<template>
  <ProjectForm mode="edit" :project-id="projectId" />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import ProjectForm from '../components/ProjectForm.vue';

const route = useRoute();
const projectId = route.params.id as string;
</script>
