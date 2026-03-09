// Type definitions for DesignSync

export interface AnalysisConfig {
  figmaUrl: string;
  figmaToken: string;
  figmaPage: string;
  figmaFrame: string;
  libRepo: string;
  libToken: string;
  libPath: string;
  libBranch: string;
  codeRepo: string;
  codeToken: string;
  codePath: string;
  codeBranch: string;
  nameMappings: string;
}

export interface FigmaComponentInstance {
  instanceName: string;
  componentName: string;
  componentId: string;
  properties: Record<string, any>;
  overrides: any[];
  boundVariables: Record<string, any>;
}

export interface FigmaData {
  usedComponents: FigmaComponentInstance[];
  pages: string[];
  componentDefs: Record<string, string>;
}

export interface GitHubRepo {
  owner: string;
  repo: string;
}

export interface GitHubTreeItem {
  path: string;
  type: string;
  sha?: string;
}

export interface VueComponent {
  name: string;
  filename: string;
  slots: string[];
  props: string[];
}

export interface VueComponentUsage {
  name: string;
  slots: string[];
}

export interface VueFileUsage {
  filename: string;
  components: VueComponentUsage[];
}

export interface Issue {
  componentName: string;
  description: string;
  severity: string;
  figmaName?: string;
  slot?: string;
  availableSlots?: string[];
  source?: string;
  file?: string;
  files?: string[];
}

export interface AnalysisIssues {
  missingFromLib: Issue[];
  incompatibleUsage: Issue[];
  missingFromDesign: Issue[];
}

export interface ReportMetadata {
  figmaInstancesCount: number;
  libComponentsCount: number;
  codeFilesCount: number;
}

export interface ProgressStep {
  id: string;
  label: string;
  state: 'pending' | 'active' | 'done' | 'error';
}

export type ProgressCallback = (percent: number, message: string) => void;
