<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-50  backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <router-link to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div class="w-8 h-8 bg-foreground text-background flex items-center justify-center text-lg font-bold">
              📋
            </div>
            <span class="text-xl font-bold">DesignSync</span>
          </router-link>
          
          <nav class="flex items-center gap-2">
            <router-link 
              to="/"
              class="px-3 py-1.5 text-sm font-medium hover:text-foreground transition-colors"
              :class="$route.path === '/' ? 'text-foreground' : 'text-muted-foreground'"
            >
              Home
            </router-link>
            <router-link 
              to="/projects"
              class="px-3 py-1.5 text-sm font-medium hover:text-foreground transition-colors"
              :class="$route.path.startsWith('/projects') ? 'text-foreground' : 'text-muted-foreground'"
            >
              Projects
            </router-link>
            <router-link 
              to="/ui-libraries"
              class="px-3 py-1.5 text-sm font-medium hover:text-foreground transition-colors"
              :class="$route.path.startsWith('/ui-libraries') ? 'text-foreground' : 'text-muted-foreground'"
            >
              UI Libraries
            </router-link>
            <router-link 
              to="/projects/new"
              class="ml-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors border border-border"
            >
              + New Project
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-12">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// No logic needed - pure layout component with router
</script>
