<template>
  <div class="h-full flex flex-col bg-primary overflow-auto">
    <!-- Top Content Area -->
    <div class="max-w-[1100px] w-full mx-auto px-10 pt-10 pb-6 flex flex-col">
      <!-- Title & Main Action -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-medium">UI Libraries</h1>
        <div class="flex items-center gap-3">
          <button class="flex items-center gap-2 px-3 py-1.5 text-[13px] text-secondary hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Documentation
          </button>
          <router-link to="/ui-libraries/new" class="btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add Library
          </router-link>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-20 flex justify-center">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-primary animate-spin rounded-full" style="border-color: var(--color-border-primary); border-top-color: var(--color-brand-primary);"></div>
          <p class="text-[13px] text-secondary">Loading libraries...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="libraries.length === 0" class="flex-1 flex items-center justify-center py-20">
        <div class="text-center">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto overflow-hidden opacity-50 grayscale">
            <img src="../assets/kickoff-logo.png" alt="Kickoff Logo" class="w-full h-full object-cover" />
          </div>
          <p class="text-[14px] text-secondary mb-4">No UI libraries yet</p>
          <router-link to="/ui-libraries/new" class="btn-primary">Add First Library</router-link>
        </div>
      </div>

      <!-- Table Content -->
      <div v-else class="flex flex-col mt-10">
        <!-- Table Header -->
        <div class="grid grid-cols-[1.5fr,0.8fr,0.8fr,0.8fr,1fr,auto] gap-4 px-4 py-2 text-[11px] font-medium text-secondary uppercase tracking-wider border-b border-secondary mb-1">
          <div>Library</div>
          <div>Components</div>
          <div>Branch</div>
          <div>Path</div>
          <div>Last Synced</div>
          <div class="w-24"></div>
        </div>

        <!-- Rows -->
        <div class="divide-y divide-tertiary">
          <router-link
            v-for="lib in libraries" 
            :key="lib._id" 
            :to="`/ui-libraries/${lib._id}`"
            class="group grid grid-cols-[1.5fr,0.8fr,0.8fr,0.8fr,1fr,auto] gap-4 items-center px-4 py-3.5 hover:bg-hover transition-colors cursor-pointer"
          >
            <!-- Library Name & Source -->
            <div class="min-w-0">
              <h3 class="text-[14px] hover:underline truncate" style="color: var(--color-brand-primary);">
                {{ lib.name }}
              </h3>
              <div class="flex items-center gap-1.5 mt-0.5">
                <svg class="w-3.5 h-3.5 text-secondary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                <p class="text-[11px] text-secondary truncate opacity-70">
                  {{ lib.source?.fullName || `${lib.source?.owner}/${lib.source?.repo}` }}
                </p>
              </div>
            </div>

            <!-- Component Count -->
            <div class="text-[13px] text-white">
              {{ lib.components?.length || lib.componentCount || 0 }}
            </div>

            <!-- Branch -->
            <div class="text-[13px] text-secondary truncate">
              {{ lib.source?.branch || 'main' }}
            </div>

            <!-- Path -->
            <div class="text-[13px] text-secondary truncate">
              {{ lib.source?.componentPath || '/' }}
            </div>

            <!-- Last Synced -->
            <div class="text-[13px] text-white">
              {{ lib.lastSyncedAt ? formatRelativeDate(lib.lastSyncedAt) : 'Never' }}
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-1 w-24">
              <button 
                @click.prevent="handleSync(lib._id)"
                class="btn-icon w-8 h-8 opacity-0 group-hover:opacity-100"
                title="Sync"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button 
                @click.prevent="handleDelete(lib._id)"
                class="w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all"
                style="color: var(--color-text-secondary);"
                onmouseover="this.style.backgroundColor='var(--color-error-bg)'; this.style.color='var(--color-error)';"
                onmouseout="this.style.backgroundColor=''; this.style.color='var(--color-text-secondary)';"
                title="Delete"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi, type UILibrary } from '../composables/useApi';
import { formatRelativeDate } from '../constants';

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
  if (!confirm('Delete this UI library?')) return;
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
    // Reload all libraries to get fresh data
    await loadLibraries();
    alert(`Synced ${result.componentCount || 0} components`);
  } catch (error: any) {
    console.error('Failed to sync library:', error);
    alert(error.message || 'Failed to sync library');
  }
}
</script>
