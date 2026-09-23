<template>
  <section class="panel" :aria-labelledby="titleId">
    <header class="panel-header">
      <h3 :id="titleId" class="panel-title">
        <i v-if="icon" :class="icon" aria-hidden="true"></i>
        <span>{{ title }}</span>
      </h3>
      <div v-if="$slots.actions" class="panel-actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="panel-body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="panel-footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup>
  import { useId } from 'vue'

  /**
   * Card shell shared by the sidebar panels: consistent header (icon, title,
   * right-aligned actions), body and optional footer.
   *
   * Slotted helpers styled here: .panel-btn (square icon button, .active = on),
   * .panel-badge (small pill), .panel-section-label (small caps label).
   */
  defineProps({
    title: { type: String, required: true },
    icon: { type: String, default: '' },
  })

  const titleId = useId()
</script>

<style scoped>
  .panel {
    background: var(--card-bg, #252530);
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 28px;
  }

  .panel-title {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 0.75em;
    font-weight: 600;
    letter-spacing: 0.2px;
    color: var(--text-primary, #fff);
  }

  .panel-title span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .panel-title i {
    color: var(--accent-primary, #00d9ff);
    width: 14px;
    text-align: center;
  }

  .panel-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .panel-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .panel-footer {
    border-top: 1px solid var(--border-color, #3a3a48);
    padding-top: 10px;
  }

  /* ---- Slotted helpers ---- */
  :slotted(.panel-btn) {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-color, #3a3a48);
    background: var(--secondary-bg, #1a1a22);
    border-radius: 6px;
    color: var(--text-muted, #8b8b9a);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72em;
    transition:
      background 0.2s,
      color 0.2s,
      border-color 0.2s;
  }

  :slotted(.panel-btn:hover) {
    color: var(--text-primary, #fff);
    border-color: var(--accent-primary, #00d9ff);
  }

  :slotted(.panel-btn:focus-visible) {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 2px;
  }

  :slotted(.panel-btn.active) {
    background: var(--accent-primary, #00d9ff);
    border-color: var(--accent-primary, #00d9ff);
    color: var(--on-accent, #000);
  }

  :slotted(.panel-badge) {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.62em;
    font-weight: 600;
    white-space: nowrap;
    color: var(--accent-primary, #00d9ff);
    background: color-mix(in srgb, var(--accent-primary, #00d9ff) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent-primary, #00d9ff) 35%, transparent);
  }

  :slotted(.panel-section-label) {
    display: block;
    font-size: 0.6em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--text-muted, #8b8b9a);
  }

  @media (max-width: 600px) {
    .panel {
      padding: 10px;
    }

    :slotted(.panel-btn) {
      width: 34px;
      height: 34px;
    }
  }
</style>
