<template>
  <div class="max-w-4xl mx-auto">
    <!-- Navigation -->
    <div class="flex items-center gap-4 mb-8">
      <button 
        class="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        @click="$emit('back')"
      >
        ← Back
      </button>
      <h2 class="text-xl font-bold">Create New Report</h2>
    </div>

    <!-- Report Name -->
    <div class="mb-8 p-6 bg-card border border-border rounded-lg">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-foreground/10 rounded-lg flex items-center justify-center text-lg border border-border">📝</div>
        <div>
          <h3 class="text-sm font-semibold">Report Name</h3>
          <p class="text-xs text-muted-foreground">Give this analysis a name</p>
        </div>
      </div>
      <div>
        <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
          Report Name
        </label>
        <input 
          type="text" 
          v-model="config.reportName" 
          placeholder="e.g. Dashboard Redesign Q1 2026"
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        />
        <p class="mt-1.5 text-xs text-muted-foreground">This helps you identify the report later</p>
      </div>
    </div>

    <!-- Figma & Library -->
    <div class="grid md:grid-cols-2 gap-4 mb-4">
      <!-- Figma -->
      <div class="p-6 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center text-lg border border-pink-500/20">🎨</div>
          <div>
            <h3 class="text-sm font-semibold">Figma File</h3>
            <p class="text-xs text-muted-foreground font-mono">Design source</p>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
              Figma File URL
            </label>
            <input 
              type="url" 
              v-model="config.figmaUrl" 
              placeholder="https://www.figma.com/file/ABC123/My-Design"
              class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
              Figma API Token
            </label>
            <input 
              type="password" 
              v-model="config.figmaToken" 
              placeholder="figd_xxxxxxxxxxxxxxxx"
              class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />
            <p class="mt-1.5 text-xs text-muted-foreground">
              Get from <a href="https://www.figma.com/settings" target="_blank" class="text-primary hover:underline">figma.com/settings</a>
            </p>
          </div>

          <!-- Optional fields -->
          <div class="pt-2">
            <button 
              class="text-xs font-mono text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary px-3 py-1.5 rounded transition-colors w-full text-left"
              @click="showFigmaOptional = !showFigmaOptional"
            >
              {{ showFigmaOptional ? '−' : '+' }} Scope options
            </button>
            <div v-if="showFigmaOptional" class="mt-3 space-y-3 p-3 bg-secondary border border-border rounded-md">
              <div>
                <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
                  Page Name (optional)
                </label>
                <input 
                  type="text" 
                  v-model="config.figmaPage" 
                  placeholder="e.g. Dashboard, Settings"
                  class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
                  Frame Name (optional)
                </label>
                <input 
                  type="text" 
                  v-model="config.figmaFrame" 
                  placeholder="e.g. Modal flows"
                  class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Component Library -->
      <div class="p-6 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-lg border border-green-500/20">📦</div>
          <div>
            <h3 class="text-sm font-semibold">Component Library</h3>
            <p class="text-xs text-muted-foreground font-mono">UI kit source</p>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
              GitHub Repo URL
            </label>
            <input 
              type="url" 
              v-model="config.libRepo" 
              placeholder="https://github.com/org/ui-library"
              class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
              GitHub Token (optional)
            </label>
            <input 
              type="password" 
              v-model="config.libToken" 
              placeholder="ghp_xxxxxxxxxxxxxxxx"
              class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />
            <p class="mt-1.5 text-xs text-muted-foreground">
              For private repos only
            </p>
          </div>

          <!-- Optional fields -->
          <div class="pt-2">
            <button 
              class="text-xs font-mono text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary px-3 py-1.5 rounded transition-colors w-full text-left"
              @click="showLibOptional = !showLibOptional"
            >
              {{ showLibOptional ? '−' : '+' }} Path & branch options
            </button>
            <div v-if="showLibOptional" class="mt-3 space-y-3 p-3 bg-secondary border border-border rounded-md">
              <div>
                <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
                  Components Path (optional)
                </label>
                <input 
                  type="text" 
                  v-model="config.libPath" 
                  placeholder="src/components"
                  class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
                  Branch (optional)
                </label>
                <input 
                  type="text" 
                  v-model="config.libBranch" 
                  placeholder="main"
                  class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Codebase -->
    <div class="p-6 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors mb-8">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-lg border border-blue-500/20">💻</div>
        <div>
          <h3 class="text-sm font-semibold">Your App Codebase</h3>
          <p class="text-xs text-muted-foreground font-mono">Where components are used</p>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-3 mb-3">
        <div>
          <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
            GitHub Repo URL
          </label>
          <input 
            type="url" 
            v-model="config.codeRepo" 
            placeholder="https://github.com/org/my-app"
            class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
            GitHub Token (optional)
          </label>
          <input 
            type="password" 
            v-model="config.codeToken" 
            placeholder="ghp_xxx (or same as above)"
            class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
          />
        </div>
        <div>
          <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
            Feature Path (optional)
          </label>
          <input 
            type="text" 
            v-model="config.codePath" 
            placeholder="src/views/dashboard"
            class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label class="block text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
            Branch (optional)
          </label>
          <input 
            type="text" 
            v-model="config.codeBranch" 
            placeholder="main"
            class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <!-- Name mappings -->
      <div class="pt-2">
        <button 
          class="text-xs font-mono text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary px-3 py-1.5 rounded transition-colors w-full text-left"
          @click="showNameMap = !showNameMap"
        >
          {{ showNameMap ? '−' : '+' }} Component name mappings
        </button>
        <div v-if="showNameMap" class="mt-3 p-3 bg-secondary border border-border rounded-md">
          <p class="text-xs text-muted-foreground mb-2">
            Format: <code class="px-1 py-0.5 bg-background rounded">FigmaName=CodeName</code>, one per line
          </p>
          <textarea 
            v-model="config.nameMappings" 
            placeholder="Modal=BaseModal&#10;Button=AppButton&#10;Card=UiCard"
            class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono resize-y min-h-[80px]"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="flex items-center gap-3">
      <button 
        class="px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        @click="handleAnalyze"
        :disabled="isAnalyzing"
      >
        <span>⚡</span>
        <span>Run Analysis</span>
      </button>
      <p class="text-xs font-mono text-muted-foreground">
        Configuration will be saved to MongoDB
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export interface AnalysisConfig {
  reportName: string;
  figmaUrl: string;
  figmaToken: string;
  figmaPage: string;
  figmaFrame: string;
  libRepo: string;
  libToken: string;
  libPath: string;
  libBranch: string;
  codeRepo: string;
  codeToken: string;
  codePath: string;
  codeBranch: string;
  nameMappings: string;
}

interface Props {
  isAnalyzing: boolean;
  showReset: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  analyze: [];
  reset: [];
  back: [];
}>();

const config = defineModel<AnalysisConfig>('config', { required: true });

const showFigmaOptional = ref(false);
const showLibOptional = ref(false);
const showNameMap = ref(false);

function handleAnalyze() {
  emit('analyze');
}
</script>
