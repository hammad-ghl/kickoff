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
      path: '/features',
      name: 'features',
      component: ProjectsList,
    },
    {
      path: '/features/new',
      name: 'create-feature',
      component: CreateProject,
    },
    {
      path: '/features/:id',
      name: 'feature-detail',
      component: ProjectDetail,
    },
    {
      path: '/features/:id/edit',
      name: 'edit-feature',
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
    // Redirect old routes to new routes
    {
      path: '/projects',
      redirect: '/features',
    },
    {
      path: '/projects/new',
      redirect: '/features/new',
    },
    {
      path: '/projects/:id',
      redirect: to => `/features/${to.params.id}`,
    },
    {
      path: '/projects/:id/edit',
      redirect: to => `/features/${to.params.id}/edit`,
    },
  ],
});

export default router;
