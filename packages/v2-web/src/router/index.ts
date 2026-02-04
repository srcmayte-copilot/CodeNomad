import { createRouter, createWebHistory } from 'vue-router'
import WorkspaceSelector from '@/views/WorkspaceSelector.vue'
import SessionView from '@/views/SessionView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/workspaces'
    },
    {
      path: '/workspaces',
      name: 'workspaces',
      component: WorkspaceSelector
    },
    {
      path: '/session/:id',
      name: 'session',
      component: SessionView,
      props: true
    }
  ]
})

export default router
