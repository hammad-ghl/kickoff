<template>
  <div class="h-full flex flex-col bg-primary overflow-hidden">
    <!-- Page Header -->
    <div class="flex items-center justify-between px-6 py-4 flex-shrink-0">
      <div class="flex items-center gap-3">
        <router-link :to="backRoute" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hover transition-colors text-secondary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
          </svg>
        </router-link>
        <h1 class="text-[18px] text-primary font-medium text-xl">{{ isEditMode ? 'Edit Feature' : 'Create Feature' }}</h1>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <router-link :to="backRoute" class="btn-secondary">Cancel</router-link>
        <button @click="handleSubmit" :disabled="submitting" class="btn-primary">
          {{ submitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Feature') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-border border-t-brand-primary animate-spin rounded-full mx-auto mb-4"></div>
        <p class="text-sm text-secondary">Loading feature...</p>
      </div>
    </div>

    <!-- Two Pane Layout -->
    <div v-else class="flex-1 flex flex-col overflow-y-auto">
      <div class="flex-1 flex">
        <!-- Left Pane: Feature Info & UI Libraries -->
        <div class="w-[480px] flex-shrink-0 overflow-y-auto">
          <div class="p-6 space-y-6">
            <!-- Feature Info Card -->
            <div class="card p-5 space-y-4">
              <h3 class="text-[12px] font-medium text-secondary uppercase tracking-wider">Feature Info</h3>
              
              <div class="space-y-2">
                <label class="block text-[14px] text-primary">Feature Name *</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="input"
                  placeholder="e.g., Social Post Scheduler"
                  required
                >
              </div>

              <div class="space-y-2">
                <label class="block text-[14px] text-primary">Description</label>
                <textarea
                  v-model="form.description"
                  class="input resize-none"
                  rows="3"
                  placeholder="Briefly describe this feature"
                ></textarea>
              </div>

              <div class="space-y-2">
                <label class="block text-[14px] text-primary">Status</label>
                <StatusDropdown
                  :current-status="form.status || 'draft'"
                  @change="(newStatus) => form.status = newStatus"
                />
              </div>
            </div>

            <!-- UI Libraries Card -->
            <div class="card p-5 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-[12px] font-medium text-secondary uppercase tracking-wider">UI Libraries</h3>
                <router-link to="/ui-libraries/new" class="text-[13px] text-brand-primary hover:underline">+ Add New</router-link>
              </div>
              
              <div v-if="availableUILibraries.length === 0 && !loadingUILibs" class="text-center py-4 text-secondary">
                <p class="text-sm mb-2">No UI libraries available.</p>
                <router-link to="/ui-libraries/new" class="text-[13px] text-brand-primary hover:underline">Add your first UI Library</router-link>
              </div>
              <div v-else-if="loadingUILibs" class="py-4 text-center text-secondary">
                Loading UI Libraries...
              </div>
              <div v-else class="space-y-2">
                <div 
                  v-for="lib in availableUILibraries" 
                  :key="lib._id"
                  class="flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors"
                  :class="(form.uiLibraryIds || []).includes(lib._id) ? 'bg-brand-active-bg border border-brand-primary' : 'hover:bg-hover'"
                  @click="toggleUILibrary(lib._id)"
                >
                  <input 
                    type="checkbox" 
                    :id="`ui-lib-${lib._id}`" 
                    :value="lib._id" 
                    v-model="form.uiLibraryIds"
                    class="w-4 h-4 text-brand-primary bg-background border-border rounded focus:ring-brand-primary"
                  >
                  <label :for="`ui-lib-${lib._id}`" class="flex-1 text-primary text-sm cursor-pointer">
                    {{ lib.name }}
                    <p class="text-xs text-secondary">{{ lib.componentCount || 0 }} components</p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Pane: PRD Editor -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="flex-1 flex flex-col p-6 overflow-hidden ">
            <div class="card flex-1 flex flex-col overflow-hidden border border-border">
              <div class="p-5 border-b border-border flex-shrink-0">
                <h3 class="text-[12px] font-medium text-secondary uppercase tracking-wider">Product Requirements Document (PRD)</h3>
                <p class="text-xs text-secondary mt-1">
                  Providing a PRD helps the AI understand your feature requirements and generate test cases.
                </p>
              </div>
              
              <!-- TipTap Editor -->
              <div class="flex-1 flex flex-col overflow-hidden ">
                <div v-if="editor" class="border-b border-border flex-shrink-0 px-4 py-2 flex items-center gap-1 bg-tertiary">
                  <button
                    @click="editor.chain().focus().toggleBold().run()"
                    :class="{ 'bg-hover': editor.isActive('bold') }"
                    class="p-2 rounded hover:bg-hover transition-colors text-secondary"
                    title="Bold"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                    </svg>
                  </button>
                  <button
                    @click="editor.chain().focus().toggleItalic().run()"
                    :class="{ 'bg-hover': editor.isActive('italic') }"
                    class="p-2 rounded hover:bg-hover transition-colors text-secondary"
                    title="Italic"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4h4M14 20h4M9 20l4-16" />
                    </svg>
                  </button>
                  <div class="w-px h-6 bg-border mx-1"></div>
                  <button
                    @click="editor.chain().focus().toggleBulletList().run()"
                    :class="{ 'bg-hover': editor.isActive('bulletList') }"
                    class="p-2 rounded hover:bg-hover transition-colors text-secondary"
                    title="Bullet List"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    @click="editor.chain().focus().toggleOrderedList().run()"
                    :class="{ 'bg-hover': editor.isActive('orderedList') }"
                    class="p-2 rounded hover:bg-hover transition-colors text-secondary"
                    title="Numbered List"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h2v2H3V4zm0 6h2v2H3v-2zm0 6h2v2H3v-2zM8 5h13M8 11h13M8 17h13" />
                    </svg>
                  </button>
                  <div class="w-px h-6 bg-border mx-1"></div>
                  <button
                    @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                    :class="{ 'bg-hover': editor.isActive('heading', { level: 2 }) }"
                    class="p-2 rounded hover:bg-hover transition-colors text-secondary"
                    title="Heading"
                  >
                    <span class="text-sm font-semibold">H2</span>
                  </button>
                  <button
                    @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
                    :class="{ 'bg-hover': editor.isActive('heading', { level: 3 }) }"
                    class="p-2 rounded hover:bg-hover transition-colors text-secondary"
                    title="Subheading"
                  >
                    <span class="text-sm font-semibold">H3</span>
                  </button>
                </div>
                
                <div class="flex-1 overflow-y-auto">
                  <editor-content :editor="editor" class="tiptap-editor" />
                </div>
              </div>

              <div class="p-4 border-t border-border flex-shrink-0">
                <div class="flex items-center gap-2">
                  <input type="checkbox" id="generate-cases-from-prd" v-model="generateCasesFromPrd" class="w-4 h-4 text-brand-primary bg-background border-border rounded focus:ring-brand-primary">
                  <label for="generate-cases-from-prd" class="text-sm text-primary">Generate test cases from PRD</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expected Test Cases - Full Width Below (Only in Edit Mode) -->
      <div v-if="isEditMode" class="flex-shrink-0 bg-tertiary">
        <div class="px-6 py-4">
          <h3 class="text-3xl font-medium text-primary mb-4 ml-4 mt-10">Generated Cases</h3>

          <div class="card p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-[12px] font-medium text-secondary uppercase tracking-wider">Expected Test Cases ({{ form.expectedCases?.length || 0 }})</h3>
              <button type="button" @click="addCase" class="text-[13px] text-brand-primary hover:underline">+ Add Case</button>
            </div>
            
            <div v-if="!form.expectedCases?.length" class="text-sm text-secondary text-center py-4">
              No expected cases defined. Add some to guide the AI analysis.
            </div>

            <div v-else class="grid grid-cols-2 gap-3">
              <div v-for="(testCase, index) in form.expectedCases" :key="index" class="flex items-center gap-3">
                <input
                  v-model="testCase.name"
                  type="text"
                  class="input flex-1"
                  placeholder="Test Case Description"
                >
                <button type="button" @click="removeCase(index)" class="btn-icon">
                  <svg class="w-4 h-4 text-secondary hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Messages (if any) -->
      <div v-if="error || success" class="px-6 py-3 border-t border-border flex-shrink-0">
        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
        <div v-if="success" class="text-green-500 text-sm">{{ success }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useApi, type Project, type UILibrary } from '../composables/useApi';
import { type FeatureStatus } from '../constants';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import StatusDropdown from './StatusDropdown.vue';

const props = defineProps<{
  projectId?: string;
  mode: 'create' | 'edit';
}>();

const router = useRouter();
const { createProject, updateProject, getProject, getAllUILibraries, generateProjectCases } = useApi();

const isEditMode = computed(() => props.mode === 'edit');
const backRoute = computed(() => isEditMode.value ? `/features/${props.projectId}` : '/features');

const form = ref<Partial<Project>>({
  name: '',
  description: '',
  status: 'draft',
  uiLibraryIds: [],
  prdText: '',
  expectedCases: [],
  casesGeneratedFrom: null,
});

const availableUILibraries = ref<UILibrary[]>([]);
const loading = ref(isEditMode.value);
const loadingUILibs = ref(true);
const submitting = ref(false);
const error = ref('');
const success = ref('');
const generateCasesFromPrd = ref(false);

// TipTap Editor
const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Start writing your Product Requirements Document here...\n\nYou can use:\n• Bold and italic formatting\n• Bullet and numbered lists\n• Headings\n\nThis content will be used by AI to generate test cases.',
    }),
  ],
  content: '',
  editorProps: {
    attributes: {
      class: 'prose prose-invert max-w-none p-6 focus:outline-none',
    },
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    form.value.prdText = html;
  },
});

onMounted(async () => {
  if (isEditMode.value && props.projectId) {
    await loadProject();
  }
  await loadUILibraries();
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

async function loadProject() {
  loading.value = true;
  try {
    const project = await getProject(props.projectId!);
    form.value = {
      name: project.name,
      description: project.description || '',
      status: project.status,
      uiLibraryIds: project.uiLibraryIds.map(lib => (typeof lib === 'string' ? lib : lib._id)),
      prdText: project.prdText || '',
      expectedCases: project.expectedCases || [],
      casesGeneratedFrom: project.casesGeneratedFrom,
    };
    generateCasesFromPrd.value = project.casesGeneratedFrom === 'prd';
    
    // Set editor content after loading
    if (editor.value && project.prdText) {
      editor.value.commands.setContent(project.prdText);
    }
  } catch (err) {
    console.error('Failed to load project:', err);
    error.value = (err as Error).message || 'Failed to load project';
  } finally {
    loading.value = false;
  }
}

async function loadUILibraries() {
  loadingUILibs.value = true;
  try {
    availableUILibraries.value = await getAllUILibraries();
  } catch (err) {
    console.error('Failed to load UI libraries:', err);
  } finally {
    loadingUILibs.value = false;
  }
}

function toggleUILibrary(id: string) {
  const index = form.value.uiLibraryIds?.indexOf(id);
  if (index !== undefined && index > -1) {
    form.value.uiLibraryIds?.splice(index, 1);
  } else {
    form.value.uiLibraryIds?.push(id);
  }
}

function addCase() {
  form.value.expectedCases?.unshift({ name: '' });
}

function removeCase(index: number) {
  form.value.expectedCases?.splice(index, 1);
}

async function handleSubmit() {
  submitting.value = true;
  error.value = '';
  success.value = '';

  try {
    if (isEditMode.value) {
      // Edit mode
      const validCases = (form.value.expectedCases || []).filter(c => c.name.trim());
      
      await updateProject(props.projectId!, {
        name: form.value.name as string,
        description: form.value.description || undefined,
        status: form.value.status as FeatureStatus,
        uiLibraryIds: form.value.uiLibraryIds as string[],
        prdText: form.value.prdText || undefined,
        expectedCases: validCases,
        casesGeneratedFrom: generateCasesFromPrd.value && form.value.prdText ? 'prd' : form.value.casesGeneratedFrom,
      });

      success.value = 'Changes saved successfully';
      setTimeout(() => { success.value = ''; }, 3000);
    } else {
      // Create mode
      const newProject = await createProject({
        name: form.value.name as string,
        description: form.value.description,
        status: form.value.status as FeatureStatus,
        uiLibraryIds: form.value.uiLibraryIds as string[],
        prdText: form.value.prdText,
        casesGeneratedFrom: generateCasesFromPrd.value && form.value.prdText ? 'prd' : null,
      });

      if (generateCasesFromPrd.value && form.value.prdText) {
        await generateProjectCases(newProject._id, 'prd');
      }

      router.push(`/features/${newProject._id}`);
    }
  } catch (err) {
    console.error('Failed to save feature:', err);
    error.value = (err as Error).message || (isEditMode.value ? 'Failed to save changes' : 'Failed to create feature');
  } finally {
    submitting.value = false;
  }
}
</script>

<style>
/* TipTap Editor Styles */
.tiptap-editor {
  min-height: 100%;
}

.tiptap-editor .ProseMirror {
  min-height: 100%;
  padding: 1.5rem;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.6;
}

.tiptap-editor .ProseMirror:focus {
  outline: none;
}

.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--color-text-tertiary);
  pointer-events: none;
  height: 0;
  white-space: pre-wrap;
}

.tiptap-editor h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--color-text-primary);
}

.tiptap-editor h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}

.tiptap-editor p {
  margin-bottom: 0.75rem;
}

.tiptap-editor ul,
.tiptap-editor ol {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.tiptap-editor ul {
  list-style-type: disc;
}

.tiptap-editor ol {
  list-style-type: decimal;
}

.tiptap-editor li {
  margin-bottom: 0.25rem;
}

.tiptap-editor strong {
  font-weight: 600;
  color: var(--color-text-primary);
}

.tiptap-editor em {
  font-style: italic;
}

.tiptap-editor code {
  background-color: var(--color-bg-tertiary);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}
</style>
