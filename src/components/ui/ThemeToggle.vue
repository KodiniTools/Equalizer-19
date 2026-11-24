<template>
  <button
    type="button"
    class="page-link theme-toggle"
    @click="setTheme(currentTheme === 'dark' ? 'light' : 'dark')"
  >
    {{ currentTheme === 'dark' ? t.theme_light : t.theme_dark }}
  </button>
</template>

<script setup lang="ts">
  import { injectI18n } from '../../composables/useI18n'
  import { injectTheme } from '../../composables/useTheme'

  const { t } = injectI18n()
  const { currentTheme, setTheme } = injectTheme()
</script>
