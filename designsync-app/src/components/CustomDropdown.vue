<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      @click="toggleDropdown"
      class="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border transition-colors text-left"
      :class="[
        isOpen ? 'border-brand-primary bg-brand-active-bg' : 'border-border bg-tertiary hover:bg-hover',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      ]"
      :disabled="disabled"
    >
      <div class="flex-1 min-w-0">
        <div v-if="selectedItems.length > 0" class="flex flex-wrap gap-2">
          <span 
            v-for="item in selectedItems" 
            :key="item.id"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[13px] bg-brand-primary text-white"
          >
            {{ item.label }}
            <button
              v-if="multiple"
              type="button"
              @click.stop="removeItem(item.id)"
              class="hover:text-error transition-colors"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
        <span v-else class="text-[14px] text-secondary">{{ placeholder }}</span>
      </div>
      <svg 
        class="w-4 h-4 text-secondary transition-transform flex-shrink-0" 
        :class="{ 'rotate-180': isOpen }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 w-full mt-2 bg-secondary border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        <div v-if="items.length === 0" class="px-4 py-3 text-[14px] text-secondary text-center">
          {{ emptyMessage }}
        </div>
        <div v-else class="py-1">
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            @click="selectItem(item)"
            class="w-full px-4 py-2.5 text-left hover:bg-hover transition-colors flex items-start gap-3"
            :class="[
              isSelected(item.id) ? 'bg-brand-active-bg' : '',
              item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]"
            :disabled="item.disabled"
          >
            <div 
              v-if="multiple"
              class="w-4 h-4 mt-0.5 flex-shrink-0 rounded border transition-colors"
              :class="isSelected(item.id) ? 'bg-brand-primary border-brand-primary' : 'border-border'"
            >
              <svg v-if="isSelected(item.id)" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div 
              v-else
              class="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full border transition-colors"
              :class="isSelected(item.id) ? 'border-brand-primary' : 'border-border'"
            >
              <div v-if="isSelected(item.id)" class="w-full h-full rounded-full bg-brand-primary scale-50"></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[14px] text-primary">{{ item.label }}</div>
              <div v-if="item.description" class="text-[12px] text-secondary mt-0.5">{{ item.description }}</div>
            </div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

export interface DropdownItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

const props = defineProps<{
  items: DropdownItem[];
  modelValue: string | string[] | undefined;
  multiple?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | undefined];
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const selectedItems = computed(() => {
  if (!props.modelValue) return [];
  
  const ids = Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue];
  return props.items.filter(item => ids.includes(item.id));
});

function isSelected(id: string): boolean {
  if (!props.modelValue) return false;
  return Array.isArray(props.modelValue) 
    ? props.modelValue.includes(id) 
    : props.modelValue === id;
}

function toggleDropdown() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
}

function selectItem(item: DropdownItem) {
  if (item.disabled) return;

  if (props.multiple) {
    const currentValue = (props.modelValue as string[]) || [];
    const index = currentValue.indexOf(item.id);
    
    if (index > -1) {
      const newValue = [...currentValue];
      newValue.splice(index, 1);
      emit('update:modelValue', newValue);
    } else {
      emit('update:modelValue', [...currentValue, item.id]);
    }
  } else {
    emit('update:modelValue', item.id);
    isOpen.value = false;
  }
}

function removeItem(id: string) {
  if (props.multiple) {
    const currentValue = (props.modelValue as string[]) || [];
    emit('update:modelValue', currentValue.filter(v => v !== id));
  } else {
    emit('update:modelValue', undefined);
  }
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
