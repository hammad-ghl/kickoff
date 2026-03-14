# Route and Layout Refactoring Summary

This document describes the route changes and layout improvements made to the Kickoff application.

## 1. Route Name Changes

All "projects" routes have been renamed to "features" to better reflect the application's purpose:

### Updated Routes

| Old Route | New Route | Description |
|-----------|-----------|-------------|
| `/projects` | `/features` | Features list view |
| `/projects/new` | `/features/new` | Create new feature |
| `/projects/:id` | `/features/:id` | Feature detail view |
| `/projects/:id/edit` | `/features/:id/edit` | Edit feature settings |

### Backward Compatibility

The old `/projects/*` routes now automatically redirect to `/features/*` routes to maintain backward compatibility with existing links or bookmarks.

### Updated Files

The following files were updated to use the new route names:

- `src/router/index.ts` - Route definitions and redirects
- `src/App.vue` - Navigation links
- `src/views/Home.vue` - Call-to-action links
- `src/views/ProjectsList.vue` - Feature list links
- `src/views/CreateProject.vue` - Navigation and redirect after creation
- `src/views/ProjectDetail.vue` - Navigation breadcrumbs and edit links
- `src/views/EditProject.vue` - Back navigation and redirect
- `src/views/ReviewDetail.vue` - Back navigation links
- `src/views/AuthCallback.vue` - Default redirect after authentication

## 2. Layout Improvements

### Fixed Sidebar Height

The sidebar is now constrained to `h-screen` and scrolls independently if content overflows:

```vue
<aside class="w-[240px] h-screen flex flex-col pt-4 overflow-y-auto flex-shrink-0">
```

### Scrollable Main Content Area

All main content views are now wrapped in a consistent scrollable layout:

```vue
<div class="flex-1 h-screen flex flex-col overflow-hidden">
  <router-view />
</div>
```

### Individual View Structure

Each view now follows this structure for consistent scrolling:

```vue
<div class="h-full flex flex-col bg-primary overflow-auto">
  <div class="max-w-[1100px] w-full mx-auto px-10 pt-10 pb-6 flex flex-col">
    <!-- Content goes here -->
  </div>
</div>
```

This ensures:
- The sidebar stays at a fixed `h-screen` height
- The main content area is independently scrollable
- Content is centered with a maximum width of 1100px
- Consistent spacing and layout across all views

### Updated Views

All views were updated to follow the new layout pattern:

- `ProjectsList.vue` (Features list)
- `UILibrariesList.vue` - Now uses max-width container like Features
- `ProjectDetail.vue`
- `CreateProject.vue`
- `EditProject.vue`
- `UILibraryDetail.vue`
- `CreateUILibrary.vue`

## 3. UI Consistency

### Max-Width Container

All list views now use a consistent max-width container (`max-w-[1100px]`) to prevent content from stretching too wide on large screens, matching the Google AI Studio design language.

### Table-Like Layouts

List views (Features and UI Libraries) now use grid-based table layouts with proper column headers for better data presentation and scannability.

## Benefits

1. **Better Navigation**: Clear, descriptive route names that match the UI terminology
2. **Improved Scrolling**: Sidebar and main content scroll independently
3. **Consistent Layout**: All views follow the same structure and spacing
4. **Better Readability**: Max-width containers prevent content from being too stretched
5. **Backward Compatible**: Old routes redirect to new ones automatically
