<template>
  <router-link
    :to="`/features/${project._id}`"
    class="group grid grid-cols-[1.5fr,1.5fr,1fr,1fr,1.2fr,auto] gap-4 items-center px-4 py-3.5 hover:bg-hover transition-colors cursor-pointer border-b border-border-low"
  >
    <!-- Feature Name & ID -->
    <div class="min-w-0">
      <h3 class="text-sm hover:underline truncate" style="color: var(--color-brand-primary);">
        {{ project.name }}
      </h3>
      <p class="text-[11px] text-secondary truncate opacity-70 mt-0.5">
        kickoff-{{ project._id.slice(0, 8) }}
      </p>
    </div>

    <!-- Description -->
    <div class="text-[13px] text-white truncate">
      {{ project.description || 'No description' }}
    </div>

    <!-- Created -->
    <div class="text-[13px] text-white">
      {{ formatDate(project.createdAt) }}
    </div>

    <!-- Reviews -->
    <div class="text-[13px] text-white">
      {{ project.reviewCount ?? 0 }} reviews
    </div>

    <!-- Status -->
    <div class="text-[13px] text-white">
      <span :class="['status-badge', getStatusClass(project.status || 'draft')]">
        <span :class="['status-dot', getStatusDotClass(project.status || 'draft')]"></span>
        {{ getStatusLabel(project.status || 'draft') }}
      </span>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-1 w-24">
      <button 
        @click.prevent="emit('copy-id', project._id)"
        class="btn-icon w-8 h-8 opacity-0 group-hover:opacity-100"
        title="Copy Feature ID"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <button 
        @click.prevent="handleChangeStatus"
        class="btn-icon w-8 h-8 opacity-0 group-hover:opacity-100"
        title="Change Status"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>
      <button 
        @click.prevent="emit('delete-feature', project._id)"
        class="btn-icon-delete w-8 h-8 opacity-0 group-hover:opacity-100"
        title="Delete Feature"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { Project } from '../composables/useApi';
import { formatDate, getStatusClass, getStatusDotClass, getStatusLabel } from '../constants';

const props = defineProps<{ project: Project }>();
const emit = defineEmits(['copy-id', 'change-status', 'delete-feature']);

function handleChangeStatus(event: MouseEvent) {
  emit('change-status', props.project._id, props.project.status || 'draft', event);
}

</script>

<style scoped>
.btn-icon-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transition: all 0.15s;
  color: var(--color-text-secondary);
}

.btn-icon-delete:hover {
  background-color: var(--color-error-bg);
  color: var(--color-error);
}
</style>
