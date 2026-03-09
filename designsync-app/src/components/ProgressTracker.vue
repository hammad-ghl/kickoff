<template>
  <div v-if="show" class="max-w-4xl mx-auto">
    <div class="mb-8">
      <div class="h-2 bg-secondary rounded-full overflow-hidden mb-4">
        <div 
          class="h-full bg-foreground rounded-full transition-all duration-500"
          :style="{ width: progress + '%' }"
        ></div>
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <div 
          v-for="step in steps" 
          :key="step.id"
          class="px-3 py-1.5 text-xs font-mono border rounded-md transition-all"
          :class="{
            'border-border text-muted-foreground': step.state === 'pending',
            'border-foreground bg-foreground/10 text-foreground animate-pulse': step.state === 'active',
            'border-green-500 bg-green-500/10 text-green-500': step.state === 'done',
            'border-red-500 bg-red-500/10 text-red-500': step.state === 'error'
          }"
        >
          {{ step.label }}
        </div>
      </div>

      <p v-if="currentMessage" class="text-sm font-mono text-muted-foreground">
        → {{ currentMessage }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface ProgressStep {
  id: string;
  label: string;
  state: 'pending' | 'active' | 'done' | 'error';
}

interface Props {
  show: boolean;
  progress: number;
  currentMessage?: string;
  steps: ProgressStep[];
}

defineProps<Props>();
</script>
