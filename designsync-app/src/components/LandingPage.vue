<template>
  <div class="max-w-4xl mx-auto">
    <!-- Hero Section -->
    <div class="text-center mb-20">
      <div class="text-7xl mb-6 animate-float">⚡</div>
      <h1 class="text-5xl font-bold mb-4">
        DesignSync
      </h1>
      <p class="text-base text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
        Find gaps between your Figma designs, component library, and production code. 
        Catch issues before they reach development.
      </p>
      
      <!-- Feature Pills -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-12">
        <div class="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
          <div class="text-2xl mb-2">🎨</div>
          <div class="text-xs font-medium text-muted-foreground">Scan Figma files</div>
        </div>
        <div class="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
          <div class="text-2xl mb-2">📦</div>
          <div class="text-xs font-medium text-muted-foreground">Index component libraries</div>
        </div>
        <div class="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
          <div class="text-2xl mb-2">💻</div>
          <div class="text-xs font-medium text-muted-foreground">Analyze your codebase</div>
        </div>
        <div class="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
          <div class="text-2xl mb-2">📊</div>
          <div class="text-xs font-medium text-muted-foreground">Generate gap reports</div>
        </div>
      </div>

      <!-- CTA Buttons -->
      <div class="flex items-center justify-center gap-3">
        <button 
          class="px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-all hover:scale-105 flex items-center gap-2"
          @click="$emit('start')"
        >
          <span>Create New Report</span>
          <span class="text-lg">→</span>
        </button>
        <button 
          v-if="recentReportsCount && recentReportsCount > 0"
          class="px-6 py-3 bg-card border border-border text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          @click="$emit('viewReports')"
        >
          View Reports ({{ recentReportsCount }})
        </button>
      </div>
    </div>

    <!-- How It Works -->
    <div class="mb-16">
      <div class="text-xs font-mono uppercase tracking-wider text-foreground/60 mb-6 text-center">
        How It Works
      </div>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all hover:-translate-y-1">
          <div class="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-bold mb-4">
            1
          </div>
          <h3 class="text-base font-semibold mb-2">Configure Sources</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Enter your Figma file, component library repo, and app codebase details
          </p>
        </div>
        <div class="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all hover:-translate-y-1">
          <div class="w-12 h-12 bg-primary/10 text-foreground rounded-full flex items-center justify-center text-xl font-bold mb-4 border border-border">
            2
          </div>
          <h3 class="text-base font-semibold mb-2">Run Analysis</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            We scan all three sources and compare component usage patterns
          </p>
        </div>
        <div class="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all hover:-translate-y-1">
          <div class="w-12 h-12 bg-primary/10 text-foreground rounded-full flex items-center justify-center text-xl font-bold mb-4 border border-border">
            3
          </div>
          <h3 class="text-base font-semibold mb-2">Review Report</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Get actionable insights on missing components and incompatible usage
          </p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
interface Props {
  recentReportsCount?: number;
}

defineProps<Props>();

defineEmits<{
  start: [];
  viewReports: [];
}>();
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
