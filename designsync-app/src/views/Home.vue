<template>
  <div class="max-w-4xl mx-auto">
    <!-- Hero Section -->
    <div class="text-center mt-20 mb-[120px]">
      <div class="text-7xl mb-6 animate-float">📋</div>
      <h1 class="text-5xl font-bold mb-4">
        DesignSync
      </h1>
      <p class="text-base text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
        Design Review Assistant — Ensure your designs use the right components and cover all user flows before development begins.
      </p>
      
      <!-- Feature Pills -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto mb-12">
        <div class="p-4 bg-card border border-border hover:border-foreground/30 transition-colors">
          <div class="text-2xl mb-2">📦</div>
          <div class="text-xs font-medium text-muted-foreground">Component Library Catalog</div>
        </div>
        <div class="p-4 bg-card border border-border hover:border-foreground/30 transition-colors">
          <div class="text-2xl mb-2">🖼️</div>
          <div class="text-xs font-medium text-muted-foreground">Upload Design Screenshots</div>
        </div>
        <div class="p-4 bg-card border border-border hover:border-foreground/30 transition-colors">
          <div class="text-2xl mb-2">✅</div>
          <div class="text-xs font-medium text-muted-foreground">Component Checklist</div>
        </div>
        <div class="p-4 bg-card border border-border hover:border-foreground/30 transition-colors">
          <div class="text-2xl mb-2">🔄</div>
          <div class="text-xs font-medium text-muted-foreground">Flow Coverage Check</div>
        </div>
        <div class="p-4 bg-card border border-border hover:border-foreground/30 transition-colors">
          <div class="text-2xl mb-2">⚠️</div>
          <div class="text-xs font-medium text-muted-foreground">Gap Detection</div>
        </div>
        <div class="p-4 bg-card border border-border hover:border-foreground/30 transition-colors">
          <div class="text-2xl mb-2">📊</div>
          <div class="text-xs font-medium text-muted-foreground">Review History</div>
        </div>
      </div>

      <!-- CTA Buttons -->
      <div class="flex items-center justify-center gap-3">
        <router-link 
          to="/projects/new"
          class="px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all hover:scale-105 flex items-center gap-2 border border-border"
        >
          <span>Create New Project</span>
          <span class="text-lg">→</span>
        </router-link>
        <router-link 
          v-if="projectCount > 0"
          to="/projects"
          class="px-6 py-3 bg-card border border-border text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          View Projects ({{ projectCount }})
        </router-link>
      </div>
    </div>

    <!-- How It Works -->
    <div class="mb-16">
      <div class="text-xs font-mono uppercase tracking-wider text-foreground/60 mb-6 text-center">
        How It Works
      </div>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="p-6 bg-card border border-border hover:border-foreground/30 transition-all hover:-translate-y-1">
          <div class="w-12 h-12 bg-foreground/10 border border-border flex items-center justify-center text-xl font-bold mb-4">
            1
          </div>
          <h3 class="text-base font-semibold mb-2">Define Components</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Add your UI library components with their props, slots, and variants
          </p>
        </div>
        <div class="p-6 bg-card border border-border hover:border-foreground/30 transition-all hover:-translate-y-1">
          <div class="w-12 h-12 bg-foreground/10 border border-border flex items-center justify-center text-xl font-bold mb-4">
            2
          </div>
          <h3 class="text-base font-semibold mb-2">Upload Design</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Paste a screenshot of your design and tag which components are used
          </p>
        </div>
        <div class="p-6 bg-card border border-border hover:border-foreground/30 transition-all hover:-translate-y-1">
          <div class="w-12 h-12 bg-foreground/10 border border-border flex items-center justify-center text-xl font-bold mb-4">
            3
          </div>
          <h3 class="text-base font-semibold mb-2">Review & Catch Gaps</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Check flow coverage (CRUD, states) and flag missing/incompatible components
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '../composables/useApi';

const { getAllProjects } = useApi();
const projectCount = ref(0);

onMounted(async () => {
  try {
    const projects = await getAllProjects();
    projectCount.value = projects.length;
  } catch (error) {
    console.error('Failed to load projects count:', error);
  }
});
</script>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
