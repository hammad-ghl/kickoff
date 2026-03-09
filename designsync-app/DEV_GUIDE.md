# DesignSync Vue App - Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## What Was Built

This is a full Vue 3 + TypeScript conversion of the original single-file HTML prototype (`design-code-analyzer.html`).

### Key Improvements

1. **TypeScript Support** ✅
   - Full type safety across all composables and components
   - Proper interfaces for all data structures
   - Type-safe props and emits

2. **Component Architecture**
   - `ConfigForm.vue` - Input form with all configuration options
   - `ProgressTracker.vue` - Real-time progress display with step indicators
   - `ReportView.vue` - Results display with stats, issue groups, and JSON export
   - `IssueGroup.vue` - Reusable component for rendering issue categories

3. **Composables (Business Logic)**
   - `useFigma.ts` - Figma API integration
   - `useGitHub.ts` - GitHub API integration  
   - `useVueParser.ts` - Vue SFC parsing (regex-based)
   - `useAnalyzer.ts` - Gap analysis engine

4. **Design System**
   - Kept the original dark theme with purple/pink accents
   - Grid background pattern
   - All styles in App.vue (scoped to components)
   - Responsive design

## Project Structure

```
designsync-app/
├── src/
│   ├── components/           # Vue components
│   │   ├── ConfigForm.vue
│   │   ├── ProgressTracker.vue
│   │   ├── ReportView.vue
│   │   └── IssueGroup.vue
│   ├── composables/          # Business logic
│   │   ├── useFigma.ts
│   │   ├── useGitHub.ts
│   │   ├── useVueParser.ts
│   │   └── useAnalyzer.ts
│   ├── types.ts             # TypeScript type definitions
│   ├── App.vue              # Main app component
│   ├── main.ts              # Entry point
│   └── vite-env.d.ts        # Vite type definitions
├── tsconfig.json            # TypeScript config
├── tsconfig.node.json       # TypeScript config for Node
├── vite.config.ts           # Vite config
└── package.json
```

## TypeScript Configuration

- Strict mode enabled
- ESNext modules
- Bundler module resolution
- No emit (Vite handles bundling)
- Isolated modules for fast compilation

## Next Steps for Improvement

### High Priority
1. **localStorage Persistence**
   - Save config (except tokens) to localStorage
   - Restore on page load

2. **Better Error Handling**
   - Toast notifications instead of alerts
   - Retry logic for failed API calls
   - GitHub rate limit detection

3. **AST-based Parsing**
   - Replace regex parser with `@vue/compiler-sfc`
   - Requires backend or WASM version

### Medium Priority
4. **Component Preview**
   - Show Figma component thumbnails
   - Link to Figma nodes

5. **Export Formats**
   - CSV export
   - Better HTML report with embedded styles
   - Markdown report for GitHub issues

6. **Name Mapping Suggestions**
   - Fuzzy matching between Figma and code names
   - Auto-suggest mappings

### Future Enhancements
7. **Backend Integration**
   - Cache GitHub repo data
   - Run analysis on larger codebases
   - Schedule periodic checks

8. **CLI Mode**
   - Run analysis from terminal
   - CI/CD integration
   - Fail PR on critical issues

## API Usage

### Browser-Only Architecture
- All API calls run directly from the browser
- No proxy server needed
- CORS-friendly (Figma & GitHub both support it)

### Rate Limits
- **Figma**: 60 requests/hour (unauthenticated), 1000/hour (with token)
- **GitHub**: 60 requests/hour (unauthenticated), 5000/hour (with token)

For large repos, always use tokens!

## Testing Locally

1. Get a Figma token: https://www.figma.com/settings
2. Get a GitHub token: https://github.com/settings/tokens
3. Enter a test Figma file URL
4. Enter test GitHub repos (component lib + app)
5. Run analysis

## Design Decisions

### Why Vue 3 Composition API?
- Better TypeScript support
- Easier to extract reusable logic (composables)
- More flexible than Options API

### Why Regex Instead of AST?
- Works entirely in the browser
- No backend needed for MVP
- Can be replaced with proper parser later

### Why No State Management?
- App state is simple (one analysis flow)
- Reactive refs/objects are sufficient
- Can add Pinia later if needed

## Contributing

When adding features:
1. Keep TypeScript strict
2. Add types for all new data structures
3. Follow the existing component pattern
4. Update this guide with new sections

## Performance

Current build size:
- JS: ~87 KB (gzipped: 33 KB)
- CSS: ~11 KB (gzipped: 2.7 KB)

Optimization opportunities:
- Lazy load ReportView
- Virtual scrolling for large issue lists
- Web worker for heavy parsing

---

**Built with:** Vue 3.5 + TypeScript 5 + Vite 7
