import { v4 as uuidv4 } from 'uuid';
import Repository from '../models/Repository';
import RepoFeatureCluster from '../models/RepoFeatureCluster';
import { analyzeCoChanges, CoChangeCluster } from './gitCoChangeAnalyzer';
import { batchSummarizeClusters, FeatureClusterSummary } from './featureClusterSummarizer';
import { batchUpsertFeaturePoints, deleteRepositoryPoints, UpsertPointInput, isQdrantAvailable } from './qdrantService';

export interface IndexingProgress {
  currentStep: 'connecting' | 'analyzing_git' | 'generating_summaries' | 'building_index' | 'finalizing';
  clustersProcessed: number;
  totalClusters: number;
}

async function updateProgress(
  repositoryId: string,
  progress: IndexingProgress
): Promise<void> {
  await Repository.findByIdAndUpdate(repositoryId, {
    indexingProgress: progress,
    updatedAt: new Date(),
  });
}

export async function indexRepository(
  repositoryId: string,
  token: string
): Promise<void> {
  const repository = await Repository.findById(repositoryId);
  if (!repository) {
    throw new Error(`Repository not found: ${repositoryId}`);
  }

  try {
    await Repository.findByIdAndUpdate(repositoryId, {
      status: 'indexing',
      errorMessage: null,
      indexingProgress: {
        currentStep: 'connecting',
        clustersProcessed: 0,
        totalClusters: 0,
      },
    });

    await updateProgress(repositoryId, {
      currentStep: 'analyzing_git',
      clustersProcessed: 0,
      totalClusters: 0,
    });

    console.log(`[Indexer] Starting git co-change analysis for ${repository.githubRepoFullName}`);
    
    const clusters = await analyzeCoChanges(
      repository.githubRepoFullName,
      repository.githubBranch,
      token,
      {
        maxCommits: 500,
        minCoChangeScore: 0.3,
        minClusterSize: 2,
        maxFilesPerCommit: 50,
        onProgress: async (p) => {
          if (p.step === 'Building clusters') {
            await updateProgress(repositoryId, {
              currentStep: 'analyzing_git',
              clustersProcessed: p.current,
              totalClusters: p.total,
            });
          }
        },
      }
    );

    console.log(`[Indexer] Found ${clusters.length} co-change clusters`);

    if (clusters.length === 0) {
      await Repository.findByIdAndUpdate(repositoryId, {
        status: 'indexed',
        indexedAt: new Date(),
        featureCount: 0,
        indexingProgress: {
          currentStep: 'finalizing',
          clustersProcessed: 0,
          totalClusters: 0,
        },
      });
      return;
    }

    await updateProgress(repositoryId, {
      currentStep: 'generating_summaries',
      clustersProcessed: 0,
      totalClusters: clusters.length,
    });

    console.log(`[Indexer] Generating summaries for ${clusters.length} clusters`);

    const summaries = await batchSummarizeClusters({
      repoFullName: repository.githubRepoFullName,
      token,
      clusters,
      batchSize: 5,
      maxPreviewFiles: 3,
      onProgress: async (p) => {
        await updateProgress(repositoryId, {
          currentStep: 'generating_summaries',
          clustersProcessed: p.processed,
          totalClusters: p.total,
        });
      },
    });

    console.log(`[Indexer] Generated ${summaries.size} summaries (skipped low-confidence)`);

    await RepoFeatureCluster.deleteMany({ repositoryId: repository._id });

    if (isQdrantAvailable()) {
      await deleteRepositoryPoints(repositoryId);
    }

    await updateProgress(repositoryId, {
      currentStep: 'building_index',
      clustersProcessed: 0,
      totalClusters: summaries.size,
    });

    const clusterDocuments: Array<{
      repositoryId: string;
      name: string;
      summary: string;
      userFlows: string[];
      constraints: string[];
      dependencies: string[];
      affectedBy: string[];
      filePaths: string[];
      qdrantPointId: string;
      confidence: 'high' | 'medium' | 'low';
    }> = [];

    const qdrantPoints: UpsertPointInput[] = [];

    for (const [cluster, summary] of summaries) {
      const pointId = uuidv4();
      
      clusterDocuments.push({
        repositoryId: repository._id.toString(),
        name: summary.featureName,
        summary: summary.summary,
        userFlows: summary.userFlows,
        constraints: summary.constraints,
        dependencies: summary.dependencies,
        affectedBy: summary.affectedBy,
        filePaths: cluster.files,
        qdrantPointId: pointId,
        confidence: summary.confidence,
      });

      qdrantPoints.push({
        id: pointId,
        repositoryId: repository._id.toString(),
        featureName: summary.featureName,
        summary: summary.summary,
        userFlows: summary.userFlows,
        constraints: summary.constraints,
        dependencies: summary.dependencies,
        affectedBy: summary.affectedBy,
        filePaths: cluster.files,
        clusterId: pointId,
      });
    }

    const insertedClusters = await RepoFeatureCluster.insertMany(clusterDocuments);
    console.log(`[Indexer] Inserted ${insertedClusters.length} cluster documents`);

    if (isQdrantAvailable() && qdrantPoints.length > 0) {
      console.log(`[Indexer] Upserting ${qdrantPoints.length} points to Qdrant`);
      await batchUpsertFeaturePoints(qdrantPoints);
    }

    await updateProgress(repositoryId, {
      currentStep: 'finalizing',
      clustersProcessed: summaries.size,
      totalClusters: summaries.size,
    });

    await Repository.findByIdAndUpdate(repositoryId, {
      status: 'indexed',
      indexedAt: new Date(),
      featureCount: insertedClusters.length,
      indexingProgress: {
        currentStep: 'finalizing',
        clustersProcessed: summaries.size,
        totalClusters: summaries.size,
      },
    });

    console.log(`[Indexer] Repository indexing complete: ${repository.githubRepoFullName}`);

  } catch (error) {
    console.error(`[Indexer] Error indexing repository:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during indexing';
    
    await Repository.findByIdAndUpdate(repositoryId, {
      status: 'failed',
      errorMessage,
    });
  }
}

export async function reindexRepository(
  repositoryId: string,
  token: string
): Promise<void> {
  const repository = await Repository.findById(repositoryId);
  if (!repository) {
    throw new Error(`Repository not found: ${repositoryId}`);
  }

  console.log(`[Indexer] Starting re-index for ${repository.githubRepoFullName}`);

  await RepoFeatureCluster.deleteMany({ repositoryId: repository._id });

  if (isQdrantAvailable()) {
    await deleteRepositoryPoints(repositoryId);
  }

  await indexRepository(repositoryId, token);
}

export async function deleteRepositoryIndex(repositoryId: string): Promise<void> {
  await RepoFeatureCluster.deleteMany({ repositoryId });

  if (isQdrantAvailable()) {
    await deleteRepositoryPoints(repositoryId);
  }

  console.log(`[Indexer] Deleted index for repository: ${repositoryId}`);
}
