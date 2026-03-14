<template>
  <div class="h-full flex flex-col bg-primary overflow-auto">
    <div class="max-w-[1100px] w-full mx-auto px-10 pt-10 pb-6 flex flex-col">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-20">
      <div class="w-12 h-12 border-4 border-primary animate-spin rounded-full mx-auto" style="border-color: var(--color-border-primary); border-top-color: var(--color-brand-primary);"></div>
      <p class="text-sm text-secondary">Loading feature...</p>
    </div>

    <!-- Not Found -->
    <div v-else-if="!project" class="text-center py-20">
      <div class="text-6xl mb-4">🔍</div>
      <p class="text-base text-secondary mb-6">Feature not found</p>
      <router-link to="/features" class="text-brand-primary hover:underline">Go back to features</router-link>
    </div>

    <!-- Project Content -->
    <div v-else class="flex flex-col flex-1">
      <!-- Header -->
      <div class="flex-shrink-0 pb-6">
        <button 
          @click="goBack"
          class="text-sm text-secondary hover:text-primary transition-colors mb-2 inline-flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Features
        </button>
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-[28px] text-primary font-normal mb-1">{{ project.name }}</h2>
            <p v-if="project.description" class="text-sm text-secondary mt-1">{{ project.description }}</p>
            <div class="flex items-center gap-3 mt-2 text-xs text-secondary font-mono">
              <span>kickoff-{{ project._id.slice(0, 8) }}</span>
              <span>•</span>
              <StatusDropdown
                :current-status="project.status || 'draft'"
                @change="(newStatus) => handleStatusChange(newStatus)"
              />
              <span>•</span>
              <span>Created {{ formatDate(project.createdAt) }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="showNewReviewModal = true"
              class="btn-secondary"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
              </svg>
              New Review
            </button>
            <router-link
              :to="`/features/${project._id}/edit`"
              class="btn-secondary"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Feature
            </router-link>
          </div>
        </div>
      </div>

      <!-- PRD and Expected Cases -->
      <div class="grid grid-cols-2 gap-4 mb-8">
        <div class="card p-4">
          <h3 class="text-[11px] uppercase tracking-wider text-secondary mb-2">PRD Content</h3>
          <div v-if="project.prdText" class="text-sm text-primary max-h-40 overflow-y-auto custom-scrollbar">
            <p class="whitespace-pre-wrap">{{ project.prdText }}</p>
          </div>
          <div v-else class="text-sm text-secondary">
            No Product Requirements Document (PRD) provided.
          </div>
          <button 
            v-if="!project.casesGeneratedFrom || project.casesGeneratedFrom === 'manual'"
            @click="generateCasesFromPrd(project._id)"
            :disabled="!project.prdText || generatingCases"
            class="btn-secondary text-xs mt-4"
          >
            {{ generatingCases ? 'Generating...' : 'Generate Cases from PRD' }}
          </button>
        </div>
        <div class="card p-4">
          <h3 class="text-[11px] uppercase tracking-wider text-secondary mb-2">Expected Test Cases ({{ project.expectedCases?.length || 0 }})</h3>
          <div v-if="project.expectedCases?.length" class="text-sm text-primary max-h-40 overflow-y-auto custom-scrollbar">
            <ul class="list-disc pl-5 space-y-1">
              <li v-for="(testCase, index) in project.expectedCases" :key="index">{{ testCase.name }}</li>
            </ul>
          </div>
          <div v-else class="text-sm text-secondary">
            No expected test cases defined. 
            <span v-if="project.prdText">Generate them from the PRD, or add them manually in <router-link :to="`/features/${project._id}/edit`" class="text-brand-primary hover:underline">edit mode</router-link>.</span>
            <span v-else>Add them manually in <router-link :to="`/features/${project._id}/edit`" class="text-brand-primary hover:underline">edit mode</router-link>.</span>
          </div>
        </div>
      </div>

      <!-- Reviews List -->
      <div class="p-0 flex flex-col flex-1">
        <div class="pb-4 pl-1 border-b border-border flex items-center justify-between">
          <h3 class="text-lg font-medium text-primary">
            Reviews ({{ reviews.length }})
          </h3>
        </div>

        <div v-if="loadingReviews" class="p-8 text-center text-secondary">
          Loading reviews...
        </div>
        <div v-else-if="reviews.length === 0" class="p-12 flex flex-col items-center justify-center text-center">
          <div class="w-20 h-20 flex items-center justify-center mb-4 opacity-30">
            <svg width="80" height="80" viewBox="0 0 103 111" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M43.096 50.702l8.562-4.456 8.219 4.456M52 1.342v44.902M2 82.922v-54.5l49.657 27.421V110L2 82.922z" stroke="currentColor" class="text-secondary"/>
              <path d="M102 28.078L51.657 56.185V110L102 82.578v-54.5z" fill="currentColor" stroke="currentColor" class="text-secondary"/>
              <path d="M52 1L2 28.421 52 55.5l49.658-27.079L52 1z" stroke="currentColor" class="text-secondary"/>
            </svg>
          </div>
          <p class="text-[14px] text-secondary mb-2">No reviews conducted yet</p>
          <p class="text-[12px] text-tertiary mb-6">Start a review to analyze design coverage and component usage</p>
          <button @click="showNewReviewModal = true" class="btn-primary p-4 font-semibold text-sm">Start First Review</button>
        </div>
        <div v-else class="flex-1 overflow-y-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-[11px] font-medium text-secondary uppercase tracking-wider text-left sticky top-0 z-10">
                <th class="px-4 py-2">Title</th>
                <th class="px-4 py-2">Status</th>
                <th class="px-4 py-2">Date</th>
                <th class="px-4 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="review in reviews" 
                :key="review._id"
                class="group hover:bg-hover transition-colors cursor-pointer border-b border-border-low"
                @click="router.push(`/review/${review._id}`)"
              >
                <td class="px-4 py-2">
                  <div class="font-normal text-primary text-[13px]">{{ review.title }}</div>
                  <div v-if="review.designImage" class="text-xs text-secondary truncate max-w-xs mt-0.5">
                    Design: {{ review.designImage.substring(review.designImage.lastIndexOf('/') + 1) }}
                  </div>
                </td>
                <td class="px-4 py-2">
                  <span :class="['chip', getAnalysisPhaseClass(review.analysisPhase)]">
                    {{ getAnalysisPhaseLabel(review.analysisPhase) }}
                  </span>
                </td>
                <td class="px-4 py-2 text-secondary">
                  {{ formatDate(review.createdAt) }}
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

    <!-- New Review Modal -->
    <div
      v-if="showNewReviewModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="showNewReviewModal = false"
    >
      <div class="card w-full max-w-md p-6">
        <h3 class="text-xl font-medium text-primary mb-4">Start New Review</h3>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block text-sm text-secondary">Review Title *</label>
            <input
              v-model="newReviewForm.title"
              type="text"
              class="input"
              placeholder="e.g., Initial Design Review v1.0"
              required
            >
          </div>
          <div class="space-y-2">
            <label class="block text-sm text-secondary">Design Screenshots *</label>
            <div 
              class="dropzone"
              :class="{ 'dropzone-active': isDragging }"
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()"
            >
              <input 
                ref="fileInput"
                type="file" 
                class="hidden" 
                @change="handleDesignImageUpload" 
                accept="image/*"
                multiple
              >
              
              <div v-if="newReviewForm.designImages.length === 0" class="flex flex-col items-center gap-2 text-center py-4">
                <svg class="w-8 h-8 text-secondary opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div class="text-[13px] text-secondary">
                  <span class="text-brand-primary font-medium">Click to upload</span> or drag and drop
                </div>
                <div class="text-[11px] text-tertiary">PNG, JPG, WebP (max. 10MB)</div>
              </div>
              
              <div v-else class="flex flex-col items-center gap-3 w-full">
                <div class="relative w-full aspect-video rounded-lg overflow-hidden bg-black/20 border border-border-low">
                  <img :src="newReviewForm.designImage" class="w-full h-full object-contain" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button @click.stop="newReviewForm.designImage = ''; newReviewForm.designImagePreview = ''" class="btn-icon bg-error/20 text-error hover:bg-error/40">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="text-[12px] text-secondary truncate max-w-full px-2">
                  {{ newReviewForm.designImagePreview }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="showNewReviewModal = false"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            @click="handleStartReview"
            :disabled="!newReviewForm.title || !newReviewForm.designImage || creatingReview"
            class="btn-primary"
          >
            {{ creatingReview ? 'Starting...' : 'Start Review' }}
          </button>
        </div>
      </div>
    </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi, type Project, type Review } from '../composables/useApi';
import { formatDate, getStatusClass, getStatusDotClass, getStatusLabel, ANALYSIS_PHASES, type FeatureStatus } from '../constants';
import StatusDropdown from '../components/StatusDropdown.vue';
import { useToast } from '../composables/useToast';

const route = useRoute();
const router = useRouter();
const { getProject, getAllReviewsForProject, createReview, generateProjectCases, updateProject } = useApi();
const { success, error: showError } = useToast();

const projectId = route.params.id as string;

const project = ref<Project | null>(null);
const reviews = ref<Review[]>([]);
const loading = ref(true);
const loadingReviews = ref(true);
const showNewReviewModal = ref(false);
const creatingReview = ref(false);
const generatingCases = ref(false);
const isDragging = ref(false);

const newReviewForm = ref({
  title: '',
  designImages: [] as string[],
  designImagePreviews: [] as string[],
});

const getAnalysisPhaseLabel = (phase: string) => {
  const p = ANALYSIS_PHASES.find(ap => ap.key === phase);
  return p ? p.label : phase;
};

const getAnalysisPhaseClass = (phase: string) => {
  switch (phase) {
    case 'completed': return 'chip-green';
    case 'failed': return 'chip-red';
    case 'pending':
    case 'generating_cases':
    case 'checking_cases':
    case 'mapping_components': return 'chip-blue';
    default: return 'chip-secondary';
  }
};

onMounted(async () => {
  await loadProject();
  await loadReviews();
});

async function loadProject() {
  loading.value = true;
  try {
    project.value = await getProject(projectId);
  } catch (err) {
    console.error('Failed to load project:', err);
  } finally {
    loading.value = false;
  }
}

async function loadReviews() {
  loadingReviews.value = true;
  try {
    reviews.value = await getAllReviewsForProject(projectId);
  } catch (err) {
    console.error('Failed to load reviews:', err);
  } finally {
    loadingReviews.value = false;
  }
}

async function processFile(file: File) {
  if (!file.type.startsWith('image/')) {
    showError('Please upload an image file.');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = () => {
    newReviewForm.value.designImages.push(reader.result as string);
    newReviewForm.value.designImagePreviews.push(file.name);
  };
  reader.readAsDataURL(file);
}

async function handleDesignImageUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      await processFile(files[i]);
    }
  }
}

function removeImage(index: number) {
  newReviewForm.value.designImages.splice(index, 1);
  newReviewForm.value.designImagePreviews.splice(index, 1);
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      processFile(files[i]);
    }
  }
}

function handleDragOver(event: DragEvent) {
  isDragging.value = true;
}

function handleDragLeave(event: DragEvent) {
  isDragging.value = false;
}

async function handleStartReview() {
  if (!newReviewForm.value.title || newReviewForm.value.designImages.length === 0) {
    showError('Please provide both a title and at least one design screenshot.');
    return;
  }

  creatingReview.value = true;
  try {
    const newReview = await createReview(projectId, {
      title: newReviewForm.value.title,
      designImages: newReviewForm.value.designImages,
    });
    showNewReviewModal.value = false;
    newReviewForm.value.title = '';
    newReviewForm.value.designImages = [];
    newReviewForm.value.designImagePreviews = [];
    router.push(`/review/${newReview._id}`);
  } catch (err) {
    console.error('Failed to start review:', err);
    showError((err as Error).message || 'Failed to start review');
  } finally {
    creatingReview.value = false;
  }
}

async function generateCasesFromPrd(projectId: string) {
  generatingCases.value = true;
  try {
    const response = await generateProjectCases(projectId, 'prd');
    success(response.message);
    await loadProject();
  } catch (err) {
    console.error('Failed to generate cases:', err);
    showError((err as Error).message || 'Failed to generate cases');
  } finally {
    generatingCases.value = false;
  }
}

async function handleStatusChange(newStatus: string) {
  if (!project.value) return;
  
  try {
    await updateProject(project.value._id, { status: newStatus as FeatureStatus });
    await loadProject();
    success('Status updated successfully');
  } catch (err: any) {
    console.error('Failed to update status:', err);
    showError(err.message || 'Failed to update status');
  }
}

function goBack() {
  // If there's history, go back, otherwise navigate to features list
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/features');
  }
}
</script>

<style scoped>
.dropzone {
  border: 2px dashed var(--color-border-tertiary);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.2s;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.02);
}

.dropzone:hover {
  border-color: rgba(255, 255, 255, 0.52);
  background-color: rgba(255, 255, 255, 0.04);
}

.dropzone-active {
  border-color: white;
  background-color: rgba(135, 169, 255, 0.05);
}

.btn-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transition: all 0.2s;
}
</style>
