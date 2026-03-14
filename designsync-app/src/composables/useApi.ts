import { ref, computed } from 'vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface ExpectedCase {
  name: string;
  description?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComponentDef {
  name: string;
  filePath?: string;
  props?: string[];
  slots?: string[];
  variants?: string[];
  description?: string;
  framework?: string;
}

export interface IComponentCheck {
  componentName: string;
  exists: boolean;
  hasIssue: boolean;
  issueDescription?: string;
  propsUsed?: string[];
  propsMissing?: string[];
  slotsUsed?: string[];
  slotsMissing?: string[];
  boundingBox?: BoundingBox;
}

export interface CaseCheck {
  caseName: string;
  status: 'pending' | 'covered' | 'partial' | 'missing' | 'unclear';
  designEvidence?: string;
  notes?: string;
}

export interface Review {
  _id: string;
  title: string;
  projectId: string;
  designImage: string; // Keep for backward compatibility (first image)
  designImages?: string[]; // New field for multiple images
  analysisPhase: 'pending' | 'generating_cases' | 'checking_cases' | 'mapping_components' | 'completed' | 'failed';
  caseChecks: CaseCheck[];
  componentChecks: IComponentCheck[];
  createdAt: string;
  updatedAt: string;
  analysisError?: string;
}

export interface UILibrary {
  _id: string;
  name: string;
  description?: string;
  source: { // Simplified for now
    provider: 'github';
    owner: string;
    repo: string;
    branch: string;
    fullName: string;
    componentPath?: string;
  };
  components?: ComponentDef[];
  componentCount?: number; // Added for convenience
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status?: 'draft' | 'prd_complete' | 'ready_for_design' | 'in_design' | 'in_design_review' | 'ready_for_kickoff';
  uiLibraryIds: (string | UILibrary)[];
  prdText?: string;
  expectedCases: ExpectedCase[];
  casesGeneratedFrom: 'prd' | 'image' | 'manual' | null;
  uiLibraryCount?: number;
  componentCount?: number;
  expectedCasesCount?: number;
  reviewCount?: number;
  latestReview?: {
    title: string;
    analysisPhase: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export function useApi() {
  const githubSessionId = ref<string | null>(localStorage.getItem('github_session'));

  const headers = computed(() => ({
    'Content-Type': 'application/json',
    ...(githubSessionId.value && { 'X-Session-Id': githubSessionId.value }),
  }));

  async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`,
      { ...options, headers: { ...headers.value, ...options?.headers } }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
    return response.json();
  }

  // GitHub Auth
  async function getGithubAuthUrl(): Promise<{ url: string }> {
    return apiFetch('/auth/github');
  }

  async function exchangeGithubCode(code: string): Promise<{ sessionId: string }> {
    const response = await apiFetch<{ sessionId: string }>('/auth/github/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    githubSessionId.value = response.sessionId;
    localStorage.setItem('github_session', response.sessionId);
    return response;
  }

  function logoutGithub() {
    githubSessionId.value = null;
    localStorage.removeItem('github_session');
  }

  async function getGithubRepos(): Promise<any[]> {
    if (!githubSessionId.value) {
      throw new Error('GitHub session not found. Please authenticate.');
    }
    return apiFetch('/github/repos');
  }

  async function getGithubBranches(owner: string, repo: string): Promise<any[]> {
    if (!githubSessionId.value) {
      throw new Error('GitHub session not found. Please authenticate.');
    }
    return apiFetch(`/github/repos/${owner}/${repo}/branches`);
  }

  // UILibrary Operations
  async function createUILibrary(data: { name: string; description?: string; source: any }): Promise<UILibrary> {
    return apiFetch('/ui-libraries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async function getAllUILibraries(): Promise<UILibrary[]> {
    return apiFetch('/ui-libraries');
  }

  async function getUILibrary(id: string): Promise<UILibrary> {
    return apiFetch(`/ui-libraries/${id}`);
  }

  async function updateUILibrary(id: string, data: { name?: string; description?: string }): Promise<UILibrary> {
    return apiFetch(`/ui-libraries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async function deleteUILibrary(id: string): Promise<void> {
    return apiFetch(`/ui-libraries/${id}`, {
      method: 'DELETE',
    });
  }

  async function syncUILibrary(id: string): Promise<{ componentCount: number; lastSyncedAt: string }> {
    return apiFetch(`/ui-libraries/${id}/sync`, {
      method: 'POST',
    });
  }

  // Project Operations
  async function createProject(data: { 
    name: string; 
    description?: string; 
    uiLibraryIds: string[]; 
    prdText?: string; 
    expectedCases?: ExpectedCase[];
    casesGeneratedFrom?: 'prd' | 'image' | 'manual' | null;
    status?: 'draft' | 'prd_complete' | 'ready_for_design' | 'in_design' | 'in_design_review' | 'ready_for_kickoff';
  }): Promise<Project> {
    return apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async function getAllProjects(): Promise<Project[]> {
    return apiFetch('/projects');
  }

  async function getProject(id: string): Promise<Project> {
    return apiFetch(`/projects/${id}`);
  }

  async function updateProject(
    id: string,
    data: {
      name?: string;
      description?: string;
      uiLibraryIds?: string[];
      prdText?: string;
      expectedCases?: ExpectedCase[];
      casesGeneratedFrom?: 'prd' | 'image' | 'manual' | null;
      status?: 'draft' | 'prd_complete' | 'ready_for_design' | 'in_design' | 'in_design_review' | 'ready_for_kickoff';
    }
  ): Promise<Project> {
    return apiFetch(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async function deleteProject(id: string): Promise<void> {
    return apiFetch(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async function generateProjectCases(projectId: string, casesSource: 'prd' | 'image'): Promise<{ message: string }> {
    return apiFetch(`/projects/${projectId}/generate-cases`, {
      method: 'POST',
      body: JSON.stringify({ casesSource }),
    });
  }

  // Review Operations
  async function startReview(projectId: string, designImage: string, title: string): Promise<Review> {
    return apiFetch(`/projects/${projectId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ designImage, title }),
    });
  }

  async function createReview(projectId: string, data: { designImages: string[]; title: string }): Promise<Review> {
    return apiFetch(`/projects/${projectId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async function getReview(id: string): Promise<Review> {
    return apiFetch(`/reviews/${id}`);
  }

  async function getAllReviewsForProject(projectId: string): Promise<Review[]> {
    return apiFetch(`/projects/${projectId}/reviews`);
  }

  async function updateReview(reviewId: string, data: Partial<Review>): Promise<Review> {
    return apiFetch(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async function deleteReview(id: string): Promise<void> {
    return apiFetch(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  async function reAnalyzeReview(reviewId: string): Promise<Review> {
    return apiFetch(`/reviews/${reviewId}/reanalyze`, {
      method: 'POST',
    });
  }

  return {
    githubSessionId,
    getGithubAuthUrl,
    exchangeGithubCode,
    logoutGithub,
    getGithubRepos,
    getGithubBranches,

    createUILibrary,
    getAllUILibraries,
    getUILibrary,
    updateUILibrary,
    deleteUILibrary,
    syncUILibrary,

    createProject,
    getAllProjects,
    getProject,
    updateProject,
    deleteProject,
    generateProjectCases,

    startReview,
    createReview,
    getReview,
    getAllReviewsForProject,
    updateReview,
    deleteReview,
    reAnalyzeReview,
  };
}
