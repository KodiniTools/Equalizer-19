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
      <p v-if="!input.isSupported && !input.systemAudioSupported" class="msg error" role="alert">
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
              <optgroup :label="t.input_group_inputs">
                <option value="">{{ t.input_default }}</option>
                <option v-for="(d, i) in input.devices.value" :key="d.deviceId" :value="d.deviceId">
                  {{ d.label || t.input_device_n.replace('{n}', i + 1) }}
                </option>
              </optgroup>
              <optgroup v-if="input.systemAudioSupported" :label="t.input_group_playback">
                <option :value="SYSTEM_AUDIO">{{ t.input_system_option }}</option>
              </optgroup>
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

        <p v-if="input.isActive.value && activeName" class="msg status" aria-live="polite">
          {{ t.input_active.replace('{name}', activeName) }}
        </p>

        <!-- Monitoring -->
        <div class="monitor">
          <label
            class="switch"
            :class="{ disabled: !input.monitorAllowed.value }"
            :title="input.monitorAllowed.value ? undefined : t.input_monitor_locked"
          >
            <input
              type="checkbox"
              :checked="input.monitor.value && input.monitorAllowed.value"
              :disabled="!input.monitorAllowed.value"
              @change="input.setMonitor($event.target.checked)"
            />
            <span class="switch-track" aria-hidden="true"></span>
            <span class="switch-label">{{ t.input_monitor }}</span>
          </label>
        </div>

        <p v-if="input.errorKey.value" class="msg error" role="alert">
          {{ t[input.errorKey.value] }}
        </p>
      </template>
    </template>

    <!-- Explanations live in the FAQ (section "Eingangsquelle") -->
    <template
      v-if="input.mode.value === 'input' && (input.isSupported || input.systemAudioSupported)"
      #footer
    >
      <router-link :to="{ path: '/faq', hash: '#eingang' }" class="help-link">
        {{ t.input_help_link }} <span aria-hidden="true">→</span>
      </router-link>
    </template>
  </BasePanel>
</template>

<script setup>
  import { inject, useId, computed } from 'vue'
  import BasePanel from './BasePanel.vue'
  import { SYSTEM_AUDIO } from '../composables/useInputSource'

  const { t } = inject('i18n')
  // Provided by AppPage (useInputSource)
  const input = inject('inputSource')

  const deviceSelectId = useId()

  // Name shown while live: device label, or "PC audio" for system audio
  const activeName = computed(() =>
    input.activeIsSystem.value ? t.value.input_system_option : input.activeLabel.value
  )
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

  .switch.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .switch-label {
    font-size: 0.72em;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  /* ---- Messages ---- */
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

  /* ---- Link to the FAQ ---- */
  .help-link {
    font-size: 0.68em;
    font-weight: 600;
    color: var(--accent-primary, #00d9ff);
    text-decoration: none;
  }

  .help-link:hover {
    text-decoration: underline;
  }

  .help-link:focus-visible {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 2px;
    border-radius: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    .live-dot {
      animation: none;
    }
  }
</style>
