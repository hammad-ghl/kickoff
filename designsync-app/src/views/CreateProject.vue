<template>
  <div class="h-full flex flex-col bg-primary overflow-auto">
    <!-- Page Header -->
    <div class="flex items-center justify-between px-6 py-4">
      <div class="flex items-center gap-3">
        <router-link to="/features" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hover transition-colors text-secondary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
          </svg>
        </router-link>
        <h1 class="text-[18px] text-primary">Create Feature</h1>
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-6 pb-8">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Project Info Card -->
        <div class="card p-5 space-y-4">
          <h3 class="text-[12px] font-medium text-secondary uppercase tracking-wider">Feature Info</h3>
          
          <div class="space-y-2">
            <label class="block text-[14px] text-primary">Feature Name *</label>
            <input
              v-model="form.name"
              type="text"
              class="input"
              placeholder="e.g., Social Post Scheduler"
              required
            >
          </div>

          <div class="space-y-2">
            <label class="block text-[14px] text-primary">Description</label>
            <textarea
              v-model="form.description"
              class="input resize-none"
              rows="3"
              placeholder="Briefly describe this feature"
            ></textarea>
          </div>

          <div class="space-y-2">
            <label class="block text-[14px] text-primary">Status</label>
            <select v-model="form.status" class="input">
              <option 
                v-for="statusOption in FEATURE_STATUSES"
                :key="statusOption.value"
                :value="statusOption.value"
              >
                {{ statusOption.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- UI Libraries Card -->
        <div class="card p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-[12px] font-medium text-secondary uppercase tracking-wider">UI Libraries</h3>
            <router-link to="/ui-libraries/new" class="text-[13px] text-brand-primary hover:underline">+ Add New</router-link>
          </div>
          
          <div v-if="availableUILibraries.length === 0" class="text-center py-4 text-secondary">
            <p class="text-sm mb-2">No UI libraries available.</p>
            <router-link to="/ui-libraries/new" class="text-[13px] text-brand-primary hover:underline">Add your first UI Library</router-link>
          </div>

          <div v-else class="space-y-2">
            <div 
              v-for="lib in availableUILibraries" 
              :key="lib._id"
              class="flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors"
              :class="(form.uiLibraryIds || []).includes(lib._id) ? 'bg-brand-active-bg border border-brand-primary' : 'hover:bg-hover'"
              @click="toggleUILibrary(lib._id)"
            >
              <input 
                type="checkbox" 
                :id="`ui-lib-${lib._id}`" 
                :value="lib._id" 
                v-model="form.uiLibraryIds"
                class="w-4 h-4 text-brand-primary bg-background border-border rounded focus:ring-brand-primary"
              >
              <label :for="`ui-lib-${lib._id}`" class="flex-1 text-primary text-sm cursor-pointer">
                {{ lib.name }}
                <p class="text-xs text-secondary">{{ lib.componentCount || 0 }} components</p>
              </label>
            </div>
          </div>
        </div>

        <!-- PRD Card -->
        <div class="card p-5 space-y-4">
          <h3 class="text-[12px] font-medium text-secondary uppercase tracking-wider">Product Requirements Document (PRD)</h3>
          
          <div class="space-y-2">
            <label class="block text-[14px] text-primary">PRD Content</label>
            <textarea
              v-model="form.prdText"
              class="input resize-none"
              rows="8"
              placeholder="Paste your PRD here. This will be used by AI to generate initial test cases."
            ></textarea>
            <p class="text-xs text-secondary mt-1">
              (Optional) Providing a PRD helps the AI understand your feature requirements.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="generate-cases-from-prd" v-model="generateCasesFromPrd" class="w-4 h-4 text-brand-primary bg-background border-border rounded focus:ring-brand-primary">
            <label for="generate-cases-from-prd" class="text-sm text-primary">Generate test cases from PRD</label>
          </div>
        </div>

        <div v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</div>

        <div class="flex justify-end gap-2">
          <router-link to="/features" class="btn-secondary">Cancel</router-link>
          <button type="submit" :disabled="submitting" class="btn-primary">
            {{ submitting ? 'Creating...' : 'Create Feature' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi, type Project, type UILibrary } from '../composables/useApi';
import { FEATURE_STATUSES, type FeatureStatus } from '../constants';

const router = useRouter();
const { createProject, getAllUILibraries, generateProjectCases } = useApi();

const form = ref<Partial<Project>>({
  name: '',
  description: '',
  status: 'draft',
  uiLibraryIds: [],
  prdText: '',
  expectedCases: [],
  casesGeneratedFrom: null,
});

const availableUILibraries = ref<UILibrary[]>([]);
const loadingUILibs = ref(true);
const submitting = ref(false);
const error = ref('');
const generateCasesFromPrd = ref(false);

onMounted(async () => {
  await loadUILibraries();
});

async function loadUILibraries() {
  loadingUILibs.value = true;
  try {
    availableUILibraries.value = await getAllUILibraries();
  } catch (err) {
    console.error('Failed to load UI libraries:', err);
    error.value = (err as Error).message || 'Failed to load UI libraries';
  } finally {
    loadingUILibs.value = false;
  }
}

function toggleUILibrary(id: string) {
  const index = form.value.uiLibraryIds?.indexOf(id);
  if (index !== undefined && index > -1) {
    form.value.uiLibraryIds?.splice(index, 1);
  } else {
    form.value.uiLibraryIds?.push(id);
  }
}

async function handleSubmit() {
  submitting.value = true;
  error.value = '';
  try {
    const newProject = await createProject({
      name: form.value.name as string,
      description: form.value.description,
      status: form.value.status as FeatureStatus,
      uiLibraryIds: form.value.uiLibraryIds as string[],
      prdText: form.value.prdText,
      casesGeneratedFrom: generateCasesFromPrd.value && form.value.prdText ? 'prd' : null,
      // Do not send expectedCases here, as they will be generated by the backend if casesGeneratedFrom is set
    });

    if (generateCasesFromPrd.value && form.value.prdText) {
      // Trigger case generation AFTER project creation
      await generateProjectCases(newProject._id, 'prd');
    }

    router.push(`/features/${newProject._id}`);
  } catch (err) {
    console.error('Failed to create feature:', err);
    error.value = (err as Error).message || 'Failed to create feature';
  } finally {
    submitting.value = false;
  }
}
</script>
