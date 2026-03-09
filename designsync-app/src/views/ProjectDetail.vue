<template>
  <div class="h-[calc(100vh-80px)]">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-20">
      <div class="w-12 h-12 border-4 border-border border-t-foreground animate-spin mx-auto mb-4 rounded-full"></div>
      <p class="text-sm text-muted-foreground">Loading project...</p>
    </div>

    <!-- Not Found -->
    <div v-else-if="!project" class="text-center py-20">
      <div class="text-6xl mb-4">🔍</div>
      <p class="text-base text-muted-foreground mb-6">Project not found</p>
      <router-link to="/projects" class="text-primary hover:underline">Go back to projects</router-link>
    </div>

    <!-- Project Content -->
    <div v-else class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex-shrink-0 pb-6">
        <router-link to="/projects" class="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block">
          ← Back to Projects
        </router-link>
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold">{{ project.name }}</h2>
            <p v-if="project.description" class="text-sm text-muted-foreground mt-1">{{ project.description }}</p>
          </div>
          <div class="flex gap-2">
            <button
              @click="showNewReviewModal = true"
              class="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              + New Review
            </button>
            <router-link 
              :to="`/projects/${project._id}/edit`"
              class="px-4 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors border border-border"
            >
              Settings
            </router-link>
          </div>
        </div>
      </div>

      <!-- Main Content: 3 columns -->
      <div class="flex-1 flex gap-6 min-h-0">
        <!-- Left: UI Libraries -->
        <div class="w-72 flex-shrink-0 flex flex-col border border-border bg-card">
          <div class="p-4 border-b border-border flex-shrink-0">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60 mb-3">UI Libraries</h3>
            
            <div v-if="uiLibraries.length === 0" class="text-center py-4">
              <p class="text-xs text-muted-foreground mb-2">No libraries linked</p>
              <router-link 
                :to="`/projects/${project._id}/edit`"
                class="text-xs text-primary hover:underline"
              >
                Add in settings
              </router-link>
            </div>

            <div v-else class="space-y-2">
              <router-link
                v-for="lib in uiLibraries"
                :key="lib._id"
                :to="`/ui-libraries/${lib._id}`"
                class="block p-2 border border-border hover:bg-secondary/30 transition-colors"
              >
                <p class="text-sm font-medium">{{ lib.name }}</p>
                <p class="text-xs text-muted-foreground">{{ lib.components?.length || 0 }} components</p>
              </router-link>
            </div>
          </div>

          <div class="p-4 border-b border-border flex-shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">Expected Cases</h3>
              <span class="text-xs text-muted-foreground">{{ project.expectedCases?.length || 0 }}</span>
            </div>

            <div v-if="!project.expectedCases?.length" class="text-center py-4">
              <p class="text-xs text-muted-foreground mb-2">No expected cases</p>
              <button 
                v-if="project.prdText"
                @click="handleGenerateCases"
                :disabled="generatingCases"
                class="text-xs text-primary hover:underline"
              >
                {{ generatingCases ? 'Generating...' : 'Generate from PRD' }}
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <div v-if="project.expectedCases?.length" class="divide-y divide-border">
              <div
                v-for="(caseItem, idx) in project.expectedCases"
                :key="idx"
                class="p-3"
              >
                <div class="flex items-start gap-2">
                  <span 
                    class="w-2 h-2 mt-1.5 rounded-full flex-shrink-0"
                    :class="{
                      'bg-red-500': caseItem.importance === 'critical',
                      'bg-yellow-500': caseItem.importance === 'important',
                      'bg-gray-400': caseItem.importance === 'nice-to-have',
                    }"
                  ></span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium">{{ caseItem.name }}</p>
                    <p class="text-xs text-muted-foreground mt-0.5">{{ caseItem.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Middle: PRD and Reviews -->
        <div class="flex-1 flex flex-col border border-border bg-card overflow-hidden">
          <!-- PRD Section (collapsible) -->
          <div v-if="project.prdText" class="border-b border-border">
            <button 
              @click="showPrd = !showPrd"
              class="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
            >
              <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">PRD</h3>
              <span class="text-muted-foreground">{{ showPrd ? '▼' : '▶' }}</span>
            </button>
            <div v-if="showPrd" class="p-4 pt-0 max-h-60 overflow-y-auto">
              <pre class="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{{ project.prdText }}</pre>
            </div>
          </div>

          <!-- Reviews List -->
          <div class="p-4 border-b border-border">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">Design Reviews</h3>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div v-if="reviewsLoading" class="text-center py-8">
              <div class="w-6 h-6 border-2 border-border border-t-foreground animate-spin mx-auto rounded-full"></div>
            </div>

            <div v-else-if="reviews.length === 0" class="text-center py-12 px-4">
              <div class="text-4xl mb-4">📋</div>
              <p class="text-sm text-muted-foreground mb-2">No reviews yet</p>
              <p class="text-xs text-muted-foreground">Click "New Review" to start</p>
            </div>

            <div v-else class="divide-y divide-border">
              <router-link
                v-for="review in reviews"
                :key="review._id"
                :to="`/review/${review._id}`"
                class="p-4 hover:bg-secondary/30 transition-colors block"
              >
                <div class="flex items-center justify-between mb-2">
                  <p class="text-sm font-medium">{{ review.title }}</p>
                  <span 
                    class="px-2 py-0.5 text-xs font-mono uppercase"
                    :class="{
                      'bg-yellow-500/10 text-yellow-500': review.analysisPhase === 'pending',
                      'bg-blue-500/10 text-blue-500': ['generating_cases', 'checking_cases', 'mapping_components'].includes(review.analysisPhase),
                      'bg-green-500/10 text-green-500': review.analysisPhase === 'completed',
                      'bg-red-500/10 text-red-500': review.analysisPhase === 'failed',
                    }"
                  >
                    {{ review.analysisPhase }}
                  </span>
                </div>
                <div class="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{{ formatDate(review.createdAt) }}</span>
                  <span v-if="review.designImages?.length">{{ review.designImages.length }} image(s)</span>
                  <span v-if="review.caseChecks?.length" class="flex items-center gap-1">
                    <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    {{ review.caseChecks.filter(c => c.status === 'covered').length }}/{{ review.caseChecks.length }} cases
                  </span>
                  <span v-if="review.componentChecks?.length" class="flex items-center gap-1">
                    <span 
                      class="w-1.5 h-1.5 rounded-full"
                      :class="getComponentSummaryColor(review.componentChecks)"
                    ></span>
                    {{ getComponentMatchCount(review.componentChecks) }}/{{ review.componentChecks.length }} components
                  </span>
                </div>
              </router-link>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- New Review Modal -->
    <div v-if="showNewReviewModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showNewReviewModal = false">
      <div class="bg-card border border-border p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">New Design Review</h3>
        
        <form @submit.prevent="handleCreateReview" class="space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">Title *</label>
            <input
              v-model="newReview.title"
              type="text"
              class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground"
              placeholder="e.g., Dashboard - User Settings"
              required
            >
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium">Description</label>
            <textarea
              v-model="newReview.description"
              class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground resize-none"
              rows="2"
              placeholder="Optional description..."
            ></textarea>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium">Design Screenshots</label>
            <div 
              class="border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-foreground/50 transition-colors"
              @click="triggerFileInput"
              @dragover.prevent
              @drop.prevent="handleFileDrop"
            >
              <div v-if="newReview.designImages.length > 0">
                <div class="flex flex-wrap gap-2 justify-center mb-2">
                  <div v-for="(img, idx) in newReview.designImages" :key="idx" class="relative">
                    <img :src="img" class="h-20 object-cover" alt="Design preview">
                    <button 
                      type="button"
                      @click.stop="removeImage(idx)"
                      class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                    >✕</button>
                  </div>
                </div>
                <p class="text-xs text-muted-foreground">Click or drag to add more</p>
              </div>
              <div v-else>
                <div class="text-3xl mb-2">🖼️</div>
                <p class="text-sm text-muted-foreground">Click or drag to upload</p>
                <p class="text-xs text-muted-foreground mt-1">or paste from clipboard</p>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleFileSelect"
            >
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              :disabled="creatingReview || !newReview.title"
            >
              {{ creatingReview ? 'Creating...' : 'Create & Analyze' }}
            </button>
            <button
              type="button"
              @click="showNewReviewModal = false"
              class="px-4 py-2 bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 border border-border"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi, type Project, type Review, type UILibrary } from '../composables/useApi';

const route = useRoute();
const router = useRouter();
const { getProject, getProjectReviews, createReview, analyzeReview, generateProjectCases } = useApi();

const project = ref<Project | null>(null);
const reviews = ref<Review[]>([]);
const loading = ref(true);
const reviewsLoading = ref(true);
const generatingCases = ref(false);

const showNewReviewModal = ref(false);
const showPrd = ref(false);
const creatingReview = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const newReview = ref<{
  title: string;
  description: string;
  designImages: string[];
}>({
  title: '',
  description: '',
  designImages: [],
});

const uiLibraries = computed((): UILibrary[] => {
  if (!project.value) return [];
  return (project.value.uiLibraryIds || []).filter(
    (lib): lib is UILibrary => typeof lib === 'object' && lib !== null
  );
});

onMounted(async () => {
  await loadProject();
  await loadReviews();
  document.addEventListener('paste', handlePaste);
});

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste);
});

async function loadProject() {
  loading.value = true;
  try {
    project.value = await getProject(route.params.id as string);
  } catch (error) {
    console.error('Failed to load project:', error);
  } finally {
    loading.value = false;
  }
}

async function loadReviews() {
  reviewsLoading.value = true;
  try {
    reviews.value = await getProjectReviews(route.params.id as string);
  } catch (error) {
    console.error('Failed to load reviews:', error);
  } finally {
    reviewsLoading.value = false;
  }
}

async function handleGenerateCases() {
  if (!project.value) return;
  generatingCases.value = true;
  try {
    const result = await generateProjectCases(project.value._id);
    await loadProject();
    alert(`Generated ${result.casesCount} expected cases`);
  } catch (error) {
    console.error('Failed to generate cases:', error);
    alert('Failed to generate cases');
  } finally {
    generatingCases.value = false;
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files) {
    for (const file of files) {
      readFileAsDataURL(file);
    }
  }
}

function handleFileDrop(event: DragEvent) {
  const files = event.dataTransfer?.files;
  if (files) {
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        readFileAsDataURL(file);
      }
    }
  }
}

function handlePaste(event: ClipboardEvent) {
  if (!showNewReviewModal.value) return;
  
  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        readFileAsDataURL(file);
      }
    }
  }
}

function readFileAsDataURL(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    if (dataUrl) {
      newReview.value.designImages.push(dataUrl);
    }
  };
  reader.readAsDataURL(file);
}

function removeImage(idx: number) {
  newReview.value.designImages.splice(idx, 1);
}

async function handleCreateReview() {
  if (!project.value) return;
  
  creatingReview.value = true;
  try {
    const review = await createReview(
      project.value._id,
      newReview.value.title,
      newReview.value.description || undefined,
      newReview.value.designImages.length > 0 ? newReview.value.designImages : undefined
    );
    
    if (review.designImages?.length > 0) {
      try {
        await analyzeReview(review._id);
      } catch (err) {
        console.error('Analysis start failed:', err);
      }
    }
    
    showNewReviewModal.value = false;
    newReview.value = { title: '', description: '', designImages: [] };
    router.push(`/review/${review._id}`);
  } catch (error) {
    console.error('Failed to create review:', error);
  } finally {
    creatingReview.value = false;
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

function getComponentMatchCount(componentChecks: any[]): number {
  return componentChecks.filter(c => c.exists && !c.hasIssue).length;
}

function getComponentSummaryColor(componentChecks: any[]): string {
  const total = componentChecks.length;
  const matched = componentChecks.filter(c => c.exists && !c.hasIssue).length;
  const partial = componentChecks.filter(c => c.exists && (c.propsMissing?.length || c.slotsMissing?.length) && !c.hasIssue).length;
  const issues = componentChecks.filter(c => !c.exists || c.hasIssue).length;

  if (issues > 0) return 'bg-red-500';
  if (partial > 0) return 'bg-yellow-500';
  if (matched === total) return 'bg-green-500';
  return 'bg-muted-foreground';
}
</script>
