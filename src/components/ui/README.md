# UI-Komponenten (Schritt 2)

Bausteine des Design-Systems, Muster: `components/ui/` im Playlist-Generator. Alle Komponenten:

- `<script setup>` mit validierten Props, Vue 3.5.
- Styling ausschließlich über die Tokens aus `src/design-system/tokens.css`, scoped.
- Native Elemente (`<button>`, `<a>`, RouterLink), Fokus-Ring über `outline`.
- Icons als `AppIcon` im Default-Slot (Klasse `.icon` wird mitskaliert).
- Je ein Vitest unter `__tests__/`.

```js
import { UiButton, UiIconButton } from '@/components/ui'
```

| Komponente     | Zweck                                           | Wichtige Props                                                                                                        |
| -------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `UiButton`     | Textbutton; `to` = RouterLink, `href` = Link    | `variant` secondary · primary · ghost · outline · danger, `size` sm · md · lg (30/36/44 px), `pressed`, `round`, `block` |
| `UiIconButton` | Quadratischer Icon-Button, `label` ist Pflicht  | `label` (wird aria-label und title), `variant`, `size` (Standard sm), `pressed`, `round`                              |

`pressed` (true/false) setzt `aria-pressed` und den Zustand „an“: primary/secondary werden zur
Akzentfläche, ghost zur getönten Fläche (Shuffle, Repeat). Ohne `pressed` gibt es kein `aria-pressed`.

Weitere Attribute (`disabled`, `title`, `@click`, `aria-keyshortcuts`) fallen auf das native Element
durch. Zusätzliche Klassen des Aufrufers landen auf dem Root-Element; eigene Regeln dafür als
`.ui-button.meine-klasse` schreiben, damit sie die Komponenten-Styles sicher überstimmen.

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
```

## Noch nicht enthalten (folgt in Schritt 2b bis 2d)

- `UiSwitch` (Checkbox in InputSource), `SliderField` (Regler in Equalizer, DynamicsProcessor,
  VolumeControl), `UiSegmentedControl` (Tabs in AppPage, Modus-Umschalter in InputSource,
  Format-Wahl in RecorderControls).
- `UiPanel` (aus BasePanel), `UiDialog` (aus DownloadDialog), `UiToast` (aus Notification).
- Die in `designTokens.spec.js` eingefrorenen Farb-Literale werden mit diesen Komponenten abgebaut.
