import { Request, Response } from 'express';
import Project from '../models/Project';
import Review from '../models/Review';
import UILibrary from '../models/UILibrary';
import { generateCasesFromPRD } from '../services/geminiAnalyzer';

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, uiLibraryIds, prdText, status } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const project = new Project({
      name,
      description,
      uiLibraryIds: uiLibraryIds || [],
      prdText: prdText || '',
      expectedCases: [],
      casesGeneratedFrom: null,
      status: status || 'draft',
    });

    await project.save();

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate('uiLibraryIds', 'name source.fullName components');

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await Project.find()
      .populate('uiLibraryIds', 'name source.fullName')
      .sort({ updatedAt: -1 });

    const projectsWithReviewCount = await Promise.all(
      projects.map(async (project) => {
        const reviewCount = await Review.countDocuments({ projectId: project._id });
        const latestReview = await Review.findOne({ projectId: project._id })
          .sort({ createdAt: -1 })
          .select('title analysisPhase createdAt');

        const uiLibs = project.uiLibraryIds as any[];
        const totalComponents = await UILibrary.aggregate([
          { $match: { _id: { $in: project.uiLibraryIds } } },
          { $project: { count: { $size: '$components' } } },
          { $group: { _id: null, total: { $sum: '$count' } } },
        ]);

        return {
          _id: project._id,
          name: project.name,
          description: project.description,
          status: project.status || 'draft',
          uiLibraryCount: uiLibs?.length || 0,
          componentCount: totalComponents[0]?.total || 0,
          expectedCasesCount: project.expectedCases?.length || 0,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          reviewCount,
          latestReview: latestReview
            ? {
                title: latestReview.title,
                analysisPhase: latestReview.analysisPhase,
                createdAt: latestReview.createdAt,
              }
            : null,
        };
      })
    );

    res.json(projectsWithReviewCount);
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, uiLibraryIds, prdText, expectedCases, casesGeneratedFrom, status } = req.body;

    const project = await Project.findById(id);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (uiLibraryIds !== undefined) project.uiLibraryIds = uiLibraryIds;
    if (prdText !== undefined) project.prdText = prdText;
    if (expectedCases !== undefined) project.expectedCases = expectedCases;
    if (casesGeneratedFrom !== undefined) project.casesGeneratedFrom = casesGeneratedFrom;
    if (status !== undefined) project.status = status;

    await project.save();

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    await Review.deleteMany({ projectId: id });
    await Project.findByIdAndDelete(id);

    res.json({ message: 'Project and all its reviews deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const generateCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (!project.prdText || project.prdText.trim().length === 0) {
      res.status(400).json({ error: 'Project has no PRD text to generate cases from' });
      return;
    }

    const cases = await generateCasesFromPRD({
      prdText: project.prdText,
      projectName: project.name,
    });

    project.expectedCases = cases;
    project.casesGeneratedFrom = 'prd';
    await project.save();

    res.json({
      message: 'Cases generated successfully',
      casesCount: cases.length,
      expectedCases: cases,
    });
  } catch (error) {
    console.error('Generate cases error:', error);
    res.status(500).json({ error: 'Failed to generate cases' });
  }
};

export const getProjectReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reviews = await Review.find({ projectId: id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Get project reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};
