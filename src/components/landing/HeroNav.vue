<template>
  <!--
    Lokale Navigation der Landing-Page (Muster: Visualizer-Landing-Page).
    Die globale Kodinitools-Navigation (SSI nav.html) ist `position: sticky`,
    daher klebt diese Leiste direkt darunter statt sie zu überlagern.
  -->
  <header class="hero-nav" :class="{ scrolled: isScrolled }">
    <div class="hero-nav-inner">
      <router-link to="/" class="hero-nav-brand" @click="scrollToTop">
        <AppIcon name="sliders" size="18" />
        <span class="hero-nav-brand-text">Equalizer 19</span>
      </router-link>

      <nav class="hero-nav-links" :aria-label="t.lp_nav_label">
        <router-link
          to="/"
          class="hero-nav-link"
          :class="{ active: activeSection === '' }"
          @click="scrollToTop"
        >
          {{ t.lp_nav_home }}
        </router-link>
        <a
          v-for="section in SECTIONS"
          :key="section.id"
          :href="`#${section.id}`"
          class="hero-nav-link"
          :class="{ active: activeSection === section.id }"
        >
          {{ t[section.labelKey] }}
        </a>
        <router-link to="/faq" class="hero-nav-link">{{ t.lp_nav_faq }}</router-link>
        <UiButton to="/app" variant="primary" size="lg" class="hero-nav-cta">
          {{ t.lp_cta_start }} <span aria-hidden="true">→</span>
        </UiButton>
      </nav>
      <ThemeToggle />
    </div>
  </header>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import AppIcon from '../AppIcon.vue'
  import ThemeToggle from '../ui/ThemeToggle.vue'
  import { injectI18n } from '../../composables/useI18n'
  import type { TranslationKey } from '../../i18n'
  import { UiButton } from '../ui'

  const { t } = injectI18n()

  // Abschnitte der Landing-Page, die per Anker erreichbar sind (Reihenfolge = Seite)
  const SECTIONS: ReadonlyArray<{ id: string; labelKey: TranslationKey }> = [
    { id: 'features', labelKey: 'lp_nav_features' },
    { id: 'blog', labelKey: 'lp_nav_blog' },
  ]

  // Unterhalb dieser Linie (px vom oberen Viewport-Rand) gilt ein Abschnitt als
  // erreicht: globale Navigation (70 px) + diese Leiste (56 px) + etwas Luft.
  const ACTIVE_LINE_PX = 160

  const isScrolled = ref(false)
  const activeSection = ref('')

  function handleScroll(): void {
    isScrolled.value = window.scrollY > 8
    // Aktiv ist der letzte Abschnitt, dessen Oberkante die Linie passiert hat
    let current = ''
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id)
      if (el && el.getBoundingClientRect().top <= ACTIVE_LINE_PX) current = id
    }
    activeSection.value = current
  }

  // „Start“/Logo auf der Landing-Page selbst: der Router hat nichts zu tun,
  // also nur nach oben scrollen.
  function scrollToTop(): void {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
</script>

<style scoped src="./hero-nav.css"></style>
