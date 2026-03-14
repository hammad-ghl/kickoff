import { Request, Response } from 'express';
import Review from '../models/Review';
import Project from '../models/Project';
import UILibrary from '../models/UILibrary';
import Repository from '../models/Repository';
import { 
  generateCasesFromImage, 
  checkCaseCoverage, 
  analyzeComponents 
} from '../services/geminiAnalyzer';
import { analyzeImpact } from '../services/featureClusterSummarizer';
import { searchSimilarFeatures, isQdrantAvailable } from '../services/qdrantService';
import type { IComponentDef } from '../models/UILibrary';
import type { IComponentCheck } from '../models/Review';

function normalizeComponentName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '');
}

function deduplicateComponentChecks(checks: IComponentCheck[]): IComponentCheck[] {
  const componentMap = new Map<string, IComponentCheck>();

  for (const check of checks) {
    const key = normalizeComponentName(check.componentName);
    const existing = componentMap.get(key);

    if (!existing) {
      componentMap.set(key, { ...check });
    } else {
      if (!existing.exists && check.exists) existing.exists = true;
      if (check.hasIssue) {
        existing.hasIssue = true;
        if (check.issueDescription) {
          existing.issueDescription = existing.issueDescription
            ? `${existing.issueDescription}; ${check.issueDescription}`
            : check.issueDescription;
        }
      }
      existing.propsUsed = mergeArrays(existing.propsUsed, check.propsUsed);
      existing.propsMissing = mergeArrays(existing.propsMissing, check.propsMissing);
      existing.slotsUsed = mergeArrays(existing.slotsUsed, check.slotsUsed);
      existing.slotsMissing = mergeArrays(existing.slotsMissing, check.slotsMissing);
    }
  }

  return Array.from(componentMap.values());
}

function mergeArrays(a?: string[], b?: string[]): string[] | undefined {
  if (!a && !b) return undefined;
  const merged = new Set([...(a || []), ...(b || [])]);
  return merged.size > 0 ? Array.from(merged) : undefined;
}

export const createReview = async (req: Request, res: Response) => {
  try {
    const { projectId, title, description, designImages } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const review = new Review({
      projectId,
      title,
      description,
      designImages: designImages || [],
      analysisPhase: 'pending',
      caseChecks: [],
      componentChecks: [],
    });

    await review.save();
    
    // Respond immediately with the created review
    res.status(201).json(review);
    
    // Start analysis in background
    // Determine initial phase based on whether project has expected cases
    const hasExpectedCases = project.expectedCases && project.expectedCases.length > 0;
    
    review.analysisPhase = hasExpectedCases ? 'checking_cases' : 'generating_cases';
    
    if (hasExpectedCases) {
      review.caseChecks = project.expectedCases.map(c => ({
        caseName: c.name,
        status: 'pending' as const,
      }));
    }
    
    await review.save();
    
    // Run the analysis in the background
    runPhasedAnalysis(
      review._id.toString(),
      review.designImages,
      project._id.toString(),
      review.title
    ).catch(err => {
      console.error('[Review Analysis] Background analysis failed:', err);
      Review.findByIdAndUpdate(review._id, {
        analysisPhase: 'failed',
        analysisError: err.message || 'Analysis failed unexpectedly',
      }).catch(console.error);
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

export const getReview = async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.id).populate({
      path: 'projectId',
      select: 'name expectedCases uiLibraryIds repositoryId prdText',
      populate: [
        {
          path: 'uiLibraryIds',
          select: 'name components',
        },
        {
          path: 'repositoryId',
          select: 'name status featureCount',
        },
      ],
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const reviewObj = review.toObject();
    if (reviewObj.componentChecks && reviewObj.componentChecks.length > 0) {
      reviewObj.componentChecks = deduplicateComponentChecks(reviewObj.componentChecks);
    }

    res.json(reviewObj);
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: 'Failed to get review' });
  }
};

export const getProjectReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Get project reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
};

export const updateReview = async (req: Request, res: Response) => {
  try {
    const { title, description, designImages, caseChecks, componentChecks } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(designImages !== undefined && { designImages }),
        ...(caseChecks !== undefined && { caseChecks }),
        ...(componentChecks !== undefined && { componentChecks }),
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find()
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
};

export const reAnalyzeReview = async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const project = await Project.findById(review.projectId).populate('uiLibraryIds');
    if (!project) {
      return res.status(400).json({ error: 'Project not found' });
    }

    if (!review.designImages || review.designImages.length === 0) {
      return res.status(400).json({ error: 'Review has no design images to analyze' });
    }

    // Reset analysis state
    const hasExpectedCases = project.expectedCases && project.expectedCases.length > 0;
    
    review.analysisPhase = hasExpectedCases ? 'checking_cases' : 'generating_cases';
    review.analysisError = undefined;
    review.componentChecks = [];
    
    if (hasExpectedCases) {
      review.caseChecks = project.expectedCases.map(c => ({
        caseName: c.name,
        status: 'pending' as const,
      }));
    } else {
      review.caseChecks = [];
    }
    
    await review.save();

    res.json({ 
      message: 'Re-analysis started', 
      reviewId: review._id,
      analysisPhase: review.analysisPhase,
    });

    // Start analysis in the background
    runPhasedAnalysis(
      review._id.toString(), 
      review.designImages, 
      project._id.toString(),
      review.title
    );
  } catch (error: any) {
    console.error('Re-analyze review error:', error);
    res.status(500).json({
      error: error.message || 'Failed to start re-analysis',
    });
  }
};

export const analyzeReview = async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const project = await Project.findById(review.projectId).populate('uiLibraryIds');
    if (!project) {
      return res.status(400).json({ error: 'Project not found' });
    }

    if (!review.designImages || review.designImages.length === 0) {
      return res.status(400).json({ error: 'Review has no design images to analyze' });
    }

    const hasExpectedCases = project.expectedCases && project.expectedCases.length > 0;
    
    review.analysisPhase = hasExpectedCases ? 'checking_cases' : 'generating_cases';
    review.analysisError = undefined;
    
    if (hasExpectedCases) {
      review.caseChecks = project.expectedCases.map(c => ({
        caseName: c.name,
        status: 'pending' as const,
      }));
    }
    
    await review.save();

    res.json({ 
      message: 'Analysis started', 
      reviewId: review._id,
      analysisPhase: review.analysisPhase,
    });

    runPhasedAnalysis(
      review._id.toString(), 
      review.designImages, 
      project._id.toString(),
      review.title
    );
  } catch (error: any) {
    console.error('Analyze review error:', error);
    res.status(500).json({
      error: error.message || 'Failed to start analysis',
    });
  }
};

async function runPhasedAnalysis(
  reviewId: string,
  designImages: string[],
  projectId: string,
  title: string
): Promise<void> {
  try {
    const project = await Project.findById(projectId).populate('uiLibraryIds');
    if (!project) {
      throw new Error('Project not found');
    }

    let expectedCases = project.expectedCases || [];

    if (expectedCases.length === 0) {
      const generatedCases = await generateCasesFromImage({
        designImageDataUrl: designImages[0],
        projectName: project.name,
      });

      project.expectedCases = generatedCases;
      project.casesGeneratedFrom = 'image';
      await project.save();

      expectedCases = generatedCases;

      const pendingCaseChecks = expectedCases.map(c => ({
        caseName: c.name,
        status: 'pending' as const,
      }));

      await Review.findByIdAndUpdate(reviewId, {
        analysisPhase: 'checking_cases',
        caseChecks: pendingCaseChecks,
      });
    }

    const caseChecks = await checkCaseCoverage({
      designImages,
      expectedCases,
      projectName: project.name,
    });

    await Review.findByIdAndUpdate(reviewId, {
      caseChecks,
      analysisPhase: 'mapping_components',
    });

    const uiLibraries = project.uiLibraryIds as any[];
    const allComponents: IComponentDef[] = [];
    
    for (const lib of uiLibraries) {
      if (lib.components && Array.isArray(lib.components)) {
        allComponents.push(...lib.components);
      }
    }

    const componentResult = await analyzeComponents({
      designImages,
      components: allComponents,
      projectName: project.name,
    });

    await Review.findByIdAndUpdate(reviewId, {
      componentChecks: componentResult.componentChecks,
      analysisPhase: 'impact_analysis',
    });

    await runImpactAnalysis(reviewId, projectId);

    await Review.findByIdAndUpdate(reviewId, {
      analysisPhase: 'completed',
    });

  } catch (error: any) {
    console.error('Phased analysis error:', error);
    await Review.findByIdAndUpdate(reviewId, {
      analysisPhase: 'failed',
      analysisError: error.message || 'Analysis failed',
    });
  }
}

async function runImpactAnalysis(reviewId: string, projectId: string): Promise<void> {
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      console.log(`[Impact Analysis] Project not found: ${projectId}`);
      return;
    }

    if (!project.repositoryId) {
      console.log(`[Impact Analysis] No repository connected for project: ${projectId}`);
      await Review.findByIdAndUpdate(reviewId, {
        impactAnalysis: {
          relatedFeatures: [],
          summary: '',
          gapsCount: 0,
          ranAt: new Date(),
          skipped: true,
          skipReason: 'No repository connected',
        },
      });
      return;
    }

    const repository = await Repository.findById(project.repositoryId);
    if (!repository) {
      console.log(`[Impact Analysis] Repository not found: ${project.repositoryId}`);
      await Review.findByIdAndUpdate(reviewId, {
        impactAnalysis: {
          relatedFeatures: [],
          summary: '',
          gapsCount: 0,
          ranAt: new Date(),
          skipped: true,
          skipReason: 'Repository not found',
        },
      });
      return;
    }

    if (repository.status !== 'indexed') {
      console.log(`[Impact Analysis] Repository not indexed: ${repository.status}`);
      await Review.findByIdAndUpdate(reviewId, {
        impactAnalysis: {
          relatedFeatures: [],
          summary: '',
          gapsCount: 0,
          ranAt: new Date(),
          repositoryId: repository._id.toString(),
          skipped: true,
          skipReason: `Repository is ${repository.status}`,
        },
      });
      return;
    }

    if (!project.prdText) {
      console.log(`[Impact Analysis] No PRD text for project: ${projectId}`);
      await Review.findByIdAndUpdate(reviewId, {
        impactAnalysis: {
          relatedFeatures: [],
          summary: '',
          gapsCount: 0,
          ranAt: new Date(),
          repositoryId: repository._id.toString(),
          skipped: true,
          skipReason: 'No PRD text available',
        },
      });
      return;
    }

    if (!isQdrantAvailable()) {
      console.log(`[Impact Analysis] Qdrant not available`);
      await Review.findByIdAndUpdate(reviewId, {
        impactAnalysis: {
          relatedFeatures: [],
          summary: '',
          gapsCount: 0,
          ranAt: new Date(),
          repositoryId: repository._id.toString(),
          skipped: true,
          skipReason: 'Vector search not available',
        },
      });
      return;
    }

    console.log(`[Impact Analysis] Searching for related features in ${repository.name}`);
    
    const searchResults = await searchSimilarFeatures(
      repository._id.toString(),
      project.prdText,
      6
    );

    if (searchResults.length === 0) {
      console.log(`[Impact Analysis] No related features found`);
      await Review.findByIdAndUpdate(reviewId, {
        impactAnalysis: {
          relatedFeatures: [],
          summary: 'No closely related features found in the codebase.',
          gapsCount: 0,
          ranAt: new Date(),
          repositoryId: repository._id.toString(),
          skipped: false,
        },
      });
      return;
    }

    console.log(`[Impact Analysis] Found ${searchResults.length} related features, analyzing gaps`);

    const relatedFeatures = searchResults.map(r => ({
      featureName: r.featureName,
      summary: r.summary,
      userFlows: r.userFlows,
      constraints: r.constraints,
      dependencies: r.dependencies,
      affectedBy: r.affectedBy,
      filePaths: r.filePaths,
      relevanceScore: r.score,
    }));

    const impactResult = await analyzeImpact({
      prdText: project.prdText,
      relatedFeatures,
      projectName: project.name,
    });

    await Review.findByIdAndUpdate(reviewId, {
      impactAnalysis: {
        relatedFeatures: impactResult.relatedFeatures,
        summary: impactResult.summary,
        gapsCount: impactResult.gapsCount,
        ranAt: new Date(),
        repositoryId: repository._id.toString(),
        skipped: false,
      },
    });

    console.log(`[Impact Analysis] Complete - found ${impactResult.gapsCount} gaps`);

  } catch (error) {
    console.error('[Impact Analysis] Error:', error);
    await Review.findByIdAndUpdate(reviewId, {
      impactAnalysis: {
        relatedFeatures: [],
        summary: 'Impact analysis failed',
        gapsCount: 0,
        ranAt: new Date(),
        skipped: true,
        skipReason: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
