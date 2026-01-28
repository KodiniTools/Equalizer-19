import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../pages/LandingPage.vue'
import AppPage from '../pages/AppPage.vue'
import FaqPage from '../pages/FaqPage.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
    meta: { title: 'Equalizer 19 - Professional Audio Processing' }
  },
  {
    path: '/app',
    name: 'App',
    component: AppPage,
    meta: { title: 'Equalizer 19 - Audio Processor' }
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: FaqPage,
    meta: { title: 'Equalizer 19 - FAQ' }
  }
]

const router = createRouter({
  history: createWebHistory('/equaliser19/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// Update page title on route change
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
