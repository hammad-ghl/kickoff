# DesignSync — Cursor Handoff

> Design ↔ Code Gap Analyzer
> Continue building this tool in Cursor from where Claude left off.

---

## What This Tool Does

A browser-based tool that connects Figma, a Vue component library (GitHub), and an app codebase (GitHub) — and produces a gap report identifying:

1. **Missing from Lib** — Components used in Figma that don't exist in the component library
2. **Incompatible Usage** — Components that exist in the lib but are used with slots/props that the lib doesn't support
3. **Missing from Design** — Components used in code (that exist in the lib) but not represented in Figma (design drift)

---

## Current State

A working **single HTML file** prototype exists (`design-code-analyzer.html`). It runs entirely in the browser — no backend. All API calls go directly from the browser to Figma and GitHub APIs.

### What's Working
- [x] Figma API integration — fetches file tree, walks all nodes, collects INSTANCE components
- [x] GitHub API integration — fetches full repo tree recursively, reads raw file content
- [x] Vue component lib indexer — regex parses `.vue` files for `<slot>` definitions and `props`
- [x] Codebase scanner — regex parses `.vue` files for component usage and `<template #slot>` usage
- [x] Gap analyzer — runs all 3 checks and produces structured issues list
- [x] Report UI — visual issue cards grouped by severity + JSON output tab
- [x] Export — JSON download + standalone HTML report download
- [x] Name mapping — manual Figma name → Code name mapping

---

## Architecture

```
Browser Only (no backend)
│
├── Figma REST API
│   └── GET /v1/files/{fileKey}           → full document tree
│   └── GET /v1/files/{fileKey}/components → component registry
│
├── GitHub REST API (lib repo)
│   └── GET /repos/{owner}/{repo}/branches/{branch}  → get SHA
│   └── GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1 → file tree
│   └── GET /repos/{owner}/{repo}/contents/{path}    → file content (base64)
│
├── GitHub REST API (app codebase repo)
│   └── same as above
│
└── Analyzer Engine (pure JS)
    ├── parseFigmaComponents()   → list of { componentName, properties, overrides }
    ├── indexComponentLib()      → { ComponentName: { slots[], props[] } }
    ├── scanCodebase()           → [{ filename, components: [{ name, slots[] }] }]
    └── analyzeGaps()            → { missingFromLib[], incompatibleUsage[], missingFromDesign[] }
```

---

## Key Functions to Know

### `parseFigmaComponents(fileKey, token, page?, frame?)`
Walks the Figma document tree recursively. Looks for nodes with `type === 'INSTANCE'`. Returns all component instances used in the design with their properties.

**Weakness:** Only catches named Figma component instances. Hand-drawn UI elements (shapes pretending to be components) are invisible to this.

### `parseVueComponent(content, filename)`
Regex-based Vue SFC parser. Extracts:
- Slots: `/<slot\s*(?:name=["']([^"']+)["'])?/g`
- Props (Options API): `props: { key: Type }`
- Props (Composition API): `defineProps({ key: Type })`
- Props (Array style): `props: ['key1', 'key2']`

**Weakness:** Dynamic slot names (`:slot="var"`) are not caught.

### `parseVueUsage(content, filename)`
Scans app `.vue` files for:
- PascalCase component tags: `/<([A-Z][A-Za-z]+)[^>]*>/g`
- Named slot usage: `<template #slotName>` and `<template v-slot:slotName>`

### `analyzeGaps(figmaData, libIndex, codeUsages, nameMap)`
Joins all 3 data sources. Returns structured issues in 3 categories.

---

## Data Structures

```js
// Figma output
figmaData = {
  usedComponents: [
    {
      instanceName: "Modal / Default",
      componentName: "Modal",
      componentId: "abc123",
      properties: { footer: { type: "BOOLEAN", value: true } },
      overrides: []
    }
  ],
  pages: ["Dashboard", "Settings"],
  componentDefs: { "key123": "Modal" }
}

// Lib index
libIndex = {
  "BaseModal": {
    name: "BaseModal",
    filename: "src/components/BaseModal.vue",
    slots: ["default", "header"],   // no footer!
    props: ["title", "size", "persistent"]
  }
}

// Code usages
codeUsages = [
  {
    filename: "src/views/Dashboard.vue",
    components: [
      { name: "BaseModal", slots: ["footer"] },  // ← uses footer slot
      { name: "AppButton", slots: [] }
    ]
  }
]

// Issues output
issues = {
  missingFromLib: [
    { componentName, figmaName, description, severity: "high" }
  ],
  incompatibleUsage: [
    { componentName, slot, availableSlots[], description, severity: "medium", source, file? }
  ],
  missingFromDesign: [
    { componentName, description, severity: "low", files[] }
  ]
}
```

---

## What To Build Next (Priority Order)

### 1. Convert to a Proper Web App (Vite + Vue 3)
The current single HTML file works but is hard to maintain. Convert to:
```
designsync/
├── src/
│   ├── App.vue
│   ├── components/
│   │   ├── ConfigForm.vue        ← the input form
│   │   ├── ProgressTracker.vue   ← step progress UI
│   │   └── ReportView.vue        ← report rendering
│   ├── composables/
│   │   ├── useFigma.js           ← Figma API logic
│   │   ├── useGitHub.js          ← GitHub API logic
│   │   ├── useVueParser.js       ← Vue SFC parsing
│   │   └── useAnalyzer.js        ← gap analysis logic
│   └── main.js
├── package.json
└── vite.config.js
```

### 2. Persist Config (localStorage)
Users shouldn't re-enter tokens every time. Save everything except tokens to localStorage. Offer to save tokens behind a checkbox warning.

```js
// On load
const saved = localStorage.getItem('designsync-config')
// On submit
localStorage.setItem('designsync-config', JSON.stringify({ figmaUrl, libRepo, ... }))
```

### 3. Replace Regex Parser with Proper AST
Current regex parsing misses edge cases. Replace with `@vue/compiler-sfc` for accurate slot/prop extraction.

```bash
npm install @vue/compiler-sfc
```

```js
import { parse } from '@vue/compiler-sfc'

const { descriptor } = parse(fileContent)
// descriptor.template.ast  → walk for slot nodes
// descriptor.scriptSetup   → parse defineProps
```

However: this only works in Node.js. For a browser-only app, use a bundled WASM version or move parsing to a small backend.

### 4. Add a Small Backend (Optional but Recommended)
Moving parsing to a backend removes the GitHub rate limit problem and allows:
- Proper AST parsing with `@vue/compiler-sfc`
- Caching results (don't re-fetch the same repo twice)
- Support for very large repos (500+ components)

Suggested stack: **Node.js + Express** or **Bun + Hono**

```
POST /api/analyze
Body: { figmaKey, figmaToken, libRepo, libToken, codeRepo, codeToken, ... }
Response: { issues, summary, metadata }
```

### 5. Figma Slot Detection (Biggest Gap)
Currently the tool looks at Figma component **property names** to guess slot intent (if a property is named "footer" it assumes a footer slot). This is fragile.

Better approach: Work with the design team to establish a convention in Figma — use component properties named exactly as slot names: `slot:footer`, `slot:header`. Then parse:

```js
Object.keys(instance.properties).forEach(key => {
  if (key.startsWith('slot:')) {
    const slotName = key.replace('slot:', '')
    // check against lib slots
  }
})
```

### 6. GitHub Rate Limit Handling
Add detection and retry with backoff:

```js
if (resp.status === 403 && resp.headers.get('X-RateLimit-Remaining') === '0') {
  const resetAt = resp.headers.get('X-RateLimit-Reset')
  throw new Error(`GitHub rate limit hit. Resets at ${new Date(resetAt * 1000).toLocaleTimeString()}. Add a GitHub token to increase limit.`)
}
```

### 7. Figma Webhook Integration
Instead of manually running the tool, trigger analysis automatically when a designer marks a page as "ready for dev".

- Set up a Figma plugin that POSTs to your backend on a status change
- Backend runs the analysis and posts results to Slack or creates Jira tickets

### 8. CI/CD Integration
Add a CLI mode so it can run in a GitHub Action on every PR:

```bash
npx designsync analyze \
  --figma-key=ABC123 \
  --lib-repo=org/ui-lib \
  --code-repo=org/my-app \
  --output=designsync-report.json
```

Fail the PR if `missingFromLib.length > 0`.

---

## Known Limitations to Fix

| Issue | Impact | Fix |
|---|---|---|
| Regex Vue parsing | Misses dynamic slots, complex props | Use `@vue/compiler-sfc` AST |
| Figma slot detection is heuristic | False positives/negatives | Establish naming convention with design team |
| No GitHub rate limit handling | Crashes on large repos without token | Add 403 detection + clear error message |
| Name mapping is manual | Breaks if team isn't consistent | Auto-suggest mappings based on fuzzy name matching |
| No caching | Re-fetches everything on every run | Cache GitHub tree + file contents by commit SHA |
| Branch defaults to `main` hardcoded | Fails on repos using `master` or other defaults | Auto-detect default branch from repo metadata |

---

## Environment / Tokens Needed to Test

| Token | Where to get it | Scopes needed |
|---|---|---|
| Figma Personal Access Token | figma.com → Settings → Personal access tokens | Read access |
| GitHub Token (lib repo) | github.com → Settings → Developer settings → PAT | `repo` (for private), `public_repo` (for public) |
| GitHub Token (app repo) | Same as above, or reuse if same org | Same |

---

## Suggested First Steps in Cursor

1. Open `design-code-analyzer.html` and run it in a browser to see the current state
2. Extract the JS logic into separate `.js` modules (start with `useAnalyzer.js`)
3. Set up a Vite + Vue 3 project and port the UI into Vue components
4. Replace regex slot parsing with `@vue/compiler-sfc` in a Node.js script first to validate
5. Add localStorage config persistence

---

## Design System Reference

The current UI uses:
- **Font:** Syne (headings) + DM Mono (code/labels) — from Google Fonts
- **Colors:**
  - Background: `#0a0a0f`
  - Surface: `#111118`, `#1a1a24`
  - Accent: `#7c6aff` (purple), `#ff6a8a` (pink), `#6affb8` (green)
  - Severity: Red `#ff4d6a`, Yellow `#ffc84d`, Green `#4dffb0`
- **Border radius:** 8–12px throughout
- **Grid:** 40px background grid via CSS `background-image`

Keep this design system consistent if extending the UI.
