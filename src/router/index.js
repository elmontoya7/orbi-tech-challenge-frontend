import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/dashboard/Home.vue'),
    meta: {
      requriesAuth: true
    }
  },
  {
    path: '/store',
    name: 'store',
    component: () => import('../views/store/Home.vue'),
    meta: {
      requriesAuth: true
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior (to, from, saved) {
    return {
      x: 0,
      y: 0
    }
  }
})

router.beforeEach((to, from, next) => {
  if ((to.name != 'login' && to.name != 'home' && to.matched.some(r => r.meta.requiresAuth)) && !Vue.$cookies.get('tk')) {
    next({name: 'home'})
  }

  next()
})

export default router
