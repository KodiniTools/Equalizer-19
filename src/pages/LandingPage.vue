<template>
  <div class="landing-page">
    <!-- Local navigation: home, sections, FAQ, app (sticky under the global nav) -->
    <HeroNav />

    <!-- Sections live in components/landing/; each brings its own styles -->
    <LandingHero />
    <LandingFacts />
    <LandingSignalChain />
    <LandingSteps />
    <LandingDetails />
    <LandingBlog />
    <LandingCta />
  </div>
</template>

<script setup lang="ts">
  import HeroNav from '../components/landing/HeroNav.vue'
  import LandingHero from '../components/landing/LandingHero.vue'
  import LandingFacts from '../components/landing/LandingFacts.vue'
  import LandingSignalChain from '../components/landing/LandingSignalChain.vue'
  import LandingSteps from '../components/landing/LandingSteps.vue'
  import LandingDetails from '../components/landing/LandingDetails.vue'
  import LandingBlog from '../components/landing/LandingBlog.vue'
  import LandingCta from '../components/landing/LandingCta.vue'
</script>

<style scoped>
  .landing-page {
    color: var(--text-primary);
    /* Anchor targets must clear both sticky bars: global nav (70px) + HeroNav (56px) */
    --lp-anchor-offset: 148px;
  }

  /* Keep anchored sections clear of the sticky navigation bars.
     The sections are child roots, so the page's scoped rule reaches them. */
  #features,
  #blog {
    scroll-margin-top: var(--lp-anchor-offset);
  }

  @media (max-width: 768px) {
    .landing-page {
      --lp-anchor-offset: 130px;
    }
  }
</style>
