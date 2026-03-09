const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getSessionHeader(): Record<string, string> {
  const sessionId = localStorage.getItem('github_session');
  return sessionId ? { 'X-Session-Id': sessionId } : {};
}

export interface ComponentDef {
  name: string;
  description?: string;
  props?: string[];
  slots?: string[];
  variants?: string[];
  filePath?: string;
  framework?: 'vue' | 'react' | 'svelte' | 'angular' | 'unknown';
}

export interface UILibrarySource {
  type: 'github';
  owner: string;
  repo: string;
  branch: string;
  componentPath?: string;
  fullName?: string;
}

export interface UILibrary {
  _id: string;
  name: string;
  description?: string;
  source: UILibrarySource;
  components: ComponentDef[];
  componentCount?: number;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpectedCase {
  name: string;
  description: string;
  importance: 'critical' | 'important' | 'nice-to-have';
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
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

export interface ComponentCheck {
  componentName: string;
  exists: boolean;
  hasIssue: boolean;
  issueDescription?: string;
  propsUsed?: string[];
  propsMissing?: string[];
  slotsUsed?: string[];
  slotsMissing?: string[];
}

export interface CaseCheck {
  caseName: string;
  status: 'pending' | 'covered' | 'partial' | 'missing' | 'unclear';
  designEvidence?: string;
  notes?: string;
}

export type AnalysisPhase = 'pending' | 'generating_cases' | 'checking_cases' | 'mapping_components' | 'completed' | 'failed';

export interface Review {
  _id: string;
  projectId: string | { 
    _id: string; 
    name: string; 
    expectedCases: ExpectedCase[];
    uiLibraryIds: (string | UILibrary)[];
  };
  title: string;
  description?: string;
  designImages: string[];
  analysisPhase: AnalysisPhase;
  caseChecks: CaseCheck[];
  componentChecks: ComponentCheck[];
  analysisError?: string;
  createdAt: string;
  updatedAt: string;
}

export function useApi() {
  async function getAllUILibraries(): Promise<UILibrary[]> {
    const response = await fetch(`${API_BASE_URL}/api/ui-libraries`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch UI libraries');
    }

    return response.json();
  }

  async function getUILibrary(id: string): Promise<UILibrary> {
    const response = await fetch(`${API_BASE_URL}/api/ui-libraries/${id}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch UI library');
    }

    return response.json();
  }

  async function createUILibrary(data: {
    name: string;
    description?: string;
    source: UILibrarySource;
  }): Promise<UILibrary> {
    const response = await fetch(`${API_BASE_URL}/api/ui-libraries`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getSessionHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create UI library');
    }

    return response.json();
  }

  async function updateUILibrary(id: string, data: { name?: string; description?: string }): Promise<UILibrary> {
    const response = await fetch(`${API_BASE_URL}/api/ui-libraries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update UI library');
    }

    return response.json();
  }

  async function deleteUILibrary(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/ui-libraries/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete UI library');
    }

    return response.json();
  }

  async function syncUILibrary(id: string): Promise<{ message: string; componentCount: number; lastSyncedAt: string }> {
    const response = await fetch(`${API_BASE_URL}/api/ui-libraries/${id}/sync`, {
      method: 'POST',
      headers: getSessionHeader(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to sync UI library');
    }

    return response.json();
  }

  async function createProject(
    name: string, 
    description?: string, 
    uiLibraryIds?: string[],
    prdText?: string
  ): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, uiLibraryIds, prdText }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create project');
    }

    return response.json();
  }

  async function getProject(id: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch project');
    }

    return response.json();
  }

  async function getAllProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/api/projects`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch projects');
    }

    return response.json();
  }

  async function updateProject(id: string, data: { 
    name?: string; 
    description?: string; 
    uiLibraryIds?: string[];
    prdText?: string;
    expectedCases?: ExpectedCase[];
    casesGeneratedFrom?: 'prd' | 'image' | 'manual' | null;
  }): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update project');
    }

    return response.json();
  }

  async function deleteProject(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete project');
    }

    return response.json();
  }

  async function generateProjectCases(projectId: string): Promise<{ casesCount: number; expectedCases: ExpectedCase[] }> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/generate-cases`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to generate cases');
    }

    return response.json();
  }

  async function getProjectReviews(projectId: string): Promise<Review[]> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/reviews`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch reviews');
    }

    return response.json();
  }

  async function createReview(
    projectId: string, 
    title: string, 
    description?: string, 
    designImages?: string[]
  ): Promise<Review> {
    const response = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title, description, designImages }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create review');
    }

    return response.json();
  }

  async function getReview(id: string): Promise<Review> {
    const response = await fetch(`${API_BASE_URL}/api/reviews/${id}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch review');
    }

    return response.json();
  }

  async function updateReview(id: string, data: Partial<Review>): Promise<Review> {
    const response = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update review');
    }

    return response.json();
  }

  async function deleteReview(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete review');
    }

    return response.json();
  }

  async function getAllReviews(): Promise<Review[]> {
    const response = await fetch(`${API_BASE_URL}/api/reviews`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch reviews');
    }

    return response.json();
  }

  async function analyzeReview(reviewId: string): Promise<{ message: string; reviewId: string; analysisPhase: AnalysisPhase }> {
    const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/analyze`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to analyze design');
    }

    return response.json();
  }

  return {
    getAllUILibraries,
    getUILibrary,
    createUILibrary,
    updateUILibrary,
    deleteUILibrary,
    syncUILibrary,
    createProject,
    getProject,
    getAllProjects,
    updateProject,
    deleteProject,
    generateProjectCases,
    getProjectReviews,
    createReview,
    getReview,
    updateReview,
    deleteReview,
    getAllReviews,
    analyzeReview,
  };
}
