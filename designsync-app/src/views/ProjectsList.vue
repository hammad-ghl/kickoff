<template>
  <div class="h-full flex flex-col bg-primary overflow-auto">
    <!-- Top Content Area -->
    <div class="max-w-[1100px] w-full mx-auto px-10 pt-10 pb-6 flex flex-col">
      <!-- Title & Main Action -->
      <div class="flex items-center justify-between mb-10">
        <h1 class="text-[28px] text-primary font-normal">Features</h1>
        <div class="flex items-center gap-4">
          <button class="flex items-center gap-2 px-3 py-1.5 text-[13px] text-secondary hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Documentation
          </button>
          <router-link to="/features/new" class="btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            New Feature
          </router-link>
        </div>
      </div>

      <!-- Controls: Filter (Aligned to Right) -->
      <div class="flex items-center justify-end mb-6 gap-3">
        <div class="flex items-center bg-tertiary/30 rounded-full px-1 py-1">
          <div class="flex items-center px-3 py-1">
            <svg class="w-3.5 h-3.5 text-secondary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span class="text-[12px] text-secondary font-medium uppercase tracking-wider">Status</span>
          </div>
          <CustomSelect
            v-model="statusFilter"
            :options="featureStatusOptions"
            :defaultOption="{ value: '', label: 'All' }"
            class="min-w-[140px]"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 flex justify-center">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-primary animate-spin rounded-full" style="border-color: var(--color-border-primary); border-top-color: var(--color-brand-primary);"></div>
          <p class="text-[13px] text-secondary">Loading features...</p>
        </div>
      </div>

      <!-- Empty State: No features at all -->
      <div v-else-if="features.length === 0" class="flex-1 flex items-center justify-center py-20">
        <div class="text-center">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto overflow-hidden opacity-50 grayscale">
            <img src="../assets/kickoff-logo.png" alt="Kickoff Logo" class="w-full h-full object-cover" />
          </div>
          <p class="text-[14px] text-secondary mb-4">No features created yet</p>
          <router-link to="/features/new" class="btn-primary">Create First Feature</router-link>
        </div>
      </div>

      <!-- Empty State: No matching filtered results -->
      <div v-else-if="filteredFeatures.length === 0" class="flex-1 flex items-center justify-center py-20">
        <div class="text-center">
          <div class="w-20 h-20 flex items-center justify-center mb-4 mx-auto opacity-30">
            <svg width="80" height="80" viewBox="0 0 103 111" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M43.096 50.702l8.562-4.456 8.219 4.456M52 1.342v44.902M2 82.922v-54.5l49.657 27.421V110L2 82.922z" stroke="currentColor" class="text-secondary"/>
              <path d="M102 28.078L51.657 56.185V110L102 82.578v-54.5z" fill="currentColor" stroke="currentColor" class="text-secondary"/>
              <path d="M52 1L2 28.421 52 55.5l49.658-27.079L52 1z" stroke="currentColor" class="text-secondary"/>
            </svg>
          </div>
          <p class="text-[14px] text-secondary mb-2">No features found</p>
          <p class="text-[12px] text-tertiary">Try adjusting your filter</p>
        </div>
      </div>

      <!-- Features Table -->
      <div v-else class="flex flex-col">
        <!-- Table Header -->
        <div class="grid grid-cols-[1.5fr,1.5fr,1fr,1fr,1.2fr,auto] gap-4 px-4 py-2 text-[11px] font-medium text-secondary uppercase tracking-wider border-b border-secondary mb-1">
          <div>Feature</div>
          <div>Description</div>
          <div>Created</div>
          <div>Reviews</div>
          <div>Status</div>
          <div class="w-24"></div>
        </div>

        <!-- Feature Rows -->
        <div class="divide-y divide-tertiary">
          <ProjectRow 
            v-for="project in filteredFeatures" 
            :key="project._id" 
            :project="project"
            @copy-id="copyFeatureId"
            @change-status="(id, status, event) => openStatusPopover(id, status, event)"
            @delete-feature="openDeleteModal"
          />
        </div>
      </div>
    </div>

    <!-- Status Popover (Teleported) -->
    <Teleport to="body">
      <div
        v-if="statusPopoverOpen"
        ref="statusPopoverRef"
        class="status-popover-wrapper"
        :style="statusPopoverStyle"
      >
        <StatusDropdown
          :current-status="selectedFeatureStatus"
          :as-popover="true"
          @change="changeStatus"
        />
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="deleteModalOpen"
      title="Delete Feature"
      confirm-text="Delete"
      confirm-button-class="btn-danger"
      :show-footer="true"
      @confirm="confirmDelete"
    >
      <p class="text-[14px] text-secondary">
        Are you sure you want to delete this feature? This action cannot be undone.
      </p>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useApi, type Project } from '../composables/useApi';
import { FEATURE_STATUSES, type FeatureStatus } from '../constants';
import ProjectRow from '../components/ProjectRow.vue';
import CustomSelect from '../components/CustomSelect.vue';
import Modal from '../components/Modal.vue';
import StatusDropdown from '../components/StatusDropdown.vue';
import { useToast } from '../composables/useToast';

const { getAllProjects, updateProject, deleteProject } = useApi();
const { success, error: showError } = useToast();

const features = ref<Project[]>([]);
const loading = ref(true);
const statusFilter = ref('');

const statusPopoverOpen = ref(false);
const statusPopoverStyle = ref({});
const deleteModalOpen = ref(false);
const selectedFeatureId = ref<string | null>(null);
const selectedFeatureStatus = ref<string>('');
const statusPopoverRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  await loadFeatures();
  // Small delay before attaching the listener to prevent immediate closure
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 100);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const featureStatusOptions = computed(() => {
  return FEATURE_STATUSES.map(s => ({ value: s.value, label: s.label }));
});

const filteredFeatures = computed(() => {
  if (!statusFilter.value) {
    return features.value;
  }
  return features.value.filter(project => project.status === statusFilter.value);
});

async function loadFeatures() {
  loading.value = true;
  try {
    features.value = await getAllProjects();
  } catch (error) {
    console.error('Failed to load features:', error);
    showError('Failed to load features');
  } finally {
    loading.value = false;
  }
}

function copyFeatureId(id: string) {
  const featureUrl = `${window.location.origin}/features/${id}`;
  navigator.clipboard.writeText(featureUrl);
  success('Feature link copied to clipboard');
}

function openStatusPopover(id: string, currentStatus: string, event?: MouseEvent) {
  selectedFeatureId.value = id;
  selectedFeatureStatus.value = currentStatus;
  
  if (event) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    statusPopoverStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      zIndex: 1000,
    };
  }
  
  statusPopoverOpen.value = true;
}

async function changeStatus(newStatus: string) {
  if (!selectedFeatureId.value) return;

  try {
    await updateProject(selectedFeatureId.value, { status: newStatus as FeatureStatus });
    await loadFeatures();
    success('Status updated successfully');
    statusPopoverOpen.value = false;
  } catch (err: any) {
    console.error('Failed to update status:', err);
    showError(err.message || 'Failed to update status');
  }
}

function openDeleteModal(id: string) {
  selectedFeatureId.value = id;
  deleteModalOpen.value = true;
}

async function confirmDelete() {
  if (!selectedFeatureId.value) return;

  try {
    await deleteProject(selectedFeatureId.value);
    features.value = features.value.filter(p => p._id !== selectedFeatureId.value);
    success('Feature deleted successfully');
    deleteModalOpen.value = false;
  } catch (err: any) {
    console.error('Failed to delete feature:', err);
    showError(err.message || 'Failed to delete feature');
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  
  // Check if click is inside the popover
  if (statusPopoverRef.value && statusPopoverRef.value.contains(target)) {
    return;
  }
  
  // Check if click is on a status button (to allow opening)
  const isStatusButton = target.closest('[title="Change Status"]');
  if (isStatusButton) {
    return;
  }
  
  // Close popover if click is outside
  if (statusPopoverOpen.value) {
    statusPopoverOpen.value = false;
  }
}

</script>

<style scoped>
.status-popover-wrapper {
  pointer-events: auto;
  z-index: 1000;
}
</style>
