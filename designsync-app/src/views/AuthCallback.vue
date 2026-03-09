<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="text-center">
      <div v-if="error" class="text-destructive">
        <h2 class="text-xl font-semibold mb-2">Authentication Failed</h2>
        <p class="text-muted-foreground mb-4">{{ error }}</p>
        <router-link to="/" class="text-primary hover:underline">Return Home</router-link>
      </div>
      <div v-else>
        <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGitHubAuth } from '../composables/useGitHubAuth';

const router = useRouter();
const route = useRoute();
const { handleCallback, checkSession } = useGitHubAuth();

const error = ref<string | null>(null);

onMounted(async () => {
  const session = route.query.session as string;
  const errorMsg = route.query.error as string;

  if (errorMsg) {
    error.value = errorMsg;
    return;
  }

  if (session) {
    handleCallback(session);
    await checkSession();
    
    const returnTo = localStorage.getItem('auth_return_to') || '/projects/new';
    localStorage.removeItem('auth_return_to');
    router.push(returnTo);
  } else {
    error.value = 'No session token received';
  }
});
</script>
