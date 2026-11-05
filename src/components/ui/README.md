# UI-Komponenten (Schritt 2)

Bausteine des Design-Systems, Muster: `components/ui/` im Playlist-Generator. Alle Komponenten:

- `<script setup>` mit validierten Props, Vue 3.5.
- Styling ausschließlich über die Tokens aus `src/design-system/tokens.css`, scoped.
- Native Elemente (`<button>`, `<a>`, RouterLink, `<input type="range">`, Checkbox mit
  `role="switch"`), Fokus-Ring über `outline`.
- Icons als `AppIcon` im Default-Slot (Klasse `.icon` wird mitskaliert).
- Je ein Vitest unter `__tests__/`.

```js
import { SliderField, UiButton, UiIconButton, UiSwitch } from '@/components/ui'
```

| Komponente     | Zweck                                           | Wichtige Props                                                                                                        |
| -------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `UiButton`     | Textbutton; `to` = RouterLink, `href` = Link    | `variant` secondary · primary · ghost · outline · danger, `size` sm · md · lg (30/36/44 px), `pressed`, `round`, `block` |
| `UiIconButton` | Quadratischer Icon-Button, `label` ist Pflicht  | `label` (wird aria-label und title), `variant`, `size` (Standard sm), `pressed`, `round`                              |
| `UiSwitch`     | Schalter (Checkbox mit `role="switch"`)         | `v-model` (Boolean), `label` (Pflicht), `labelHidden`, `disabled`, `id`                                               |
| `SliderField`  | Beschrifteter Regler mit Wertanzeige            | `v-model` (Number), `label` (Pflicht), `valueText`, `min`, `max`, `step`, `disabled`, `ariaLabel`, `ariaValueText`     |

`pressed` (true/false) setzt `aria-pressed` und den Zustand „an“: primary/secondary werden zur
Akzentfläche, ghost zur getönten Fläche (Shuffle, Repeat). Ohne `pressed` gibt es kein `aria-pressed`.

Weitere Attribute (`disabled`, `title`, `@click`, `aria-keyshortcuts`) fallen auf das native Element
durch. Zusätzliche Klassen des Aufrufers landen auf dem Root-Element; eigene Regeln dafür als
`.ui-button.meine-klasse` schreiben, damit sie die Komponenten-Styles sicher überstimmen.

`SliderField` gibt `update:modelValue`, `input` und `change` jeweils als Zahl weiter. `ariaLabel`
überschreibt den sichtbaren `label`-Text für Screenreader (z. B. mit eingesetztem Wert).

### Regler-Anatomie `range.css`

Die Optik horizontaler Regler (Spur 4 px, Daumen 12 px, auf Smartphones 16 px) liegt in
`range.css` und wird nicht global geladen. Wer einen nackten `<input type="range">` außerhalb von
`SliderField` braucht (VolumeControl), bindet die Datei scoped ein und setzt die Klasse `.ui-range`:

```vue
<input type="range" class="ui-range" />

<style scoped src="./ui/range.css"></style>
```

Die vertikalen Regler in `Equalizer.vue` und `HeroEqualizer.vue` haben weiterhin eigene Styles.

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

## Noch nicht enthalten (folgt in Schritt 2c und 2d)

- `UiSegmentedControl` (Tabs in AppPage, Modus-Umschalter in InputSource, Format-Wahl in
  RecorderControls).
- `UiPanel` (aus BasePanel), `UiDialog` (aus DownloadDialog), `UiToast` (aus Notification).
- Die in `designTokens.spec.js` eingefrorenen Farb-Literale werden mit diesen Komponenten abgebaut.
