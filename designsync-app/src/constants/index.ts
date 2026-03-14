// Feature Status Constants
export const FEATURE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'prd_complete', label: 'PRD Complete' },
  { value: 'ready_for_design', label: 'Ready for design' },
  { value: 'in_design', label: 'In design' },
  { value: 'in_design_review', label: 'In design review' },
  { value: 'ready_for_kickoff', label: 'Ready for Kickoff' },
] as const;

export type FeatureStatus = typeof FEATURE_STATUSES[number]['value'];

export const STATUS_LABELS: Record<string, string> = {
  'draft': 'Draft',
  'prd_complete': 'PRD Complete',
  'ready_for_design': 'Ready for design',
  'in_design': 'In design',
  'in_design_review': 'In design review',
  'ready_for_kickoff': 'Ready for Kickoff',
};

export const STATUS_CLASSES: Record<string, string> = {
  'draft': 'status-draft',
  'prd_complete': 'status-prd-complete',
  'ready_for_design': 'status-ready-for-design',
  'in_design': 'status-in-design',
  'in_design_review': 'status-in-design-review',
  'ready_for_kickoff': 'status-ready-for-kickoff',
};

export const STATUS_DOT_CLASSES: Record<string, string> = {
  'draft': 'status-dot-draft',
  'prd_complete': 'status-dot-prd-complete',
  'ready_for_design': 'status-dot-ready-for-design',
  'in_design': 'status-dot-in-design',
  'in_design_review': 'status-dot-in-design-review',
  'ready_for_kickoff': 'status-dot-ready-for-kickoff',
};

// Analysis Phase Constants
export const ANALYSIS_PHASES = [
  { key: 'pending', label: 'Pending' },
  { key: 'generating_cases', label: 'Generate Cases' },
  { key: 'checking_cases', label: 'Check Coverage' },
  { key: 'mapping_components', label: 'Map Components' },
  { key: 'impact_analysis', label: 'Impact Analysis' },
  { key: 'completed', label: 'Complete' },
  { key: 'failed', label: 'Failed' },
] as const;

export type AnalysisPhase = typeof ANALYSIS_PHASES[number]['key'];

// Helper Functions
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || 'Draft';
}

export function getStatusClass(status: string): string {
  return STATUS_CLASSES[status] || STATUS_CLASSES['draft'];
}

export function getStatusDotClass(status: string): string {
  return STATUS_DOT_CLASSES[status] || STATUS_DOT_CLASSES['draft'];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 7) {
    return formatRelativeDate(dateString);
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const getAnalysisPhaseLabel = (phase: string) => {
  const p = ANALYSIS_PHASES.find(ap => ap.key === phase);
  return p ? p.label : phase;
};

export const getAnalysisPhaseClass = (phase: string, currentPhase: string | undefined, isCompleted: (key: string) => boolean) => {
  if (currentPhase === phase || isCompleted(phase)) {
    switch (phase) {
      case 'completed': return 'chip-green';
      case 'failed': return 'chip-red';
      default: return 'chip-blue';
    }
  } else {
    return 'chip-secondary';
  }
};
