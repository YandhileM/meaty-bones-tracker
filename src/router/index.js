import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../services/auth.js'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import CustomersView from '../views/CustomersView.vue'
import CustomerDetailView from '../views/CustomerDetailView.vue'
import StockView from '../views/StockView.vue'

const routes = [
  {
    path: '/login',
    component: LoginView,
  },
  {
    path: '/',
    component: HomeView,
  },
  {
    path: '/customers',
    component: CustomersView,
  },
  {
    path: '/customers/:id',
    component: CustomerDetailView,
  },
  {
    path: '/stock',
    component: StockView,
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
