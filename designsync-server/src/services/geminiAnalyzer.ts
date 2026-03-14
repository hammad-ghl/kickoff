import { GoogleGenAI } from '@google/genai';
import type { IComponentDef } from '../models/UILibrary';
import type { IComponentCheck, ICaseCheck } from '../models/Review';
import type { IExpectedCase } from '../models/Project';

const MODEL = 'gemini-2.5-flash';

function getEnv(key: string): string | undefined {
  return process.env[key];
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid design image: expected data URL (data:...;base64,...)');
  }
  return { mimeType: match[1].trim(), base64: match[2] };
}

function getAI(): GoogleGenAI {
  const apiKey = getEnv('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenAI({ apiKey });
}

export interface GenerateCasesFromPRDInput {
  prdText: string;
  projectName?: string;
}

export async function generateCasesFromPRD(input: GenerateCasesFromPRDInput): Promise<IExpectedCase[]> {
  const ai = getAI();

  const prompt = `You are a product design review assistant. Analyze the following PRD (Product Requirements Document) and enumerate ALL the user flows, edge cases, and states that a complete implementation would need.

**PRD Content:**
${input.prdText}

${input.projectName ? `**Project/Feature Name:** ${input.projectName}` : ''}

**Task:** Generate a comprehensive list of test cases/flows that should be designed and implemented for this feature. Think about:
- All user flows mentioned in the PRD
- User flows that are implied but not explicitly mentioned
- Edge cases (empty states, error states, loading states)
- Validation scenarios
- Permission/access scenarios
- Mobile/responsive considerations if applicable
- Undo/cancel flows

For each case, assign an importance level:
- "critical": Must have for MVP, core functionality
- "important": Should have, significantly impacts UX
- "nice-to-have": Good to have, but can be deprioritized

**Output format:** Reply with a single JSON object only, no markdown or extra text:
{
  "cases": [
    {
      "name": "string (short descriptive name)",
      "description": "string (what this case covers)",
      "importance": "critical" | "important" | "nice-to-have"
    }
  ]
}

Now analyze the PRD and return only the JSON object.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ text: prompt }],
  });

  const text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
  if (!text || typeof text !== 'string') {
    throw new Error('Gemini returned no text for PRD analysis');
  }

  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  let parsed: any;

  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gemini response was not valid JSON: ${text.slice(0, 200)}...`);
  }

  const cases: IExpectedCase[] = (parsed.cases || []).map((c: any) => ({
    name: String(c.name ?? ''),
    description: String(c.description ?? ''),
    importance: ['critical', 'important', 'nice-to-have'].includes(c.importance) ? c.importance : 'important',
  }));

  return cases;
}

export interface GenerateCasesFromImageInput {
  designImageDataUrl: string;
  projectName?: string;
}

export async function generateCasesFromImage(input: GenerateCasesFromImageInput): Promise<IExpectedCase[]> {
  const ai = getAI();
  const { mimeType, base64 } = parseDataUrl(input.designImageDataUrl);

  const prompt = `You are a design review assistant. Analyze the provided UI/design screenshot.

**Task:** Based on what you see in this design, enumerate ALL the user flows, edge cases, and states that a complete implementation of this feature would need. Think beyond what's visible - what cases SHOULD exist for a complete implementation?

Consider:
- Main user flows visible in the design
- Flows that should exist but may not be shown (error handling, empty states, loading)
- Edge cases relevant to this type of feature
- Validation scenarios
- Alternative paths

For each case, assign an importance level:
- "critical": Must have for MVP, core functionality
- "important": Should have, significantly impacts UX
- "nice-to-have": Good to have, but can be deprioritized

${input.projectName ? `**Project/Feature Name:** ${input.projectName}` : ''}

**Output format:** Reply with a single JSON object only, no markdown or extra text:
{
  "cases": [
    {
      "name": "string (short descriptive name)",
      "description": "string (what this case covers)",
      "importance": "critical" | "important" | "nice-to-have"
    }
  ]
}

Now analyze the image and return only the JSON object.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        inlineData: {
          mimeType: mimeType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
          data: base64,
        },
      },
      { text: prompt },
    ],
  });

  const text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
  if (!text || typeof text !== 'string') {
    throw new Error('Gemini returned no text for image analysis');
  }

  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  let parsed: any;

  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gemini response was not valid JSON: ${text.slice(0, 200)}...`);
  }

  const cases: IExpectedCase[] = (parsed.cases || []).map((c: any) => ({
    name: String(c.name ?? ''),
    description: String(c.description ?? ''),
    importance: ['critical', 'important', 'nice-to-have'].includes(c.importance) ? c.importance : 'important',
  }));

  return cases;
}

export interface CheckCaseCoverageInput {
  designImages: string[];
  expectedCases: IExpectedCase[];
  projectName?: string;
}

export async function checkCaseCoverage(input: CheckCaseCoverageInput): Promise<ICaseCheck[]> {
  const ai = getAI();

  const imageContents = input.designImages.map(img => {
    const { mimeType, base64 } = parseDataUrl(img);
    return {
      inlineData: {
        mimeType: mimeType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
        data: base64,
      },
    };
  });

  const casesList = input.expectedCases.map((c, i) => 
    `${i + 1}. **${c.name}** (${c.importance}): ${c.description}`
  ).join('\n');

  const prompt = `You are a design review assistant. You are given ${input.designImages.length} design screenshot(s) and a list of expected cases/flows that should be covered.

**Expected Cases to Check:**
${casesList}

${input.projectName ? `**Project/Feature Name:** ${input.projectName}` : ''}

**Task:** For each expected case, determine if it is visible/covered in the design screenshots.

For each case, provide:
- "covered": The case is clearly shown in the design(s)
- "partial": Some aspects are shown but not complete
- "missing": The case is not visible in any of the designs
- "unclear": Cannot determine from the screenshots

Also provide:
- designEvidence: Brief description of what in the design shows this case (if covered/partial)
- notes: Any observations or concerns (especially for missing/partial cases)

**Output format:** Reply with a single JSON object only, no markdown or extra text:
{
  "caseChecks": [
    {
      "caseName": "string (exact name from expected cases)",
      "status": "covered" | "partial" | "missing" | "unclear",
      "designEvidence": "string (what shows this case, if any)",
      "notes": "string (observations or concerns)"
    }
  ]
}

Analyze all screenshots and return the JSON object.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [...imageContents, { text: prompt }],
  });

  const text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
  if (!text || typeof text !== 'string') {
    throw new Error('Gemini returned no text for case coverage check');
  }

  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  let parsed: any;

  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gemini response was not valid JSON: ${text.slice(0, 200)}...`);
  }

  const caseChecks: ICaseCheck[] = (parsed.caseChecks || []).map((c: any) => ({
    caseName: String(c.caseName ?? ''),
    status: ['covered', 'partial', 'missing', 'unclear'].includes(c.status) ? c.status : 'unclear',
    designEvidence: c.designEvidence ? String(c.designEvidence) : undefined,
    notes: c.notes ? String(c.notes) : undefined,
  }));

  return caseChecks;
}

export interface AnalyzeComponentsInput {
  designImages: string[];
  components: IComponentDef[];
  projectName?: string;
}

export interface AnalyzeComponentsResult {
  componentChecks: IComponentCheck[];
}

export async function analyzeComponents(input: AnalyzeComponentsInput): Promise<AnalyzeComponentsResult> {
  const ai = getAI();

  const imageContents = input.designImages.map(img => {
    const { mimeType, base64 } = parseDataUrl(img);
    return {
      inlineData: {
        mimeType: mimeType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
        data: base64,
      },
    };
  });

  const componentList = input.components.length
    ? input.components.map(c => {
        const parts = [`- ${c.name}`];
        if (c.props?.length) parts.push(`props=[${c.props.join(', ')}]`);
        if (c.slots?.length) parts.push(`slots=[${c.slots.join(', ')}]`);
        if (c.variants?.length) parts.push(`variants=[${c.variants.join(', ')}]`);
        return parts.join(' | ');
      }).join('\n')
    : '(No components in library)';

  const prompt = `You are a design review assistant. Analyze the provided UI/design screenshot(s) and map visible UI elements to the component library.

**Component library (these are the only components available in the codebase):**
${componentList}

${input.projectName ? `**Project/Feature Name:** ${input.projectName}` : ''}

**Tasks:**
1. Identify the UNIQUE component types used in the design (buttons, inputs, cards, modals, nav items, tables, icons, etc.)
2. **IMPORTANT: Do NOT list duplicates.** If a component type (e.g., Button) appears multiple times in the design, only include it ONCE in your output. Pick the MOST PROMINENT or FIRST instance for the bounding box.
3. For each unique component type:
   - Match it to the closest component in the library by name (use exact library name if it matches)
   - Set exists: true if it matches a library component, false if not in library
   - Set hasIssue: true if:
     - The component isn't in the library
     - The design uses props/slots/variants that don't exist in the library component
     - The design requires functionality the library component doesn't support
   - If hasIssue, explain why in issueDescription
   - Aggregate ALL props/slots used across all instances of this component type
   - **CRITICAL: Provide a bounding box** for ONE representative instance of this component in the image

**Bounding Box Format:**
- x: horizontal position from left edge as decimal (0.0 = left edge, 1.0 = right edge)
- y: vertical position from top edge as decimal (0.0 = top edge, 1.0 = bottom edge)
- width: width as decimal fraction of image width
- height: height as decimal fraction of image height

**Output format:** Reply with a single JSON object only, no markdown or extra text:
{
  "componentChecks": [
    {
      "componentName": "string (use library name if matched, otherwise descriptive name)",
      "exists": boolean,
      "hasIssue": boolean,
      "issueDescription": "string (only if hasIssue is true)",
      "propsUsed": ["string (all props used across all instances)"],
      "propsMissing": ["string"],
      "slotsUsed": ["string"],
      "slotsMissing": ["string"],
      "boundingBox": { "x": 0.0-1.0, "y": 0.0-1.0, "width": 0.0-1.0, "height": 0.0-1.0 }
    }
  ]
}

Remember: Each component type should appear EXACTLY ONCE. Always include a boundingBox for visual reference. Analyze all screenshots and return only the JSON object.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [...imageContents, { text: prompt }],
  });

  const text = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
  if (!text || typeof text !== 'string') {
    throw new Error('Gemini returned no text for component analysis');
  }

  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  let parsed: any;

  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gemini response was not valid JSON: ${text.slice(0, 200)}...`);
  }

  const rawChecks: IComponentCheck[] = (parsed.componentChecks || []).map((c: any) => {
    let boundingBox = undefined;
    if (c.boundingBox && typeof c.boundingBox === 'object') {
      const bb = c.boundingBox;
      if (
        typeof bb.x === 'number' && 
        typeof bb.y === 'number' && 
        typeof bb.width === 'number' && 
        typeof bb.height === 'number'
      ) {
        boundingBox = {
          x: Math.max(0, Math.min(1, bb.x)),
          y: Math.max(0, Math.min(1, bb.y)),
          width: Math.max(0, Math.min(1, bb.width)),
          height: Math.max(0, Math.min(1, bb.height)),
        };
      }
    }
    
    return {
      componentName: String(c.componentName ?? '').trim(),
      exists: Boolean(c.exists === true),
      hasIssue: Boolean(c.hasIssue === true),
      issueDescription: c.issueDescription ? String(c.issueDescription) : undefined,
      propsUsed: Array.isArray(c.propsUsed) ? c.propsUsed.map(String) : undefined,
      propsMissing: Array.isArray(c.propsMissing) ? c.propsMissing.map(String) : undefined,
      slotsUsed: Array.isArray(c.slotsUsed) ? c.slotsUsed.map(String) : undefined,
      slotsMissing: Array.isArray(c.slotsMissing) ? c.slotsMissing.map(String) : undefined,
      boundingBox,
    };
  });

  console.log(`[Component Analysis] Raw: ${rawChecks.length} components, Names: ${rawChecks.map(c => c.componentName).join(', ')}`);
  
  const componentChecks = deduplicateComponentChecks(rawChecks);
  
  console.log(`[Component Analysis] After dedup: ${componentChecks.length} components`);

  return { componentChecks };
}

function normalizeComponentName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '');
}

function deduplicateComponentChecks(checks: IComponentCheck[]): IComponentCheck[] {
  const componentMap = new Map<string, IComponentCheck>();

  for (const check of checks) {
    const key = normalizeComponentName(check.componentName);
    const existing = componentMap.get(key);

    if (!existing) {
      componentMap.set(key, { ...check });
    } else {
      if (!existing.exists && check.exists) existing.exists = true;
      if (check.hasIssue) {
        existing.hasIssue = true;
        if (check.issueDescription) {
          existing.issueDescription = existing.issueDescription
            ? `${existing.issueDescription}; ${check.issueDescription}`
            : check.issueDescription;
        }
      }
      existing.propsUsed = mergeArrays(existing.propsUsed, check.propsUsed);
      existing.propsMissing = mergeArrays(existing.propsMissing, check.propsMissing);
      existing.slotsUsed = mergeArrays(existing.slotsUsed, check.slotsUsed);
      existing.slotsMissing = mergeArrays(existing.slotsMissing, check.slotsMissing);
      // Keep the first bounding box (most prominent instance)
      if (!existing.boundingBox && check.boundingBox) {
        existing.boundingBox = check.boundingBox;
      }
    }
  }

  return Array.from(componentMap.values());
}

function mergeArrays(a?: string[], b?: string[]): string[] | undefined {
  if (!a && !b) return undefined;
  const merged = new Set([...(a || []), ...(b || [])]);
  return merged.size > 0 ? Array.from(merged) : undefined;
}
