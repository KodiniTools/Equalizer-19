<template>
  <div class="container">
    <div class="controls-section">
      <div class="controls-header">
        <h3>{{ t.settings_controls }}</h3>
      </div>
      
      <div class="controls-grid">
        <!-- Language Switcher -->
        <div class="control-group">
          <label>{{ t.language }}</label>
          <div class="lang-switcher">
            <div 
              class="switch-option" 
              :class="{ active: currentLanguage === 'de' }"
              @click="handleLanguageChange('de')"
            >
              <i class="fas fa-globe"></i>
              <span>{{ t.lang_de }}</span>
            </div>
            <div 
              class="switch-option" 
              :class="{ active: currentLanguage === 'en' }"
              @click="handleLanguageChange('en')"
            >
              <i class="fas fa-globe"></i>
              <span>{{ t.lang_en }}</span>
            </div>
          </div>
        </div>
        
        <!-- Theme Switcher -->
        <div class="control-group">
          <label>{{ t.theme }}</label>
          <div class="theme-switcher">
            <div 
              class="switch-option" 
              :class="{ active: currentTheme === 'dark' }"
              @click="handleThemeChange('dark')"
            >
              <i class="fas fa-moon"></i>
              <span>{{ t.dark_theme }}</span>
            </div>
            <div 
              class="switch-option" 
              :class="{ active: currentTheme === 'light' }"
              @click="handleThemeChange('light')"
            >
              <i class="fas fa-sun"></i>
              <span>{{ t.light_theme }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const { t, currentLanguage, setLanguage } = inject('i18n')
const { currentTheme, setTheme } = inject('theme')
const notify = inject('notify')

const handleLanguageChange = (lang) => {
  setLanguage(lang)
  const message = lang === 'en' 
    ? 'Language changed to English' 
    : 'Sprache zu Deutsch geändert'
  notify(message, 'success')
}

const handleThemeChange = (theme) => {
  setTheme(theme)
  const message = currentLanguage.value === 'en'
    ? `Switched to ${theme} theme`
    : `${theme === 'dark' ? 'Dunkles' : 'Helles'} Theme aktiviert`
  notify(message, 'success')
}
</script>
