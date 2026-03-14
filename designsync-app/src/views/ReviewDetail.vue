<template>
  <div class="h-full flex flex-col bg-primary overflow-auto">
    <div v-if="loading" class="text-center py-20 flex flex-col items-center justify-center h-full">
      <div class="w-12 h-12 border-4 border-border border-t-brand-primary animate-spin rounded-full mb-4"></div>
      <p class="text-sm text-secondary">Loading review...</p>
    </div>

    <div v-else-if="!review" class="text-center py-20 flex flex-col items-center justify-center h-full">
      <div class="text-6xl mb-4">🔍</div>
      <p class="text-base text-secondary mb-6">Review not found</p>
      <router-link :to="`/features/${projectId}`" class="text-brand-primary hover:underline">Go back to feature</router-link>
    </div>

    <div v-else class="flex-1 flex flex-col">
      <!-- Top Bar -->
      <div class="flex-shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="goBack" class="btn-icon w-8 h-8">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 class="text-[18px] text-primary font-normal">{{ review.title }}</h2>
          <span :class="[getAnalysisPhaseClass(review.analysisPhase, review.analysisPhase, isPhaseCompleted), 'chip']">
            {{ getAnalysisPhaseLabel(review.analysisPhase) }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showReanalyzeModal = true" :disabled="reAnalyzing" class="btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ reAnalyzing ? 'Re-analyzing...' : 'Re-analyze' }}
          </button>
          <button @click="showDeleteModal = true" class="btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      <!-- Analysis Progress Tracker -->
      <div class="flex-shrink-0 px-6 py-6 border-b border-border bg-tertiary">
        <div class="max-w-5xl mx-auto">
          <div class="grid grid-cols-5 gap-3">
            <div 
              v-for="(phase, index) in ANALYSIS_PHASES_DISPLAY"
              :key="phase.key"
              class="relative"
            >
              <!-- Progress Card -->
              <div 
                class="card p-4 transition-all duration-300 relative overflow-hidden min-w-[180px]"
                :class="{
                  'bg-brand-primary/10 border-brand-primary': isPhaseActive(phase.key),
                  'bg-green-900/10 border-green-600': isPhaseCompleted(phase.key) && review.analysisPhase === 'completed',
                  'opacity-50': !isPhaseActive(phase.key) && !isPhaseCompleted(phase.key)
                }"
              >
                <!-- Active indicator with animation -->
                <div 
                  v-if="isPhaseActive(phase.key)"
                  class="absolute top-0 left-0 right-0 h-1 bg-brand-primary overflow-hidden"
                >
                  <div class="h-full bg-white/60 animate-progress-bar"></div>
                </div>
                
                <!-- Pulsing background for active phase -->
                <div 
                  v-if="isPhaseActive(phase.key)"
                  class="absolute inset-0 bg-brand-primary/5 animate-pulse-slow"
                ></div>
                
                <div class="flex items-start gap-3 relative z-10">
                  <!-- Icon -->
                  <div 
                    class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 relative"
                    :class="getModernPhaseIconClass(phase.key)"
                  >
                    <!-- Spinning loader for active phase - perfectly circular -->
                    <div 
                      v-if="isPhaseActive(phase.key)"
                      class="absolute inset-0 rounded-full"
                    >
                      <svg class="w-full h-full animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-dasharray="60" 
                          stroke-dashoffset="15"
                          stroke-linecap="round"
                          class="opacity-60"
                        />
                      </svg>
                    </div>
                    <svg class="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path :d="getPhaseIconPath(phase.key)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
                    </svg>
                  </div>
                  
                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <h4 
                      class="text-[13px] font-semibold mb-1 transition-colors duration-300"
                      :class="getPhaseTextClass(phase.key)"
                    >
                      {{ phase.label }}
                    </h4>
                    <p class="text-[10px] text-tertiary leading-relaxed">
                      {{ phase.description }}
                    </p>
                    <!-- Active status text -->
                    <p 
                      v-if="isPhaseActive(phase.key) && review.analysisPhase !== 'completed' && review.analysisPhase !== 'failed'"
                      class="text-[10px] text-brand-primary font-medium mt-1.5 animate-pulse"
                    >
                      Processing...
                    </p>
                  </div>
                </div>
                
                <!-- Status indicator -->
                <div 
                  v-if="isPhaseCompleted(phase.key) && review.analysisPhase === 'completed'"
                  class="absolute top-3 right-3"
                >
                  <CheckCircle :size="14" class="text-green-500" />
                </div>
              </div>
              
              <!-- Connector Line -->
              <div 
                v-if="index < ANALYSIS_PHASES_DISPLAY.length - 1"
                class="absolute top-8 -right-2 w-4 h-0.5 bg-border z-0"
                :class="{ 'bg-brand-primary': isPhaseCompleted(phase.key) }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Analysis Error Banner -->
      <div v-if="review.analysisError" class="bg-red-900/30 border-b border-red-700 text-red-300 px-6 py-3 text-sm flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Analysis failed: {{ review.analysisError }}</span>
      </div>

      <!-- Main 3-Pane Layout -->
      <div class="flex-1 flex min-h-0">
        <!-- Left Pane: Case Coverage -->
        <div class="w-1/3 flex flex-col border-r border-border-light bg-tertiary  h-[calc(100vh-210px)]">
          <div class="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
            <h3 class="text-[14px] font-medium text-primary">Case Coverage ({{ filteredCaseChecks.length }})</h3>
            <div class="w-36">
              <CustomDropdown
                v-model="caseFilter"
                :options="caseFilterOptions"
                placeholder="All Cases"
              />
            </div>
          </div>
          <div v-if="review.caseChecks.length === 0" class="p-4 text-secondary text-sm">
            No test cases generated yet.
            <span v-if="isPhaseActive('generating_cases')"> Generating cases...</span>
          </div>
          <div v-else class="flex-1 overflow-y-auto divide-y divide-border-low pb-[200px]">
            <div 
              v-for="c in filteredCaseChecks"
              :key="c.caseName"
              class="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-hover transition-colors"
              :class="getCheckBgClass(c.status)"
            >
              <div class="w-5 h-5 flex-shrink-0">
                <component :is="getCaseStatusIcon(c.status)" class="w-5 h-5" />
              </div>
              <span class="text-sm text-primary flex-1">{{ c.caseName }}</span>
            </div>
          </div>
        </div>

        <!-- Center Pane: Design Images -->
        <div class="w-1/3 flex flex-col border-r border-border-light bg-primary-low">
          <div class="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
            <h3 class="text-[14px] font-medium text-primary">Design</h3>
            <div class="flex items-center gap-2">
              <button class="btn-secondary btn-sm" @click="showBoundingBoxes = !showBoundingBoxes">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path v-if="showBoundingBoxes" d="M3 3h18v18H3V3zm16 16V5H5v14h14zM8 8h8v8H8V8z"/>
                  <path v-else d="M3 3h18v18H3V3zm2 2v14h14V5H5z"/>
                </svg>
                Boxes
              </button>
              <button class="btn-secondary btn-sm" @click="openAddImageModal = true">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Add Image
              </button>
            </div>
          </div>
          <div v-if="!review.designImages || review.designImages.length === 0" class="p-8 text-center text-secondary text-sm">
            No design image uploaded for this review.
          </div>
          <div v-else class="flex-1 overflow-y-auto p-4 flex items-start justify-center relative">
            <div class="relative cursor-pointer inline-block" @click="expandedImage = true">
              <img 
                :src="review.designImages[0]"
                alt="Design Screenshot"
                class="max-w-full h-auto object-contain rounded-lg shadow-lg block"
                @load="onImageLoad"
                ref="designImageRef"
              />
              <div v-if="showBoundingBoxes && renderedDimensions.width && renderedDimensions.height" class="absolute inset-0 pointer-events-none">
                <template v-for="(comp, index) in visibleComponentBoxes" :key="index">
                  <div 
                    v-if="comp.boundingBox"
                    class="absolute border-2 border-dashed transition-all duration-300 pointer-events-auto"
                    :class="getBoundingBoxClass(comp.hasIssue)"
                    :style="getBoundingBoxStyle(comp.boundingBox)"
                    :title="`${comp.componentName} - x:${(comp.boundingBox.x * 100).toFixed(1)}% y:${(comp.boundingBox.y * 100).toFixed(1)}% w:${(comp.boundingBox.width * 100).toFixed(1)}% h:${(comp.boundingBox.height * 100).toFixed(1)}%`"
                  >
                    <span 
                      class="absolute -top-5 left-0 px-1 text-[10px] font-mono rounded-sm whitespace-nowrap pointer-events-none"
                      :class="getBoundingBoxLabelClass(comp.hasIssue)"
                    >
                      {{ comp.componentName }}
                    </span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Pane: Component Checks -->
        <div class="w-1/3 flex flex-col bg-tertiary h-[calc(100vh-210px)] overflow-y-auto">
          <div class="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
            <h3 class="text-[14px] font-medium text-primary">Components ({{ filteredComponentChecks.length }})</h3>
            <div class="w-36">
              <CustomDropdown
                v-model="componentFilter"
                :options="componentFilterOptions"
                placeholder="All Components"
              />
            </div>
          </div>
          <!-- Helper text -->
          <div v-if="selectedComponent" class="px-4 py-2 bg-brand-primary/10 border-b border-brand-primary/30 text-[11px] text-brand-primary flex items-center justify-between">
            <span>Showing only selected component's marking</span>
            <button 
              @click="selectedComponent = null" 
              class="text-[10px] underline hover:no-underline"
            >
              Clear selection
            </button>
          </div>
          <div v-if="!review.componentChecks || review.componentChecks.length === 0" class="p-4 text-secondary text-sm">
            No components mapped yet.
            <span v-if="isPhaseActive('mapping_components')"> Mapping components...</span>
          </div>
          <div v-else class="flex-1 overflow-y-auto divide-y divide-border-low pb-[200px]">
            <div 
              v-for="comp in filteredComponentChecks"
              :key="comp.componentName"
              class="px-4 py-3 cursor-pointer hover:bg-hover transition-colors"
              :class="getComponentBgClass(comp)"
              @click="handleComponentClick(comp.componentName)"
            >
              <div class="flex items-center gap-3">
                <div class="w-5 h-5 flex-shrink-0">
                  <component :is="getComponentStatusIcon(comp)" class="w-5 h-5" />
                </div>
                <span class="text-sm font-medium flex-1" :class="selectedComponent === comp.componentName ? 'text-brand-primary' : 'text-primary'">
                  {{ comp.componentName }}
                </span>
                <!-- Selected indicator -->
                <span 
                  v-if="selectedComponent === comp.componentName"
                  class="chip bg-brand-primary/20 text-brand-primary border border-brand-primary text-[10px] font-semibold"
                >
                  Selected
                </span>
                <span 
                  v-if="comp.propsMissing?.length || comp.slotsMissing?.length"
                  class="chip chip-orange text-[10px]"
                >
                  Missing: {{ (comp.propsMissing?.length || 0) + (comp.slotsMissing?.length || 0) }}
                </span>
                <span v-if="comp.exists && !comp.hasIssue && (comp.propsMissing?.length === 0 && comp.slotsMissing?.length === 0)" class="chip chip-green text-[10px]">
                  OK
                </span>
                <span v-if="!comp.exists" class="chip chip-red text-[10px]">
                  Missing
                </span>
              </div>
              <div v-if="comp.hasIssue && comp.issueDescription" class="text-xs text-red-400 mt-2 ml-8">
                Issue: {{ comp.issueDescription }}
              </div>
              <div v-if="comp.propsMissing?.length" class="text-xs text-orange-400 mt-1 ml-8">
                Missing Props: {{ comp.propsMissing.join(', ') }}
              </div>
              <div v-if="comp.slotsMissing?.length" class="text-xs text-orange-400 mt-1 ml-8">
                Missing Slots: {{ comp.slotsMissing.join(', ') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Image Modal -->
      <Modal
        v-model="openAddImageModal"
        title="Add Design Image"
        :show-footer="false"
      >
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block text-sm text-secondary">Upload Image *</label>
            <input 
              type="file" 
              class="block w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-primary-contrast hover:file:bg-brand-secondary cursor-pointer" 
              @change="handleAddDesignImage" 
              accept="image/*" 
              required
            >
            <p v-if="newDesignImagePreview" class="text-xs text-secondary mt-1">{{ newDesignImagePreview }}</p>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              @click="openAddImageModal = false"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button
              @click="submitNewDesignImage"
              :disabled="!newDesignImage || addingDesignImage"
              class="btn-primary"
            >
              {{ addingDesignImage ? 'Adding...' : 'Add Image' }}
            </button>
          </div>
        </div>
      </Modal>

      <!-- Re-analyze Confirmation Modal -->
      <Modal
        v-model="showReanalyzeModal"
        title="Re-analyze Review"
        confirm-text="Re-analyze"
        :show-footer="true"
        @confirm="confirmReanalyze"
      >
        <p class="text-sm text-secondary">
          This will re-run the entire analysis process for this review. All current results will be replaced with new analysis data.
        </p>
        <p class="text-sm text-secondary mt-3">
          Are you sure you want to continue?
        </p>
      </Modal>

      <!-- Delete Confirmation Modal -->
      <Modal
        v-model="showDeleteModal"
        title="Delete Review"
        confirm-text="Delete"
        confirm-button-class="btn-primary bg-red-600 hover:bg-red-700"
        :show-footer="true"
        @confirm="confirmDelete"
      >
        <p class="text-sm text-secondary">
          This action cannot be undone. This will permanently delete the review and all associated data.
        </p>
        <p class="text-sm text-secondary mt-3">
          Are you sure you want to delete <strong class="text-primary">"{{ review?.title }}"</strong>?
        </p>
      </Modal>

      <!-- Expanded Image Modal -->
      <Modal
        v-model="expandedImage"
        title="Design Image"
        :show-footer="false"
        size="large"
      >
        <div class="relative max-h-[80vh] overflow-auto bg-black/20 rounded-lg p-4 flex items-center justify-center">
          <div class="relative inline-block">
            <img 
              v-if="review?.designImages?.[0]"
              :src="review.designImages[0]"
              alt="Design Screenshot"
              class="w-auto h-auto max-w-full max-h-[75vh] rounded-lg block"
            />
            <div v-if="showBoundingBoxes && renderedDimensions.width && renderedDimensions.height" class="absolute inset-0 pointer-events-none">
              <template v-for="(comp, index) in visibleComponentBoxes" :key="index">
                <div 
                  v-if="comp.boundingBox"
                  class="absolute border-2 border-dashed transition-all duration-300"
                  :class="getBoundingBoxClass(comp.hasIssue)"
                  :style="getBoundingBoxStyle(comp.boundingBox)"
                  :title="`${comp.componentName}`"
                >
                  <span 
                    class="absolute -top-5 left-0 px-1 text-[10px] font-mono rounded-sm whitespace-nowrap"
                    :class="getBoundingBoxLabelClass(comp.hasIssue)"
                  >
                    {{ comp.componentName }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi, type Review, type IComponentCheck } from '../composables/useApi';
import { formatDate, getAnalysisPhaseLabel, ANALYSIS_PHASES, getAnalysisPhaseClass } from '../constants';
import Modal from '../components/Modal.vue';
import CustomDropdown, { type DropdownOption } from '../components/CustomDropdown.vue';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  HelpCircle, 
  Clock,
  List,
  Folder,
  Filter
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const { getReview, deleteReview, reAnalyzeReview, updateReview } = useApi();

const reviewId = route.params.id as string;
const projectId = ref<string>('');

const review = ref<Review | null>(null);
const loading = ref(true);
const reAnalyzing = ref(false);
const caseFilter = ref('');
const componentFilter = ref('');
const selectedComponent = ref<string | null>(null);
const showBoundingBoxes = ref(true);
const designImageRef = ref<HTMLImageElement | null>(null);
const imageDimensions = ref({ width: 0, height: 0 });
const renderedDimensions = ref({ width: 0, height: 0 });
const openAddImageModal = ref(false);
const newDesignImage = ref('');
const newDesignImagePreview = ref('');
const addingDesignImage = ref(false);
const showReanalyzeModal = ref(false);
const showDeleteModal = ref(false);
const expandedImage = ref(false);

// Icon components with consistent colors using Lucide
const StatusIconCovered = () => h(CheckCircle, { class: 'text-green-500' });
const StatusIconPartial = () => h(AlertCircle, { class: 'text-orange-500' });
const StatusIconMissing = () => h(XCircle, { class: 'text-red-500' });
const StatusIconUnclear = () => h(HelpCircle, { class: 'text-yellow-500' });
const StatusIconPending = () => h(Clock, { class: 'text-blue-500' });
const StatusIconWarning = () => h(Folder, { class: 'text-orange-500' });
const IconList = () => h(List);
const IconFilter = () => h(Filter);

const caseFilterOptions: DropdownOption[] = [
  { value: '', label: 'All Cases', icon: IconFilter },
  { value: 'covered', label: 'Covered', icon: StatusIconCovered },
  { value: 'partial', label: 'Partial', icon: StatusIconPartial },
  { value: 'missing', label: 'Missing', icon: StatusIconMissing },
  { value: 'unclear', label: 'Unclear', icon: StatusIconUnclear },
  { value: 'pending', label: 'Pending', icon: StatusIconPending },
];

const componentFilterOptions: DropdownOption[] = [
  { value: '', label: 'All', icon: IconFilter },
  { value: 'exists', label: 'Exists', icon: StatusIconCovered },
  { value: 'missing', label: 'Missing', icon: StatusIconMissing },
  { value: 'hasIssue', label: 'Has Issues', icon: StatusIconWarning },
];

const getCaseStatusIcon = (status: string) => {
  switch (status) {
    case 'covered': return StatusIconCovered;
    case 'partial': return StatusIconPartial;
    case 'missing': return StatusIconMissing;
    case 'unclear': return StatusIconUnclear;
    case 'pending': return StatusIconPending;
    default: return null;
  }
};

const getComponentStatusIcon = (comp: IComponentCheck) => {
  if (!comp.exists) return StatusIconMissing;
  if (comp.hasIssue || comp.propsMissing?.length || comp.slotsMissing?.length) return StatusIconWarning;
  return StatusIconCovered;
};

// Calculate bounding box style with pixel-perfect positioning
const getBoundingBoxStyle = (boundingBox: { x: number; y: number; width: number; height: number }) => {
  // Use percentage-based positioning for better scaling
  return {
    left: `${boundingBox.x * 100}%`,
    top: `${boundingBox.y * 100}%`,
    width: `${boundingBox.width * 100}%`,
    height: `${boundingBox.height * 100}%`,
  };
};

const ANALYSIS_PHASES_DISPLAY = [
  { 
    key: 'pending', 
    label: 'Pending',
    description: 'Review queued for analysis'
  },
  { 
    key: 'generating_cases', 
    label: 'Generate Cases',
    description: 'Extracting test cases from design'
  },
  { 
    key: 'checking_cases', 
    label: 'Check Coverage',
    description: 'Validating design coverage'
  },
  { 
    key: 'mapping_components', 
    label: 'Map Components',
    description: 'Matching UI components to library'
  },
  { 
    key: 'completed', 
    label: 'Completed',
    description: 'Analysis finished successfully'
  },
];

const filteredCaseChecks = computed(() => {
  if (!review.value?.caseChecks) return [];
  if (!caseFilter.value) return review.value.caseChecks;
  return review.value.caseChecks.filter(c => c.status === caseFilter.value);
});

const filteredComponentChecks = computed(() => {
  if (!review.value?.componentChecks) return [];
  if (!componentFilter.value) return review.value.componentChecks;
  
  return review.value.componentChecks.filter(c => {
    if (componentFilter.value === 'exists') return c.exists && !c.hasIssue && !c.propsMissing?.length && !c.slotsMissing?.length;
    if (componentFilter.value === 'missing') return !c.exists;
    if (componentFilter.value === 'hasIssue') return c.hasIssue || c.propsMissing?.length || c.slotsMissing?.length;
    return true;
  });
});

// Bounding boxes to display - either all filtered or just the selected component
const visibleComponentBoxes = computed(() => {
  if (!review.value?.componentChecks) return [];
  
  // If a specific component is selected, show only that one
  if (selectedComponent.value) {
    return review.value.componentChecks.filter(c => c.componentName === selectedComponent.value);
  }
  
  // Otherwise show all filtered components
  return filteredComponentChecks.value;
});

const progressPercentage = computed(() => {
  if (!review.value) return 0;
  const currentPhase = review.value.analysisPhase;
  
  // Find current phase index
  const currentIndex = ANALYSIS_PHASES_DISPLAY.findIndex(p => p.key === currentPhase);
  
  if (currentIndex === -1) return 0;
  
  // If completed or failed, show 100%
  if (currentPhase === 'completed' || currentPhase === 'failed') {
    return 100;
  }
  
  // Calculate percentage based on current phase
  const totalPhases = ANALYSIS_PHASES_DISPLAY.length;
  return ((currentIndex + 1) / totalPhases) * 100;
});

const getPhaseIconPath = (phase: string) => {
  switch (phase) {
    case 'pending': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'generating_cases': return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4';
    case 'checking_cases': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'mapping_components': return 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h14a2 2 0 012 2v12a4 4 0 01-4 4h-3M5 11h14M12 3v18';
    case 'completed': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'failed': return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
    default: return '';
  }
};

const getModernPhaseIconClass = (phase: string) => {
  const currentPhase = review.value?.analysisPhase;
  
  if (currentPhase === 'completed' && phase === 'completed') {
    return 'bg-green-600 text-white';
  }
  
  if (currentPhase === 'failed' && phase === 'failed') {
    return 'bg-red-600 text-white';
  }
  
  if (isPhaseCompleted(phase)) {
    return 'bg-brand-primary/20 text-brand-primary';
  }
  
  if (isPhaseActive(phase)) {
    return 'bg-brand-primary text-white';
  }
  
  return 'bg-tertiary text-secondary';
};

const getPhaseTextClass = (phase: string) => {
  if (isPhaseActive(phase) || isPhaseCompleted(phase)) {
    return 'text-primary';
  }
  return 'text-secondary';
};

const isPhaseActive = (phaseKey: string) => {
  if (!review.value) return false;
  // If analysis is completed or failed, no phase should be active
  if (review.value.analysisPhase === 'completed' || review.value.analysisPhase === 'failed') {
    return false;
  }
  const currentPhaseIndex = ANALYSIS_PHASES.findIndex(p => p.key === review.value?.analysisPhase);
  const phaseIndex = ANALYSIS_PHASES.findIndex(p => p.key === phaseKey);
  return phaseIndex === currentPhaseIndex;
};

const isPhaseCompleted = (phaseKey: string) => {
  if (!review.value) return false;
  const currentPhase = review.value.analysisPhase;
  
  // If current phase is completed or failed, all phases before it are completed
  if (currentPhase === 'completed' || currentPhase === 'failed') {
    return true;
  }
  
  const currentPhaseIndex = ANALYSIS_PHASES_DISPLAY.findIndex(p => p.key === currentPhase);
  const phaseIndex = ANALYSIS_PHASES_DISPLAY.findIndex(p => p.key === phaseKey);
  
  return phaseIndex < currentPhaseIndex;
};

const getCheckBgClass = (status: string) => {
  switch (status) {
    case 'covered': return 'hover:bg-green-900/20';
    case 'partial': return 'hover:bg-orange-900/20';
    case 'missing': return 'hover:bg-red-900/20';
    case 'unclear': return 'hover:bg-yellow-900/20';
    case 'pending': return 'hover:bg-blue-900/20';
    default: return 'hover:bg-hover';
  }
};

const getBoundingBoxClass = (hasIssue: boolean) => {
  return hasIssue ? 'border-red-500' : 'border-brand-primary';
};

const getBoundingBoxLabelClass = (hasIssue: boolean) => {
  return hasIssue ? 'bg-red-500 text-white' : 'bg-brand-primary text-primary-contrast';
};

const getComponentBgClass = (comp: IComponentCheck) => {
  const baseClasses = [];
  
  // Selection state - make it very prominent
  if (selectedComponent.value === comp.componentName) {
    baseClasses.push('!bg-brand-primary/30 border-l-4 border-brand-primary shadow-inner');
  } else {
    // Status-based hover colors (only when not selected)
    if (!comp.exists) baseClasses.push('hover:bg-red-900/20');
    else if (comp.hasIssue || comp.propsMissing?.length || comp.slotsMissing?.length) baseClasses.push('hover:bg-orange-900/20');
    else baseClasses.push('hover:bg-green-900/20');
  }
  
  return baseClasses.join(' ');
};

const handleComponentClick = (componentName: string) => {
  // Toggle selection: if already selected, deselect; otherwise select
  if (selectedComponent.value === componentName) {
    selectedComponent.value = null;
  } else {
    selectedComponent.value = componentName;
  }
};

watch(() => review.value?.analysisPhase, (newPhase, oldPhase) => {
  if (newPhase && newPhase !== oldPhase) {
    // Poll for updates if analysis is in progress
    if (['generating_cases', 'checking_cases', 'mapping_components'].includes(newPhase)) {
      startPolling();
    } else {
      stopPolling();
    }
  }
}, { immediate: true });

let pollInterval: ReturnType<typeof setInterval> | null = null;
const POLLING_INTERVAL = 3000; // Poll every 3 seconds

const startPolling = () => {
  if (pollInterval) return;
  pollInterval = setInterval(async () => {
    if (review.value && ['generating_cases', 'checking_cases', 'mapping_components'].includes(review.value.analysisPhase)) {
      await refreshReview();
    } else {
      stopPolling();
    }
  }, POLLING_INTERVAL);
};

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

onMounted(async () => {
  await loadReview();
});

async function loadReview() {
  loading.value = true;
  try {
    const fetchedReview = await getReview(reviewId);
    review.value = fetchedReview;
    projectId.value = fetchedReview.projectId; // Set projectId from fetched review
    // Ensure review.analysisError is defined to avoid template errors
    if (!review.value.analysisError) {
      review.value.analysisError = undefined;
    }
  } catch (err) {
    console.error('Failed to load review:', err);
  } finally {
    loading.value = false;
  }
}

async function refreshReview() {
  // Silent refresh for polling - no loading state
  try {
    const fetchedReview = await getReview(reviewId);
    review.value = fetchedReview;
    if (!review.value.analysisError) {
      review.value.analysisError = undefined;
    }
  } catch (err) {
    console.error('Failed to refresh review:', err);
  }
}

async function confirmReanalyze() {
  if (!review.value) return;
  showReanalyzeModal.value = false;
  reAnalyzing.value = true;
  try {
    const updatedReview = await reAnalyzeReview(reviewId);
    review.value = updatedReview;
    // Start polling to track analysis progress
    startPolling();
  } catch (err) {
    console.error('Failed to re-analyze review:', err);
    alert((err as Error).message || 'Failed to re-analyze review');
  } finally {
    reAnalyzing.value = false;
  }
}

async function confirmDelete() {
  if (!review.value) return;
  showDeleteModal.value = false;

  try {
    await deleteReview(reviewId);
    router.push(`/features/${review.value.projectId}`);
  } catch (err) {
    console.error('Failed to delete review:', err);
    alert((err as Error).message || 'Failed to delete review');
  }
}

function goBack() {
  if (projectId.value?._id) {
    router.push(`/features/${projectId.value?._id}`);
  } else {
    router.push('/features');
  }
}

function onImageLoad() {
  if (designImageRef.value) {
    imageDimensions.value.width = designImageRef.value.naturalWidth;
    imageDimensions.value.height = designImageRef.value.naturalHeight;
    // Get the actual rendered dimensions
    renderedDimensions.value.width = designImageRef.value.width;
    renderedDimensions.value.height = designImageRef.value.height;
  }
}

async function handleAddDesignImage(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      newDesignImage.value = reader.result as string;
      newDesignImagePreview.value = file.name;
    };
    reader.readAsDataURL(file);
  }
}

async function submitNewDesignImage() {
  if (!newDesignImage.value) {
    alert('Please select an image to upload.');
    return;
  }
  if (!review.value) return;

  addingDesignImage.value = true;
  try {
    const updatedReview = await updateReview(review.value._id, {
      designImage: newDesignImage.value,
    });
    review.value = updatedReview;
    openAddImageModal.value = false;
    newDesignImage.value = '';
    newDesignImagePreview.value = '';
  } catch (err) {
    console.error('Failed to add design image:', err);
    alert((err as Error).message || 'Failed to add design image');
  } finally {
    addingDesignImage.value = false;
  }
}
</script>

<style scoped>
@keyframes progress-bar {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-progress-bar {
  animation: progress-bar 1.5s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
