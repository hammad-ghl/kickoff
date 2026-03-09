import Project from '../models/Project';
import Report from '../models/Report';

interface FigmaComponentInstance {
  instanceName: string;
  componentName: string;
  componentId: string;
  properties: Record<string, any>;
  overrides: any[];
  boundVariables: Record<string, any>;
}

interface FigmaData {
  usedComponents: FigmaComponentInstance[];
  pages: string[];
  componentDefs: Record<string, string>;
}

interface VueComponent {
  name: string;
  filename: string;
  slots: string[];
  props: string[];
}

interface VueFileUsage {
  filename: string;
  components: { name: string; slots: string[] }[];
}

async function fetchFigmaComponents(
  fileKey: string,
  token: string,
  targetPage?: string,
  targetFrame?: string
): Promise<FigmaData> {
  const headers = { 'X-Figma-Token': token };

  console.log(`Fetching Figma file: ${fileKey}`);
  const resp = await fetch(`https://api.figma.com/v1/files/${fileKey}`, { headers });
  if (!resp.ok) {
    const err: any = await resp.json().catch(() => ({}));
    const errorMessage = err.message || err.err || err.error || resp.statusText;
    console.error(`Figma API error response:`, { status: resp.status, error: err });
    
    if (resp.status === 403) {
      throw new Error('Figma API error: Access denied. Check that your Figma token has access to this file.');
    }
    if (resp.status === 404) {
      throw new Error('Figma API error: File not found. Check that the Figma URL is correct and the file exists.');
    }
    if (resp.status === 400) {
      throw new Error(`Figma API error: ${errorMessage}. Check your Figma URL and token.`);
    }
    if (resp.status === 401) {
      throw new Error('Figma API error: Invalid or expired token. Please generate a new Personal Access Token from Figma.');
    }
    throw new Error(`Figma API error: ${resp.status} — ${errorMessage}`);
  }
  const data: any = await resp.json();

  const compResp = await fetch(`https://api.figma.com/v1/files/${fileKey}/components`, { headers });
  const compData: any = compResp.ok ? await compResp.json() : { meta: { components: [] } };
  const componentDefs: Record<string, string> = {};
  (compData.meta?.components || []).forEach((c: any) => {
    componentDefs[c.key] = c.name;
  });

  const usedComponents: FigmaComponentInstance[] = [];
  const pages = data.document?.children || [];

  function walkNode(node: any, depth: number): void {
    if (depth > 50) return;
    if (node.type === 'INSTANCE') {
      usedComponents.push({
        instanceName: node.name,
        componentName: componentDefs[node.componentId] || node.name,
        componentId: node.componentId,
        properties: node.componentProperties || {},
        overrides: node.overrides || [],
        boundVariables: node.boundVariables || {},
      });
    }
    if (node.children) {
      node.children.forEach((child: any) => walkNode(child, depth + 1));
    }
  }

  for (const page of pages) {
    if (targetPage && !page.name.toLowerCase().includes(targetPage.toLowerCase())) continue;
    for (const frame of (page.children || [])) {
      if (targetFrame && !frame.name.toLowerCase().includes(targetFrame.toLowerCase())) continue;
      walkNode(frame, 0);
    }
  }

  return { usedComponents, pages: pages.map((p: any) => p.name), componentDefs };
}

async function githubFetch(url: string, token?: string): Promise<any> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers['Authorization'] = `token ${token}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    const err: any = await resp.json().catch(() => ({}));
    throw new Error(`GitHub API ${resp.status}: ${err.message || resp.statusText}`);
  }
  return resp.json();
}

async function getRepoTree(owner: string, repo: string, branch: string, token?: string) {
  const branchData = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/branches/${branch || 'main'}`,
    token
  );
  const sha = branchData.commit?.sha;
  if (!sha) throw new Error('Could not find branch SHA');

  const tree = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
    token
  );
  return tree.tree || [];
}

async function getFileContent(owner: string, repo: string, path: string, token?: string): Promise<string> {
  const data = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    token
  );
  if (data.encoding === 'base64') {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }
  return data.content || '';
}

function parseVueComponent(content: string, filename: string): VueComponent {
  const name = filename.replace('.vue', '').replace(/.*\//, '');
  const slots: string[] = [];
  const props: string[] = [];

  const slotRegex = /<slot\s*(?:name=["']([^"']+)["'])?/g;
  let m;
  while ((m = slotRegex.exec(content)) !== null) {
    slots.push(m[1] || 'default');
  }

  const definePropsMatch = content.match(/defineProps\s*\(\s*(\{[\s\S]*?\})\s*\)/);
  if (definePropsMatch) {
    const propsBlock = definePropsMatch[1];
    const propNames = [...propsBlock.matchAll(/(\w+)\s*:/g)].map(x => x[1]);
    props.push(...propNames);
  }

  const optionsPropsMatch = content.match(/props\s*:\s*(\{[\s\S]*?\})/);
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
    name,
    filename,
    slots: [...new Set(slots)],
    props: [...new Set(props)],
  };
}

function parseVueUsage(content: string, filename: string): VueFileUsage {
  const componentUsages: Record<string, { slots: string[]; props: string[] }> = {};
  
  const tagRegex = /<([A-Z][A-Za-z]+)[^>]*>/g;
  let m;
  while ((m = tagRegex.exec(content)) !== null) {
    const tag = m[1];
    if (!componentUsages[tag]) componentUsages[tag] = { slots: [], props: [] };
  }

  const slotTemplateRegex = /<template\s+[#v][-:]slot[s]?[:=]["']?(\w+)["']?/g;
  while ((m = slotTemplateRegex.exec(content)) !== null) {
    const before = content.substring(0, m.index);
    const componentMatch = before.match(/<([A-Z][A-Za-z]+)[^>]*>[^<]*$/);
    if (componentMatch) {
      const comp = componentMatch[1];
      if (!componentUsages[comp]) componentUsages[comp] = { slots: [], props: [] };
      componentUsages[comp].slots.push(m[1]);
    }
  }

  return {
    filename,
    components: Object.keys(componentUsages).map(name => ({
      name,
      slots: componentUsages[name]?.slots || [],
    })),
  };
}

async function indexComponentLib(
  owner: string,
  repo: string,
  branch: string,
  token: string | undefined,
  compPath: string | undefined
): Promise<Record<string, VueComponent>> {
  const tree = await getRepoTree(owner, repo, branch, token);
  const basePath = compPath || 'src/components';
  const vueFiles = tree.filter((f: any) => f.type === 'blob' && f.path.endsWith('.vue') && f.path.startsWith(basePath));

  const components: Record<string, VueComponent> = {};

  const batchSize = 10;
  for (let i = 0; i < vueFiles.length; i += batchSize) {
    const batch = vueFiles.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (file: any) => {
        try {
          const content = await getFileContent(owner, repo, file.path, token);
          const parsed = parseVueComponent(content, file.path);
          components[parsed.name] = parsed;
        } catch (e) {
          console.warn('Could not read', file.path, (e as Error).message);
        }
      })
    );
  }

  return components;
}

async function scanCodebase(
  owner: string,
  repo: string,
  branch: string,
  token: string | undefined,
  focusPath: string | undefined
): Promise<VueFileUsage[]> {
  const tree = await getRepoTree(owner, repo, branch, token);
  const basePath = focusPath || 'src';
  const vueFiles = tree.filter((f: any) => f.type === 'blob' && f.path.endsWith('.vue') && f.path.startsWith(basePath));

  const usages: VueFileUsage[] = [];

  const batchSize = 10;
  for (let i = 0; i < vueFiles.length; i += batchSize) {
    const batch = vueFiles.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (file: any) => {
        try {
          const content = await getFileContent(owner, repo, file.path, token);
          const parsed = parseVueUsage(content, file.path);
          if (parsed.components.length > 0) usages.push(parsed);
        } catch (e) {
          console.warn('Could not read', file.path, (e as Error).message);
        }
      })
    );
  }

  return usages;
}

function analyzeGaps(
  figmaData: FigmaData,
  libIndex: Record<string, VueComponent>,
  codeUsages: VueFileUsage[],
  nameMap: Record<string, string>
) {
  const issues = {
    missingFromLib: [] as any[],
    incompatibleUsage: [] as any[],
    missingFromDesign: [] as any[],
  };

  const figmaCompNames = new Set<string>();

  function normalize(name: string): string {
    return nameMap[name] || name;
  }

  figmaData.usedComponents.forEach(inst => {
    const normalName = normalize(inst.componentName);
    figmaCompNames.add(normalName);

    const libComp = libIndex[normalName];

    if (!libComp) {
      if (!issues.missingFromLib.find((i: any) => i.componentName === normalName)) {
        issues.missingFromLib.push({
          componentName: normalName,
          figmaName: inst.componentName,
          description: `Component "${normalName}" is used in Figma but not found in the component library.`,
          severity: 'high',
        });
      }
    } else {
      const propKeys = Object.keys(inst.properties || {});

      propKeys.forEach(prop => {
        const propLower = prop.toLowerCase();
        if (
          (propLower.includes('footer') ||
            propLower.includes('header') ||
            propLower.includes('actions') ||
            propLower.includes('prefix') ||
            propLower.includes('suffix')) &&
          !libComp.slots.includes(propLower) &&
          !libComp.slots.includes('default')
        ) {
          if (
            !issues.incompatibleUsage.find(
              (i: any) => i.componentName === normalName && i.slot === propLower
            )
          ) {
            issues.incompatibleUsage.push({
              componentName: normalName,
              slot: propLower,
              availableSlots: libComp.slots,
              description: `Figma uses "${normalName}" with a "${prop}" region, but the lib component only has slots: [${libComp.slots.join(', ') || 'default'}]`,
              severity: 'medium',
              source: 'figma-property',
            });
          }
        }
      });
    }
  });

  codeUsages.forEach(fileUsage => {
    fileUsage.components.forEach(usage => {
      const libComp = libIndex[usage.name];
      if (!libComp) return;

      usage.slots.forEach(slot => {
        if (!libComp.slots.includes(slot) && libComp.slots.length > 0) {
          issues.incompatibleUsage.push({
            componentName: usage.name,
            slot,
            availableSlots: libComp.slots,
            description: `In "${fileUsage.filename}", <${usage.name}> uses slot "#${slot}" but the lib component only has: [${libComp.slots.join(', ')}]`,
            severity: 'medium',
            source: 'code',
            file: fileUsage.filename,
          });
        }
      });
    });
  });

  const allCodeComponents = new Set<string>();
  codeUsages.forEach(f => f.components.forEach(c => allCodeComponents.add(normalize(c.name))));

  allCodeComponents.forEach(compName => {
    if (libIndex[compName] && !figmaCompNames.has(compName)) {
      const files = codeUsages
        .filter(f => f.components.some(c => normalize(c.name) === compName))
        .map(f => f.filename);
      issues.missingFromDesign.push({
        componentName: compName,
        description: `"${compName}" is used in ${files.length} code file(s) but not represented in Figma designs. Design may be incomplete.`,
        severity: 'low',
        files: files.slice(0, 3),
      });
    }
  });

  return issues;
}

function parseGitHubRepo(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

function parseFigmaFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(file|design)\/([A-Za-z0-9]+)/);
  return match ? match[2] : null;
}

function buildNameMap(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!text) return map;
  text.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
      map[parts[0].trim()] = parts[1].trim();
    }
  });
  return map;
}

async function updateProgress(
  reportId: string,
  step: string,
  message: string,
  percentage: number
): Promise<void> {
  await Report.findByIdAndUpdate(reportId, {
    progress: { step, message, percentage },
  });
}

export async function runAnalysis(reportId: string, projectId: string): Promise<void> {
  try {
    const report = await Report.findById(reportId);
    if (!report) throw new Error('Report not found');

    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    await Report.findByIdAndUpdate(reportId, {
      status: 'analyzing',
      progress: { step: 'validating', message: 'Validating configuration...', percentage: 5 },
    });

    const { config } = project;

    const figmaKey = parseFigmaFileKey(config.figmaUrl);
    if (!figmaKey) {
      throw new Error('Invalid Figma URL. Expected format: https://www.figma.com/design/FILE_KEY/... or https://www.figma.com/file/FILE_KEY/...');
    }

    if (!config.figmaToken || config.figmaToken.trim() === '') {
      throw new Error('Figma access token is required. Generate one at https://www.figma.com/developers/api#access-tokens');
    }

    const libGH = parseGitHubRepo(config.libRepo);
    if (!libGH) throw new Error('Invalid library repo URL. Expected format: https://github.com/owner/repo');

    const codeGH = parseGitHubRepo(config.codeRepo);
    if (!codeGH) throw new Error('Invalid codebase repo URL. Expected format: https://github.com/owner/repo');

    const nameMap = buildNameMap(config.nameMappings || '');

    await updateProgress(reportId, 'fetching_figma', 'Fetching Figma components...', 15);

    const figmaData = await fetchFigmaComponents(
      figmaKey,
      config.figmaToken,
      config.figmaPage,
      config.figmaFrame
    );

    await updateProgress(reportId, 'indexing_library', `Indexing component library (${libGH.owner}/${libGH.repo})...`, 40);

    const libIndex = await indexComponentLib(
      libGH.owner,
      libGH.repo,
      config.libBranch || 'main',
      config.libToken,
      config.libPath
    );

    await updateProgress(reportId, 'scanning_codebase', `Scanning codebase (${codeGH.owner}/${codeGH.repo})...`, 65);

    const codeUsages = await scanCodebase(
      codeGH.owner,
      codeGH.repo,
      config.codeBranch || 'main',
      config.codeToken || config.libToken,
      config.codePath
    );

    await updateProgress(reportId, 'analyzing_gaps', 'Analyzing gaps between design and code...', 85);

    const issues = analyzeGaps(figmaData, libIndex, codeUsages, nameMap);

    await Report.findByIdAndUpdate(reportId, {
      status: 'completed',
      progress: { step: 'complete', message: 'Analysis complete!', percentage: 100 },
      result: {
        issues,
        metadata: {
          figmaInstancesCount: figmaData.usedComponents.length,
          libComponentsCount: Object.keys(libIndex).length,
          codeFilesCount: codeUsages.length,
        },
      },
    });

  } catch (error) {
    console.error('Analysis error:', error);
    await Report.findByIdAndUpdate(reportId, {
      status: 'failed',
      progress: { step: 'complete', message: 'Analysis failed', percentage: 100 },
      error: (error as Error).message,
    });
  }
}
