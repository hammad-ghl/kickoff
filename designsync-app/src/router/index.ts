import { createRouter, createWebHistory } from 'vue-router';

import Home from '../views/Home.vue';
import ProjectsList from '../views/ProjectsList.vue';
import CreateProject from '../views/CreateProject.vue';
import ProjectDetail from '../views/ProjectDetail.vue';
import EditProject from '../views/EditProject.vue';
import ReviewDetail from '../views/ReviewDetail.vue';
import AuthCallback from '../views/AuthCallback.vue';
import UILibrariesList from '../views/UILibrariesList.vue';
import CreateUILibrary from '../views/CreateUILibrary.vue';
import UILibraryDetail from '../views/UILibraryDetail.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/projects',
      name: 'projects',
      component: ProjectsList,
    },
    {
      path: '/projects/new',
      name: 'create-project',
      component: CreateProject,
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: ProjectDetail,
    },
    {
      path: '/projects/:id/edit',
      name: 'edit-project',
      component: EditProject,
    },
    {
      path: '/review/:id',
      name: 'review',
      component: ReviewDetail,
    },
    {
      path: '/ui-libraries',
      name: 'ui-libraries',
      component: UILibrariesList,
    },
    {
      path: '/ui-libraries/new',
      name: 'create-ui-library',
      component: CreateUILibrary,
    },
    {
      path: '/ui-libraries/:id',
      name: 'ui-library-detail',
      component: UILibraryDetail,
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallback,
    },
  ],
});

export default router;
