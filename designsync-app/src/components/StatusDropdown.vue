<template>
  <div class="relative" ref="dropdownRef" v-if="!asPopover">
    <button
      @click="toggleDropdown"
      :class="['status-badge cursor-pointer hover:opacity-80 transition-opacity', getStatusClass(currentStatus)]"
    >
      <span :class="['status-dot', getStatusDotClass(currentStatus)]"></span>
      {{ getStatusLabel(currentStatus) }}
      <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="status-dropdown"
      >
        <button
          v-for="status in FEATURE_STATUSES"
          :key="status.value"
          @click="selectStatus(status.value)"
          :class="[
            'status-chip',
            getStatusClass(status.value),
            { 'status-chip-selected': currentStatus === status.value }
          ]"
        >
          <span :class="['status-dot', getStatusDotClass(status.value)]"></span>
          <span class="flex-1 text-left text-xs font-semibold">{{ status.label }}</span>
          <svg
            v-if="currentStatus === status.value"
            class="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>

  <!-- Popover mode (no trigger button, just the dropdown content) -->
  <div v-else class="status-dropdown-content" ref="dropdownRef">
    <button
      v-for="status in FEATURE_STATUSES"
      :key="status.value"
      @click="selectStatus(status.value)"
      :class="[
        'status-chip',
        getStatusClass(status.value),
        { 'status-chip-selected': currentStatus === status.value }
      ]"
    >
      <span :class="['status-dot', getStatusDotClass(status.value)]"></span>
      <span class="flex-1 text-left text-xs font-medium">{{ status.label }}</span>
      <svg
        v-if="currentStatus === status.value"
        class="w-4 h-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { FEATURE_STATUSES, getStatusClass, getStatusDotClass, getStatusLabel } from '../constants';

const props = defineProps<{
  currentStatus: string;
  asPopover?: boolean;
}>();

const emit = defineEmits<{
  (e: 'change', status: string): void;
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectStatus = (status: string) => {
  emit('change', status);
  if (!props.asPopover) {
    isOpen.value = false;
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (props.asPopover) return; // Let parent handle click outside for popover mode
  
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  if (!props.asPopover) {
    document.addEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  if (!props.asPopover) {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<style scoped>
.status-dropdown,
.status-dropdown-content {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 1.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  padding: 10px;
  min-width: 240px;
}

.status-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  z-index: 100;
  overflow: hidden;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 10px 20px;
  text-align: left;
  border-radius: 2rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 0.375rem;
}

.status-chip:last-child {
  margin-bottom: 0;
}

.status-chip:hover {
  transform: translateX(2px);
  border-color: currentColor;
}

.status-chip-selected {
  border-color: currentColor;
}

/* Override status badge styles for chip appearance */
.status-chip.status-draft {
  background: var(--color-muted-bg);
  color: var(--color-muted);
}

.status-chip.status-prd-complete {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.status-chip.status-ready-for-design {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.status-chip.status-in-design {
  background: rgba(251, 146, 60, 0.2);
  color: #fb923c;
}

.status-chip.status-in-design-review {
  background: rgba(147, 197, 253, 0.2);
  color: #93c5fd;
}

.status-chip.status-ready-for-kickoff {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
