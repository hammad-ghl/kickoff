<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold">UI Libraries</h2>
      <router-link 
        to="/ui-libraries/new"
        class="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors border border-border"
      >
        + Add Library
      </router-link>
    </div>

    <div v-if="loading" class="text-center py-20">
      <div class="w-12 h-12 border-4 border-border border-t-foreground animate-spin mx-auto mb-4 rounded-full"></div>
      <p class="text-sm text-muted-foreground">Loading libraries...</p>
    </div>

    <div v-else-if="libraries.length === 0" class="text-center py-20">
      <div class="text-6xl mb-4">📚</div>
      <p class="text-base text-muted-foreground mb-6">No UI libraries yet. Add your first component library from GitHub.</p>
      <router-link 
        to="/ui-libraries/new"
        class="inline-block px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors border border-border"
      >
        Add First Library
      </router-link>
    </div>

    <div v-else class="space-y-3">
      <router-link
        v-for="lib in libraries" 
        :key="lib._id" 
        :to="`/ui-libraries/${lib._id}`"
        class="group p-5 bg-card border border-border hover:border-foreground/50 transition-all cursor-pointer relative block"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="text-base font-semibold mb-1 group-hover:text-primary transition-colors">{{ lib.name }}</h3>
            <p v-if="lib.description" class="text-sm text-muted-foreground mb-2">{{ lib.description }}</p>
            <div class="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                {{ lib.source?.fullName || `${lib.source?.owner}/${lib.source?.repo}` }}
              </span>
              <span>•</span>
              <span>{{ lib.componentCount || 0 }} components</span>
              <span v-if="lib.lastSyncedAt">•</span>
              <span v-if="lib.lastSyncedAt">Synced {{ formatDate(lib.lastSyncedAt) }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button 
              class="opacity-0 group-hover:opacity-100 px-2 py-1 text-sm bg-secondary border border-border hover:bg-primary/10 hover:border-primary/50 transition-all"
              @click.prevent="handleSync(lib._id)"
              title="Re-sync components"
            >
              🔄
            </button>
            <button 
              class="opacity-0 group-hover:opacity-100 px-2 py-1 text-sm bg-secondary border border-border hover:bg-destructive/10 hover:border-destructive/50 transition-all"
              @click.prevent="handleDelete(lib._id)"
              title="Delete library"
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
import { useApi, type UILibrary } from '../composables/useApi';

const { getAllUILibraries, deleteUILibrary, syncUILibrary } = useApi();

const libraries = ref<UILibrary[]>([]);
const loading = ref(true);

onMounted(async () => {
  await loadLibraries();
});

async function loadLibraries() {
  loading.value = true;
  try {
    libraries.value = await getAllUILibraries();
  } catch (error) {
    console.error('Failed to load libraries:', error);
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id: string) {
  if (!confirm('Are you sure you want to delete this UI library?')) return;

  try {
    await deleteUILibrary(id);
    libraries.value = libraries.value.filter(l => l._id !== id);
  } catch (error: any) {
    console.error('Failed to delete library:', error);
    alert(error.message || 'Failed to delete library');
  }
}

async function handleSync(id: string) {
  try {
    const result = await syncUILibrary(id);
    const lib = libraries.value.find(l => l._id === id);
    if (lib) {
      lib.componentCount = result.componentCount;
      lib.lastSyncedAt = result.lastSyncedAt;
    }
    alert(`Synced ${result.componentCount} components`);
  } catch (error: any) {
    console.error('Failed to sync library:', error);
    alert(error.message || 'Failed to sync library');
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
