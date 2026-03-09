<template>
  <div class="max-w-6xl mx-auto">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-20">
      <div class="w-12 h-12 border-4 border-border border-t-foreground animate-spin mx-auto mb-4 rounded-full"></div>
      <p class="text-sm text-muted-foreground">Loading library...</p>
    </div>

    <!-- Not Found -->
    <div v-else-if="!library" class="text-center py-20">
      <div class="text-6xl mb-4">?</div>
      <p class="text-base text-muted-foreground mb-6">UI Library not found</p>
      <router-link to="/ui-libraries" class="text-primary hover:underline">Go back to libraries</router-link>
    </div>

    <!-- Library Content -->
    <div v-else>
      <!-- Header -->
      <div class="mb-8">
        <router-link to="/ui-libraries" class="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block">
          ← Back to UI Libraries
        </router-link>
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold">{{ library.name }}</h2>
            <p v-if="library.description" class="text-sm text-muted-foreground mt-1">{{ library.description }}</p>
            <div class="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-mono">
              <a 
                :href="`https://github.com/${library.source?.fullName}`" 
                target="_blank"
                class="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                {{ library.source?.fullName }}
              </a>
              <span>•</span>
              <span>{{ library.source?.branch }}</span>
              <span v-if="library.source?.componentPath">•</span>
              <span v-if="library.source?.componentPath">{{ library.source?.componentPath }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="handleSync"
              :disabled="syncing"
              class="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors border border-border disabled:opacity-50"
            >
              {{ syncing ? 'Syncing...' : '🔄 Re-sync' }}
            </button>
            <button
              @click="showEditModal = true"
              class="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors border border-border"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="p-4 bg-card border border-border">
          <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Components</p>
          <p class="text-2xl font-bold">{{ library.components?.length || 0 }}</p>
        </div>
        <div class="p-4 bg-card border border-border">
          <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Synced</p>
          <p class="text-lg font-medium">{{ library.lastSyncedAt ? formatDate(library.lastSyncedAt) : 'Never' }}</p>
        </div>
        <div class="p-4 bg-card border border-border">
          <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Frameworks</p>
          <p class="text-lg font-medium">{{ uniqueFrameworks.join(', ') || 'Unknown' }}</p>
        </div>
      </div>

      <!-- Components List -->
      <div class="bg-card border border-border">
        <div class="p-3 border-b border-border flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Components ({{ filteredComponents.length }})
          </h3>
          <input
            v-model="componentSearch"
            type="text"
            class="px-3 py-1.5 bg-background border border-border text-xs focus:outline-none focus:border-foreground w-48"
            placeholder="Search..."
          >
        </div>

        <div v-if="!library.components || library.components.length === 0" class="p-8 text-center text-muted-foreground">
          <p class="text-sm mb-2">No components indexed yet.</p>
          <button @click="handleSync" class="text-xs text-primary hover:underline">Sync now</button>
        </div>

        <!-- Compact Table View -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-secondary/30 border-b border-border">
              <tr>
                <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Props</th>
                <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Slots</th>
                <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Variants</th>
                <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Framework</th>
                <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider w-8"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="comp in filteredComponents"
                :key="comp.name"
                class="hover:bg-secondary/20 transition-colors cursor-pointer group"
                @click="selectedComponent = comp"
              >
                <td class="px-3 py-2">
                  <div class="font-medium text-sm">{{ comp.name }}</div>
                  <div v-if="comp.description" class="text-xs text-muted-foreground truncate max-w-xs">
                    {{ comp.description }}
                  </div>
                </td>
                <td class="px-3 py-2">
                  <span v-if="comp.props?.length" class="text-xs text-muted-foreground font-mono">
                    {{ comp.props.length }}
                  </span>
                  <span v-else class="text-xs text-muted-foreground/40">—</span>
                </td>
                <td class="px-3 py-2">
                  <span v-if="comp.slots?.length" class="text-xs text-muted-foreground font-mono">
                    {{ comp.slots.length }}
                  </span>
                  <span v-else class="text-xs text-muted-foreground/40">—</span>
                </td>
                <td class="px-3 py-2">
                  <span v-if="comp.variants?.length" class="text-xs text-muted-foreground font-mono">
                    {{ comp.variants.length }}
                  </span>
                  <span v-else class="text-xs text-muted-foreground/40">—</span>
                </td>
                <td class="px-3 py-2">
                  <span class="text-xs px-1.5 py-0.5 bg-secondary border border-border font-mono uppercase">
                    {{ comp.framework || 'unk' }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right">
                  <button class="text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="showEditModal = false"
    >
      <div class="bg-card border border-border w-full max-w-md p-6">
        <h3 class="text-lg font-semibold mb-4">Edit Library</h3>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">Name</label>
            <input
              v-model="editForm.name"
              type="text"
              class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground"
            >
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium">Description</label>
            <textarea
              v-model="editForm.description"
              class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground resize-none"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="showEditModal = false"
            class="px-4 py-2 bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 border border-border"
          >
            Cancel
          </button>
          <button
            @click="handleUpdate"
            class="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 border border-border"
          >
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Component Detail Modal -->
    <div
      v-if="selectedComponent"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="selectedComponent = null"
    >
      <div class="bg-card border border-border w-full max-w-lg p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold">{{ selectedComponent.name }}</h3>
            <p v-if="selectedComponent.filePath" class="text-xs text-muted-foreground font-mono mt-1">
              {{ selectedComponent.filePath }}
            </p>
          </div>
          <button @click="selectedComponent = null" class="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div class="space-y-4">
          <div v-if="selectedComponent.props?.length">
            <h4 class="text-xs uppercase tracking-wider text-muted-foreground mb-2">Props</h4>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="prop in selectedComponent.props"
                :key="prop"
                class="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-mono"
              >
                {{ prop }}
              </span>
            </div>
          </div>

          <div v-if="selectedComponent.slots?.length">
            <h4 class="text-xs uppercase tracking-wider text-muted-foreground mb-2">Slots</h4>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="slot in selectedComponent.slots"
                :key="slot"
                class="px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-mono"
              >
                {{ slot }}
              </span>
            </div>
          </div>

          <div v-if="selectedComponent.variants?.length">
            <h4 class="text-xs uppercase tracking-wider text-muted-foreground mb-2">Variants</h4>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="variant in selectedComponent.variants"
                :key="variant"
                class="px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 text-xs font-mono"
              >
                {{ variant }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi, type UILibrary, type ComponentDef } from '../composables/useApi';

const route = useRoute();
const { getUILibrary, updateUILibrary, syncUILibrary } = useApi();

const library = ref<UILibrary | null>(null);
const loading = ref(true);
const syncing = ref(false);
const componentSearch = ref('');
const showEditModal = ref(false);
const selectedComponent = ref<ComponentDef | null>(null);

const editForm = ref({
  name: '',
  description: '',
});

const filteredComponents = computed(() => {
  if (!library.value?.components) return [];
  if (!componentSearch.value) return library.value.components;
  
  const search = componentSearch.value.toLowerCase();
  return library.value.components.filter(c =>
    c.name.toLowerCase().includes(search) ||
    c.description?.toLowerCase().includes(search)
  );
});

const uniqueFrameworks = computed(() => {
  if (!library.value?.components) return [];
  const frameworks = new Set(library.value.components.map(c => c.framework).filter(Boolean));
  return Array.from(frameworks);
});

onMounted(async () => {
  await loadLibrary();
});

async function loadLibrary() {
  loading.value = true;
  try {
    library.value = await getUILibrary(route.params.id as string);
    editForm.value = {
      name: library.value.name,
      description: library.value.description || '',
    };
  } catch (error) {
    console.error('Failed to load library:', error);
  } finally {
    loading.value = false;
  }
}

async function handleSync() {
  syncing.value = true;
  try {
    const result = await syncUILibrary(route.params.id as string);
    await loadLibrary();
    alert(`Synced ${result.componentCount} components`);
  } catch (error: any) {
    console.error('Failed to sync:', error);
    alert(error.message || 'Failed to sync library');
  } finally {
    syncing.value = false;
  }
}

async function handleUpdate() {
  try {
    await updateUILibrary(route.params.id as string, {
      name: editForm.value.name,
      description: editForm.value.description,
    });
    if (library.value) {
      library.value.name = editForm.value.name;
      library.value.description = editForm.value.description;
    }
    showEditModal.value = false;
  } catch (error: any) {
    console.error('Failed to update:', error);
    alert(error.message || 'Failed to update library');
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
