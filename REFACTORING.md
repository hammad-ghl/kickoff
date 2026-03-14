# Code Refactoring Summary

## Changes Made

### 1. Created Constants File (`src/constants/index.ts`)

Extracted all repeating values into a centralized constants file:

- **Feature Statuses**: Array of status objects with values and labels
- **Status Type Definitions**: TypeScript types for better type safety
- **Helper Functions**: 
  - `getStatusLabel()` - Get display label for a status
  - `getStatusClass()` - Get CSS class for a status badge
  - `getStatusDotClass()` - Get CSS class for status indicator dot
  - `formatDate()` - Format dates consistently
  - `formatRelativeDate()` - Format dates as relative time

### 2. CSS Variables (`src/style.css`)

Moved all hardcoded colors to CSS variables for easy theming:

#### Color Categories:
- **Background Colors**: 
  - `--color-bg-primary`: Main background (#202124)
  - `--color-bg-secondary`: Cards/panels (#292a2d)
  - `--color-bg-tertiary`: Borders (#3c4043)
  - `--color-bg-hover`: Hover states

- **Text Colors**:
  - `--color-text-primary`: Main text (#e8eaed)
  - `--color-text-secondary`: Secondary text (#9aa0a6)
  - `--color-text-tertiary`: Tertiary text (#5f6368)

- **Brand Colors**:
  - `--color-brand-primary`: Primary blue (#8ab4f8)
  - `--color-brand-primary-hover`: Hover blue (#aecbfa)
  - `--color-brand-active-bg`: Active background (#394457)
  - `--color-brand-active-text`: Active text (#c2e7ff)

- **Status Colors**: Success, Warning, Error, Info, Muted
  - Each with base color, background, and border variants

#### Component Classes:
- `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-icon`
- `.chip`, `.chip-active`
- `.card`
- `.input`
- `.status-badge`
- Status-specific classes (`.status-draft`, `.status-prd-complete`, etc.)
- Status dot classes

### 3. Updated Components

#### `ProjectsList.vue`:
- Uses constants from `src/constants/index.ts`
- Uses CSS variables via Tailwind utility classes
- Removed hardcoded status labels, classes, and colors
- Simplified status handling logic

#### `UILibrariesList.vue`:
- Uses `formatRelativeDate()` helper
- Cleaner, more maintainable code

#### `tailwind.config.js`:
- Updated to reference CSS variables
- Consistent color naming across the app

## Benefits

1. **Single Source of Truth**: All colors and constants in one place
2. **Easy Theme Changes**: Update CSS variables to change the entire theme
3. **Type Safety**: TypeScript types for statuses and other constants
4. **Maintainability**: No more searching for hardcoded values
5. **Consistency**: Helper functions ensure uniform formatting
6. **Reusability**: Import constants/helpers anywhere in the app

## How to Change Colors

To update the color scheme, simply edit the CSS variables in `src/style.css`:

```css
:root {
  --color-bg-primary: #202124;  /* Change main background */
  --color-brand-primary: #8ab4f8;  /* Change primary brand color */
  /* etc... */
}
```

All components will automatically use the new colors!

## How to Add New Statuses

1. Add to `FEATURE_STATUSES` array in `src/constants/index.ts`
2. Add labels to `STATUS_LABELS` object
3. Add CSS classes in `src/style.css`:
   - `.status-{name}` for badge styling
   - `.status-dot-{name}` for dot indicator
4. Update backend model enum in `Project.ts`
