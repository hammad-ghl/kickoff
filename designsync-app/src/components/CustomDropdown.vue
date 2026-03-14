<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="toggleDropdown"
      class="custom-dropdown-trigger"
      :class="{ 'active': isOpen }"
    >
      <div class="flex items-center gap-2 flex-1">
        <component 
          v-if="selectedOption?.icon" 
          :is="selectedOption.icon" 
          class="w-4 h-4 flex-shrink-0"
        />
        <span class="text-sm">{{ selectedOption?.label || placeholder }}</span>
      </div>
      <svg 
        class="w-4 h-4 text-secondary transition-transform duration-200 flex-shrink-0" 
        :class="{ 'rotate-180': isOpen }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    <Transition name="dropdown">
      <div v-if="isOpen" class="custom-dropdown-menu">
        <button
          v-for="option in options"
          :key="option.value"
          @click="selectOption(option)"
          class="custom-dropdown-item"
          :class="{ 'selected': modelValue === option.value }"
        >
          <component 
            v-if="option.icon" 
            :is="option.icon" 
            class="w-4 h-4 flex-shrink-0"
          />
          <span class="flex-1 text-left">{{ option.label }}</span>
          <svg 
            v-if="modelValue === option.value"
            class="w-4 h-4 text-brand-primary flex-shrink-0" 
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: any;
}

const props = defineProps<{
  modelValue: string;
  options: DropdownOption[];
  placeholder?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const selectedOption = computed(() => 
  props.options.find(opt => opt.value === props.modelValue)
);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectOption = (option: DropdownOption) => {
  emit('update:modelValue', option.value);
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.custom-dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-tertiary);
  border-radius: 0.5rem;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  transition: all 0.15s;
  cursor: pointer;
}

.custom-dropdown-trigger:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-secondary);
}

.custom-dropdown-trigger.active {
  border-color: var(--color-brand-primary);
  background-color: var(--color-bg-hover);
}

.custom-dropdown-menu {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 0.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 50;
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
}

.custom-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  transition: all 0.15s;
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
}

.custom-dropdown-item:hover {
  background-color: var(--color-bg-hover);
}

.custom-dropdown-item.selected {
  background-color: rgba(135, 169, 255, 0.1);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
