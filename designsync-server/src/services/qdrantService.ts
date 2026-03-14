import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'repo_features';
const VECTOR_SIZE = 1536;

let qdrantClient: QdrantClient | null = null;

function getEnv(key: string): string | undefined {
  return process.env[key];
}

function getQdrantClient(): QdrantClient {
  if (qdrantClient) return qdrantClient;

  const url = getEnv('QDRANT_URL');
  const apiKey = getEnv('QDRANT_API_KEY');

  if (!url) {
    throw new Error('QDRANT_URL is not set');
  }

  qdrantClient = new QdrantClient({
    url,
    apiKey,
  });

  return qdrantClient;
}

async function getOpenAIEmbedding(text: string): Promise<number[]> {
  const apiKey = getEnv('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as any;
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json() as any;
  return data.data[0].embedding;
}

export async function initializeQdrantCollection(): Promise<void> {
  const client = getQdrantClient();

  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });

      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'repository_id',
        field_schema: 'keyword',
      });

      console.log(`[Qdrant] Created collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`[Qdrant] Collection already exists: ${COLLECTION_NAME}`);
    }
  } catch (error) {
    console.error('[Qdrant] Failed to initialize collection:', error);
    throw error;
  }
}

export interface QdrantPointPayload {
  repository_id: string;
  feature_name: string;
  summary: string;
  constraints: string[];
  dependencies: string[];
  affected_by: string[];
  user_flows: string[];
  file_paths: string[];
  cluster_id: string;
  [key: string]: unknown;
}

export interface UpsertPointInput {
  id: string;
  repositoryId: string;
  featureName: string;
  summary: string;
  userFlows: string[];
  constraints: string[];
  dependencies: string[];
  affectedBy: string[];
  filePaths: string[];
  clusterId: string;
}

export async function upsertFeaturePoint(input: UpsertPointInput): Promise<void> {
  const client = getQdrantClient();

  const textToEmbed = `
Feature: ${input.featureName}
Description: ${input.summary}
User flows: ${input.userFlows.join('. ')}
Constraints: ${input.constraints.join('. ')}
  `.trim();

  const vector = await getOpenAIEmbedding(textToEmbed);

  await client.upsert(COLLECTION_NAME, {
    points: [
      {
        id: input.id,
        vector,
        payload: {
          repository_id: input.repositoryId,
          feature_name: input.featureName,
          summary: input.summary,
          constraints: input.constraints,
          dependencies: input.dependencies,
          affected_by: input.affectedBy,
          user_flows: input.userFlows,
          file_paths: input.filePaths,
          cluster_id: input.clusterId,
        } as QdrantPointPayload,
      },
    ],
  });
}

export async function batchUpsertFeaturePoints(inputs: UpsertPointInput[]): Promise<void> {
  const client = getQdrantClient();
  const batchSize = 10;

  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);

    const pointsWithVectors = await Promise.all(
      batch.map(async (input) => {
        const textToEmbed = `
Feature: ${input.featureName}
Description: ${input.summary}
User flows: ${input.userFlows.join('. ')}
Constraints: ${input.constraints.join('. ')}
        `.trim();

        const vector = await getOpenAIEmbedding(textToEmbed);

        return {
          id: input.id,
          vector,
          payload: {
            repository_id: input.repositoryId,
            feature_name: input.featureName,
            summary: input.summary,
            constraints: input.constraints,
            dependencies: input.dependencies,
            affected_by: input.affectedBy,
            user_flows: input.userFlows,
            file_paths: input.filePaths,
            cluster_id: input.clusterId,
          } as QdrantPointPayload,
        };
      })
    );

    await client.upsert(COLLECTION_NAME, { points: pointsWithVectors });

    if (i + batchSize < inputs.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

export interface SearchResult {
  id: string;
  score: number;
  featureName: string;
  summary: string;
  constraints: string[];
  dependencies: string[];
  affectedBy: string[];
  userFlows: string[];
  filePaths: string[];
  clusterId: string;
}

export async function searchSimilarFeatures(
  repositoryId: string,
  prdText: string,
  topK: number = 6,
  minScore: number = 0.65
): Promise<SearchResult[]> {
  const client = getQdrantClient();

  const queryVector = await getOpenAIEmbedding(prdText);

  const searchResult = await client.search(COLLECTION_NAME, {
    vector: queryVector,
    filter: {
      must: [
        {
          key: 'repository_id',
          match: { value: repositoryId },
        },
      ],
    },
    limit: topK,
    with_payload: true,
  });

  return searchResult
    .filter((r) => r.score >= minScore)
    .map((r) => {
      const payload = r.payload as unknown as QdrantPointPayload;
      return {
        id: String(r.id),
        score: r.score,
        featureName: payload.feature_name,
        summary: payload.summary,
        constraints: payload.constraints || [],
        dependencies: payload.dependencies || [],
        affectedBy: payload.affected_by || [],
        userFlows: payload.user_flows || [],
        filePaths: payload.file_paths || [],
        clusterId: payload.cluster_id,
      };
    });
}

export async function deleteRepositoryPoints(repositoryId: string): Promise<void> {
  const client = getQdrantClient();

  await client.delete(COLLECTION_NAME, {
    filter: {
      must: [
        {
          key: 'repository_id',
          match: { value: repositoryId },
        },
      ],
    },
  });
}

export async function getPointCount(repositoryId?: string): Promise<number> {
  const client = getQdrantClient();

  if (repositoryId) {
    const result = await client.count(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'repository_id',
            match: { value: repositoryId },
          },
        ],
      },
      exact: true,
    });
    return result.count;
  }

  const result = await client.count(COLLECTION_NAME, { exact: true });
  return result.count;
}

export function isQdrantAvailable(): boolean {
  return Boolean(getEnv('QDRANT_URL'));
}
