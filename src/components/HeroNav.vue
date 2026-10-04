<template>
  <!--
    Lokale Navigation der Landing-Page (Muster: Visualizer-Landing-Page).
    Die globale Kodinitools-Navigation (SSI nav.html) ist `position: sticky`,
    daher klebt diese Leiste direkt darunter statt sie zu überlagern.
  -->
  <div class="hero-nav" :class="{ scrolled: isScrolled }">
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
        <router-link to="/app" class="lp-btn lp-btn-primary hero-nav-cta">
          {{ t.lp_cta_start }} <span aria-hidden="true">→</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup>
  import { inject, ref, onMounted, onUnmounted } from 'vue'
  import AppIcon from './AppIcon.vue'

  const { t } = inject('i18n')

  // Abschnitte der Landing-Page, die per Anker erreichbar sind (Reihenfolge = Seite)
  const SECTIONS = [
    { id: 'features', labelKey: 'lp_nav_features' },
    { id: 'blog', labelKey: 'lp_nav_blog' },
  ]

  // Unterhalb dieser Linie (px vom oberen Viewport-Rand) gilt ein Abschnitt als
  // erreicht: globale Navigation (70 px) + diese Leiste (56 px) + etwas Luft.
  const ACTIVE_LINE_PX = 160

  const isScrolled = ref(false)
  const activeSection = ref('')

  function handleScroll() {
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
  function scrollToTop() {
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

<style scoped>
  .hero-nav {
    position: sticky;
    top: 70px; /* Höhe der globalen Navigation (nav.html, Desktop) */
    z-index: 50; /* unter der globalen Navigation (100) und ihren Dropdowns */
    background: var(--nav-bg);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-color);
    transition: box-shadow 0.3s ease;
  }

  .hero-nav.scrolled {
    box-shadow: 0 4px 20px var(--shadow-light);
  }

  .hero-nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 56px;
    max-width: 1160px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .hero-nav-brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.2px;
    color: var(--text-primary);
    text-decoration: none;
  }

  .hero-nav-brand .icon {
    color: var(--accent-primary);
  }

  .hero-nav-links {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }

  .hero-nav-link {
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--text-secondary);
    text-decoration: none;
    transition:
      color 0.2s,
      background 0.2s;
  }

  .hero-nav-link:hover {
    color: var(--text-primary);
    background: var(--hover-bg);
  }

  .hero-nav-link.active {
    color: var(--accent-primary);
  }

  /* Kompakte Variante des globalen .lp-btn */
  .hero-nav-cta {
    margin-left: 8px;
    padding: 8px 14px;
    font-size: 14px;
    white-space: nowrap;
  }

  .hero-nav-brand:focus-visible,
  .hero-nav-link:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    .hero-nav {
      top: 60px; /* globale Navigation ist auf kleinen Bildschirmen 60 px hoch */
    }

    .hero-nav-inner {
      height: 52px;
      gap: 10px;
      padding: 0 16px;
    }

    /* Links bleiben erreichbar: bei Platzmangel seitlich scrollbar */
    .hero-nav-links {
      overflow-x: auto;
      scrollbar-width: none;
    }

    .hero-nav-links::-webkit-scrollbar {
      display: none;
    }

    .hero-nav-link {
      padding: 6px 10px;
      font-size: 13px;
    }
  }

  @media (max-width: 600px) {
    .hero-nav-brand-text,
    .hero-nav-cta {
      display: none; /* Platz für die Abschnittslinks; die Hero-CTA folgt direkt darunter */
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-nav,
    .hero-nav-link {
      transition: none;
    }
  }
</style>
