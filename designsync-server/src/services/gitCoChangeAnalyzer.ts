import fetch from 'node-fetch';

export interface CoChangeCluster {
  files: string[];
  coChangeScore: number;
}

interface CommitFile {
  filename: string;
  status: string;
}

interface Commit {
  sha: string;
  parents: { sha: string }[];
}

const SOURCE_FILE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte',
  '.py', '.go', '.rs', '.java', '.kt', '.rb',
  '.cs', '.php', '.swift', '.m', '.h', '.cpp', '.c'
];

const EXCLUDED_PATTERNS = [
  /node_modules\//,
  /\.test\./,
  /\.spec\./,
  /\.stories\./,
  /__tests__\//,
  /__mocks__\//,
  /\.d\.ts$/,
  /\.config\./,
  /\.lock$/,
  /\.md$/,
  /\.json$/,
  /\.yaml$/,
  /\.yml$/,
  /\.env/,
  /\.gitignore/,
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock\.yaml/,
];

function isSourceFile(path: string): boolean {
  if (EXCLUDED_PATTERNS.some(p => p.test(path))) return false;
  return SOURCE_FILE_EXTENSIONS.some(ext => path.endsWith(ext));
}

async function githubApiFetch(url: string, token: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (response.status === 403) {
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    const rateLimitReset = response.headers.get('x-ratelimit-reset');
    if (rateLimitRemaining === '0' && rateLimitReset) {
      const resetTime = parseInt(rateLimitReset) * 1000;
      const waitTime = resetTime - Date.now();
      if (waitTime > 0 && waitTime < 60000) {
        await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
        return githubApiFetch(url, token);
      }
    }
    throw new Error('GitHub API rate limit exceeded');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as any;
    throw new Error(`GitHub API ${response.status}: ${err.message || response.statusText}`);
  }

  return response.json();
}

async function fetchCommits(
  repoFullName: string,
  branch: string,
  token: string,
  maxCommits: number
): Promise<Commit[]> {
  const [owner, repo] = repoFullName.split('/');
  const commits: Commit[] = [];
  let page = 1;
  const perPage = 100;

  while (commits.length < maxCommits) {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=${perPage}&page=${page}`;
    const batch = await githubApiFetch(url, token);
    
    if (!batch || batch.length === 0) break;
    commits.push(...batch);
    
    if (batch.length < perPage) break;
    page++;
    
    if (page % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return commits.slice(0, maxCommits);
}

async function fetchCommitFiles(
  repoFullName: string,
  sha: string,
  token: string
): Promise<string[]> {
  const [owner, repo] = repoFullName.split('/');
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
  
  try {
    const data = await githubApiFetch(url, token);
    if (!data.files) return [];
    
    return data.files
      .map((f: CommitFile) => f.filename)
      .filter((f: string) => isSourceFile(f));
  } catch (error) {
    console.warn(`Failed to fetch files for commit ${sha}:`, error);
    return [];
  }
}

class UnionFind {
  parent: Map<string, string> = new Map();
  rank: Map<string, number> = new Map();

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }

  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    if (rootX === rootY) return;

    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;

    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
  }

  getClusters(): Map<string, string[]> {
    const clusters = new Map<string, string[]>();
    for (const file of this.parent.keys()) {
      const root = this.find(file);
      if (!clusters.has(root)) {
        clusters.set(root, []);
      }
      clusters.get(root)!.push(file);
    }
    return clusters;
  }
}

export interface AnalyzeOptions {
  maxCommits?: number;
  minCoChangeScore?: number;
  minClusterSize?: number;
  maxFilesPerCommit?: number;
  onProgress?: (progress: { step: string; current: number; total: number }) => void;
}

export async function analyzeCoChanges(
  githubRepoFullName: string,
  branch: string,
  token: string,
  options: AnalyzeOptions = {}
): Promise<CoChangeCluster[]> {
  const {
    maxCommits = 500,
    minCoChangeScore = 0.3,
    minClusterSize = 2,
    maxFilesPerCommit = 50,
    onProgress,
  } = options;

  onProgress?.({ step: 'Fetching commits', current: 0, total: maxCommits });
  
  const allCommits = await fetchCommits(githubRepoFullName, branch, token, maxCommits);
  
  const filteredCommits = allCommits.filter(c => c.parents.length === 1);
  
  onProgress?.({ step: 'Analyzing commit files', current: 0, total: filteredCommits.length });

  const fileCoOccurrence = new Map<string, Map<string, number>>();
  const fileCommitCount = new Map<string, number>();
  const batchSize = 10;

  for (let i = 0; i < filteredCommits.length; i += batchSize) {
    const batch = filteredCommits.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(commit => fetchCommitFiles(githubRepoFullName, commit.sha, token))
    );

    for (const files of batchResults) {
      if (files.length === 0 || files.length > maxFilesPerCommit) continue;

      for (const file of files) {
        fileCommitCount.set(file, (fileCommitCount.get(file) || 0) + 1);
      }

      for (let j = 0; j < files.length; j++) {
        for (let k = j + 1; k < files.length; k++) {
          const [fileA, fileB] = [files[j], files[k]].sort();
          
          if (!fileCoOccurrence.has(fileA)) {
            fileCoOccurrence.set(fileA, new Map());
          }
          const inner = fileCoOccurrence.get(fileA)!;
          inner.set(fileB, (inner.get(fileB) || 0) + 1);
        }
      }
    }

    onProgress?.({ step: 'Analyzing commit files', current: Math.min(i + batchSize, filteredCommits.length), total: filteredCommits.length });
    
    if (i % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  onProgress?.({ step: 'Building clusters', current: 0, total: 1 });

  const uf = new UnionFind();
  const pairScores = new Map<string, number>();

  for (const [fileA, coOccurrences] of fileCoOccurrence) {
    for (const [fileB, count] of coOccurrences) {
      const countA = fileCommitCount.get(fileA) || 0;
      const countB = fileCommitCount.get(fileB) || 0;
      
      const jaccard = count / (countA + countB - count);
      
      if (jaccard >= minCoChangeScore) {
        uf.union(fileA, fileB);
        pairScores.set(`${fileA}|${fileB}`, jaccard);
      }
    }
  }

  const rawClusters = uf.getClusters();
  const clusters: CoChangeCluster[] = [];

  for (const [, files] of rawClusters) {
    if (files.length < minClusterSize) continue;

    let totalScore = 0;
    let pairCount = 0;
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const [a, b] = [files[i], files[j]].sort();
        const score = pairScores.get(`${a}|${b}`);
        if (score) {
          totalScore += score;
          pairCount++;
        }
      }
    }

    clusters.push({
      files: files.sort(),
      coChangeScore: pairCount > 0 ? totalScore / pairCount : minCoChangeScore,
    });
  }

  clusters.sort((a, b) => b.files.length - a.files.length);

  onProgress?.({ step: 'Complete', current: 1, total: 1 });

  return clusters;
}

export async function getFilePreview(
  repoFullName: string,
  filePath: string,
  token: string,
  maxLines: number = 50
): Promise<string> {
  const [owner, repo] = repoFullName.split('/');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) return '';

    const data = await response.json() as any;
    if (data.encoding === 'base64') {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const lines = content.split('\n').slice(0, maxLines);
      return lines.join('\n');
    }
    return '';
  } catch {
    return '';
  }
}
