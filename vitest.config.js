import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

// Komponenten- und DOM-Tests (src/**/__tests__/*.spec.js). Die reinen
// Logik-Tests unter tests/ laufen weiterhin mit node:test (npm run test:node).
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/__tests__/*.spec.js'],
      exclude: [...configDefaults.exclude, 'tests/**'],
      setupFiles: ['src/__tests__/setup.js'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  })
)
