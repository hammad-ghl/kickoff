<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <router-link :to="`/projects/${projectId}`" class="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block">
        ← Back to Project
      </router-link>
      <h2 class="text-2xl font-bold">Project Settings</h2>
      <p class="text-sm text-muted-foreground mt-1">Manage project configuration</p>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="w-8 h-8 border-2 border-border border-t-foreground animate-spin mx-auto rounded-full"></div>
      <p class="text-sm text-muted-foreground mt-2">Loading project...</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Project Info -->
      <div class="p-5 bg-card border border-border space-y-4">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">Project Info</h3>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium">Project Name *</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground transition-colors"
            required
          >
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium">Description</label>
          <textarea
            v-model="form.description"
            class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
            rows="2"
          ></textarea>
        </div>
      </div>

      <!-- UI Libraries -->
      <div class="p-5 bg-card border border-border space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">📚</span>
          <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">UI Libraries</h3>
        </div>
        <p class="text-xs text-muted-foreground">
          Select the UI component libraries for this project.
        </p>

        <div v-if="loadingLibraries" class="text-center py-4">
          <div class="w-6 h-6 border-2 border-border border-t-foreground animate-spin mx-auto rounded-full"></div>
        </div>

        <div v-else-if="allLibraries.length === 0" class="text-center py-6 bg-secondary/30 border border-border">
          <p class="text-sm text-muted-foreground mb-3">No UI libraries available</p>
          <router-link 
            to="/ui-libraries/new"
            class="inline-block px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 border border-border"
          >
            + Add UI Library
          </router-link>
        </div>

        <div v-else class="space-y-2">
          <label
            v-for="lib in allLibraries"
            :key="lib._id"
            class="flex items-center gap-3 p-3 border border-border hover:bg-secondary/30 cursor-pointer transition-colors"
            :class="{ 'bg-primary/10 border-primary/30': form.uiLibraryIds.includes(lib._id) }"
          >
            <input
              type="checkbox"
              :value="lib._id"
              v-model="form.uiLibraryIds"
              class="w-4 h-4 accent-primary"
            >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-sm">{{ lib.name }}</span>
                <span class="text-xs text-muted-foreground">({{ lib.componentCount || 0 }} components)</span>
              </div>
              <p v-if="lib.source?.fullName" class="text-xs text-muted-foreground truncate">
                {{ lib.source.fullName }}
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- PRD -->
      <div class="p-5 bg-card border border-border space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">📝</span>
            <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">PRD</h3>
          </div>
          <button
            v-if="form.prdText && form.prdText.trim().length > 0"
            type="button"
            @click="handleGenerateCases"
            :disabled="generatingCases"
            class="text-xs text-primary hover:underline"
          >
            {{ generatingCases ? 'Generating...' : 'Re-generate cases from PRD' }}
          </button>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium">PRD Content</label>
          <textarea
            v-model="form.prdText"
            class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground transition-colors resize-none font-mono"
            rows="6"
            placeholder="Paste your PRD content here..."
          ></textarea>
        </div>
      </div>

      <!-- Expected Cases -->
      <div class="p-5 bg-card border border-border space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">Expected Cases</h3>
          <button
            type="button"
            @click="addCase"
            class="text-xs text-primary hover:underline"
          >
            + Add Case
          </button>
        </div>

        <p v-if="form.casesGeneratedFrom" class="text-xs text-muted-foreground">
          Generated from: {{ form.casesGeneratedFrom }}
        </p>

        <div v-if="form.expectedCases.length === 0" class="text-center py-4 text-sm text-muted-foreground">
          No expected cases defined
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="(caseItem, idx) in form.expectedCases"
            :key="idx"
            class="p-3 bg-background border border-border space-y-2"
          >
            <div class="flex items-start gap-2">
              <input
                v-model="caseItem.name"
                type="text"
                class="flex-1 px-2 py-1 bg-card border border-border text-sm focus:outline-none focus:border-foreground"
                placeholder="Case name"
              >
              <select
                v-model="caseItem.importance"
                class="px-2 py-1 bg-card border border-border text-sm focus:outline-none focus:border-foreground"
              >
                <option value="critical">Critical</option>
                <option value="important">Important</option>
                <option value="nice-to-have">Nice-to-have</option>
              </select>
              <button
                type="button"
                @click="removeCase(idx)"
                class="text-muted-foreground hover:text-red-500 px-2"
              >
                ✕
              </button>
            </div>
            <textarea
              v-model="caseItem.description"
              class="w-full px-2 py-1 bg-card border border-border text-xs focus:outline-none focus:border-foreground resize-none"
              rows="2"
              placeholder="Description..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="p-5 bg-card border border-red-500/30 space-y-4">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-red-500">Danger Zone</h3>
        <p class="text-xs text-muted-foreground">
          Permanently delete this project and all its reviews.
        </p>
        <button
          type="button"
          @click="confirmDelete"
          class="px-4 py-2 bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-colors border border-red-500/30"
        >
          Delete Project
        </button>
      </div>

      <!-- Submit -->
      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="flex-1 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border"
          :disabled="submitting || !form.name"
        >
          {{ submitting ? 'Saving...' : 'Save Changes' }}
        </button>
        <router-link 
          :to="`/projects/${projectId}`"
          class="px-6 py-3 bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors border border-border"
        >
          Cancel
        </router-link>
      </div>

      <p v-if="error" class="text-sm text-red-500 mt-2">{{ error }}</p>
      <p v-if="success" class="text-sm text-green-500 mt-2">{{ success }}</p>
    </form>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="showDeleteModal = false"
    >
      <div class="bg-card border border-border p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4 text-red-500">Delete Project?</h3>
        <p class="text-sm text-muted-foreground mb-6">
          This will permanently delete "{{ form.name }}" and all its reviews. This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            @click="handleDelete"
            class="flex-1 px-4 py-2 bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
            :disabled="deleting"
          >
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
          <button
            type="button"
            @click="showDeleteModal = false"
            class="px-4 py-2 bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 border border-border"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi, type UILibrary, type ExpectedCase } from '../composables/useApi';

const route = useRoute();
const router = useRouter();
const projectId = route.params.id as string;

const { getProject, updateProject, deleteProject, getAllUILibraries, generateProjectCases } = useApi();

const loading = ref(true);
const loadingLibraries = ref(true);
const submitting = ref(false);
const deleting = ref(false);
const generatingCases = ref(false);
const error = ref('');
const success = ref('');

const allLibraries = ref<UILibrary[]>([]);
const showDeleteModal = ref(false);

const form = ref<{
  name: string;
  description: string;
  uiLibraryIds: string[];
  prdText: string;
  expectedCases: ExpectedCase[];
  casesGeneratedFrom: 'prd' | 'image' | 'manual' | null;
}>({
  name: '',
  description: '',
  uiLibraryIds: [],
  prdText: '',
  expectedCases: [],
  casesGeneratedFrom: null,
});

onMounted(async () => {
  await Promise.all([loadProject(), loadLibraries()]);
});

async function loadProject() {
  loading.value = true;
  try {
    const project = await getProject(projectId);
    form.value.name = project.name;
    form.value.description = project.description || '';
    form.value.prdText = project.prdText || '';
    form.value.expectedCases = project.expectedCases || [];
    form.value.casesGeneratedFrom = project.casesGeneratedFrom || null;
    
    form.value.uiLibraryIds = (project.uiLibraryIds || []).map(lib => 
      typeof lib === 'string' ? lib : lib._id
    );
  } catch (err) {
    error.value = (err as Error).message || 'Failed to load project';
  } finally {
    loading.value = false;
  }
}

async function loadLibraries() {
  loadingLibraries.value = true;
  try {
    allLibraries.value = await getAllUILibraries();
  } catch (err) {
    console.error('Failed to load libraries:', err);
  } finally {
    loadingLibraries.value = false;
  }
}

async function handleGenerateCases() {
  generatingCases.value = true;
  try {
    const result = await generateProjectCases(projectId);
    form.value.expectedCases = result.expectedCases;
    form.value.casesGeneratedFrom = 'prd';
    success.value = `Generated ${result.casesCount} cases`;
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (err) {
    error.value = (err as Error).message || 'Failed to generate cases';
  } finally {
    generatingCases.value = false;
  }
}

function addCase() {
  form.value.expectedCases.push({
    name: '',
    description: '',
    importance: 'important',
  });
}

function removeCase(idx: number) {
  form.value.expectedCases.splice(idx, 1);
}

function confirmDelete() {
  showDeleteModal.value = true;
}

async function handleDelete() {
  deleting.value = true;
  try {
    await deleteProject(projectId);
    router.push('/projects');
  } catch (err) {
    error.value = (err as Error).message || 'Failed to delete project';
    showDeleteModal.value = false;
  } finally {
    deleting.value = false;
  }
}

async function handleSubmit() {
  submitting.value = true;
  error.value = '';
  success.value = '';

  try {
    const validCases = form.value.expectedCases.filter(c => c.name.trim());
    
    await updateProject(projectId, {
      name: form.value.name,
      description: form.value.description || undefined,
      uiLibraryIds: form.value.uiLibraryIds,
      prdText: form.value.prdText || undefined,
      expectedCases: validCases,
      casesGeneratedFrom: form.value.casesGeneratedFrom,
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
