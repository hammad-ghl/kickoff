import fetch from 'node-fetch';

function getEnv() {
  return {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/api/auth/github/callback',
  };
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  default_branch: string;
  html_url: string;
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

export function getGitHubAuthUrl(state?: string): string {
  const env = getEnv();
  const params = new URLSearchParams({
    client_id: env.clientId,
    redirect_uri: env.redirectUri,
    scope: 'read:user user:email repo',
    state: state || '',
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const env = getEnv();
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.clientId,
      client_secret: env.clientSecret,
      code,
      redirect_uri: env.redirectUri,
    }),
  });

  const data = await response.json() as any;
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  return data.access_token;
}

export async function getGitHubUser(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub user');
  }

  return response.json() as Promise<GitHubUser>;
}

export async function getUserRepos(token: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch repos');
    }

    const batch = await response.json() as GitHubRepo[];
    repos.push(...batch);

    if (batch.length < perPage) break;
    page++;
    if (page > 5) break;
  }

  return repos;
}

async function githubApiFetch(url: string, token: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as any;
    throw new Error(`GitHub API ${response.status}: ${err.message || response.statusText}`);
  }

  return response.json();
}

async function getRepoTree(owner: string, repo: string, branch: string, token: string) {
  const branchData = await githubApiFetch(
    `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
    token
  );
  const sha = branchData.commit?.sha;
  if (!sha) throw new Error('Could not find branch SHA');

  const tree = await githubApiFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
    token
  );
  return tree.tree || [];
}

async function getFileContent(owner: string, repo: string, path: string, token: string): Promise<string> {
  const data = await githubApiFetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    token
  );
  if (data.encoding === 'base64') {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }
  return data.content || '';
}

function detectFramework(filename: string, content: string): 'vue' | 'react' | 'svelte' | 'angular' | 'unknown' {
  if (filename.endsWith('.vue')) return 'vue';
  if (filename.endsWith('.svelte')) return 'svelte';
  if (filename.endsWith('.component.ts') || filename.endsWith('.component.html')) return 'angular';
  
  if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
    if (content.includes('import React') || content.includes("from 'react'") || content.includes('from "react"')) {
      return 'react';
    }
  }
  
  return 'unknown';
}

function parseVueComponent(content: string, filename: string): Partial<ComponentDef> {
  const slots: string[] = [];
  const props: string[] = [];

  const slotRegex = /<slot\s*(?:name=["']([^"']+)["'])?/g;
  let m;
  while ((m = slotRegex.exec(content)) !== null) {
    slots.push(m[1] || 'default');
  }

  const definePropsMatch = content.match(/defineProps\s*[<(]\s*(?:\{([\s\S]*?)\}|\s*(\w+)\s*[>)])/);
  if (definePropsMatch) {
    const propsBlock = definePropsMatch[1] || '';
    const propNames = [...propsBlock.matchAll(/(\w+)\s*[?:]?\s*:/g)].map(x => x[1]);
    props.push(...propNames);
  }

  const optionsPropsMatch = content.match(/props\s*:\s*\{([\s\S]*?)\}/);
  if (optionsPropsMatch && !definePropsMatch) {
    const propsBlock = optionsPropsMatch[1];
    const propNames = [...propsBlock.matchAll(/(\w+)\s*:/g)].map(x => x[1]);
    props.push(...propNames);
  }

  const arrayPropsMatch = content.match(/props\s*:\s*\[([^\]]+)\]/);
  if (arrayPropsMatch) {
    const propNames = [...arrayPropsMatch[1].matchAll(/['"](\w+)['"]/g)].map(x => x[1]);
    props.push(...propNames);
  }

  return {
    props: [...new Set(props)],
    slots: [...new Set(slots)],
    variants: [],
  };
}

function parseReactComponent(content: string, filename: string): Partial<ComponentDef> {
  const props: string[] = [];
  const slots: string[] = [];

  const interfaceMatch = content.match(/interface\s+\w*Props\s*\{([\s\S]*?)\}/);
  if (interfaceMatch) {
    const propsBlock = interfaceMatch[1];
    const propNames = [...propsBlock.matchAll(/(\w+)\s*[?:]?\s*:/g)].map(x => x[1]);
    props.push(...propNames);
  }

  const typeMatch = content.match(/type\s+\w*Props\s*=\s*\{([\s\S]*?)\}/);
  if (typeMatch && !interfaceMatch) {
    const propsBlock = typeMatch[1];
    const propNames = [...propsBlock.matchAll(/(\w+)\s*[?:]?\s*:/g)].map(x => x[1]);
    props.push(...propNames);
  }

  if (content.includes('children')) {
    slots.push('children');
  }

  const renderPropsMatch = content.match(/render\w+\s*[?:]?\s*:/g);
  if (renderPropsMatch) {
    renderPropsMatch.forEach(match => {
      const slotName = match.replace(/\s*[?:]?\s*:/, '').trim();
      slots.push(slotName);
    });
  }

  return {
    props: [...new Set(props.filter(p => p !== 'children'))],
    slots: [...new Set(slots)],
    variants: [],
  };
}

function parseSvelteComponent(content: string, filename: string): Partial<ComponentDef> {
  const props: string[] = [];
  const slots: string[] = [];

  const exportLetMatch = content.matchAll(/export\s+let\s+(\w+)/g);
  for (const match of exportLetMatch) {
    props.push(match[1]);
  }

  const slotMatch = content.matchAll(/<slot\s*(?:name=["']([^"']+)["'])?/g);
  for (const match of slotMatch) {
    slots.push(match[1] || 'default');
  }

  return {
    props: [...new Set(props)],
    slots: [...new Set(slots)],
    variants: [],
  };
}

function extractComponentName(filename: string): string {
  return filename
    .replace(/.*\//, '')
    .replace(/\.(vue|tsx|jsx|svelte|component\.ts)$/, '')
    .replace(/\.index$/, '');
}

function isComponentFile(path: string): boolean {
  if (path.includes('node_modules/')) return false;
  if (path.includes('.test.') || path.includes('.spec.') || path.includes('.stories.')) return false;
  if (path.includes('__tests__/') || path.includes('__mocks__/')) return false;
  
  return (
    path.endsWith('.vue') ||
    path.endsWith('.tsx') ||
    path.endsWith('.jsx') ||
    path.endsWith('.svelte')
  );
}

export async function indexComponentLibrary(
  owner: string,
  repo: string,
  branch: string,
  token: string,
  componentPath?: string
): Promise<ComponentDef[]> {
  const tree = await getRepoTree(owner, repo, branch, token);
  const basePath = componentPath || '';
  
  const componentFiles = tree.filter((f: any) => {
    if (f.type !== 'blob') return false;
    if (!isComponentFile(f.path)) return false;
    if (basePath && !f.path.startsWith(basePath)) return false;
    return true;
  });

  const components: ComponentDef[] = [];
  const batchSize = 10;

  for (let i = 0; i < componentFiles.length; i += batchSize) {
    const batch = componentFiles.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (file: any) => {
        try {
          const content = await getFileContent(owner, repo, file.path, token);
          const framework = detectFramework(file.path, content);
          const name = extractComponentName(file.path);

          let parsed: Partial<ComponentDef> = { props: [], slots: [], variants: [] };

          switch (framework) {
            case 'vue':
              parsed = parseVueComponent(content, file.path);
              break;
            case 'react':
              parsed = parseReactComponent(content, file.path);
              break;
            case 'svelte':
              parsed = parseSvelteComponent(content, file.path);
              break;
          }

          return {
            name,
            description: '',
            props: parsed.props || [],
            slots: parsed.slots || [],
            variants: parsed.variants || [],
            filePath: file.path,
            framework,
          } as ComponentDef;
        } catch (e) {
          console.warn('Could not parse', file.path, (e as Error).message);
          return null;
        }
      })
    );

    components.push(...results.filter((c): c is ComponentDef => c !== null));
  }

  return components.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRepoBranches(owner: string, repo: string, token: string, search?: string): Promise<string[]> {
  if (search) {
    try {
      const refs = await githubApiFetch(
        `https://api.github.com/repos/${owner}/${repo}/git/matching-refs/heads/${encodeURIComponent(search)}`,
        token
      );
      const branches = refs.map((r: any) => r.ref.replace('refs/heads/', ''));
      if (branches.length > 0) {
        return branches.slice(0, 30);
      }
    } catch (err) {
      // Fall back to listing all branches if matching-refs fails
    }
  }
  
  // Default: list branches (no server-side search available)
  const branches = await githubApiFetch(
    `https://api.github.com/repos/${owner}/${repo}/branches?per_page=50`,
    token
  );
  
  let result = branches.map((b: any) => b.name);
  
  // Client-side filter if search provided but matching-refs didn't work
  if (search) {
    const searchLower = search.toLowerCase();
    result = result.filter((b: string) => b.toLowerCase().includes(searchLower));
  }
  
  return result;
}

export async function getRepoDirectories(owner: string, repo: string, branch: string, token: string): Promise<string[]> {
  const tree = await getRepoTree(owner, repo, branch, token);
  const dirs = tree
    .filter((f: any) => f.type === 'tree')
    .map((f: any) => f.path)
    .filter((p: string) => !p.includes('node_modules') && !p.startsWith('.'));
  return dirs;
}
