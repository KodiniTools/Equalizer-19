<template>
  <div class="history-controls" role="group" :aria-label="t.history_title">
    <button
      type="button"
      class="btn btn-icon btn-sm history-btn"
      :disabled="!canUndo"
      :title="undoTitle"
      :aria-label="undoTitle"
      :aria-keyshortcuts="'Control+Z Meta+Z'"
      @click="history.undo()"
    >
      <AppIcon name="undo" />
      <span v-if="undoDepth > 0" class="history-count" aria-hidden="true">{{ undoDepth }}</span>
    </button>
    <button
      type="button"
      class="btn btn-icon btn-sm history-btn"
      :disabled="!canRedo"
      :title="redoTitle"
      :aria-label="redoTitle"
      :aria-keyshortcuts="'Control+Shift+Z Control+Y Meta+Shift+Z'"
      @click="history.redo()"
    >
      <AppIcon name="redo" />
      <span v-if="redoDepth > 0" class="history-count" aria-hidden="true">{{ redoDepth }}</span>
    </button>
  </div>
</template>

<script setup>
  import { inject, computed, watch } from 'vue'
  import AppIcon from './AppIcon.vue'
  import { EQ_BAND_FREQUENCIES, formatFrequency } from '../utils/presets.js'

  /**
   * Undo / redo buttons for the processing history (EQ + compressor).
   * Tooltips name the step that would be reverted; every undo/redo – from
   * these buttons or the keyboard shortcuts – is announced via `notify`.
   */
  const { t } = inject('i18n')
  const history = inject('history')
  const notify = inject('notify', () => {})

  const { canUndo, canRedo, undoChange, redoChange, undoDepth, redoDepth, lastAction } = history

  /**
   * Turn a change descriptor (see utils/processingState.js) into text.
   */
  function describe(change) {
    const tr = t.value
    if (!change) return ''
    switch (change.type) {
      case 'eq-band':
        return tr.history_eq_band.replace(
          '{freq}',
          formatFrequency(EQ_BAND_FREQUENCIES[change.index])
        )
      case 'eq-curve':
        return tr.history_eq_curve
      case 'eq-bypass':
        return change.enabled ? tr.eq_active : tr.eq_bypassed
      case 'dyn-param':
        return tr.history_dyn_param.replace('{param}', tr[change.param] ?? change.param)
      case 'dyn-params':
        return tr.history_dyn_params
      case 'dyn-toggle':
        return change.enabled ? tr.history_dyn_on : tr.history_dyn_off
      default:
        return tr.history_mixed
    }
  }

  const undoTitle = computed(() =>
    canUndo.value
      ? `${t.value.history_undo_hint.replace('{action}', describe(undoChange.value))} (${t.value.key_ctrl}+Z)`
      : t.value.history_nothing_undo
  )

  const redoTitle = computed(() =>
    canRedo.value
      ? `${t.value.history_redo_hint.replace('{action}', describe(redoChange.value))} (${t.value.key_ctrl}+Shift+Z)`
      : t.value.history_nothing_redo
  )

  // Feedback for every undo/redo, whichever way it was triggered
  watch(lastAction, (action) => {
    if (!action) return
    const template = action.kind === 'undo' ? t.value.history_undone : t.value.history_redone
    notify(template.replace('{action}', describe(action.change)), 'info')
  })
</script>

<style scoped>
  .history-controls {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  /* Button look comes from the global .btn system; only the badge anchor is local */
  .history-btn {
    position: relative;
  }

  /* Number of available steps */
  .history-count {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--accent-primary, #00d9ff);
    color: var(--on-accent, #000);
    font-size: 10.5px;
    font-weight: 700;
    line-height: 16px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
</style>
