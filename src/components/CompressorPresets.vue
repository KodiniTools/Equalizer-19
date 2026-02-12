<template>
  <div class="comp-presets">
    <!-- Header -->
    <div class="presets-header">
      <span class="presets-title">Compressor Presets</span>
    </div>

    <!-- Preset Categories -->
    <div class="preset-categories">
      <!-- Basic -->
      <div class="preset-category">
        <span class="category-label">Basic</span>
        <div class="preset-buttons">
          <button
            v-for="preset in basicPresets"
            :key="preset"
            :class="['preset-btn', { active: activePreset === preset }]"
            @click="applyPreset(preset)"
          >
            {{ preset }}
          </button>
        </div>
      </div>

      <!-- Genre -->
      <div class="preset-category">
        <span class="category-label">Genre</span>
        <div class="preset-buttons">
          <button
            v-for="preset in genrePresets"
            :key="preset"
            :class="['preset-btn', { active: activePreset === preset }]"
            @click="applyPreset(preset)"
          >
            {{ preset }}
          </button>
        </div>
      </div>

      <!-- Instrument / Voice -->
      <div class="preset-category">
        <span class="category-label">Instrument</span>
        <div class="preset-buttons">
          <button
            v-for="preset in instrumentPresets"
            :key="preset"
            :class="['preset-btn', { active: activePreset === preset }]"
            @click="applyPreset(preset)"
          >
            {{ preset }}
          </button>
        </div>
      </div>

      <!-- Mastering -->
      <div class="preset-category">
        <span class="category-label">Mastering</span>
        <div class="preset-buttons">
          <button
            v-for="preset in masteringPresets"
            :key="preset"
            :class="['preset-btn', { active: activePreset === preset }]"
            @click="applyPreset(preset)"
          >
            {{ preset }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { COMP_PRESETS } from '../utils/presets'

const audioEngine = inject('audioEngine')

const activePreset = ref(null)

// Preset categories
const basicPresets = ['Gentle', 'Medium', 'Heavy']
const genrePresets = ['Rock', 'Pop', 'Electro', 'Jazz', 'Hip-Hop', 'Classical']
const instrumentPresets = ['Vocal', 'Drums', 'Bass', 'Podcast']
const masteringPresets = ['Master', 'Limiter']

function applyPreset(presetName) {
  const preset = COMP_PRESETS[presetName]
  if (!preset) return

  activePreset.value = presetName

  if (audioEngine && audioEngine.updateDynamics) {
    // Convert ms to seconds for attack and release
    audioEngine.updateDynamics({
      threshold: preset.th,
      ratio: preset.ra,
      knee: preset.kn,
      attack: preset.at / 1000,
      release: preset.re / 1000
    })
  }
}
</script>

<style scoped>
.comp-presets {
  background: var(--card-bg, #252530);
  border: 1px solid var(--border-color, #3a3a48);
  border-radius: 12px;
  padding: 12px;
}

.presets-header {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.presets-title {
  font-size: 0.75em;
  font-weight: 600;
  color: var(--text-secondary, #c8c8d5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preset-categories {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preset-category {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-label {
  font-size: 0.65em;
  font-weight: 500;
  color: var(--text-muted, #8b8b9a);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-btn {
  padding: 6px 10px;
  border: 1px solid var(--border-color, #3a3a48);
  background: var(--secondary-bg, #1a1a22);
  border-radius: 6px;
  color: var(--text-secondary, #c8c8d5);
  font-size: 0.65em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: var(--hover-bg, #323240);
  color: var(--text-primary, #fff);
  border-color: var(--accent-primary, #00d9ff);
}

.preset-btn.active {
  background: var(--accent-primary, #00d9ff);
  border-color: var(--accent-primary, #00d9ff);
  color: #000;
}

@media (max-width: 600px) {
  .comp-presets {
    padding: 10px;
  }

  .preset-btn {
    padding: 5px 8px;
    font-size: 0.6em;
  }

  .category-label {
    font-size: 0.6em;
  }

  .preset-categories {
    gap: 8px;
  }

  .preset-buttons {
    gap: 4px;
  }
}

@media (max-width: 400px) {
  .comp-presets {
    padding: 8px;
  }

  .preset-btn {
    padding: 4px 7px;
    font-size: 0.55em;
  }

  .presets-title {
    font-size: 0.7em;
  }
}
</style>
