<template>
  <section class="container related-tools" :aria-labelledby="titleId">
    <header class="rt-header">
      <h2 :id="titleId" class="rt-title">{{ t.tools_title }}</h2>
      <p class="rt-subtitle">{{ t.tools_subtitle }}</p>
    </header>

    <ul class="rt-grid">
      <li v-for="tool in TOOLS" :key="tool.url">
        <a class="rt-card" :href="tool.url" target="_blank" rel="noopener">
          <span class="rt-icon" aria-hidden="true">
            <i :class="tool.icon"></i>
          </span>
          <span class="rt-body">
            <span class="rt-name">{{ t[tool.titleKey] }}</span>
            <span class="rt-desc">{{ t[tool.descKey] }}</span>
          </span>
          <span class="rt-cta">
            {{ t.tools_open }}
            <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
            <span class="visually-hidden">({{ t.tools_new_tab }})</span>
          </span>
        </a>
      </li>
    </ul>
  </section>
</template>

<script setup>
  import { inject, useId } from 'vue'

  /**
   * Links to the other KodiniTools audio tools (open in a new tab).
   * Add an entry here (plus its *_title / *_desc strings) to show another card.
   */
  const TOOLS = [
    {
      url: 'https://kodinitools.com/audiokonverter/',
      icon: 'fas fa-arrows-rotate',
      titleKey: 'tool_converter_title',
      descKey: 'tool_converter_desc',
    },
    {
      url: 'https://kodinitools.com/audio-cutter/',
      icon: 'fas fa-scissors',
      titleKey: 'tool_cutter_title',
      descKey: 'tool_cutter_desc',
    },
    {
      url: 'https://kodinitools.com/audionormalisierer/',
      icon: 'fas fa-wave-square',
      titleKey: 'tool_normalizer_title',
      descKey: 'tool_normalizer_desc',
    },
  ]

  const { t } = inject('i18n')
  const titleId = useId()
</script>

<style scoped>
  .related-tools {
    margin-top: 8px;
  }

  .rt-header {
    margin-bottom: 12px;
  }

  .rt-title {
    margin: 0 0 4px;
    font-size: 1em;
    font-weight: 700;
    color: var(--text-primary, #fff);
  }

  .rt-subtitle {
    margin: 0;
    font-size: 0.75em;
    color: var(--text-muted, #8b8b9a);
  }

  .rt-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .rt-grid li {
    display: flex;
  }

  .rt-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--card-bg, #252530);
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 12px;
    color: inherit;
    text-decoration: none;
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      transform 0.2s;
  }

  .rt-card:hover {
    border-color: var(--accent-primary, #00d9ff);
    box-shadow: 0 8px 24px var(--shadow-light, rgba(0, 0, 0, 0.2));
    transform: translateY(-2px);
  }

  .rt-card:focus-visible {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 3px;
  }

  .rt-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1em;
    color: var(--accent-primary, #00d9ff);
    background: color-mix(in srgb, var(--accent-primary, #00d9ff) 14%, transparent);
  }

  .rt-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .rt-name {
    font-size: 0.9em;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .rt-desc {
    font-size: 0.75em;
    line-height: 1.5;
    color: var(--text-secondary, #c8c8d5);
  }

  /* Pinned to the bottom so the buttons line up across cards */
  .rt-cta {
    margin-top: auto;
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.72em;
    font-weight: 600;
    color: var(--accent-primary, #00d9ff);
    border: 1px solid var(--border-color, #3a3a48);
    background: var(--secondary-bg, #1a1a22);
    transition:
      background 0.2s,
      color 0.2s,
      border-color 0.2s;
  }

  .rt-cta i {
    font-size: 0.85em;
  }

  .rt-card:hover .rt-cta {
    background: var(--accent-primary, #00d9ff);
    border-color: var(--accent-primary, #00d9ff);
    color: var(--on-accent, #000);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 900px) {
    .rt-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    /* Compact horizontal cards on narrow screens */
    .rt-card {
      flex-direction: row;
      align-items: center;
      padding: 12px;
    }

    .rt-icon {
      flex-shrink: 0;
    }

    .rt-body {
      flex: 1;
      min-width: 0;
    }

    .rt-cta {
      margin-top: 0;
      align-self: center;
      flex-shrink: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rt-card:hover {
      transform: none;
    }
  }
</style>
