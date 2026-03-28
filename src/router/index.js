import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../services/auth.js'
import LoginView from '../views/LoginView.vue'

const routes = [
  {
    path: '/login',
    component: LoginView,
  },
  {
    path: '/',
    component: { template: '<div>Home</div>' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.path === '/login') return true
  if (!isAuthenticated()) return '/login'
})

export default router
