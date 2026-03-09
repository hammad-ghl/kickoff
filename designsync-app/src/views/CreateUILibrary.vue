<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <router-link to="/ui-libraries" class="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block">
        ← Back to UI Libraries
      </router-link>
      <h2 class="text-2xl font-bold">Add UI Library</h2>
      <p class="text-sm text-muted-foreground mt-1">Connect a GitHub repository containing your UI components</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- GitHub Auth -->
      <div class="p-5 bg-card border border-border space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">GitHub Connection</h3>
        </div>

        <div v-if="!isAuthenticated" class="text-center py-6">
          <p class="text-sm text-muted-foreground mb-4">Sign in with GitHub to access your repositories</p>
          <button
            type="button"
            @click="handleGitHubLogin"
            class="inline-flex items-center gap-2 px-4 py-2 bg-[#24292f] text-white text-sm font-medium hover:bg-[#24292f]/90 transition-colors border border-border"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Sign in with GitHub
          </button>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-background border border-border">
            <div class="flex items-center gap-2">
              <img :src="user?.avatar_url" class="w-6 h-6 rounded-full" :alt="user?.login">
              <span class="text-sm font-medium">{{ user?.login }}</span>
            </div>
            <button
              type="button"
              @click="handleLogout"
              class="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Disconnect
            </button>
          </div>

          <!-- Repository Selection -->
          <div class="space-y-2">
            <label class="block text-sm font-medium">Select Repository *</label>
            <div class="relative">
              <input
                v-model="repoSearch"
                type="text"
                class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground"
                placeholder="Search repositories..."
                @focus="handleRepoFocus"
              >
              <div
                v-if="showRepoDropdown"
                class="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border max-h-60 overflow-y-auto shadow-lg"
              >
                <div v-if="loadingRepos" class="px-3 py-4 text-center">
                  <div class="w-5 h-5 border-2 border-border border-t-foreground animate-spin mx-auto mb-2"></div>
                  <p class="text-xs text-muted-foreground">Loading repositories...</p>
                </div>
                <div v-else-if="filteredRepos.length === 0" class="px-3 py-4 text-center text-xs text-muted-foreground">
                  No repositories found
                </div>
                <button
                  v-else
                  v-for="repo in filteredRepos"
                  :key="repo.id"
                  type="button"
                  @click="selectRepo(repo)"
                  class="w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors"
                  :class="{ 'bg-primary/10': form.repo?.id === repo.id }"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{{ repo.fullName }}</span>
                    <span v-if="repo.private" class="text-xs text-muted-foreground">🔒</span>
                  </div>
                  <p v-if="repo.description" class="text-xs text-muted-foreground truncate">{{ repo.description }}</p>
                </button>
              </div>
            </div>
            <div v-if="form.repo" class="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 text-sm">
              <span>{{ form.repo.fullName }}</span>
              <button type="button" @click="clearRepo" class="ml-auto text-muted-foreground hover:text-foreground">✕</button>
            </div>
          </div>

          <!-- Branch -->
          <div v-if="form.repo" class="space-y-2">
            <label class="block text-sm font-medium">Branch</label>
            <div class="relative">
              <input
                v-model="branchSearch"
                type="text"
                class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground"
                :placeholder="form.branch || 'main'"
                @focus="showBranchDropdown = true"
                @input="handleBranchSearch"
              >
              <div
                v-if="showBranchDropdown && branches.length > 0"
                class="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border max-h-40 overflow-y-auto shadow-lg"
              >
                <button
                  v-for="branch in branches"
                  :key="branch"
                  type="button"
                  @click="selectBranch(branch)"
                  class="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                  :class="{ 'bg-primary/10': form.branch === branch }"
                >
                  {{ branch }}
                </button>
              </div>
            </div>
          </div>

          <!-- Component Path -->
          <div v-if="form.repo" class="space-y-2">
            <label class="block text-sm font-medium">Component Path</label>
            <div class="relative">
              <input
                v-model="pathSearch"
                type="text"
                class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground"
                placeholder="src/components"
                @focus="showPathDropdown = true"
              >
              <div
                v-if="showPathDropdown && directories.length > 0"
                class="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border max-h-40 overflow-y-auto shadow-lg"
              >
                <button
                  v-for="dir in filteredDirectories"
                  :key="dir"
                  type="button"
                  @click="selectPath(dir)"
                  class="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                >
                  {{ dir }}
                </button>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">Leave empty to scan entire repository</p>
          </div>
        </div>
      </div>

      <!-- Library Info -->
      <div class="p-5 bg-card border border-border space-y-4">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-foreground/60">Library Info</h3>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium">Library Name *</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground transition-colors"
            placeholder="My Design System"
            required
          >
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium">Description</label>
          <textarea
            v-model="form.description"
            class="w-full px-3 py-2 bg-background border border-border text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
            rows="2"
            placeholder="Optional description..."
          ></textarea>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="flex-1 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border"
          :disabled="submitting || !canSubmit"
        >
          {{ submitting ? 'Creating & Indexing...' : 'Create & Index Library' }}
        </button>
        <router-link 
          to="/ui-libraries"
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '../composables/useApi';
import { useGitHubAuth, type GitHubRepo } from '../composables/useGitHubAuth';

const router = useRouter();
const { createUILibrary } = useApi();
const {
  user,
  isAuthenticated,
  checkSession,
  initiateLogin,
  logout,
  getRepos,
  getBranches,
  getDirectories,
} = useGitHubAuth();

const submitting = ref(false);
const error = ref('');

const repos = ref<GitHubRepo[]>([]);
const branches = ref<string[]>([]);
const directories = ref<string[]>([]);

const repoSearch = ref('');
const branchSearch = ref('');
const pathSearch = ref('');

const showRepoDropdown = ref(false);
const showBranchDropdown = ref(false);
const showPathDropdown = ref(false);

const loadingRepos = ref(false);
const loadingBranches = ref(false);
const loadingDirectories = ref(false);

const form = ref<{
  name: string;
  description: string;
  repo: GitHubRepo | null;
  branch: string;
  componentPath: string;
}>({
  name: '',
  description: '',
  repo: null,
  branch: '',
  componentPath: '',
});

const filteredRepos = computed(() => {
  if (!repoSearch.value) return repos.value.slice(0, 20);
  const search = repoSearch.value.toLowerCase();
  return repos.value.filter(repo =>
    repo.fullName.toLowerCase().includes(search)
  ).slice(0, 20);
});

const filteredDirectories = computed(() => {
  if (!pathSearch.value) return directories.value.slice(0, 20);
  const search = pathSearch.value.toLowerCase();
  return directories.value.filter(dir =>
    dir.toLowerCase().includes(search)
  ).slice(0, 20);
});

const canSubmit = computed(() => {
  return form.value.name && form.value.repo && isAuthenticated.value;
});

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  await checkSession();
  // Don't pre-load repos - they'll load on focus
});

function handleClickOutside(e: Event) {
  const target = e.target as HTMLElement;
  if (!target.closest('.relative')) {
    showRepoDropdown.value = false;
    showBranchDropdown.value = false;
    showPathDropdown.value = false;
  }
}

async function handleGitHubLogin() {
  localStorage.setItem('auth_return_to', '/ui-libraries/new');
  await initiateLogin();
}

function handleLogout() {
  logout();
  repos.value = [];
  form.value.repo = null;
}

async function loadRepos() {
  if (repos.value.length > 0) return; // Already loaded
  
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
  loadBranchesAndDirs();
}

function clearRepo() {
  form.value.repo = null;
  form.value.branch = '';
  form.value.componentPath = '';
  repoSearch.value = '';
  branches.value = [];
  directories.value = [];
}

async function loadBranchesAndDirs() {
  if (!form.value.repo) return;
  const [owner, repo] = form.value.repo.fullName.split('/');
  
  loadingBranches.value = true;
  loadingDirectories.value = true;
  
  try {
    const [branchesData, dirsData] = await Promise.all([
      getBranches(owner, repo),
      getDirectories(owner, repo, form.value.branch || 'main')
    ]);
    branches.value = branchesData;
    directories.value = dirsData;
  } catch (err) {
    console.error('Failed to load branches/directories:', err);
  } finally {
    loadingBranches.value = false;
    loadingDirectories.value = false;
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
  loadDirectories();
}

async function loadDirectories() {
  if (!form.value.repo) return;
  const [owner, repo] = form.value.repo.fullName.split('/');
  
  loadingDirectories.value = true;
  try {
    directories.value = await getDirectories(owner, repo, form.value.branch || 'main');
  } catch (err) {
    console.error('Failed to load directories:', err);
  } finally {
    loadingDirectories.value = false;
  }
}

function selectPath(path: string) {
  form.value.componentPath = path;
  pathSearch.value = path;
  showPathDropdown.value = false;
}

async function handleSubmit() {
  if (!form.value.repo) return;

  submitting.value = true;
  error.value = '';

  try {
    const [owner, repo] = form.value.repo.fullName.split('/');
    
    const library = await createUILibrary({
      name: form.value.name,
      description: form.value.description || undefined,
      source: {
        type: 'github',
        owner,
        repo,
        branch: form.value.branch || form.value.repo.defaultBranch,
        componentPath: form.value.componentPath || undefined,
        fullName: form.value.repo.fullName,
      },
    });

    router.push(`/ui-libraries/${library._id}`);
  } catch (err) {
    error.value = (err as Error).message || 'Failed to create library';
  } finally {
    submitting.value = false;
  }
}
</script>
