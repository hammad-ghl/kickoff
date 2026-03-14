<template>
  <div class="h-full flex flex-col bg-primary overflow-auto">
    <div class="max-w-[1100px] w-full mx-auto px-10 pt-10 pb-6 flex flex-col">
      <!-- Loading -->
      <div v-if="loading" class="py-20 flex justify-center">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-primary animate-spin rounded-full" style="border-color: var(--color-border-primary); border-top-color: var(--color-brand-primary);"></div>
          <p class="text-[13px] text-secondary">Loading repository...</p>
        </div>
      </div>

      <!-- Not Found -->
      <div v-else-if="!repository" class="py-20 text-center">
        <p class="text-[14px] text-secondary">Repository not found</p>
        <router-link to="/repositories" class="btn-primary mt-4">Back to Repositories</router-link>
      </div>

      <!-- Content -->
      <template v-else>
        <!-- Header -->
        <div class="mb-8">
          <router-link to="/repositories" class="text-[13px] text-secondary hover:text-white transition-colors mb-3 inline-flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Repositories
          </router-link>
          
          <div class="flex items-start justify-between mt-2">
            <div>
              <h1 class="text-[28px] text-primary font-normal">{{ repository.name }}</h1>
              <div class="flex items-center gap-3 mt-2">
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  <span class="text-[13px] text-secondary">{{ repository.githubRepoFullName }}</span>
                </div>
                <span class="text-secondary">·</span>
                <span :class="statusBadgeClass">{{ statusLabel }}</span>
                <template v-if="repository.indexedAt">
                  <span class="text-secondary">·</span>
                  <span class="text-[13px] text-secondary">Indexed {{ formatRelativeDate(repository.indexedAt) }}</span>
                </template>
              </div>
            </div>
            
            <button 
              v-if="repository.status === 'indexed' || repository.status === 'failed'"
              @click="handleReindex"
              class="btn-secondary"
              :disabled="reindexing"
            >
              <svg v-if="reindexing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Re-index
            </button>
          </div>
        </div>

        <!-- Indexing Progress View -->
        <div v-if="repository.status === 'indexing' || repository.status === 'pending'" class="card p-8">
          <div class="max-w-lg mx-auto text-center">
            <div class="w-12 h-12 border-3 border-primary animate-spin rounded-full mx-auto mb-6" style="border-color: var(--color-border-primary); border-top-color: var(--color-brand-primary);"></div>
            
            <h2 class="text-xl font-medium text-primary mb-2">
              Indexing {{ repository.name }}...
            </h2>
            
            <!-- Progress Bar -->
            <div v-if="repository.indexingProgress?.totalClusters > 0" class="mt-6 mb-4">
              <div class="w-full bg-tertiary rounded-full h-2">
                <div 
                  class="bg-brand-primary h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${progressPercent}%` }"
                ></div>
              </div>
              <p class="text-[12px] text-secondary mt-2">
                {{ repository.indexingProgress?.clustersProcessed || 0 }} / {{ repository.indexingProgress?.totalClusters }} clusters
              </p>
            </div>

            <!-- Steps -->
            <div class="text-left mt-8 space-y-3">
              <div class="flex items-center gap-3">
                <div :class="stepIconClass('connecting')">
                  <svg v-if="isStepComplete('connecting')" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  <div v-else-if="isCurrentStep('connecting')" class="w-3 h-3 border-2 animate-spin rounded-full" style="border-color: var(--color-brand-primary); border-top-color: transparent;"></div>
                </div>
                <span :class="stepTextClass('connecting')">Connected to repository</span>
              </div>
              
              <div class="flex items-center gap-3">
                <div :class="stepIconClass('analyzing_git')">
                  <svg v-if="isStepComplete('analyzing_git')" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  <div v-else-if="isCurrentStep('analyzing_git')" class="w-3 h-3 border-2 animate-spin rounded-full" style="border-color: var(--color-brand-primary); border-top-color: transparent;"></div>
                </div>
                <span :class="stepTextClass('analyzing_git')">Analysing git history</span>
              </div>
              
              <div class="flex items-center gap-3">
                <div :class="stepIconClass('generating_summaries')">
                  <svg v-if="isStepComplete('generating_summaries')" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  <div v-else-if="isCurrentStep('generating_summaries')" class="w-3 h-3 border-2 animate-spin rounded-full" style="border-color: var(--color-brand-primary); border-top-color: transparent;"></div>
                </div>
                <span :class="stepTextClass('generating_summaries')">
                  Generating feature summaries
                  <span v-if="isCurrentStep('generating_summaries') && repository.indexingProgress?.totalClusters" class="text-secondary">
                    ({{ repository.indexingProgress.clustersProcessed }} / ~{{ repository.indexingProgress.totalClusters }} clusters)
                  </span>
                </span>
              </div>
              
              <div class="flex items-center gap-3">
                <div :class="stepIconClass('building_index')">
                  <svg v-if="isStepComplete('building_index')" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  <div v-else-if="isCurrentStep('building_index')" class="w-3 h-3 border-2 animate-spin rounded-full" style="border-color: var(--color-brand-primary); border-top-color: transparent;"></div>
                </div>
                <span :class="stepTextClass('building_index')">Building search index</span>
              </div>
              
              <div class="flex items-center gap-3">
                <div :class="stepIconClass('finalizing')">
                  <svg v-if="isStepComplete('finalizing')" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  <div v-else-if="isCurrentStep('finalizing')" class="w-3 h-3 border-2 animate-spin rounded-full" style="border-color: var(--color-brand-primary); border-top-color: transparent;"></div>
                </div>
                <span :class="stepTextClass('finalizing')">Finalising</span>
              </div>
            </div>

            <p class="text-[13px] text-secondary mt-8">
              This usually takes 5–10 minutes.<br>
              You can leave this page — we'll notify you when it's done.
            </p>
          </div>
        </div>

        <!-- Failed State -->
        <div v-else-if="repository.status === 'failed'" class="card p-8">
          <div class="max-w-lg mx-auto text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style="background-color: var(--color-error-bg);">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--color-error);">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 class="text-xl font-medium text-primary mb-2">Indexing Failed</h2>
            <p class="text-[14px] text-secondary mb-4">{{ repository.errorMessage || 'An unknown error occurred during indexing.' }}</p>
            <button @click="handleReindex" class="btn-primary" :disabled="reindexing">
              Try Again
            </button>
          </div>
        </div>

        <!-- Indexed State: Show Feature Clusters -->
        <template v-else-if="repository.status === 'indexed'">
          <!-- Stats -->
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="card p-4">
              <p class="text-[11px] font-medium text-secondary uppercase tracking-wider mb-1">Feature Clusters</p>
              <p class="text-2xl font-medium text-primary">{{ repository.featureCount || 0 }}</p>
            </div>
            <div class="card p-4">
              <p class="text-[11px] font-medium text-secondary uppercase tracking-wider mb-1">Branch</p>
              <p class="text-lg text-primary">{{ repository.githubBranch }}</p>
            </div>
            <div class="card p-4">
              <p class="text-[11px] font-medium text-secondary uppercase tracking-wider mb-1">Last Indexed</p>
              <p class="text-lg text-primary">{{ formatRelativeDate(repository.indexedAt) }}</p>
            </div>
          </div>

          <!-- Clusters Section -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-[13px] font-medium text-primary uppercase tracking-wider">Indexed Features</h3>
                <p class="text-[12px] text-secondary mt-1">
                  These feature clusters were automatically discovered from git co-change patterns and summarised by AI.
                </p>
              </div>
              
              <!-- Search -->
              <div class="relative w-64">
                <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  v-model="searchQuery"
                  type="text"
                  class="input w-full pl-9 py-1.5 text-[13px]"
                  placeholder="Search features..."
                >
              </div>
            </div>

            <!-- Clusters List -->
            <div v-if="loadingClusters" class="py-8 flex justify-center">
              <div class="w-6 h-6 border-2 animate-spin rounded-full" style="border-color: var(--color-border-primary); border-top-color: var(--color-brand-primary);"></div>
            </div>
            
            <div v-else-if="clusters.length === 0" class="py-8 text-center">
              <p class="text-[14px] text-secondary">No feature clusters found</p>
            </div>
            
            <div v-else class="space-y-3">
              <div 
                v-for="cluster in clusters" 
                :key="cluster._id" 
                class="p-4 border border-border rounded-lg hover:bg-hover transition-colors cursor-pointer"
                @click="toggleCluster(cluster._id)"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <h4 class="text-[14px] font-medium text-primary">{{ cluster.name }}</h4>
                    <p class="text-[13px] text-secondary mt-1 line-clamp-2">{{ cluster.summary }}</p>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <span class="chip chip-secondary text-[11px]">{{ cluster.filePaths.length }} files</span>
                    <svg 
                      class="w-4 h-4 text-secondary transition-transform"
                      :class="{ 'rotate-180': expandedClusters.has(cluster._id) }"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <!-- Expanded Content -->
                <div v-if="expandedClusters.has(cluster._id)" class="mt-4 pt-4 border-t border-border">
                  <div class="grid grid-cols-2 gap-4">
                    <div v-if="cluster.userFlows?.length">
                      <p class="text-[11px] font-medium text-secondary uppercase tracking-wider mb-2">User Flows</p>
                      <ul class="space-y-1">
                        <li v-for="flow in cluster.userFlows" :key="flow" class="text-[12px] text-primary">• {{ flow }}</li>
                      </ul>
                    </div>
                    <div v-if="cluster.constraints?.length">
                      <p class="text-[11px] font-medium text-secondary uppercase tracking-wider mb-2">Constraints</p>
                      <ul class="space-y-1">
                        <li v-for="c in cluster.constraints" :key="c" class="text-[12px] text-primary">• {{ c }}</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div class="mt-4">
                    <p class="text-[11px] font-medium text-secondary uppercase tracking-wider mb-2">Files</p>
                    <div class="flex flex-wrap gap-1.5">
                      <span 
                        v-for="file in cluster.filePaths.slice(0, 10)" 
                        :key="file" 
                        class="px-2 py-1 bg-tertiary rounded text-[11px] text-secondary font-mono"
                      >
                        {{ file.split('/').pop() }}
                      </span>
                      <span v-if="cluster.filePaths.length > 10" class="px-2 py-1 text-[11px] text-secondary">
                        +{{ cluster.filePaths.length - 10 }} more
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Load More -->
              <div v-if="hasMoreClusters" class="text-center pt-4">
                <button @click="loadMoreClusters" class="btn-secondary text-[13px]">
                  Load More
                </button>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useApi, type Repository, type RepoFeatureCluster } from '../composables/useApi';
import { formatRelativeDate } from '../constants';

const route = useRoute();
const { getRepository, getRepositoryClusters, reindexRepository } = useApi();

const repository = ref<Repository | null>(null);
const clusters = ref<RepoFeatureCluster[]>([]);
const loading = ref(true);
const loadingClusters = ref(false);
const reindexing = ref(false);
const searchQuery = ref('');
const expandedClusters = ref(new Set<string>());
const clusterOffset = ref(0);
const totalClusters = ref(0);

let pollInterval: number | null = null;

const progressPercent = computed(() => {
  if (!repository.value?.indexingProgress?.totalClusters) return 0;
  return Math.round((repository.value.indexingProgress.clustersProcessed / repository.value.indexingProgress.totalClusters) * 100);
});

const statusLabel = computed(() => {
  switch (repository.value?.status) {
    case 'pending': return 'Pending';
    case 'indexing': return 'Indexing';
    case 'indexed': return 'Indexed';
    case 'failed': return 'Failed';
    default: return 'Unknown';
  }
});

const statusBadgeClass = computed(() => {
  const base = 'text-[12px] px-2 py-0.5 rounded-full';
  switch (repository.value?.status) {
    case 'indexed': return `${base} bg-success-bg text-success`;
    case 'indexing': return `${base} bg-info-bg text-info`;
    case 'failed': return `${base} bg-error-bg text-error`;
    default: return `${base} bg-tertiary text-secondary`;
  }
});

const hasMoreClusters = computed(() => clusters.value.length < totalClusters.value);

const indexingSteps = ['connecting', 'analyzing_git', 'generating_summaries', 'building_index', 'finalizing'];

function isCurrentStep(step: string): boolean {
  return repository.value?.indexingProgress?.currentStep === step;
}

function isStepComplete(step: string): boolean {
  const currentStep = repository.value?.indexingProgress?.currentStep;
  if (!currentStep) return false;
  const currentIndex = indexingSteps.indexOf(currentStep);
  const stepIndex = indexingSteps.indexOf(step);
  return stepIndex < currentIndex;
}

function stepIconClass(step: string): string {
  const base = 'w-6 h-6 rounded-full flex items-center justify-center';
  if (isStepComplete(step)) {
    return `${base} bg-success-bg text-success`;
  } else if (isCurrentStep(step)) {
    return `${base} bg-brand-active-bg`;
  }
  return `${base} bg-tertiary`;
}

function stepTextClass(step: string): string {
  if (isStepComplete(step) || isCurrentStep(step)) {
    return 'text-[14px] text-primary';
  }
  return 'text-[14px] text-secondary';
}

onMounted(async () => {
  await loadRepository();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});

function startPolling() {
  pollInterval = window.setInterval(async () => {
    if (repository.value?.status === 'indexing' || repository.value?.status === 'pending') {
      await loadRepository(false);
    }
  }, 3000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

async function loadRepository(showLoading = true) {
  if (showLoading) loading.value = true;
  try {
    repository.value = await getRepository(route.params.id as string);
    
    if (repository.value?.status === 'indexed') {
      await loadClusters();
    }
  } catch (error) {
    console.error('Failed to load repository:', error);
  } finally {
    loading.value = false;
  }
}

async function loadClusters() {
  loadingClusters.value = true;
  try {
    const result = await getRepositoryClusters(route.params.id as string, searchQuery.value);
    clusters.value = result.clusters;
    totalClusters.value = result.total;
    clusterOffset.value = result.clusters.length;
  } catch (error) {
    console.error('Failed to load clusters:', error);
  } finally {
    loadingClusters.value = false;
  }
}

async function loadMoreClusters() {
  try {
    const result = await getRepositoryClusters(route.params.id as string, searchQuery.value);
    clusters.value.push(...result.clusters);
    clusterOffset.value += result.clusters.length;
  } catch (error) {
    console.error('Failed to load more clusters:', error);
  }
}

function toggleCluster(id: string) {
  if (expandedClusters.value.has(id)) {
    expandedClusters.value.delete(id);
  } else {
    expandedClusters.value.add(id);
  }
}

async function handleReindex() {
  reindexing.value = true;
  try {
    await reindexRepository(route.params.id as string);
    await loadRepository();
  } catch (error: any) {
    alert(error.message || 'Failed to start re-indexing');
  } finally {
    reindexing.value = false;
  }
}

let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    clusterOffset.value = 0;
    loadClusters();
  }, 300);
});
</script>
