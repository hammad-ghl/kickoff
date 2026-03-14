import { Request, Response } from 'express';
import Repository from '../models/Repository';
import RepoFeatureCluster from '../models/RepoFeatureCluster';
import Project from '../models/Project';
import { getTokenForSession } from './authController';
import { indexRepository, reindexRepository, deleteRepositoryIndex } from '../services/repositoryIndexer';
import { searchSimilarFeatures, isQdrantAvailable } from '../services/qdrantService';

export const createRepository = async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const token = getTokenForSession(sessionId);

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, description, githubRepoFullName, githubBranch } = req.body;

    if (!name || !githubRepoFullName) {
      return res.status(400).json({ error: 'Missing required fields: name, githubRepoFullName' });
    }

    const repository = new Repository({
      name,
      description,
      githubRepoFullName,
      githubBranch: githubBranch || 'main',
      status: 'pending',
      indexingProgress: {
        currentStep: 'connecting',
        clustersProcessed: 0,
        totalClusters: 0,
      },
    });

    await repository.save();

    indexRepository(repository._id.toString(), token).catch((error) => {
      console.error('Background indexing failed:', error);
    });

    res.status(201).json(repository);
  } catch (error) {
    console.error('Create repository error:', error);
    res.status(500).json({ error: 'Failed to create repository' });
  }
};

export const getAllRepositories = async (req: Request, res: Response) => {
  try {
    const repositories = await Repository.find()
      .select('name description githubRepoFullName githubBranch status indexedAt featureCount indexingProgress errorMessage createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.json(repositories);
  } catch (error) {
    console.error('Get all repositories error:', error);
    res.status(500).json({ error: 'Failed to get repositories' });
  }
};

export const getRepository = async (req: Request, res: Response) => {
  try {
    const repository = await Repository.findById(req.params.id);

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    res.json(repository);
  } catch (error) {
    console.error('Get repository error:', error);
    res.status(500).json({ error: 'Failed to get repository' });
  }
};

export const getRepositoryClusters = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { search, limit = '50', offset = '0' } = req.query;

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    let query: any = { repositoryId: id };
    
    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
      ];
    }

    const clusters = await RepoFeatureCluster.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string));

    const total = await RepoFeatureCluster.countDocuments(query);

    res.json({
      clusters,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Get repository clusters error:', error);
    res.status(500).json({ error: 'Failed to get repository clusters' });
  }
};

export const updateRepository = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const repository = await Repository.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      { new: true }
    );

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    res.json(repository);
  } catch (error) {
    console.error('Update repository error:', error);
    res.status(500).json({ error: 'Failed to update repository' });
  }
};

export const deleteRepository = async (req: Request, res: Response) => {
  try {
    const repositoryId = req.params.id as string;

    const referencingProjects = await Project.find({ repositoryId });
    if (referencingProjects.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete: repository is referenced by projects',
        projects: referencingProjects.map((p) => ({ _id: p._id, name: p.name })),
      });
    }

    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    await deleteRepositoryIndex(repositoryId);

    await Repository.findByIdAndDelete(repositoryId);

    res.json({ message: 'Repository deleted' });
  } catch (error) {
    console.error('Delete repository error:', error);
    res.status(500).json({ error: 'Failed to delete repository' });
  }
};

export const reindexRepositoryHandler = async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const token = getTokenForSession(sessionId);

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const repositoryId = req.params.id as string;
    const repository = await Repository.findById(repositoryId);
    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    await Repository.findByIdAndUpdate(repositoryId, {
      status: 'pending',
      errorMessage: null,
    });

    reindexRepository(repositoryId, token).catch((error) => {
      console.error('Background reindexing failed:', error);
    });

    res.json({ message: 'Re-indexing started', status: 'indexing' });
  } catch (error) {
    console.error('Reindex repository error:', error);
    res.status(500).json({ error: 'Failed to start re-indexing' });
  }
};

export const searchRepository = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { query, topK = 6 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing required field: query' });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    if (repository.status !== 'indexed') {
      return res.status(400).json({ 
        error: 'Repository is not indexed',
        status: repository.status,
      });
    }

    if (!isQdrantAvailable()) {
      return res.status(503).json({ error: 'Vector search is not available' });
    }

    const results = await searchSimilarFeatures(id, query, topK);

    res.json({
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search repository error:', error);
    res.status(500).json({ error: 'Failed to search repository' });
  }
};
