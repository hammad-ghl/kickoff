<template>
  <div class="flex h-screen bg-primary overflow-hidden">
    <!-- Sidebar - Fixed height -->
    <aside class="w-[240px] h-screen flex flex-col pt-4 overflow-y-auto flex-shrink-0 border-r border-border">
      <!-- Logo/Brand Section -->
      <div class="px-4 mb-4">
        <button class="flex items-center gap-3 w-full px-3 py-2 hover:bg-hover rounded-lg transition-colors group text-left"
        @click="navigateTo('/')">
          <div class="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg">
            <img src="./assets/kickoff-logo.png" alt="Kickoff Logo" class="w-full h-full object-cover" />
          </div>
          <div class="flex flex-col items-start min-w-0">
            <span class="text-lg text-primary font-bold leading-none mb-1">Kickoff</span>
            <span class="text-[11px] text-secondary leading-none">Design-Dev Bridge</span>
          </div>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 space-y-1 mt-10">
        <template v-for="item in navItems" :key="item.label">
          <router-link
            v-if="!item.disabled && item.to"
            :to="item.to"
            class="nav-item"
            :class="{ 'nav-item-active': item.isActive?.($route.path) }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="item.icon"></svg>
            <span>{{ item.label }}</span>
          </router-link>
          <div v-else class="nav-item opacity-50 cursor-not-allowed">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="item.icon"></svg>
            <span>{{ item.label }}</span>
          </div>
        </template>
      </nav>

      <!-- Bottom Utility -->
      <div class="px-4 py-4 mt-auto space-y-0.5">
        <template v-for="item in bottomNavItems" :key="item.label">
          <div class="nav-item opacity-50 cursor-not-allowed">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="item.icon"></svg>
            <span>{{ item.label }}</span>
          </div>
        </template>

        <!-- Account -->
        <div class="flex items-center gap-3 px-3 py-3 mt-4">
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium" style="background-color: var(--color-error); color: var(--color-bg-primary);">
            U
          </div>
          <span class="text-[13px] text-secondary truncate">user@email.com</span>
        </div>
      </div>
    </aside>

    <!-- Main Content Area - Fixed height with internal scroll -->
    <div class="flex-1 h-screen flex flex-col overflow-hidden">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const $route = useRoute();
const router = useRouter();

interface NavItem {
  to?: string;
  label: string;
  icon: string;
  isActive?: (path: string) => boolean;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  {
    to: '/features',
    label: 'Features',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />`,
    isActive: (path: string) => path.startsWith('/features') || path.startsWith('/review') || path === '/',
  },
  {
    to: '/ui-libraries',
    label: 'UI Libraries',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />`,
    isActive: (path: string) => path.startsWith('/ui-libraries'),
  },
  {
    label: 'Teams',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />`,
    disabled: true,
  },
  {
    label: 'Members',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />`,
    disabled: true,
  },
];

function navigateTo(path: string) {
  router.push(path);
}

const bottomNavItems: NavItem[] = [
  {
    label: 'Settings',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`,
    disabled: true,
  },
];
</script>

<style>
.nav-item {
  @apply flex items-center gap-3 px-3 py-2 text-[14px] rounded-full transition-colors;
}

.nav-item:hover {
  color: white;
  background-color: var(--color-bg-hover);
}

.nav-item-active {
  background-color: var(--color-brand-active-bg);
  color: var(--color-brand-active-text);
  @apply font-medium;
}

.nav-item-active:hover {
  background-color: var(--color-brand-active-bg);
}

.nav-item svg {
  color: var(--color-text-secondary);
}

.nav-item-active svg {
  color: var(--color-brand-active-text);
}
</style>
