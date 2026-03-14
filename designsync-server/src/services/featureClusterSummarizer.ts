import { CoChangeCluster, getFilePreview } from './gitCoChangeAnalyzer';

import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-flash';

function getEnv(key: string): string | undefined {
  return process.env[key];
}

function getAI(): GoogleGenAI {
  const apiKey = getEnv('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenAI({ apiKey });
}

export interface FeatureClusterSummary {
  featureName: string;
  summary: string;
  userFlows: string[];
  constraints: string[];
  dependencies: string[];
  affectedBy: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface SummarizeClusterInput {
  cluster: CoChangeCluster;
  filePreviews?: Map<string, string>;
}

const SUMMARIZATION_PROMPT = `You are analyzing a group of files from a software product codebase.
These files frequently change together in git history, which means they
likely implement the same product feature or are tightly coupled.

File paths in this cluster:
{FILE_PATHS}

{OPTIONAL_FILE_PREVIEWS}

Based on these file paths and any code previews provided, respond with a JSON object:
{
  "feature_name": "short name for this feature (3-6 words)",
  "summary": "plain English description of what this feature does, from a product perspective. 2-4 sentences. Focus on user-facing behaviour, not implementation details.",
  "user_flows": ["list of user flows this feature supports"],
  "constraints": ["known limitations or constraints in the current implementation"],
  "dependencies": ["other features or services this depends on"],
  "affected_by": ["other features or changes that could affect this"],
  "confidence": "high | medium | low"
}

Respond ONLY with the JSON object. No preamble, no explanation.`;

export async function summarizeCluster(input: SummarizeClusterInput): Promise<FeatureClusterSummary | null> {
  const ai = getAI();
  
  const filePaths = input.cluster.files.map(f => `- ${f}`).join('\n');
  
  let filePreviewsText = '';
  if (input.filePreviews && input.filePreviews.size > 0) {
    const previews: string[] = [];
    for (const [path, content] of input.filePreviews) {
      if (content.trim()) {
        previews.push(`--- ${path} ---\n${content}\n`);
      }
    }
    if (previews.length > 0) {
      filePreviewsText = `\nCode previews for key files:\n${previews.join('\n')}`;
    }
  }

  const prompt = SUMMARIZATION_PROMPT
    .replace('{FILE_PATHS}', filePaths)
    .replace('{OPTIONAL_FILE_PREVIEWS}', filePreviewsText);

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ text: prompt }],
    });

    const text = typeof (response as any).text === 'function' 
      ? (response as any).text() 
      : (response as any).text;
      
    if (!text || typeof text !== 'string') {
      console.warn('Gemini returned no text for cluster summarization');
      return null;
    }

    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    let parsed: any;

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn('Gemini response was not valid JSON, retrying with stricter prompt');
      return await retrySummarization(ai, filePaths);
    }

    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) 
      ? parsed.confidence 
      : 'medium';

    if (confidence === 'low') {
      return null;
    }

    return {
      featureName: String(parsed.feature_name ?? 'Unknown Feature'),
      summary: String(parsed.summary ?? ''),
      userFlows: Array.isArray(parsed.user_flows) ? parsed.user_flows.map(String) : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map(String) : [],
      dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies.map(String) : [],
      affectedBy: Array.isArray(parsed.affected_by) ? parsed.affected_by.map(String) : [],
      confidence,
    };
  } catch (error) {
    console.error('Error summarizing cluster:', error);
    return null;
  }
}

async function retrySummarization(ai: GoogleGenAI, filePaths: string): Promise<FeatureClusterSummary | null> {
  const stricterPrompt = `Analyze these files and return ONLY a valid JSON object (no markdown, no explanation):

Files:
${filePaths}

Return exactly this structure:
{"feature_name":"string","summary":"string","user_flows":[],"constraints":[],"dependencies":[],"affected_by":[],"confidence":"high|medium|low"}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ text: stricterPrompt }],
    });

    const text = typeof (response as any).text === 'function' 
      ? (response as any).text() 
      : (response as any).text;
      
    if (!text) return null;

    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) 
      ? parsed.confidence 
      : 'medium';

    if (confidence === 'low') return null;

    return {
      featureName: String(parsed.feature_name ?? 'Unknown Feature'),
      summary: String(parsed.summary ?? ''),
      userFlows: Array.isArray(parsed.user_flows) ? parsed.user_flows.map(String) : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map(String) : [],
      dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies.map(String) : [],
      affectedBy: Array.isArray(parsed.affected_by) ? parsed.affected_by.map(String) : [],
      confidence,
    };
  } catch {
    return null;
  }
}

export interface BatchSummarizeOptions {
  repoFullName: string;
  token: string;
  clusters: CoChangeCluster[];
  batchSize?: number;
  maxPreviewFiles?: number;
  onProgress?: (progress: { processed: number; total: number }) => void;
}

export async function batchSummarizeClusters(
  options: BatchSummarizeOptions
): Promise<Map<CoChangeCluster, FeatureClusterSummary>> {
  const {
    repoFullName,
    token,
    clusters,
    batchSize = 5,
    maxPreviewFiles = 3,
    onProgress,
  } = options;

  const results = new Map<CoChangeCluster, FeatureClusterSummary>();
  
  for (let i = 0; i < clusters.length; i += batchSize) {
    const batch = clusters.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (cluster) => {
      const filePreviews = new Map<string, string>();
      
      const filesToPreview = cluster.files.slice(0, maxPreviewFiles);
      for (const filePath of filesToPreview) {
        try {
          const preview = await getFilePreview(repoFullName, filePath, token, 50);
          if (preview) {
            filePreviews.set(filePath, preview);
          }
        } catch {
          // Continue without preview
        }
      }

      const summary = await summarizeCluster({ cluster, filePreviews });
      return { cluster, summary };
    });

    const batchResults = await Promise.all(batchPromises);
    
    for (const { cluster, summary } of batchResults) {
      if (summary) {
        results.set(cluster, summary);
      }
    }

    onProgress?.({ processed: Math.min(i + batchSize, clusters.length), total: clusters.length });
    
    if (i + batchSize < clusters.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
}

export interface ImpactAnalysisInput {
  prdText: string;
  relatedFeatures: Array<{
    featureName: string;
    summary: string;
    userFlows: string[];
    constraints: string[];
    dependencies: string[];
    affectedBy: string[];
    filePaths: string[];
    relevanceScore: number;
  }>;
  projectName?: string;
}

export interface ImpactAnalysisResult {
  relatedFeatures: Array<{
    featureName: string;
    relevance: string;
    gap: string;
    severity: 'high' | 'medium' | 'low';
    files: string[];
  }>;
  summary: string;
  gapsCount: number;
}

const IMPACT_ANALYSIS_PROMPT = `You are a senior engineer reviewing a Product Requirements Document (PRD)
for a new feature. You have been given summaries of existing features in
the codebase that are semantically related to this PRD.

Your job is to identify gaps — things the PRD does not address but should,
given what already exists in the codebase.

PRD CONTENT:
{PRD_TEXT}

RELATED EXISTING FEATURES (retrieved from codebase):
{RELATED_FEATURES}

Respond with a JSON object:
{
  "related_features": [
    {
      "feature_name": "name of the related feature",
      "relevance": "brief explanation of why this is related",
      "gap": "specific thing the PRD does not address about this feature",
      "severity": "high | medium | low",
      "files": ["relevant file paths"]
    }
  ],
  "summary": "2-3 sentence overall assessment of PRD completeness",
  "gaps_count": number
}

Only include features where there is a genuine gap.
Do not include features that are related but not affected.
If no gaps are found, return an empty related_features array.
Respond ONLY with the JSON object.`;

export async function analyzeImpact(input: ImpactAnalysisInput): Promise<ImpactAnalysisResult> {
  const ai = getAI();

  const relatedFeaturesText = input.relatedFeatures.map((f, i) => {
    return `
${i + 1}. ${f.featureName} (relevance score: ${f.relevanceScore.toFixed(2)})
   Summary: ${f.summary}
   User flows: ${f.userFlows.join(', ') || 'None documented'}
   Constraints: ${f.constraints.join(', ') || 'None documented'}
   Dependencies: ${f.dependencies.join(', ') || 'None documented'}
   Files: ${f.filePaths.slice(0, 5).join(', ')}${f.filePaths.length > 5 ? ` (+${f.filePaths.length - 5} more)` : ''}
`.trim();
  }).join('\n\n');

  const prompt = IMPACT_ANALYSIS_PROMPT
    .replace('{PRD_TEXT}', input.prdText)
    .replace('{RELATED_FEATURES}', relatedFeaturesText);

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ text: prompt }],
    });

    const text = typeof (response as any).text === 'function' 
      ? (response as any).text() 
      : (response as any).text;

    if (!text || typeof text !== 'string') {
      return {
        relatedFeatures: [],
        summary: 'Unable to perform impact analysis - no response from AI',
        gapsCount: 0,
      };
    }

    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    const relatedFeatures = (parsed.related_features || []).map((f: any) => ({
      featureName: String(f.feature_name ?? ''),
      relevance: String(f.relevance ?? ''),
      gap: String(f.gap ?? ''),
      severity: ['high', 'medium', 'low'].includes(f.severity) ? f.severity : 'medium',
      files: Array.isArray(f.files) ? f.files.map(String) : [],
    }));

    return {
      relatedFeatures,
      summary: String(parsed.summary ?? ''),
      gapsCount: typeof parsed.gaps_count === 'number' ? parsed.gaps_count : relatedFeatures.length,
    };
  } catch (error) {
    console.error('Error analyzing impact:', error);
    return {
      relatedFeatures: [],
      summary: 'Error performing impact analysis',
      gapsCount: 0,
    };
  }
}
