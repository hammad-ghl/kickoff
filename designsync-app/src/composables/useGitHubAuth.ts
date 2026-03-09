import { ref, computed } from 'vue';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  defaultBranch: string;
  htmlUrl: string;
}

export interface ComponentDef {
  name: string;
  description?: string;
  props: string[];
  slots: string[];
  variants: string[];
  filePath: string;
  framework: 'vue' | 'react' | 'svelte' | 'angular' | 'unknown';
}

const sessionId = ref<string | null>(localStorage.getItem('github_session'));
const user = ref<GitHubUser | null>(null);
const isLoading = ref(false);

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (sessionId.value) {
    headers['X-Session-Id'] = sessionId.value;
  }
  return headers;
}

export function useGitHubAuth() {
  const isAuthenticated = computed(() => !!user.value);

  async function checkSession(): Promise<boolean> {
    if (!sessionId.value) return false;

    try {
      const response = await fetch(`${API_BASE}/api/auth/session`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      
      if (data.success && data.authenticated) {
        user.value = data.user;
        return true;
      } else {
        logout();
        return false;
      }
    } catch {
      return false;
    }
  }

  async function initiateLogin(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/github`);
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        localStorage.setItem('github_oauth_state', data.state);
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to initiate OAuth');
      }
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      throw error;
    }
  }

  function handleCallback(session: string): void {
    sessionId.value = session;
    localStorage.setItem('github_session', session);
    localStorage.removeItem('github_oauth_state');
  }

  function logout(): void {
    sessionId.value = null;
    user.value = null;
    localStorage.removeItem('github_session');
    
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    }).catch(() => {});
  }

  async function getRepos(): Promise<GitHubRepo[]> {
    isLoading.value = true;
    try {
      const response = await fetch(`${API_BASE}/api/auth/repos`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch repos');
      }
      
      return data.repos;
    } finally {
      isLoading.value = false;
    }
  }

  async function getBranches(owner: string, repo: string, search?: string): Promise<string[]> {
    const url = search
      ? `${API_BASE}/api/auth/repos/${owner}/${repo}/branches?search=${encodeURIComponent(search)}`
      : `${API_BASE}/api/auth/repos/${owner}/${repo}/branches`;
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch branches');
    }
    
    return data.branches;
  }

  async function getDirectories(owner: string, repo: string, branch: string): Promise<string[]> {
    const response = await fetch(
      `${API_BASE}/api/auth/repos/${owner}/${repo}/directories?branch=${encodeURIComponent(branch)}`,
      { headers: getHeaders() }
    );
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch directories');
    }
    
    return data.directories;
  }

  async function syncComponents(
    owner: string,
    repo: string,
    branch: string,
    componentPath?: string
  ): Promise<ComponentDef[]> {
    isLoading.value = true;
    try {
      const response = await fetch(`${API_BASE}/api/auth/sync-components`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ owner, repo, branch, componentPath }),
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to sync components');
      }
      
      return data.components;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    user,
    sessionId,
    isAuthenticated,
    isLoading,
    checkSession,
    initiateLogin,
    handleCallback,
    logout,
    getRepos,
    getBranches,
    getDirectories,
    syncComponents,
  };
}
