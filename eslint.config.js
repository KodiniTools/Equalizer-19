import {
  configureVueProject,
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

// @vue/eslint-config-typescript bringt typescript-eslint mit und parst
// <script setup lang="ts"> in .vue-Dateien; alle Komponenten sind TypeScript.
configureVueProject({ scriptLangs: ['ts'] })

export default defineConfigWithVueTs(
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      // Nur Fehler und Warnungen dürfen in die Konsole; Debug-Ausgaben nicht
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'warn',
    },
  },
  {
    files: ['tests/**', 'src/**/__tests__/**', '*.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  }
)
