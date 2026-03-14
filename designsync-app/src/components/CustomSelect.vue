<template>
  <div class="relative group">
    <select 
      :value="modelValue"
      @change="handleChange"
      class="appearance-none bg-transparent border border-border-low rounded-full px-4 py-1.5 pr-10 text-[13px] text-white hover:bg-hover hover:border-border transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-transparent"
      v-bind="$attrs"
    >
      <option 
        v-if="defaultOption"
        :value="defaultOption.value"
        class="bg-[#202124] text-white"
      >
        {{ defaultOption.label }}
      </option>
      <option 
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        class="bg-[#202124] text-white"
      >
        {{ option.label }}
      </option>
    </select>
    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary group-hover:text-white transition-colors">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Option {
  value: string;
  label: string;
}

withDefaults(defineProps<{
  modelValue: string;
  options: Option[];
  defaultOption?: Option;
}>(), {
  defaultOption: () => ({ value: '', label: 'Select' }),
});

const emit = defineEmits(['update:modelValue']);

function handleChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value);
}
</script>

<style scoped>
/* Custom styling for the select options to match the dark theme */
select option {
  padding: 8px;
}
</style>
