<template>
  <div class="h-full flex flex-col bg-primary overflow-auto">
    <div class="max-w-[1100px] w-full mx-auto px-10 pt-10 pb-6 flex flex-col">
    <div class="mb-8">
      <router-link :to="`/features/${projectId}`" class="text-sm text-secondary hover:underline transition-colors mb-2 inline-block">
        ← Back to Feature
      </router-link>
      <h2 class="text-[28px] text-primary font-normal mb-1">Feature Settings</h2>
      <p class="text-sm text-secondary mt-1">Manage feature configuration</p>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="w-8 h-8 border-2 border-primary animate-spin rounded-full mx-auto" style="border-color: var(--color-border-primary); border-top-color: var(--color-brand-primary);"></div>
      <p class="text-sm text-secondary mt-2">Loading feature...</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Feature Info -->
      <div class="card p-5 space-y-4">
        <h3 class="text-[12px] font-medium text-secondary uppercase tracking-wider">Feature Info</h3>
        
        <div class="space-y-2">
          <label class="block text-[14px] text-primary">Feature Name *</label>
          <input
            v-model="form.name"
            type="text"
            class="input"
            required
          >
        </div>

        <div class="space-y-2">
          <label class="block text-[14px] text-primary">Description</label>
          <textarea
            v-model="form.description"
            class="input resize-none"
            rows="3"
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

      <!-- UI Libraries -->
      <div class="card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-[12px] font-medium text-secondary uppercase tracking-wider">UI Libraries</h3>
          <router-link to="/ui-libraries/new" class="text-[13px] text-brand-primary hover:underline">+ Add New</router-link>
        </div>
        
        <div v-if="availableUILibraries.length === 0 && !loadingUILibs" class="text-center py-4 text-secondary">
          <p class="text-sm mb-2">No UI libraries available.</p>
          <router-link to="/ui-libraries/new" class="text-[13px] text-brand-primary hover:underline">Add your first UI Library</router-link>
        </div>
        <div v-else-if="loadingUILibs" class="py-4 text-center text-secondary">
          Loading UI Libraries...
        </div>
        <div v-else class="space-y-2">
          <div 
            v-for="lib in availableUILibraries" 
            :key="lib._id"
            class="flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors"
            :class="form.uiLibraryIds?.includes(lib._id) ? 'bg-brand-active-bg border border-brand-primary' : 'hover:bg-hover'"
            @click="toggleUILibrary(lib._id)"
          >
            <input 
              type="checkbox" 
              :id="`edit-ui-lib-${lib._id}`" 
              :value="lib._id" 
              v-model="form.uiLibraryIds"
              class="w-4 h-4 text-brand-primary bg-background border-border rounded focus:ring-brand-primary"
            >
            <label :for="`edit-ui-lib-${lib._id}`" class="flex-1 text-primary text-sm cursor-pointer">
              {{ lib.name }}
              <p class="text-xs text-secondary">{{ lib.componentCount || 0 }} components</p>
            </label>
          </div>
        </div>
      </div>

      <!-- PRD Section -->
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

      <!-- Expected Cases -->
      <div class="card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-[12px] font-medium text-secondary uppercase tracking-wider">Expected Test Cases ({{ form.expectedCases?.length || 0 }})</h3>
          <button type="button" @click="addCase" class="text-[13px] text-brand-primary hover:underline">+ Add Case</button>
        </div>
        
        <div v-if="!form.expectedCases?.length" class="text-sm text-secondary">
          No expected cases defined. Add some to guide the AI analysis.
        </div>

        <div v-else class="space-y-3">
          <div v-for="(testCase, index) in form.expectedCases" :key="index" class="flex items-center gap-3">
            <input
              v-model="testCase.name"
              type="text"
              class="input flex-1"
              placeholder="Test Case Description (e.g., User can login with valid credentials)"
            >
            <button type="button" @click="removeCase(index)" class="btn-icon">
              <svg class="w-4 h-4 text-secondary hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</div>
      <div v-if="success" class="text-green-500 text-sm mb-4">{{ success }}</div>

      <div class="flex justify-end gap-2">
        <router-link :to="`/features/${projectId}`" class="btn-secondary">Cancel</router-link>
        <button type="submit" :disabled="submitting" class="btn-primary">
          {{ submitting ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi, type Project, type UILibrary, type ExpectedCase } from '../composables/useApi';
import { FEATURE_STATUSES, type FeatureStatus } from '../constants';

const route = useRoute();
const router = useRouter();
const { getProject, updateProject, getAllUILibraries } = useApi();

const projectId = route.params.id as string;

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
const loading = ref(true);
const loadingUILibs = ref(true);
const submitting = ref(false);
const error = ref('');
const success = ref('');
const generateCasesFromPrd = ref(false);

onMounted(async () => {
  await loadProject();
  await loadUILibraries();
});

async function loadProject() {
  loading.value = true;
  try {
    const project = await getProject(projectId);
    form.value = {
      name: project.name,
      description: project.description || '',
      status: project.status,
      uiLibraryIds: project.uiLibraryIds.map(lib => (typeof lib === 'string' ? lib : lib._id)),
      prdText: project.prdText || '',
      expectedCases: project.expectedCases || [],
      casesGeneratedFrom: project.casesGeneratedFrom,
    };
    generateCasesFromPrd.value = project.casesGeneratedFrom === 'prd';
  } catch (err) {
    console.error('Failed to load project:', err);
    error.value = (err as Error).message || 'Failed to load project';
  } finally {
    loading.value = false;
  }
}

async function loadUILibraries() {
  loadingUILibs.value = true;
  try {
    availableUILibraries.value = await getAllUILibraries();
  } catch (err) {
    console.error('Failed to load UI libraries:', err);
    // Do not set global error, as project loading might still be fine
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

function addCase() {
  form.value.expectedCases?.push({ name: '' });
}

function removeCase(index: number) {
  form.value.expectedCases?.splice(index, 1);
}

async function handleSubmit() {
  submitting.value = true;
  error.value = '';
  success.value = '';

  try {
    const validCases = (form.value.expectedCases || []).filter(c => c.name.trim());
    
    await updateProject(projectId, {
      name: form.value.name as string,
      description: form.value.description || undefined,
      status: form.value.status as FeatureStatus,
      uiLibraryIds: form.value.uiLibraryIds as string[],
      prdText: form.value.prdText || undefined,
      expectedCases: validCases,
      casesGeneratedFrom: generateCasesFromPrd.value && form.value.prdText ? 'prd' : form.value.casesGeneratedFrom,
    });

    success.value = 'Changes saved successfully';
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (err) {
    error.value = (err as Error).message || 'Failed to save changes';
  } finally {
    submitting.value = false;
  }
}
</script>
