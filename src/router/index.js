import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../pages/LandingPage.vue'
import AppPage from '../pages/AppPage.vue'
import FaqPage from '../pages/FaqPage.vue'

// Offset for in-page anchors: each page sets `scroll-margin-top` on its targets
// (FAQ: global nav; landing page: global nav + HeroNav), so the CSS stays the
// single source of truth. Falls back to the height of the global navigation.
const DEFAULT_HASH_OFFSET = 96
function hashScrollOffset(hash) {
  const el = document.getElementById(hash.slice(1))
  if (!el) return DEFAULT_HASH_OFFSET
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop)
  return Number.isFinite(margin) && margin > 0 ? margin : DEFAULT_HASH_OFFSET
}

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
    meta: { title: 'Equalizer 19 - Professional Audio Processing' },
  },
  {
    path: '/app',
    name: 'App',
    component: AppPage,
    meta: { title: 'Equalizer 19 - Audio Processor' },
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: FaqPage,
    meta: { title: 'Equalizer 19 - FAQ' },
  },
]

const router = createRouter({
  history: createWebHistory('/equaliser19/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      // Offset keeps the target clear of the sticky navigation bars
      return { el: to.hash, top: hashScrollOffset(to.hash), behavior: 'smooth' }
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  },
})

// Redirect landing page with ?source=audiokonverter to the app
router.beforeEach((to, from, next) => {
  if (to.name === 'Landing' && to.query.source === 'audiokonverter') {
    next({ name: 'App', query: { source: 'audiokonverter' } })
  } else {
    if (to.meta.title) {
      document.title = to.meta.title
    }
    next()
  }
})

export default router
