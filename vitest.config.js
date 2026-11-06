import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

// Ein Testlauf für alles: Komponenten- und DOM-Tests unter src/**/__tests__
// (jsdom) und die reinen Logik-Tests unter tests/ (Kopfzeile
// `// @vitest-environment node`).
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/__tests__/*.spec.{js,ts}', 'tests/**/*.test.{js,ts}'],
      exclude: [...configDefaults.exclude],
      setupFiles: ['src/__tests__/setup.js'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  })
)
