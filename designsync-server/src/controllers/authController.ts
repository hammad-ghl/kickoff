import { Request, Response } from 'express';
import {
  getGitHubAuthUrl,
  exchangeCodeForToken,
  getGitHubUser,
  getUserRepos,
  getRepoBranches,
  getRepoDirectories,
  indexComponentLibrary,
  GitHubUser,
} from '../services/github';

const tokenStore: Map<string, { token: string; user: GitHubUser; expiresAt: number }> = new Map();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function initiateOAuth(req: Request, res: Response) {
  try {
    const state = generateSessionId();
    const redirectUrl = getGitHubAuthUrl(state);
    
    res.json({
      success: true,
      authUrl: redirectUrl,
      state,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
}

export async function handleCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing authorization code' 
      });
    }

    const token = await exchangeCodeForToken(code);
    const user = await getGitHubUser(token);

    const sessionId = (state as string) || generateSessionId();
    tokenStore.set(sessionId, {
      token,
      user,
      expiresAt: Date.now() + 3600000,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?session=${sessionId}`);
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent((error as Error).message)}`);
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    
    if (!sessionId) {
      return res.json({ success: true, authenticated: false });
    }

    const session = tokenStore.get(sessionId);
    
    if (!session || session.expiresAt < Date.now()) {
      tokenStore.delete(sessionId);
      return res.json({ success: true, authenticated: false });
    }

    res.json({
      success: true,
      authenticated: true,
      user: {
        id: session.user.id,
        login: session.user.login,
        name: session.user.name,
        avatar_url: session.user.avatar_url,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    
    if (sessionId) {
      tokenStore.delete(sessionId);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
}

export async function listRepos(req: Request, res: Response) {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const session = tokenStore.get(sessionId);

    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }

    const repos = await getUserRepos(session.token);
    
    res.json({
      success: true,
      repos: repos.map(r => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        private: r.private,
        description: r.description,
        defaultBranch: r.default_branch,
        htmlUrl: r.html_url,
      })),
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
}

export async function listBranches(req: Request, res: Response) {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const session = tokenStore.get(sessionId);

    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }

    const owner = req.params.owner as string;
    const repo = req.params.repo as string;
    const search = req.query.search as string | undefined;
    const branches = await getRepoBranches(owner, repo, session.token, search);
    
    res.json({
      success: true,
      branches,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
}

export async function listDirectories(req: Request, res: Response) {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const session = tokenStore.get(sessionId);

    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }

    const owner = req.params.owner as string;
    const repo = req.params.repo as string;
    const branch = (req.query.branch as string) || 'main';
    
    const directories = await getRepoDirectories(
      owner, 
      repo, 
      branch, 
      session.token
    );
    
    res.json({
      success: true,
      directories,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
}

export async function syncComponents(req: Request, res: Response) {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const session = tokenStore.get(sessionId);

    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }

    const { owner, repo, branch, componentPath } = req.body;

    if (!owner || !repo) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing owner or repo' 
      });
    }

    const components = await indexComponentLibrary(
      owner,
      repo,
      branch || 'main',
      session.token,
      componentPath
    );
    
    res.json({
      success: true,
      components,
      count: components.length,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
}

export function getTokenForSession(sessionId: string): string | null {
  const session = tokenStore.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }
  return session.token;
}
