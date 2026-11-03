<template>
  <component
    :is="tag"
    v-bind="rootProps"
    :class="[
      'ui-button',
      `ui-button--${variant}`,
      `ui-button--${size}`,
      { 'ui-button--round': round, 'ui-button--block': block, 'is-on': pressed === true },
    ]"
    :aria-pressed="pressed === null ? undefined : pressed"
  >
    <slot />
  </component>
</template>

<script setup>
  import { computed } from 'vue'
  import { RouterLink } from 'vue-router'

  /**
   * Textbutton des Design-Systems. Ersetzt das frühere globale .btn-System.
   *
   * - `variant`: secondary (Standard) · primary · ghost · outline · danger
   * - `size`: sm (30 px) · md (36 px) · lg (44 px)
   * - `pressed`: true/false setzt aria-pressed und den Zustand „an“ (.is-on);
   *   primary/secondary werden dann zur Akzentfläche, ghost zur getönten Fläche
   * - `to` rendert als RouterLink, `href` als Link, sonst <button>
   *
   * Icons (AppIcon) kommen als Kinder in den Default-Slot. Weitere Attribute
   * (title, aria-label, disabled, @click) fallen auf das native Element durch.
   */
  const props = defineProps({
    variant: {
      type: String,
      default: 'secondary',
      validator: (v) => ['secondary', 'primary', 'ghost', 'outline', 'danger'].includes(v),
    },
    size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
    type: { type: String, default: 'button' },
    pressed: { type: [Boolean, null], default: null },
    round: { type: Boolean, default: false },
    block: { type: Boolean, default: false },
    href: { type: String, default: '' },
    to: { type: [String, Object], default: null },
  })

  const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))

  /** Nur die Attribute des jeweiligen Elements, damit kein `href: undefined` den RouterLink stört. */
  const rootProps = computed(() => {
    if (props.to) return { to: props.to }
    if (props.href) return { href: props.href }
    return { type: props.type }
  })
</script>

<style scoped>
  .ui-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--secondary-bg);
    color: var(--text-primary);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    flex-shrink: 0;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .ui-button:hover:not(:disabled) {
    background: var(--hover-bg);
    border-color: var(--border-strong);
    color: var(--text-primary);
  }

  .ui-button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .ui-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ui-button :deep(.icon) {
    width: 14px;
    height: 14px;
  }

  /* ---- Varianten ---- */
  .ui-button--primary {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    color: var(--on-accent);
  }

  .ui-button--primary:hover:not(:disabled) {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
    color: var(--on-accent);
  }

  .ui-button--ghost {
    background: transparent;
    border-color: transparent;
    color: var(--text-secondary);
  }

  .ui-button--ghost:hover:not(:disabled) {
    background: var(--hover-bg);
    border-color: transparent;
  }

  .ui-button--outline {
    background: transparent;
    border-color: var(--border-color);
  }

  .ui-button--outline:hover:not(:disabled) {
    background: transparent;
    border-color: var(--accent-primary);
  }

  .ui-button--danger {
    background: transparent;
    border-color: color-mix(in srgb, var(--error) 50%, transparent);
    color: var(--error);
  }

  .ui-button--danger:hover:not(:disabled) {
    background: var(--error);
    border-color: var(--error);
    color: var(--on-status);
  }

  /* ---- Größen ---- */
  .ui-button--sm {
    height: 30px;
    padding: 0 10px;
    font-size: 12px;
  }

  .ui-button--sm :deep(.icon) {
    width: 13px;
    height: 13px;
  }

  .ui-button--lg {
    height: 44px;
    padding: 0 22px;
    font-size: 15px;
    border-radius: 10px;
    gap: 8px;
  }

  .ui-button--lg :deep(.icon) {
    width: 16px;
    height: 16px;
  }

  .ui-button--round {
    border-radius: 50%;
  }

  .ui-button--block {
    width: 100%;
  }

  /* ---- Zustand „an“ (aria-pressed): Vollfläche für Schalter … ---- */
  .ui-button.is-on {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    color: var(--on-accent);
  }

  .ui-button.is-on:hover:not(:disabled) {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
    color: var(--on-accent);
  }

  /* … und getönte Fläche für Modus-Buttons (Shuffle, Repeat) */
  .ui-button--ghost.is-on {
    background: color-mix(in srgb, var(--accent-primary) 20%, transparent);
    border-color: transparent;
    color: var(--accent-primary);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent-primary) 55%, transparent);
  }

  .ui-button--ghost.is-on:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent-primary) 30%, transparent);
    color: var(--accent-primary);
  }
</style>
