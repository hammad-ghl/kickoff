<template>
  <div class="h-[calc(100vh-80px)]">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-20">
      <div class="w-12 h-12 border-4 border-border border-t-foreground animate-spin mx-auto mb-4 rounded-full"></div>
      <p class="text-sm text-muted-foreground">Loading review...</p>
    </div>

    <!-- Not Found -->
    <div v-else-if="!review" class="text-center py-20">
      <div class="text-6xl mb-4">?</div>
      <p class="text-base text-muted-foreground mb-6">Review not found</p>
      <router-link to="/projects" class="text-primary hover:underline">Go back to projects</router-link>
    </div>

    <!-- Review Content -->
    <div v-else class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex-shrink-0 pb-4 border-b border-border mb-4">
        <router-link :to="`/projects/${projectId}`" class="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block">
          ← Back to Project
        </router-link>
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-bold">{{ review.title }}</h2>
            <p v-if="review.description" class="text-sm text-muted-foreground mt-1">{{ review.description }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span 
              class="px-3 py-1 text-xs font-mono uppercase"
              :class="getPhaseStatusClass(review.analysisPhase)"
            >
              {{ review.analysisPhase }}
            </span>
            <button
              v-if="review.designImages?.length > 0 && !isAnalyzing"
              @click="startAnalysis"
              class="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              Re-analyze
            </button>
          </div>
        </div>
      </div>

      <!-- Analysis Progress Banner -->
      <div v-if="isAnalyzing" class="flex-shrink-0 mb-4 p-4 border border-border bg-card">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <p class="text-sm font-medium mb-2">Analysis in progress...</p>
            <div class="flex items-center gap-6 text-xs">
              <div class="flex items-center gap-2">
                <span 
                  class="w-5 h-5 flex items-center justify-center rounded-full text-xs"
                  :class="[getPhaseClass('generating_cases'), { 'animate-pulse-step': review.analysisPhase === 'generating_cases' }]"
                >
                  {{ getPhaseIcon('generating_cases') }}
                </span>
                <span :class="review.analysisPhase === 'generating_cases' ? 'text-foreground font-medium' : 'text-muted-foreground'">
                  Generating cases
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span 
                  class="w-5 h-5 flex items-center justify-center rounded-full text-xs"
                  :class="[getPhaseClass('checking_cases'), { 'animate-pulse-step': review.analysisPhase === 'checking_cases' }]"
                >
                  {{ getPhaseIcon('checking_cases') }}
                </span>
                <span :class="review.analysisPhase === 'checking_cases' ? 'text-foreground font-medium' : 'text-muted-foreground'">
                  Checking coverage
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span 
                  class="w-5 h-5 flex items-center justify-center rounded-full text-xs"
                  :class="[getPhaseClass('mapping_components'), { 'animate-pulse-step': review.analysisPhase === 'mapping_components' }]"
                >
                  {{ getPhaseIcon('mapping_components') }}
                </span>
                <span :class="review.analysisPhase === 'mapping_components' ? 'text-foreground font-medium' : 'text-muted-foreground'">
                  Mapping components
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span 
                  class="w-5 h-5 flex items-center justify-center rounded-full text-xs"
                  :class="getPhaseClass('completed')"
                >
                  {{ getPhaseIcon('completed') }}
                </span>
                <span :class="review.analysisPhase === 'completed' ? 'text-foreground font-medium' : 'text-muted-foreground'">
                  Complete
                </span>
              </div>
            </div>
          </div>
          <div class="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
        </div>
      </div>

      <!-- Error Banner -->
      <div v-if="review.analysisPhase === 'failed' && review.analysisError" class="flex-shrink-0 mb-4 p-4 border border-red-500/30 bg-red-500/10 text-red-500">
        <p class="text-sm font-medium">Analysis failed</p>
        <p class="text-xs mt-1">{{ review.analysisError }}</p>
      </div>

      <!-- Main Content: 3 columns -->
      <div class="flex-1 flex gap-4 min-h-0">
        <!-- Left: Design Images -->
        <div class="w-1/3 flex flex-col border border-border bg-card overflow-hidden">
          <div class="p-3 border-b border-border flex-shrink-0 flex items-center justify-between">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">Design</h3>
            <div class="flex items-center gap-2">
              <span v-if="review.designImages?.length" class="text-xs text-muted-foreground">
                {{ review.designImages.length }} image{{ review.designImages.length > 1 ? 's' : '' }}
              </span>
              <label class="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 cursor-pointer transition-colors">
                + Add
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  class="hidden" 
                  @change="handleAddImages"
                >
              </label>
            </div>
          </div>
          <div class="flex-1 overflow-auto p-2">
            <div v-if="review.designImages?.length > 0" class="space-y-2">
              <img 
                v-for="(img, idx) in review.designImages" 
                :key="idx" 
                :src="img" 
                class="w-full cursor-pointer hover:opacity-90 transition-opacity"
                :alt="`Design ${idx + 1}`"
                @click="selectedImageIndex = idx"
              >
            </div>
            <div v-else class="h-full flex items-center justify-center text-muted-foreground">
              <label class="text-center cursor-pointer hover:text-foreground transition-colors">
                <div class="text-4xl mb-2">🖼️</div>
                <p class="text-sm">Click to add design images</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  class="hidden" 
                  @change="handleAddImages"
                >
              </label>
            </div>
          </div>
        </div>

        <!-- Middle: Case Coverage -->
        <div class="w-1/3 flex flex-col border border-border bg-card overflow-hidden relative">
          <div class="p-3 border-b border-border flex-shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">Case Coverage</h3>
              <span class="text-xs text-muted-foreground">
                {{ filteredCaseChecks.length }}/{{ totalCasesCount }}
              </span>
            </div>
            <!-- Filter Tabs (only show when coverage check is done) -->
            <div v-if="review.caseChecks.length > 0 && !hasPendingCases" class="flex gap-1">
              <button
                @click="caseFilter = 'all'"
                class="px-2 py-1 text-xs transition-colors"
                :class="caseFilter === 'all' ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'"
              >
                All
              </button>
              <button
                @click="caseFilter = 'covered'"
                class="px-2 py-1 text-xs transition-colors flex items-center gap-1"
                :class="caseFilter === 'covered' ? 'bg-green-500/20 text-green-500' : 'text-muted-foreground hover:text-foreground'"
              >
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                {{ caseCounts.covered }}
              </button>
              <button
                @click="caseFilter = 'partial'"
                class="px-2 py-1 text-xs transition-colors flex items-center gap-1"
                :class="caseFilter === 'partial' ? 'bg-yellow-500/20 text-yellow-500' : 'text-muted-foreground hover:text-foreground'"
              >
                <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
                {{ caseCounts.partial }}
              </button>
              <button
                @click="caseFilter = 'missing'"
                class="px-2 py-1 text-xs transition-colors flex items-center gap-1"
                :class="caseFilter === 'missing' ? 'bg-red-500/20 text-red-500' : 'text-muted-foreground hover:text-foreground'"
              >
                <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                {{ caseCounts.missing }}
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto">
            <!-- Show loading spinner while generating cases -->
            <div v-if="review.caseChecks.length === 0 && review.analysisPhase === 'generating_cases'" class="text-center py-8 text-sm text-muted-foreground">
              <div class="flex flex-col items-center justify-center gap-2">
                <div class="w-6 h-6 border-2 border-muted-foreground/30 border-t-primary animate-spin rounded-full"></div>
                <span>Generating test cases from design...</span>
              </div>
            </div>

            <!-- No cases yet - show analyze button -->
            <div v-else-if="review.caseChecks.length === 0 && !isAnalyzing" class="text-center py-8 text-sm text-muted-foreground">
              <p class="mb-2">No case checks yet.</p>
              <button
                v-if="review.designImages?.length > 0"
                @click="startAnalysis"
                class="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Analyze Design
              </button>
            </div>

            <div v-else-if="review.caseChecks.length > 0" class="divide-y divide-border">
              <div 
                v-for="check in filteredCaseChecks" 
                :key="check.caseName"
                class="p-3"
                :class="getCheckBgClass(check.status)"
              >
                <div class="flex items-start gap-2 mb-1">
                  <span 
                    class="w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs"
                    :class="getCheckIconClass(check.status)"
                  >
                    {{ getCheckIcon(check.status) }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-medium">{{ check.caseName }}</span>
                    <span 
                      class="ml-2 px-1.5 py-0.5 text-[10px] uppercase"
                      :class="getStatusBadgeClass(check.status)"
                    >
                      {{ check.status === 'pending' ? 'checking...' : check.status }}
                    </span>
                  </div>
                </div>
                <p v-if="check.designEvidence" class="text-xs text-muted-foreground mt-1 ml-7">
                  {{ check.designEvidence }}
                </p>
                <p v-if="check.notes" class="text-xs text-yellow-600 mt-1 ml-7">
                  {{ check.notes }}
                </p>
              </div>
              <div v-if="filteredCaseChecks.length === 0" class="p-4 text-center text-xs text-muted-foreground">
                No {{ caseFilter }} cases
              </div>
            </div>
          </div>

          <!-- Loading overlay when checking coverage -->
          <div 
            v-if="review.analysisPhase === 'checking_cases' && review.caseChecks.length > 0"
            class="absolute inset-0 bg-card/70 backdrop-blur-[1px] flex items-center justify-center z-10"
          >
            <div class="text-center p-4 bg-card border border-border shadow-lg">
              <div class="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-2"></div>
              <span class="text-sm text-foreground font-medium">Checking coverage...</span>
              <p class="text-xs text-muted-foreground mt-1">Analyzing {{ review.caseChecks.length }} cases</p>
            </div>
          </div>
        </div>

        <!-- Right: Component Checks -->
        <div class="w-1/3 flex flex-col border border-border bg-card overflow-hidden relative">
          <div class="p-3 border-b border-border flex-shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">Components</h3>
              <span class="text-xs text-muted-foreground">
                {{ filteredComponentChecks.length }}/{{ review.componentChecks.length }}
              </span>
            </div>
            <!-- Filter Tabs -->
            <div v-if="review.componentChecks.length > 0" class="flex gap-1">
              <button
                @click="componentFilter = 'all'"
                class="px-2 py-1 text-xs transition-colors"
                :class="componentFilter === 'all' ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'"
              >
                All
              </button>
              <button
                @click="componentFilter = 'ok'"
                class="px-2 py-1 text-xs transition-colors flex items-center gap-1"
                :class="componentFilter === 'ok' ? 'bg-green-500/20 text-green-500' : 'text-muted-foreground hover:text-foreground'"
              >
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                {{ componentCounts.ok }}
              </button>
              <button
                @click="componentFilter = 'partial'"
                class="px-2 py-1 text-xs transition-colors flex items-center gap-1"
                :class="componentFilter === 'partial' ? 'bg-yellow-500/20 text-yellow-500' : 'text-muted-foreground hover:text-foreground'"
              >
                <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
                {{ componentCounts.partial }}
              </button>
              <button
                @click="componentFilter = 'issue'"
                class="px-2 py-1 text-xs transition-colors flex items-center gap-1"
                :class="componentFilter === 'issue' ? 'bg-red-500/20 text-red-500' : 'text-muted-foreground hover:text-foreground'"
              >
                <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                {{ componentCounts.issue }}
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div v-if="review.componentChecks.length === 0 && review.analysisPhase === 'mapping_components'" class="text-center py-8 text-sm text-muted-foreground">
              <div class="flex flex-col items-center justify-center gap-2">
                <div class="w-6 h-6 border-2 border-muted-foreground/30 border-t-primary animate-spin rounded-full"></div>
                <span>Mapping components...</span>
              </div>
            </div>

            <div v-else-if="review.componentChecks.length === 0 && !isAnalyzing" class="text-center py-8 text-sm text-muted-foreground">
              <p>Component analysis will appear after AI analysis.</p>
            </div>

            <div v-else class="divide-y divide-border">
              <div 
                v-for="check in filteredComponentChecks" 
                :key="check.componentName"
                class="p-3"
                :class="getComponentBgClass(check)"
              >
                <div class="flex items-start gap-2 mb-1">
                  <span 
                    class="w-5 h-5 flex items-center justify-center border flex-shrink-0 text-xs"
                    :class="getComponentIconClass(check)"
                  >
                    {{ getComponentIcon(check) }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-medium">{{ check.componentName }}</span>
                    <span v-if="!check.exists" class="ml-2 text-xs text-red-500">(not in library)</span>
                    <span v-else-if="hasMissingParts(check)" class="ml-2 text-xs text-yellow-500">(partial match)</span>
                  </div>
                </div>
                <p v-if="check.hasIssue && check.issueDescription" class="text-xs text-red-600 mt-1 ml-7">
                  {{ check.issueDescription }}
                </p>
                <div v-if="check.propsMissing?.length" class="mt-1 ml-7 text-xs text-yellow-600">
                  Missing props: {{ check.propsMissing.join(', ') }}
                </div>
                <div v-if="check.slotsMissing?.length" class="mt-1 ml-7 text-xs text-yellow-600">
                  Missing slots: {{ check.slotsMissing.join(', ') }}
                </div>
              </div>
              <div v-if="filteredComponentChecks.length === 0" class="p-4 text-center text-xs text-muted-foreground">
                No {{ componentFilter === 'ok' ? 'fully matched' : componentFilter === 'partial' ? 'partial match' : componentFilter === 'issue' ? 'issue' : '' }} components
              </div>
            </div>
          </div>

          <!-- Loading overlay when mapping components -->
          <div 
            v-if="review.analysisPhase === 'mapping_components'"
            class="absolute inset-0 bg-card/70 backdrop-blur-[1px] flex items-center justify-center z-10"
          >
            <div class="text-center p-4 bg-card border border-border shadow-lg">
              <div class="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-2"></div>
              <span class="text-sm text-foreground font-medium">Mapping components...</span>
              <p class="text-xs text-muted-foreground mt-1">Analyzing design against library</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer: Summary & Actions -->
      <div class="flex-shrink-0 pt-4 mt-4 border-t border-border flex items-center justify-between">
        <div class="flex gap-6 text-sm">
          <div>
            <span class="text-muted-foreground">Cases: </span>
            <span class="font-medium">{{ coveredCount }}/{{ totalCasesCount }}</span>
            <span class="text-muted-foreground ml-1">({{ coveragePercent }}%)</span>
          </div>
          <div>
            <span class="text-muted-foreground">Components: </span>
            <span class="font-medium">{{ review.componentChecks.length }}</span>
            <span v-if="issueCount > 0" class="text-red-500 ml-1">({{ issueCount }} issues)</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="deleteCurrentReview"
            class="px-4 py-2 bg-red-500/10 text-red-500 text-sm hover:bg-red-500/20 border border-red-500/20"
          >
            Delete Review
          </button>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div
      v-if="selectedImageIndex !== null && review?.designImages"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      @click="selectedImageIndex = null"
    >
      <img 
        :src="review.designImages[selectedImageIndex]" 
        class="max-w-full max-h-full object-contain"
        @click.stop
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi, type Review, type AnalysisPhase, type CaseCheck } from '../composables/useApi';

const route = useRoute();
const router = useRouter();
const { getReview, deleteReview, analyzeReview, updateReview } = useApi();

const review = ref<Review | null>(null);
const loading = ref(true);
const selectedImageIndex = ref<number | null>(null);
const caseFilter = ref<'all' | 'covered' | 'partial' | 'missing'>('all');
const componentFilter = ref<'all' | 'ok' | 'partial' | 'issue'>('all');
let pollingInterval: ReturnType<typeof setInterval> | null = null;

const projectId = computed(() => {
  if (!review.value) return '';
  if (typeof review.value.projectId === 'string') return review.value.projectId;
  return review.value.projectId._id;
});

const issueCount = computed(() => {
  return review.value?.componentChecks.filter(c => c.hasIssue).length || 0;
});

const coveredCount = computed(() => {
  return review.value?.caseChecks.filter(c => c.status === 'covered').length || 0;
});

const totalCasesCount = computed(() => {
  return review.value?.caseChecks.length || 0;
});

const coveragePercent = computed(() => {
  if (totalCasesCount.value === 0) return 0;
  return Math.round((coveredCount.value / totalCasesCount.value) * 100);
});

const isAnalyzing = computed(() => {
  const phase = review.value?.analysisPhase;
  return phase === 'generating_cases' || phase === 'checking_cases' || phase === 'mapping_components';
});

const hasPendingCases = computed(() => {
  return review.value?.caseChecks.some(c => c.status === 'pending') || false;
});

const caseCounts = computed(() => {
  const checks = review.value?.caseChecks || [];
  return {
    covered: checks.filter(c => c.status === 'covered').length,
    partial: checks.filter(c => c.status === 'partial').length,
    missing: checks.filter(c => c.status === 'missing').length,
  };
});

const filteredCaseChecks = computed(() => {
  const checks = review.value?.caseChecks || [];
  if (caseFilter.value === 'all') return checks;
  return checks.filter(c => c.status === caseFilter.value);
});

const componentCounts = computed(() => {
  const checks = review.value?.componentChecks || [];
  return {
    ok: checks.filter(c => c.exists && !c.hasIssue && !hasMissingParts(c)).length,
    partial: checks.filter(c => c.exists && hasMissingParts(c) && !c.hasIssue).length,
    issue: checks.filter(c => !c.exists || c.hasIssue).length,
  };
});

const filteredComponentChecks = computed(() => {
  const checks = review.value?.componentChecks || [];
  if (componentFilter.value === 'all') return checks;
  if (componentFilter.value === 'ok') return checks.filter(c => c.exists && !c.hasIssue && !hasMissingParts(c));
  if (componentFilter.value === 'partial') return checks.filter(c => c.exists && hasMissingParts(c) && !c.hasIssue);
  if (componentFilter.value === 'issue') return checks.filter(c => !c.exists || c.hasIssue);
  return checks;
});

const phaseOrder: AnalysisPhase[] = ['pending', 'generating_cases', 'checking_cases', 'mapping_components', 'completed'];

function getPhaseStatusClass(phase: AnalysisPhase): string {
  switch (phase) {
    case 'pending': return 'bg-yellow-500/10 text-yellow-500';
    case 'generating_cases':
    case 'checking_cases':
    case 'mapping_components': return 'bg-blue-500/10 text-blue-500';
    case 'completed': return 'bg-green-500/10 text-green-500';
    case 'failed': return 'bg-red-500/10 text-red-500';
    default: return 'bg-secondary text-secondary-foreground';
  }
}

function getPhaseClass(phase: AnalysisPhase): string {
  const currentPhase = review.value?.analysisPhase || 'pending';
  const currentIdx = phaseOrder.indexOf(currentPhase);
  const phaseIdx = phaseOrder.indexOf(phase);

  if (currentPhase === 'failed') {
    return 'bg-red-500/20 text-red-500';
  }
  
  if (phaseIdx < currentIdx || currentPhase === 'completed') {
    return 'bg-green-500/20 text-green-500';
  }
  if (phaseIdx === currentIdx) {
    return 'bg-primary/20 text-primary';
  }
  return 'bg-muted text-muted-foreground';
}

function getPhaseIcon(phase: AnalysisPhase): string {
  const currentPhase = review.value?.analysisPhase || 'pending';
  const currentIdx = phaseOrder.indexOf(currentPhase);
  const phaseIdx = phaseOrder.indexOf(phase);

  if (currentPhase === 'failed') {
    return '!';
  }

  if (phaseIdx < currentIdx || currentPhase === 'completed') {
    return '✓';
  }
  if (phaseIdx === currentIdx) {
    return '●';
  }
  return '○';
}

function getCheckBgClass(status: CaseCheck['status']): string {
  switch (status) {
    case 'covered': return 'bg-green-500/5';
    case 'partial': return 'bg-yellow-500/5';
    case 'missing': return 'bg-red-500/5';
    case 'pending': return 'bg-muted/30';
    default: return '';
  }
}

function getCheckIconClass(status: CaseCheck['status']): string {
  switch (status) {
    case 'covered': return 'text-green-500';
    case 'partial': return 'text-yellow-500';
    case 'missing': return 'text-red-500';
    case 'pending': return 'text-muted-foreground animate-pulse';
    default: return 'text-muted-foreground';
  }
}

function getCheckIcon(status: CaseCheck['status']): string {
  switch (status) {
    case 'covered': return '✓';
    case 'partial': return '◐';
    case 'missing': return '✕';
    case 'pending': return '○';
    default: return '?';
  }
}

function getStatusBadgeClass(status: CaseCheck['status']): string {
  switch (status) {
    case 'covered': return 'bg-green-500/10 text-green-500';
    case 'partial': return 'bg-yellow-500/10 text-yellow-500';
    case 'missing': return 'bg-red-500/10 text-red-500';
    case 'pending': return 'bg-muted text-muted-foreground animate-pulse';
    default: return 'bg-secondary text-muted-foreground';
  }
}

function hasMissingParts(check: any): boolean {
  return (check.propsMissing?.length > 0 || check.slotsMissing?.length > 0) && check.exists;
}

function getComponentBgClass(check: any): string {
  if (!check.exists || check.hasIssue) return 'bg-red-500/5';
  if (hasMissingParts(check)) return 'bg-yellow-500/5';
  return 'bg-green-500/5';
}

function getComponentIconClass(check: any): string {
  if (!check.exists || check.hasIssue) return 'border-red-500 bg-red-500/10 text-red-500';
  if (hasMissingParts(check)) return 'border-yellow-500 bg-yellow-500/10 text-yellow-500';
  return 'border-green-500 bg-green-500/10 text-green-500';
}

function getComponentIcon(check: any): string {
  if (!check.exists || check.hasIssue) return '!';
  if (hasMissingParts(check)) return '⚠';
  return '✓';
}

onMounted(async () => {
  await loadReview();
  if (isAnalyzing.value) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});

function startPolling() {
  if (pollingInterval) return;
  pollingInterval = setInterval(async () => {
    await loadReview();
    if (!isAnalyzing.value) {
      stopPolling();
    }
  }, 2000);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

async function loadReview() {
  const wasLoading = loading.value;
  if (wasLoading) loading.value = true;
  try {
    review.value = await getReview(route.params.id as string);
  } catch (error) {
    console.error('Failed to load review:', error);
  } finally {
    if (wasLoading) loading.value = false;
  }
}

async function startAnalysis() {
  if (!review.value || !review.value.designImages?.length) return;
  
  try {
    await analyzeReview(review.value._id);
    review.value.analysisPhase = 'generating_cases';
    startPolling();
  } catch (error) {
    console.error('Failed to start analysis:', error);
  }
}

async function deleteCurrentReview() {
  if (!review.value) return;
  if (!confirm('Are you sure you want to delete this review?')) return;

  try {
    await deleteReview(review.value._id);
    router.push(`/projects/${projectId.value}`);
  } catch (error) {
    console.error('Failed to delete review:', error);
  }
}

async function handleAddImages(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length || !review.value) return;

  const newImages: string[] = [];
  
  for (const file of Array.from(input.files)) {
    const base64 = await fileToBase64(file);
    newImages.push(base64);
  }

  try {
    const existingImages = review.value.designImages || [];
    const updatedImages = [...existingImages, ...newImages];
    
    await updateReview(review.value._id, { designImages: updatedImages });
    review.value.designImages = updatedImages;
  } catch (error) {
    console.error('Failed to add images:', error);
    alert('Failed to add images');
  }

  input.value = '';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
</script>

<style scoped>
@keyframes pulse-step {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 hsl(var(--primary) / 0.4);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
    box-shadow: 0 0 0 6px hsl(var(--primary) / 0);
  }
}

.animate-pulse-step {
  animation: pulse-step 1.5s ease-in-out infinite;
}
</style>
