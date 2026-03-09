<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold">Projects</h2>
      <!-- <router-link 
        to="/projects/new"
        class="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors border border-border"
      >
        + New Project
      </router-link> -->
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-20">
      <div class="w-12 h-12 border-4 border-border border-t-foreground animate-spin mx-auto mb-4"></div>
      <p class="text-sm text-muted-foreground">Loading projects...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="projects.length === 0" class="text-center py-20">
      <div class="text-6xl mb-4">📁</div>
      <p class="text-base text-muted-foreground mb-6">No projects yet. Create your first project to get started!</p>
      <router-link 
        to="/projects/new"
        class="inline-block px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors border border-border"
      >
        Create First Project
      </router-link>
    </div>

    <!-- Projects Grid -->
    <div v-else class="space-y-3">
      <router-link
        v-for="project in projects" 
        :key="project._id" 
        :to="`/projects/${project._id}`"
        class="group p-5 bg-card border border-border hover:border-foreground/50 transition-all cursor-pointer relative block"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="text-base font-semibold mb-1 group-hover:text-primary transition-colors">{{ project.name }}</h3>
            <p v-if="project.description" class="text-sm text-muted-foreground mb-2">{{ project.description }}</p>
            <div class="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span>Updated {{ formatDate(project.updatedAt) }}</span>
              <span>•</span>
              <span>{{ project.uiLibraryCount || 0 }} libraries</span>
              <span>•</span>
              <span>{{ project.expectedCasesCount || 0 }} cases</span>
              <span>•</span>
              <span>{{ project.reviewCount || 0 }} reviews</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span 
              v-if="project.latestReview"
              class="px-2.5 py-1 text-xs font-mono uppercase tracking-wide"
              :class="{
                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20': project.latestReview.analysisPhase === 'pending',
                'bg-blue-500/10 text-blue-500 border border-blue-500/20': ['generating_cases', 'checking_cases', 'mapping_components'].includes(project.latestReview.analysisPhase),
                'bg-green-500/10 text-green-500 border border-green-500/20': project.latestReview.analysisPhase === 'completed',
                'bg-red-500/10 text-red-500 border border-red-500/20': project.latestReview.analysisPhase === 'failed',
              }"
            >
              {{ project.latestReview.analysisPhase }}
            </span>
            <button 
              class="opacity-0 group-hover:opacity-100 px-2 py-1 text-sm bg-secondary border border-border hover:bg-destructive/10 hover:border-destructive/50 transition-all"
              @click.prevent="handleDelete(project._id)"
              title="Delete project"
            >
              🗑️
            </button>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi, type Project } from '../composables/useApi';

const { getAllProjects, deleteProject } = useApi();

const projects = ref<Project[]>([]);
const loading = ref(true);

onMounted(async () => {
  await loadProjects();
});

async function loadProjects() {
  loading.value = true;
  try {
    projects.value = await getAllProjects();
  } catch (error) {
    console.error('Failed to load projects:', error);
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id: string) {
  if (!confirm('Are you sure you want to delete this project and all its reviews?')) return;

  try {
    await deleteProject(id);
    projects.value = projects.value.filter(p => p._id !== id);
  } catch (error) {
    console.error('Failed to delete project:', error);
    alert('Failed to delete project');
  }
}

function formatDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return d.toLocaleDateString();
}
</script>
