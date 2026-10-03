<template>
  <section class="panel" :aria-labelledby="titleId">
    <header class="panel-header">
      <h3 :id="titleId" class="panel-title">
        <AppIcon v-if="icon" :name="icon" />
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
  import AppIcon from './AppIcon.vue'

  /**
   * Card shell shared by the sidebar panels: consistent header (icon, title,
   * right-aligned actions), body and optional footer.
   *
   * `icon` is a name from utils/icons.js. Header buttons use the global
   * .btn system (.btn.btn-icon.btn-sm, .is-on = on). Slotted helpers styled
   * here: .panel-badge (small pill), .panel-section-label (small caps label).
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
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2px;
    color: var(--text-primary, #fff);
  }

  .panel-title span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .panel-title .icon {
    color: var(--accent-primary, #00d9ff);
    width: 14px;
    height: 14px;
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
  :slotted(.panel-badge) {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10.5px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--accent-primary, #00d9ff);
    background: color-mix(in srgb, var(--accent-primary, #00d9ff) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent-primary, #00d9ff) 35%, transparent);
  }

  :slotted(.panel-section-label) {
    display: block;
    font-size: 10.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--text-muted, #8b8b9a);
  }

  @media (max-width: 600px) {
    .panel {
      padding: 10px;
    }
  }
</style>
