# UI-Komponenten (Schritt 2)

Bausteine des Design-Systems, Muster: `components/ui/` im Playlist-Generator. Alle Komponenten:

- `<script setup>` mit validierten Props, Vue 3.5.
- Styling ausschließlich über die Tokens aus `src/design-system/tokens.css`, scoped.
- Native Elemente (`<button>`, `<a>`, RouterLink, `<input type="range">`, Checkbox mit
  `role="switch"`), Fokus-Ring über `outline`.
- Icons als `AppIcon` im Default-Slot (Klasse `.icon` wird mitskaliert).
- Je ein Vitest unter `__tests__/`.

```js
import {
  SliderField,
  UiButton,
  UiDialog,
  UiIconButton,
  UiPanel,
  UiSegmentedControl,
  UiSwitch,
  UiToast,
} from '@/components/ui'
```

| Komponente     | Zweck                                           | Wichtige Props                                                                                                        |
| -------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `UiButton`     | Textbutton; `to` = RouterLink, `href` = Link    | `variant` secondary · primary · ghost · outline · danger, `size` sm · md · lg (30/36/44 px), `pressed`, `round`, `block` |
| `UiIconButton` | Quadratischer Icon-Button, `label` ist Pflicht  | `label` (wird aria-label und title), `variant`, `size` (Standard sm), `pressed`, `round`                              |
| `UiSwitch`     | Schalter (Checkbox mit `role="switch"`)         | `v-model` (Boolean), `label` (Pflicht), `labelHidden`, `disabled`, `id`                                               |
| `SliderField`  | Beschrifteter Regler mit Wertanzeige            | `v-model` (Number), `label` (Pflicht), `valueText`, `min`, `max`, `step`, `disabled`, `ariaLabel`, `ariaValueText`     |
| `UiSegmentedControl` | Umschalter mit genau einer gewählten Option (Radiogroup) | `v-model` (String oder Number), `options` `[{ value, label, title?, disabled? }]`, `label`, `variant` accent · surface, `size` sm · md · lg, `block` |
| `UiPanel` | Karten-Rahmen der Sidebar-Panels mit Kopfzeile | `title` (Pflicht), `icon`; Slots default, `actions`, `footer` |
| `UiDialog` | Modaler Dialog, teleportiert nach body | `open`, `title`, `closeLabel` (Pflicht), `icon`; Slots default, `footer`; Event `close` (Escape, Hintergrund, Button) |
| `UiToast` | Eine Benachrichtigung mit Statusfarbe | `message` (Pflicht), `type` info · success · warning · error |

`pressed` (true/false) setzt `aria-pressed` und den Zustand „an“: primary/secondary werden zur
Akzentfläche, ghost zur getönten Fläche (Shuffle, Repeat). Ohne `pressed` gibt es kein `aria-pressed`.

Weitere Attribute (`disabled`, `title`, `@click`, `aria-keyshortcuts`) fallen auf das native Element
durch. Zusätzliche Klassen des Aufrufers landen auf dem Root-Element; eigene Regeln dafür als
`.ui-button.meine-klasse` schreiben, damit sie die Komponenten-Styles sicher überstimmen.

`SliderField` gibt `update:modelValue`, `input` und `change` jeweils als Zahl weiter. `ariaLabel`
überschreibt den sichtbaren `label`-Text für Screenreader (z. B. mit eingesetztem Wert).

`UiSegmentedControl` folgt dem Radiogroup-Muster: Tab springt als Ganzes hinein, Pfeiltasten,
Pos1 und Ende wechseln und wählen. `variant="accent"` färbt die gewählte Option in der
Akzentfarbe (Quelle, Aufnahmeformat), `variant="surface"` hebt sie als Kartenfläche ab (Tabs der
App-Seite). `block` verteilt die Optionen gleich breit über die volle Breite, sonst ist der
Umschalter so breit wie sein Inhalt. `title` einer Option wird auch `aria-label`.

`UiPanel` stylt zwei Hilfsklassen für Slot-Inhalte: `.panel-badge` (kleine Pille) und
`.panel-section-label` (Beschriftung in Kapitälchen). `UiDialog` schließt nie selbst: der Aufrufer
hält `open` und reagiert auf `close`, so kann er z. B. während des Speicherns das Schließen
verweigern. Fokussiert der Aufrufer nach dem Öffnen selbst ein Element (`nextTick`), lässt der
Dialog es dort. `UiToast` ist nur die Fläche; Position, Dauer und Ein-/Ausblenden übernimmt
`components/Notification.vue` (`notify` aus AppPage).

### Regler-Anatomie `range.css`

Die Optik horizontaler Regler (Spur 4 px, Daumen 12 px, auf Smartphones 16 px) liegt in
`range.css` und wird nicht global geladen. Wer einen nackten `<input type="range">` außerhalb von
`SliderField` braucht (VolumeControl), bindet die Datei scoped ein und setzt die Klasse `.ui-range`:

```vue
<input type="range" class="ui-range" />

<style scoped src="./ui/range.css"></style>
```

Die vertikalen Regler in `equalizer/EqBands.vue` und `landing/HeroEqualizer.vue` haben weiterhin eigene Styles.

## Beispiel

```vue
<UiButton variant="primary" size="lg" to="/app">
  App starten
  <AppIcon name="arrow-right" />
</UiButton>

<UiIconButton :label="t.reset" @click="reset">
  <AppIcon name="undo" />
</UiIconButton>

<UiIconButton variant="ghost" :pressed="isShuffle" :label="t.player_shuffle" @click="toggleShuffle">
  <AppIcon name="shuffle" />
</UiIconButton>

<UiSwitch v-model="monitor" :label="t.input_monitor" :disabled="!monitorAllowed" />

<UiPanel icon="sliders" :title="t.dynamics">
  <template #actions>
    <UiIconButton :label="t.reset" @click="reset"><AppIcon name="undo" /></UiIconButton>
  </template>
  <span class="panel-section-label">{{ t.comp_params }}</span>
  …
</UiPanel>

<UiDialog :open="show" :title="t.dl_title" icon="download" :close-label="t.dl_cancel" @close="onCancel">
  …
  <template #footer>
    <UiButton @click="onCancel">{{ t.dl_cancel }}</UiButton>
    <UiButton variant="primary" @click="onConfirm">{{ t.dl_save }}</UiButton>
  </template>
</UiDialog>

<UiSegmentedControl
  v-model="activeTab"
  :options="[
    { value: 'source', label: t.app_tab_source },
    { value: 'eq', label: t.app_tab_eq },
  ]"
  :label="t.app_tabs_label"
  variant="surface"
  size="lg"
  block
/>

<SliderField
  v-model="threshold"
  :label="t.threshold"
  :value-text="`${threshold} dB`"
  :min="-60"
  :max="0"
  :step="1"
  @input="applySettings"
/>
```

## Schritt 2 ist abgeschlossen

Alle Bausteine aus dem Playlist-Generator-Muster, die der Equalizer braucht, liegen hier. Die in
`designTokens.spec.js` eingefrorenen Farb-Literale der restlichen Komponenten (AudioMeter,
equalizer/, recorder/, AppPage) werden in späteren Schritten abgebaut.
