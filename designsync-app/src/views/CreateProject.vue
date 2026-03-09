<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <router-link to="/projects" class="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block">
        ← Back to Projects
      </router-link>
      <h2 class="text-2xl font-bold">Create Project</h2>
      <p class="text-sm text-muted-foreground mt-1">Set up a new design review project</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Project Info -->
      <div class="p-5 bg-card border border-border space-y-4">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">Project Info</h3>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium">Project Name *</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground transition-colors"
            placeholder="Social Post Scheduler"
            required
          >
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium">Description</label>
          <textarea
            v-model="form.description"
            class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
            rows="2"
            placeholder="Optional project description..."
          ></textarea>
        </div>
      </div>

      <!-- UI Libraries -->
      <div class="p-5 bg-card border border-border space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">📚</span>
          <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">UI Libraries</h3>
        </div>
        <p class="text-xs text-muted-foreground mb-4">
          Select the UI component libraries to use for this project. You can 
          <router-link to="/ui-libraries/new" class="text-primary hover:underline">add a new library</router-link> 
          if you haven't indexed your components yet.
        </p>

        <div v-if="loadingLibraries" class="text-center py-4">
          <div class="w-6 h-6 border-2 border-border border-t-foreground animate-spin mx-auto rounded-full"></div>
        </div>

        <div v-else-if="libraries.length === 0" class="text-center py-6 bg-secondary/30 border border-border">
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
            v-for="lib in libraries"
            :key="lib._id"
            class="flex items-center gap-3 p-3 border border-border hover:bg-secondary/30 cursor-pointer transition-colors"
            :class="{ 'bg-primary/10 border-primary/30': selectedLibraryIds.includes(lib._id) }"
          >
            <input
              type="checkbox"
              :value="lib._id"
              v-model="selectedLibraryIds"
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

      <!-- PRD (Optional) -->
      <div class="p-5 bg-card border border-border space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">📝</span>
          <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">PRD (Optional)</h3>
        </div>
        <p class="text-xs text-muted-foreground mb-4">
          Paste your PRD to auto-generate expected test cases. You can also add or modify cases later.
        </p>

        <div class="space-y-2">
          <label class="block text-sm font-medium">PRD Content</label>
          <textarea
            v-model="form.prdText"
            class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground transition-colors resize-none font-mono"
            rows="6"
            placeholder="Paste your PRD content here...

e.g.:
- User can schedule social media posts
- Posts can include text, images, and links
- User can select date and time for publishing
- ..."
          ></textarea>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="flex-1 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border"
          :disabled="submitting || !form.name"
        >
          {{ submitting ? 'Creating...' : 'Create Project' }}
        </button>
        <router-link 
          to="/projects"
          class="px-6 py-3 bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors border border-border"
        >
          Cancel
        </router-link>
      </div>

      <p v-if="error" class="text-sm text-red-500 mt-2">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi, type UILibrary } from '../composables/useApi';

const router = useRouter();
const { createProject, getAllUILibraries, generateProjectCases } = useApi();

const submitting = ref(false);
const error = ref('');
const loadingLibraries = ref(true);

const libraries = ref<UILibrary[]>([]);
const selectedLibraryIds = ref<string[]>([]);

const form = ref({
  name: '',
  description: '',
  prdText: '',
});

onMounted(async () => {
  await loadLibraries();
});

async function loadLibraries() {
  loadingLibraries.value = true;
  try {
    libraries.value = await getAllUILibraries();
  } catch (err) {
    console.error('Failed to load libraries:', err);
  } finally {
    loadingLibraries.value = false;
  }
}

async function handleSubmit() {
  submitting.value = true;
  error.value = '';

  try {
    const project = await createProject(
      form.value.name,
      form.value.description || undefined,
      selectedLibraryIds.value.length > 0 ? selectedLibraryIds.value : undefined,
      form.value.prdText || undefined
    );

    if (form.value.prdText && form.value.prdText.trim().length > 0) {
      try {
        await generateProjectCases(project._id);
      } catch (err) {
        console.error('Failed to generate cases:', err);
      }
    }

    router.push(`/projects/${project._id}`);
  } catch (err) {
    error.value = (err as Error).message || 'Failed to create project';
  } finally {
    submitting.value = false;
  }
}
</script>
