<template>
  <BasePanel icon="fas fa-microphone" :title="t.input_title">
    <template v-if="input.isActive.value" #actions>
      <span class="panel-badge live-badge">
        <span class="live-dot" aria-hidden="true"></span>{{ t.input_live_badge }}
      </span>
    </template>

    <!-- Source switch -->
    <div class="segmented" role="group" :aria-label="t.input_title">
      <button
        type="button"
        :class="{ active: input.mode.value === 'playlist' }"
        :aria-pressed="input.mode.value === 'playlist'"
        @click="input.setMode('playlist')"
      >
        {{ t.input_mode_playlist }}
      </button>
      <button
        type="button"
        :class="{ active: input.mode.value === 'input' }"
        :aria-pressed="input.mode.value === 'input'"
        @click="input.setMode('input')"
      >
        {{ t.input_mode_live }}
      </button>
    </div>

    <template v-if="input.mode.value === 'input'">
      <p v-if="!input.isSupported" class="msg error" role="alert">
        {{ t.input_err_unsupported }}
      </p>

      <template v-else>
        <!-- Device -->
        <div class="field">
          <label class="panel-section-label" :for="deviceSelectId">{{
            t.input_device_label
          }}</label>
          <div class="select-wrap">
            <select
              :id="deviceSelectId"
              class="device-select"
              :value="input.selectedDeviceId.value"
              :disabled="input.isStarting.value"
              @change="input.selectDevice($event.target.value)"
            >
              <option value="">{{ t.input_default }}</option>
              <option v-for="(d, i) in input.devices.value" :key="d.deviceId" :value="d.deviceId">
                {{ d.label || t.input_device_n.replace('{n}', i + 1) }}
              </option>
            </select>
            <i class="fas fa-chevron-down select-chevron" aria-hidden="true"></i>
          </div>
        </div>

        <!-- Start / stop -->
        <button
          v-if="!input.isActive.value"
          type="button"
          class="action-btn primary"
          :disabled="input.isStarting.value"
          @click="input.start()"
        >
          {{ input.isStarting.value ? t.input_starting : t.input_start }}
        </button>
        <button v-else type="button" class="action-btn" @click="input.stop()">
          {{ t.input_stop }}
        </button>

        <p
          v-if="input.isActive.value && input.activeLabel.value"
          class="msg status"
          aria-live="polite"
        >
          {{ t.input_active.replace('{name}', input.activeLabel.value) }}
        </p>

        <!-- Monitoring -->
        <div class="monitor">
          <label class="switch">
            <input
              type="checkbox"
              :checked="input.monitor.value"
              @change="input.setMonitor($event.target.checked)"
            />
            <span class="switch-track" aria-hidden="true"></span>
            <span class="switch-label">{{ t.input_monitor }}</span>
          </label>
          <p class="hint">{{ t.input_monitor_hint }} {{ t.input_record_hint }}</p>
        </div>

        <p v-if="input.errorKey.value" class="msg error" role="alert">
          {{ t[input.errorKey.value] }}
        </p>
      </template>
    </template>

    <template v-if="input.mode.value === 'input' && input.isSupported" #footer>
      <details class="help">
        <summary>
          <span>{{ t.input_help_title }}</span>
          <i class="fas fa-chevron-down chevron" aria-hidden="true"></i>
        </summary>
        <ol>
          <li>{{ t.input_help_1 }}</li>
          <li>{{ t.input_help_2 }}</li>
          <li>{{ t.input_help_3 }}</li>
        </ol>
        <p class="hint">{{ t.input_help_note }}</p>
      </details>
    </template>
  </BasePanel>
</template>

<script setup>
  import { inject, useId } from 'vue'
  import BasePanel from './BasePanel.vue'

  const { t } = inject('i18n')
  // Provided by AppPage (useInputSource)
  const input = inject('inputSource')

  const deviceSelectId = useId()
</script>

<style scoped>
  /* ---- Source switch ---- */
  .segmented {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    padding: 2px;
    border-radius: 8px;
    background: var(--secondary-bg, #1a1a22);
    border: 1px solid var(--border-color, #3a3a48);
  }

  .segmented button {
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-muted, #8b8b9a);
    font-size: 0.7em;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .segmented button:hover {
    color: var(--text-primary, #fff);
  }

  .segmented button.active {
    background: var(--accent-primary, #00d9ff);
    color: var(--on-accent, #000);
  }

  .segmented button:focus-visible {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 1px;
  }

  /* ---- Device select ---- */
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .select-wrap {
    position: relative;
  }

  .device-select {
    width: 100%;
    height: 32px;
    padding: 0 30px 0 10px;
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 8px;
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-primary, #fff);
    font-size: 0.72em;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    text-overflow: ellipsis;
  }

  .device-select:hover {
    border-color: var(--accent-primary, #00d9ff);
  }

  .device-select:focus-visible {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 1px;
  }

  .device-select option {
    background: var(--card-bg, #252530);
    color: var(--text-primary, #fff);
  }

  .select-chevron {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.6em;
    color: var(--text-muted, #8b8b9a);
    pointer-events: none;
  }

  /* ---- Buttons ---- */
  .action-btn {
    height: 34px;
    border-radius: 8px;
    border: 1px solid var(--border-color, #3a3a48);
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-primary, #fff);
    font-size: 0.72em;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 0.2s,
      border-color 0.2s;
  }

  .action-btn:hover:not(:disabled) {
    border-color: var(--accent-primary, #00d9ff);
  }

  .action-btn.primary {
    background: var(--accent-primary, #00d9ff);
    border-color: var(--accent-primary, #00d9ff);
    color: var(--on-accent, #000);
  }

  .action-btn.primary:hover:not(:disabled) {
    background: var(--accent-hover, #00c4e6);
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 2px;
  }

  /* ---- Live badge ---- */
  .live-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--error, #ef4444);
    animation: live-pulse 1.2s infinite;
  }

  @keyframes live-pulse {
    50% {
      opacity: 0.35;
    }
  }

  /* ---- Monitor switch ---- */
  .monitor {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .switch {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    width: fit-content;
  }

  .switch input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }

  .switch-track {
    position: relative;
    width: 32px;
    height: 18px;
    border-radius: 999px;
    background: var(--secondary-bg, #1a1a22);
    border: 1px solid var(--border-color, #3a3a48);
    transition: background 0.2s;
  }

  .switch-track::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--text-muted, #8b8b9a);
    transition:
      transform 0.2s,
      background 0.2s;
  }

  .switch input:checked + .switch-track {
    background: var(--accent-primary, #00d9ff);
    border-color: var(--accent-primary, #00d9ff);
  }

  .switch input:checked + .switch-track::after {
    transform: translateX(14px);
    background: var(--on-accent, #000);
  }

  .switch input:focus-visible + .switch-track {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 2px;
  }

  .switch-label {
    font-size: 0.72em;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  /* ---- Messages ---- */
  .hint {
    margin: 0;
    font-size: 0.62em;
    line-height: 1.5;
    color: var(--text-muted, #8b8b9a);
  }

  .msg {
    margin: 0;
    font-size: 0.66em;
    line-height: 1.5;
  }

  .msg.status {
    color: var(--text-secondary, #c8c8d5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .msg.error {
    padding: 8px 10px;
    border-radius: 8px;
    color: var(--error, #ef4444);
    background: color-mix(in srgb, var(--error, #ef4444) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--error, #ef4444) 35%, transparent);
  }

  /* ---- Help ---- */
  .help summary {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    list-style: none;
    font-size: 0.68em;
    font-weight: 500;
    color: var(--text-muted, #8b8b9a);
  }

  .help summary::-webkit-details-marker {
    display: none;
  }

  .help summary:hover {
    color: var(--text-primary, #fff);
  }

  .help summary:focus-visible {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 2px;
  }

  .help .chevron {
    margin-left: auto;
    font-size: 0.85em;
    transition: transform 0.2s;
  }

  .help[open] .chevron {
    transform: rotate(180deg);
  }

  .help ol {
    margin: 10px 0 8px;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.64em;
    line-height: 1.5;
    color: var(--text-secondary, #c8c8d5);
  }

  @media (prefers-reduced-motion: reduce) {
    .live-dot {
      animation: none;
    }
  }
</style>
