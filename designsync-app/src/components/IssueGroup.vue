<template>
  <div class="mb-8">
    <div class="flex items-center gap-3 mb-4 pb-3 border-b border-border">
      <span 
        class="px-2.5 py-1 text-xs font-mono uppercase tracking-wide border rounded-md"
        :class="badgeClass"
      >
        {{ badgeLabel }}
      </span>
      <h3 class="text-base font-semibold flex-1">{{ title }}</h3>
      <span class="text-xs font-mono text-muted-foreground">
        {{ items.length }} issue{{ items.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <div class="space-y-2">
      <div 
        v-for="(item, index) in items" 
        :key="index" 
        class="p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
      >
        <div class="flex gap-3">
          <div class="text-lg flex-shrink-0">{{ icon }}</div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold font-mono mb-1">{{ item.componentName }}</h4>
            <p class="text-sm text-muted-foreground mb-2 leading-relaxed">{{ item.description }}</p>
            
            <div v-if="getMetaTags(item).length > 0" class="flex flex-wrap gap-1.5">
              <span 
                v-for="(tag, tagIndex) in getMetaTags(item)" 
                :key="tagIndex" 
                class="px-2 py-0.5 text-xs font-mono bg-secondary border border-border rounded text-muted-foreground"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Issue {
  componentName: string;
  description: string;
  severity: string;
  figmaName?: string;
  slot?: string;
  availableSlots?: string[];
  file?: string;
  files?: string[];
  source?: string;
}

interface Props {
  title: string;
  badgeClass: string;
  badgeLabel: string;
  items: Issue[];
  icon: string;
}

defineProps<Props>();

function getMetaTags(item: Issue): string[] {
  const tags: string[] = [];
  
  if (item.figmaName && item.figmaName !== item.componentName) {
    tags.push(`figma: ${item.figmaName}`);
  }
  
  if (item.slot) {
    tags.push(`slot: ${item.slot}`);
  }
  
  if (item.availableSlots && item.availableSlots.length > 0) {
    tags.push(`available: ${item.availableSlots.join(', ')}`);
  }
  
  if (item.file) {
    const pathParts = item.file.split('/');
    tags.push(`file: .../${pathParts.slice(-2).join('/')}`);
  } else if (item.source === 'figma-property') {
    tags.push('source: figma');
  }
  
  if (item.files && item.files.length > 0) {
    item.files.forEach((file: string) => {
      const pathParts = file.split('/');
      tags.push(`.../${pathParts.slice(-2).join('/')}`);
    });
  }
  
  return tags;
}
</script>
