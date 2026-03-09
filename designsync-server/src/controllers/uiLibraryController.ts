import { Request, Response } from 'express';
import UILibrary from '../models/UILibrary';
import Project from '../models/Project';
import { indexComponentLibrary } from '../services/github';
import { getTokenForSession } from './authController';

export const createUILibrary = async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const token = getTokenForSession(sessionId);

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, description, source } = req.body;

    if (!name || !source?.owner || !source?.repo || !source?.branch) {
      return res.status(400).json({ error: 'Missing required fields: name, source.owner, source.repo, source.branch' });
    }

    const library = new UILibrary({
      name,
      description,
      source: {
        type: 'github',
        owner: source.owner,
        repo: source.repo,
        branch: source.branch,
        componentPath: source.componentPath || '',
        fullName: source.fullName || `${source.owner}/${source.repo}`,
      },
      components: [],
    });

    await library.save();

    try {
      const components = await indexComponentLibrary(
        source.owner,
        source.repo,
        source.branch,
        token,
        source.componentPath
      );

      library.components = components;
      library.lastSyncedAt = new Date();
      await library.save();
    } catch (syncError) {
      console.error('Initial sync failed:', syncError);
    }

    res.status(201).json(library);
  } catch (error) {
    console.error('Create UI library error:', error);
    res.status(500).json({ error: 'Failed to create UI library' });
  }
};

export const getAllUILibraries = async (req: Request, res: Response) => {
  try {
    const libraries = await UILibrary.find()
      .select('name description source.fullName source.owner source.repo lastSyncedAt createdAt updatedAt')
      .sort({ updatedAt: -1 });

    const result = libraries.map(lib => ({
      _id: lib._id,
      name: lib.name,
      description: lib.description,
      source: lib.source,
      componentCount: lib.components?.length || 0,
      lastSyncedAt: lib.lastSyncedAt,
      createdAt: lib.createdAt,
      updatedAt: lib.updatedAt,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get all UI libraries error:', error);
    res.status(500).json({ error: 'Failed to get UI libraries' });
  }
};

export const getUILibrary = async (req: Request, res: Response) => {
  try {
    const library = await UILibrary.findById(req.params.id);

    if (!library) {
      return res.status(404).json({ error: 'UI library not found' });
    }

    res.json(library);
  } catch (error) {
    console.error('Get UI library error:', error);
    res.status(500).json({ error: 'Failed to get UI library' });
  }
};

export const updateUILibrary = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const library = await UILibrary.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      { new: true }
    );

    if (!library) {
      return res.status(404).json({ error: 'UI library not found' });
    }

    res.json(library);
  } catch (error) {
    console.error('Update UI library error:', error);
    res.status(500).json({ error: 'Failed to update UI library' });
  }
};

export const deleteUILibrary = async (req: Request, res: Response) => {
  try {
    const libraryId = req.params.id;

    const referencingProjects = await Project.find({ uiLibraryIds: libraryId });
    if (referencingProjects.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete: library is referenced by projects',
        projects: referencingProjects.map(p => ({ _id: p._id, name: p.name })),
      });
    }

    const library = await UILibrary.findByIdAndDelete(libraryId);

    if (!library) {
      return res.status(404).json({ error: 'UI library not found' });
    }

    res.json({ message: 'UI library deleted' });
  } catch (error) {
    console.error('Delete UI library error:', error);
    res.status(500).json({ error: 'Failed to delete UI library' });
  }
};

export const syncUILibrary = async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const token = getTokenForSession(sessionId);

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const library = await UILibrary.findById(req.params.id);

    if (!library) {
      return res.status(404).json({ error: 'UI library not found' });
    }

    const components = await indexComponentLibrary(
      library.source.owner,
      library.source.repo,
      library.source.branch,
      token,
      library.source.componentPath
    );

    library.components = components;
    library.lastSyncedAt = new Date();
    await library.save();

    res.json({
      message: 'Sync completed',
      componentCount: components.length,
      lastSyncedAt: library.lastSyncedAt,
    });
  } catch (error) {
    console.error('Sync UI library error:', error);
    res.status(500).json({ error: 'Failed to sync UI library' });
  }
};
