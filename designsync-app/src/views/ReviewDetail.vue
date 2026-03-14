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
        <div class="max-w-4xl mx-auto">
          <div class="relative flex items-center justify-between">
            <!-- Progress Line -->
            <div class="absolute top-5 left-0 right-0 h-0.5 bg-border z-0">
              <div 
                class="h-full bg-brand-primary transition-all duration-500"
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
            
            <!-- Phase Steps -->
            <div 
              v-for="(phase, index) in ANALYSIS_PHASES_DISPLAY"
              :key="phase.key"
              class="flex flex-col items-center relative z-10"
              :class="{ 'flex-1': index !== ANALYSIS_PHASES_DISPLAY.length - 1 }"
            >
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center mb-3 border-2 transition-all duration-300"
                :class="getModernPhaseIconClass(phase.key)"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path :d="getPhaseIconPath(phase.key)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
                </svg>
              </div>
              <span 
                class="text-[11px] font-medium text-center max-w-[80px] transition-colors duration-300"
                :class="getPhaseTextClass(phase.key)"
              >
                {{ phase.label }}
              </span>
              <span 
                v-if="isPhaseActive(phase.key)"
                class="text-[10px] text-brand-primary font-medium mt-1"
              >
                In Progress...
              </span>
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
        <div class="w-1/3 flex flex-col border-r border-border-light bg-tertiary">
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
          <div v-else class="flex-1 overflow-y-auto divide-y divide-border-low">
            <div 
              v-for="c in filteredCaseChecks"
              :key="c.caseName"
              class="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-hover transition-colors"
              :class="getCheckBgClass(c.status)"
            >
              <div class="w-5 h-5 flex-shrink-0" :class="getCheckIconClass(c.status)">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" v-html="getCheckIcon(c.status)"></svg>
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
          <div v-if="!review.designImage" class="p-8 text-center text-secondary text-sm">
            No design image uploaded for this review.
          </div>
          <div v-else class="flex-1 overflow-y-auto p-4 flex items-start justify-center relative">
            <img 
              :src="review.designImage"
              alt="Design Screenshot"
              class="max-w-full h-auto object-contain rounded-lg shadow-lg"
              @load="onImageLoad"
              ref="designImageRef"
            />
            <div v-if="showBoundingBoxes && imageDimensions.width && imageDimensions.height" class="absolute top-4 left-4 right-4 bottom-4 pointer-events-none">
              <template v-for="(comp, index) in filteredComponentChecks" :key="index">
                <div 
                  v-if="comp.boundingBox"
                  class="absolute border-2 border-dashed transition-all duration-300"
                  :class="getBoundingBoxClass(comp.hasIssue)"
                  :style="{
                    left: `${comp.boundingBox.x * 100}%`,
                    top: `${comp.boundingBox.y * 100}%`,
                    width: `${comp.boundingBox.width * 100}%`,
                    height: `${comp.boundingBox.height * 100}%`,
                  }"
                >
                  <span 
                    class="absolute -top-5 left-0 px-1 text-xs font-mono rounded-sm whitespace-nowrap"
                    :class="getBoundingBoxLabelClass(comp.hasIssue)"
                  >
                    {{ comp.componentName }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Right Pane: Component Checks -->
        <div class="w-1/3 flex flex-col bg-tertiary">
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
          <div v-if="!review.componentChecks || review.componentChecks.length === 0" class="p-4 text-secondary text-sm">
            No components mapped yet.
            <span v-if="isPhaseActive('mapping_components')"> Mapping components...</span>
          </div>
          <div v-else class="flex-1 overflow-y-auto divide-y divide-border-low">
            <div 
              v-for="comp in filteredComponentChecks"
              :key="comp.componentName"
              class="px-4 py-3 cursor-pointer hover:bg-hover transition-colors"
              :class="getComponentBgClass(comp)"
            >
              <div class="flex items-center gap-3">
                <div class="w-5 h-5 flex-shrink-0" :class="getComponentIconClass(comp)">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" v-html="getComponentIcon(comp)"></svg>
                </div>
                <span class="text-sm text-primary font-medium flex-1">{{ comp.componentName }}</span>
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
const showBoundingBoxes = ref(true);
const designImageRef = ref<HTMLImageElement | null>(null);
const imageDimensions = ref({ width: 0, height: 0 });
const openAddImageModal = ref(false);
const newDesignImage = ref('');
const newDesignImagePreview = ref('');
const addingDesignImage = ref(false);
const showReanalyzeModal = ref(false);
const showDeleteModal = ref(false);

// Filter options with icons
const CheckCircleIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
]);

const AlertCircleIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
]);

const XCircleIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' })
]);

const QuestionCircleIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
]);

const ClockIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
]);

const ListIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 6h16M4 12h16M4 18h16' })
]);

const caseFilterOptions: DropdownOption[] = [
  { value: '', label: 'All Cases', icon: ListIcon },
  { value: 'covered', label: 'Covered', icon: CheckCircleIcon },
  { value: 'partial', label: 'Partial', icon: AlertCircleIcon },
  { value: 'missing', label: 'Missing', icon: XCircleIcon },
  { value: 'unclear', label: 'Unclear', icon: QuestionCircleIcon },
  { value: 'pending', label: 'Pending', icon: ClockIcon },
];

const componentFilterOptions: DropdownOption[] = [
  { value: '', label: 'All Components', icon: ListIcon },
  { value: 'exists', label: 'Exists', icon: CheckCircleIcon },
  { value: 'missing', label: 'Missing', icon: XCircleIcon },
  { value: 'hasIssue', label: 'Has Issues', icon: AlertCircleIcon },
];

const ANALYSIS_PHASES_DISPLAY = [
  { key: 'pending', label: 'Pending' },
  { key: 'generating_cases', label: 'Generate Cases' },
  { key: 'checking_cases', label: 'Check Coverage' },
  { key: 'mapping_components', label: 'Map Components' },
  { key: 'completed', label: 'Completed' },
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

const progressPercentage = computed(() => {
  if (!review.value) return 0;
  const currentIndex = ANALYSIS_PHASES.findIndex(p => p.key === review.value?.analysisPhase);
  const totalPhases = ANALYSIS_PHASES_DISPLAY.length - 1;
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
  if (isPhaseCompleted(phase)) {
    return 'bg-brand-primary border-brand-primary text-white';
  } else if (isPhaseActive(phase)) {
    return 'bg-brand-primary/20 border-brand-primary text-brand-primary animate-pulse';
  } else {
    return 'bg-tertiary border-border text-secondary';
  }
};

const getPhaseTextClass = (phase: string) => {
  if (isPhaseActive(phase) || isPhaseCompleted(phase)) {
    return 'text-primary';
  }
  return 'text-secondary';
};

const isPhaseActive = (phaseKey: string) => {
  if (!review.value) return false;
  const currentPhaseIndex = ANALYSIS_PHASES.findIndex(p => p.key === review.value?.analysisPhase);
  const phaseIndex = ANALYSIS_PHASES.findIndex(p => p.key === phaseKey);
  return phaseIndex === currentPhaseIndex;
};

const isPhaseCompleted = (phaseKey: string) => {
  if (!review.value) return false;
  const currentPhaseIndex = ANALYSIS_PHASES.findIndex(p => p.key === review.value?.analysisPhase);
  const phaseIndex = ANALYSIS_PHASES.findIndex(p => p.key === phaseKey);
  return phaseIndex < currentPhaseIndex || review.value?.analysisPhase === 'completed';
};

const getCheckIcon = (status: string) => {
  switch (status) {
    case 'covered': return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`;
    case 'partial': return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
    case 'missing': return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />`;
    case 'unclear': return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9.971L11.636 13.379m0 0l-3.35 3.353M12 21.603V12m0 0L7.493 8.358M12 12l3.35-3.35M12 12l3.35 3.35M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
    case 'pending': return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />`;
    default: return '';
  }
};

const getCheckIconClass = (status: string) => {
  switch (status) {
    case 'covered': return 'text-green-500';
    case 'partial': return 'text-orange-500';
    case 'missing': return 'text-red-500';
    case 'unclear': return 'text-yellow-500';
    case 'pending': return 'text-blue-500';
    default: return 'text-secondary';
  }
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

const getComponentIcon = (comp: IComponentCheck) => {
  if (!comp.exists) return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />`; // Missing
  if (comp.hasIssue || comp.propsMissing?.length || comp.slotsMissing?.length) return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856a2 2 0 001.995-1.858L21 7H3m2 0V4a1 1 0 011-1h4a1 1 0 011 1v3m0 0h1l1-1h2l1 1h1M7 7h10" />`; // Warning
  return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`; // OK
};

const getComponentIconClass = (comp: IComponentCheck) => {
  if (!comp.exists) return 'text-red-500';
  if (comp.hasIssue || comp.propsMissing?.length || comp.slotsMissing?.length) return 'text-orange-500';
  return 'text-green-500';
};

const getComponentBgClass = (comp: IComponentCheck) => {
  if (!comp.exists) return 'hover:bg-red-900/20';
  if (comp.hasIssue || comp.propsMissing?.length || comp.slotsMissing?.length) return 'hover:bg-orange-900/20';
  return 'hover:bg-green-900/20';
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
      await loadReview();
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

async function confirmReanalyze() {
  if (!review.value) return;
  showReanalyzeModal.value = false;
  reAnalyzing.value = true;
  try {
    const updatedReview = await reAnalyzeReview(reviewId);
    review.value = updatedReview;
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
  if (projectId.value) {
    router.push(`/features/${projectId.value}`);
  } else {
    router.push('/features');
  }
}

function onImageLoad() {
  if (designImageRef.value) {
    imageDimensions.value.width = designImageRef.value.naturalWidth;
    imageDimensions.value.height = designImageRef.value.naturalHeight;
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
