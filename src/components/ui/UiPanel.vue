<template>
  <section class="ui-panel" :aria-labelledby="titleId">
    <header class="ui-panel__header">
      <h3 :id="titleId" class="ui-panel__title">
        <AppIcon v-if="icon" :name="icon" />
        <span>{{ title }}</span>
      </h3>
      <div v-if="$slots.actions" class="ui-panel__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="ui-panel__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="ui-panel__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup lang="ts">
  import { useId } from 'vue'
  import AppIcon from '../AppIcon.vue'

  /**
   * Karten-Rahmen der Sidebar-Panels: Kopfzeile (Icon, Titel, Aktionen rechts),
   * Body und optionaler Footer. `icon` ist ein Name aus utils/icons.ts, Aktionen
   * sind UiIconButton (`pressed` = an).
   *
   * Hilfsklassen für Slot-Inhalte: .panel-badge (kleine Pille) und
   * .panel-section-label (kleine Kapitälchen-Beschriftung).
   */
  withDefaults(defineProps<{ title: string; icon?: string }>(), { icon: '' })

  const titleId = useId()
</script>

<style scoped>
  .ui-panel {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ui-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 28px;
  }

  .ui-panel__title {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2px;
    color: var(--text-primary);
  }

  .ui-panel__title span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ui-panel__title .icon {
    color: var(--accent-primary);
    width: 14px;
    height: 14px;
  }

  .ui-panel__actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .ui-panel__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .ui-panel__footer {
    border-top: 1px solid var(--border-color);
    padding-top: 10px;
  }

  /* ---- Hilfsklassen für Slot-Inhalte ---- */
  :slotted(.panel-badge) {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10.5px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--accent-primary);
    background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent);
  }

  :slotted(.panel-section-label) {
    display: block;
    font-size: 10.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--text-muted);
  }

  @media (max-width: 600px) {
    .ui-panel {
      padding: 10px;
    }
  }
</style>
