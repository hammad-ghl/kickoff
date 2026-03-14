<template>
  <div class="h-full flex items-center justify-center bg-primary p-8">
    <div class="max-w-lg w-full text-center">
      <!-- Logo -->
      <div class="w-20 h-20 bg-tertiary rounded-3xl flex items-center justify-center mx-auto mb-8 overflow-hidden shadow-2xl border border-border-low">
        <img src="../assets/kickoff-logo.png" alt="Kickoff Logo" class="w-full h-full object-cover" />
      </div>
      
      <!-- Title -->
      <h1 class="text-[24px] font-normal text-[#e8eaed] mb-2">
        Welcome to Kickoff
      </h1>
      <p class="text-[14px] text-[#9aa0a6] max-w-sm mx-auto mb-8 leading-relaxed">
        AI-powered design review assistant. Streamline feature development from PRD to production-ready code.
      </p>
      
      <!-- Feature Chips -->
      <div class="flex flex-wrap justify-center gap-2 mb-8">
        <span class="chip">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PRD Analysis
        </span>
        <span class="chip">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Design Review
        </span>
        <span class="chip">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Coverage Check
        </span>
        <span class="chip">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Component Mapping
        </span>
      </div>

      <!-- CTA Buttons -->
      <div class="flex items-center justify-center gap-3">
        <router-link to="/features/new" class="btn-primary p-5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        <p class="text-sm font-semibold">  Create Feature</p>
        </router-link>
        <router-link to="/features" class="btn-secondary p-5 text-white">
        <p class="text-sm font-medium">  View Features</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Pure presentation component
</script>
