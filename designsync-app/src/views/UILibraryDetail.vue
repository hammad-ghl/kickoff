<template>
  <div class="h-full flex flex-col bg-primary overflow-auto">
    <div class="max-w-[1100px] w-full mx-auto px-10 pt-10 pb-6 flex flex-col">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <div class="w-12 h-12 border-4 border-border border-t-foreground animate-spin mx-auto mb-4 rounded-full"></div>
        <p class="text-sm text-secondary">Loading library...</p>
      </div>

      <!-- Not Found -->
      <div v-else-if="!library" class="text-center py-20">
        <div class="text-6xl mb-4">🔍</div>
        <p class="text-base text-secondary mb-6">UI Library not found</p>
        <router-link to="/ui-libraries" class="text-brand-primary hover:underline">Go back to libraries</router-link>
      </div>

      <!-- Library Content -->
      <div v-else class="flex flex-col flex-1">
        <!-- Header and Actions -->
        <div class="flex items-start justify-between mb-8">
          <div>
            <router-link to="/ui-libraries" class="text-sm text-secondary hover:underline transition-colors mb-2 inline-block">
              ← Back to UI Libraries
            </router-link>
            <h2 class="text-[28px] text-primary font-normal mb-1">{{ library.name }}</h2>
            <div class="flex items-center gap-2 text-xs text-secondary font-mono">
              <a 
                :href="`https://github.com/${library.source?.fullName}`" 
                target="_blank"
                class="flex items-center gap-1 hover:text-brand-primary transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                <span class="truncate max-w-[200px]">{{ library.source?.fullName }}</span>
              </a>
              <span v-if="library.source?.branch">•</span>
              <span v-if="library.source?.branch">{{ library.source?.branch }}</span>
              <span v-if="library.source?.componentPath">•</span>
              <span v-if="library.source?.componentPath" class="truncate max-w-[150px]">{{ library.source?.componentPath }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="handleSync"
              :disabled="syncing"
              class="btn-secondary"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ syncing ? 'Re-syncing...' : 'Re-sync' }}
            </button>
            <button
              @click="showEditModal = true"
              class="btn-secondary"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 mb-8 text-secondary">
          <div class="card p-4">
            <p class="text-[11px] uppercase tracking-wider mb-1">Components</p>
            <p class="text-[22px] font-medium text-primary">{{ library.components?.length || 0 }}</p>
          </div>
          <div class="card p-4">
            <p class="text-[11px] uppercase tracking-wider mb-1">Last Synced</p>
            <p class="text-[14px] font-normal text-primary">{{ library.lastSyncedAt ? formatRelativeDate(library.lastSyncedAt) : 'Never' }}</p>
          </div>
          <div class="card p-4">
            <p class="text-[11px] uppercase tracking-wider mb-1">Frameworks</p>
            <p class="text-[14px] font-normal text-primary">{{ uniqueFrameworks.join(', ') || 'Unknown' }}</p>
          </div>
        </div>

        <!-- Components List -->
        <div class="p-0 flex flex-col flex-1">
          <div class="sticky top-0 p-4 bg-primary border-b border-border flex items-center justify-between">
            <h3 class="text-[14px] font-medium text-primary">
              Components ({{ filteredComponents.length }})
            </h3>
            <input
              v-model="componentSearch"
              type="text"
              class="input w-56 rounded-full focus:outline-non bg-secondary"
              placeholder="Search components..."
            >
          </div>

          <div v-if="!library.components || library.components.length === 0" class="p-8 text-center text-secondary">
            <p class="text-sm mb-4">No components indexed yet. Sync your library to fetch components.</p>
            <button @click="handleSync" class="btn-secondary">Sync Now</button>
          </div>

          <div v-else class="flex-1 overflow-y-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-[11px] font-bold text-secondary uppercase rounded-xl tracking-wider text-left sticky top-0  z-10">
                  <th class="px-4 py-2">Name</th>
                  <th class="px-4 py-2">Props</th>
                  <th class="px-4 py-2">Slots</th>
                  <th class="px-4 py-2">Variants</th>
                  <th class="px-4 py-2">Framework</th>
                  <th class="px-4 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="comp in filteredComponents"
                  :key="comp.name"
                  class="group hover:bg-hover transition-colors cursor-pointer border-b border-white/5"
                  @click="selectedComponent = comp"
                >
                  <td class="px-4 py-2">
                    <div class="font-medium text-sm">{{ comp.name }}</div>
                    <div v-if="comp.description" class="text-xs text-secondary truncate max-w-xs mt-0.5">
                      {{ comp.description }}
                    </div>
                  </td>
                  <td class="px-4 py-2">
                    <span v-if="comp.props?.length" class="text-xs text-secondary font-mono">
                      {{ comp.props.length }}
                    </span>
                    <span v-else class="text-xs text-secondary/60">—</span>
                  </td>
                  <td class="px-4 py-2">
                    <span v-if="comp.slots?.length" class="text-xs text-secondary font-mono">
                      {{ comp.slots.length }}
                    </span>
                    <span v-else class="text-xs text-secondary/60">—</span>
                  </td>
                  <td class="px-4 py-2">
                    <span v-if="comp.variants?.length" class="text-xs text-secondary font-mono">
                      {{ comp.variants.length }}
                    </span>
                    <span v-else class="text-xs text-secondary/60">—</span>
                  </td>
                  <td class="px-4 py-2">
                    <span class="chip text-[11px] font-bold">
                      {{ comp.framework || 'UNK' }}
                    </span>
                  </td>
                  <td class="px-4 py-2 text-right">
                    <button class="btn-icon w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
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
        <div class="card w-full max-w-md p-6">
          <h3 class="text-2xl font-semibold mb-4">Edit Library</h3>
          
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm text-secondary">Name</label>
              <input
                v-model="editForm.name"
                type="text"
                class="input"
              >
            </div>

            <div class="space-y-2">
              <label class="block text-sm text-secondary">Description</label>
              <textarea
                v-model="editForm.description"
                class="input resize-none"
                rows="3"
              ></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              @click="showEditModal = false"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button
              @click="handleUpdate"
              class="btn-primary"
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
        <div class="card w-full max-w-lg p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-lg font-medium text-primary">{{ selectedComponent.name }}</h3>
              <p v-if="selectedComponent.filePath" class="text-xs text-secondary font-mono mt-1">
                {{ selectedComponent.filePath }}
              </p>
            </div>
            <button @click="selectedComponent = null" class="btn-icon">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="space-y-4">
            <div v-if="selectedComponent.props?.length">
              <h4 class="text-[11px] uppercase tracking-wider text-secondary mb-2">Props</h4>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="prop in selectedComponent.props"
                  :key="prop"
                  class="chip chip-blue"
                >
                  {{ prop }}
                </span>
              </div>
            </div>

            <div v-if="selectedComponent.slots?.length">
              <h4 class="text-[11px] uppercase tracking-wider text-secondary mb-2">Slots</h4>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="slot in selectedComponent.slots"
                  :key="slot"
                  class="chip chip-green"
                >
                  {{ slot }}
                </span>
              </div>
            </div>

            <div v-if="selectedComponent.variants?.length">
              <h4 class="text-[11px] uppercase tracking-wider text-secondary mb-2">Variants</h4>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="variant in selectedComponent.variants"
                  :key="variant"
                  class="chip chip-purple"
                >
                  {{ variant }}
                </span>
              </div>
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
import { formatRelativeDate } from '../constants'; // Import formatRelativeDate

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
  }
  finally {
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

// Remove the local formatDate function as we are now importing formatRelativeDate
</script>
