<template>
  <div class="h-full flex flex-col bg-primary overflow-auto">
    <div class="max-w-[1100px] w-full mx-auto px-10 pt-10 pb-6 flex flex-col">
      <!-- Header -->
      <div class="mb-8">
        <router-link to="/repositories" class="text-[13px] text-secondary hover:text-white transition-colors mb-3 inline-flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Repositories
        </router-link>
        <h1 class="text-[28px] text-primary font-normal mt-2">Add Repository</h1>
        <p class="text-[14px] text-secondary mt-2">Connect a GitHub repository to enable codebase-aware PRD review</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Repository Info -->
        <div class="card p-6 space-y-5">
          <h3 class="text-[13px] font-medium text-primary uppercase tracking-wider">Repository Info</h3>
          
          <div class="space-y-2">
            <label class="block text-[13px] font-medium text-primary">Repository Name *</label>
            <input
              v-model="form.name"
              type="text"
              class="input w-full"
              placeholder="e.g., Social Planner"
              required
            >
          </div>

          <div class="space-y-2">
            <label class="block text-[13px] font-medium text-primary">Description</label>
            <textarea
              v-model="form.description"
              class="input w-full resize-none"
              rows="3"
              placeholder="Optional description..."
            ></textarea>
          </div>
        </div>

        <!-- GitHub Auth -->
        <div class="card p-6 space-y-4">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            <h3 class="text-[13px] font-medium text-primary uppercase tracking-wider">GitHub Connection</h3>
          </div>

          <div v-if="!isAuthenticated" class="text-center py-8">
            <p class="text-[14px] text-secondary mb-5">Sign in with GitHub to access your repositories</p>
            <button
              type="button"
              @click="handleGitHubLogin"
              class="btn-primary"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Sign in with GitHub
            </button>
          </div>

          <div v-else class="space-y-5">
            <div class="flex items-center justify-between px-4 py-3 bg-primary border border-white/20 rounded-2xl">
              <div class="flex items-center gap-3">
                <img :src="user?.avatar_url" class="w-7 h-7 rounded-full" :alt="user?.login">
                <span class="text-[14px] font-medium text-primary">{{ user?.login }}</span>
              </div>
              <button
                type="button"
                @click="handleLogout"
                class="text-[13px] text-secondary hover:text-white transition-colors"
              >
                Disconnect
              </button>
            </div>

            <!-- Repository Selection -->
            <div class="space-y-2">
              <label class="block text-[13px] font-medium text-primary">Select Repository *</label>
              <div class="relative">
                <input
                  v-model="repoSearch"
                  type="text"
                  class="input w-full"
                  placeholder="Search repositories..."
                  @focus="handleRepoFocus"
                >
                <div
                  v-if="showRepoDropdown"
                  class="absolute z-50 top-full left-0 right-0 mt-1 bg-primary border border-white/20 rounded-2xl max-h-60 overflow-y-auto shadow-xl"
                >
                  <div v-if="loadingRepos" class="px-4 py-6 text-center bg-primary rounded-lg overflow-hidden">
                    <div class="w-5 h-5 border-2 animate-spin rounded-full mx-auto mb-2" style="border-color: var(--color-border-primary); border-top-color: var(--color-brand-primary);"></div>
                    <p class="text-[13px] text-secondary">Loading repositories...</p>
                  </div>
                  <div v-else-if="filteredRepos.length === 0" class="px-4 py-6 text-center text-[13px] text-secondary">
                    No repositories found
                  </div>
                  <button
                    v-else
                    v-for="repo in filteredRepos"
                    :key="repo.id"
                    type="button"
                    @click="selectRepo(repo)"
                    class="w-full text-left px-4 py-2.5 hover:bg-hover transition-colors border-b border-border last:border-b-0"
                    :class="{ 'bg-brand-active-bg': form.repo?.id === repo.id }"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-[14px] font-medium text-primary">{{ repo.fullName }}</span>
                      <span v-if="repo.private" class="text-[12px] text-secondary">🔒</span>
                    </div>
                    <p v-if="repo.description" class="text-[12px] text-secondary truncate mt-0.5">{{ repo.description }}</p>
                  </button>
                </div>
              </div>
              <div v-if="form.repo" class="flex items-center gap-2 px-4 py-2.5 bg-brand-active-bg border border-brand-primary rounded-lg text-[14px]">
                <span class="text-primary">{{ form.repo.fullName }}</span>
                <button type="button" @click="clearRepo" class="ml-auto text-secondary hover:text-white">✕</button>
              </div>
            </div>

            <!-- Branch -->
            <div v-if="form.repo" class="space-y-2">
              <label class="block text-[13px] font-medium text-primary">Branch *</label>
              <div class="relative">
                <input
                  v-model="branchSearch"
                  type="text"
                  class="input w-full"
                  :placeholder="form.branch || 'main'"
                  @focus="showBranchDropdown = true"
                  @input="handleBranchSearch"
                >
                <div
                  v-if="showBranchDropdown && branches.length > 0"
                  class="absolute z-50 top-full left-0 right-0 mt-1 bg-primary border border-white/20 rounded-2xl max-h-40 overflow-y-auto shadow-xl"
                >
                  <button
                    v-for="branch in branches"
                    :key="branch"
                    type="button"
                    @click="selectBranch(branch)"
                    class="w-full text-left px-4 py-2 text-[14px] hover:bg-hover transition-colors border-b border-border last:border-b-0"
                    :class="{ 'bg-brand-active-bg': form.branch === branch }"
                  >
                    {{ branch }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Info Box -->
        <div class="card p-4 bg-info-bg border-info-border">
          <div class="flex gap-3">
            <svg class="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-[13px] text-primary font-medium mb-1">About Repository Indexing</p>
              <p class="text-[12px] text-secondary">
                After connecting, we'll analyze your repository's git history to discover feature clusters. 
                This typically takes 5-10 minutes. You can leave the page and return later.
              </p>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="flex items-center justify-end gap-3">
          <router-link 
            to="/repositories"
            class="btn-secondary"
          >
            Cancel
          </router-link>
          <button
            type="submit"
            class="btn-primary"
            :disabled="submitting || !canSubmit"
          >
            <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ submitting ? 'Creating...' : 'Create & Index Repository' }}
          </button>
        </div>

        <p v-if="error" class="text-[14px] mt-2" style="color: var(--color-error);">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '../composables/useApi';
import { useGitHubAuth, type GitHubRepo } from '../composables/useGitHubAuth';

const router = useRouter();
const { createRepository } = useApi();
const {
  user,
  isAuthenticated,
  checkSession,
  initiateLogin,
  logout,
  getRepos,
  getBranches,
} = useGitHubAuth();

const submitting = ref(false);
const error = ref('');

const repos = ref<GitHubRepo[]>([]);
const branches = ref<string[]>([]);

const repoSearch = ref('');
const branchSearch = ref('');

const showRepoDropdown = ref(false);
const showBranchDropdown = ref(false);

const loadingRepos = ref(false);

const form = ref<{
  name: string;
  description: string;
  repo: GitHubRepo | null;
  branch: string;
}>({
  name: '',
  description: '',
  repo: null,
  branch: '',
});

const filteredRepos = computed(() => {
  if (!repoSearch.value) return repos.value.slice(0, 20);
  const search = repoSearch.value.toLowerCase();
  return repos.value.filter(repo =>
    repo.fullName.toLowerCase().includes(search)
  ).slice(0, 20);
});

const canSubmit = computed(() => {
  return form.value.name && form.value.repo && isAuthenticated.value;
});

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  await checkSession();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function handleClickOutside(e: Event) {
  const target = e.target as HTMLElement;
  if (!target.closest('.relative')) {
    showRepoDropdown.value = false;
    showBranchDropdown.value = false;
  }
}

async function handleGitHubLogin() {
  localStorage.setItem('auth_return_to', '/repositories/new');
  await initiateLogin();
}

function handleLogout() {
  logout();
  repos.value = [];
  form.value.repo = null;
}

async function loadRepos() {
  if (repos.value.length > 0) return;
  
  loadingRepos.value = true;
  try {
    repos.value = await getRepos();
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    loadingRepos.value = false;
  }
}

async function handleRepoFocus() {
  showRepoDropdown.value = true;
  if (repos.value.length === 0 && !loadingRepos.value) {
    await loadRepos();
  }
}

function selectRepo(repo: GitHubRepo) {
  form.value.repo = repo;
  form.value.branch = repo.defaultBranch;
  form.value.name = repo.name;
  repoSearch.value = repo.fullName;
  showRepoDropdown.value = false;
  loadBranches();
}

function clearRepo() {
  form.value.repo = null;
  form.value.branch = '';
  repoSearch.value = '';
  branches.value = [];
}

async function loadBranches() {
  if (!form.value.repo) return;
  const [owner, repo] = form.value.repo.fullName.split('/');
  
  try {
    branches.value = await getBranches(owner, repo);
  } catch (err) {
    console.error('Failed to load branches:', err);
  }
}

let branchSearchTimeout: ReturnType<typeof setTimeout>;
function handleBranchSearch() {
  clearTimeout(branchSearchTimeout);
  branchSearchTimeout = setTimeout(async () => {
    if (!form.value.repo) return;
    const [owner, repo] = form.value.repo.fullName.split('/');
    try {
      branches.value = await getBranches(owner, repo, branchSearch.value);
    } catch (err) {
      console.error('Failed to search branches:', err);
    }
  }, 300);
}

function selectBranch(branch: string) {
  form.value.branch = branch;
  branchSearch.value = branch;
  showBranchDropdown.value = false;
}

async function handleSubmit() {
  if (!form.value.repo) return;

  submitting.value = true;
  error.value = '';

  try {
    const repository = await createRepository({
      name: form.value.name,
      description: form.value.description || undefined,
      githubRepoFullName: form.value.repo.fullName,
      githubBranch: form.value.branch || form.value.repo.defaultBranch,
    });

    router.push(`/repositories/${repository._id}`);
  } catch (err) {
    error.value = (err as Error).message || 'Failed to create repository';
  } finally {
    submitting.value = false;
  }
}
</script>
