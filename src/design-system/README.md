# Design-System · Tokens

Design-Tokens von Equalizer 19. Die Namen sind die Quellnamen der App
(`--accent-primary`, `--text-primary`, `--font-sans`, …); es gibt keinen eigenen Namespace.

| Datei                          | Zweck                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `tokens.css`                   | **Laufzeit-Quelle.** CSS Custom Properties: Dark auf `:root`, Light auf `html[data-theme='light']`, Kontrastmodus. Wird von `src/assets/style.css` importiert. |
| `tokens.json`                  | Maschinenlesbare Fassung (W3C-Design-Tokens-nah). Farben je Theme, dazu Skalen (Abstände, Schrift, Radien, Schatten, Bewegung) als Dokumentation der im Code verwendeten Werte. |
| `tokens.ts`                    | Zugriff aus TypeScript: `colorToken(theme, name)`, `themeColors(theme)`, `cssVar(name)`, `readCssVar(name)`; löst `{color.dark.--x}`-Aliase auf. |
| `__tests__/tokens.spec.ts`     | Konsistenz JSON ↔ CSS (dark, light, high-contrast, nav-light), Light-Gegenstücke, Verweise.            |
| `__tests__/designTokens.spec.ts` | Alle Styles unter `src/`: keine Literal-Fallbacks, nur definierte Variablen, keine neuen Farb-Literale. |
| `__tests__/tokenTestUtils.ts`  | Gemeinsame Helfer: CSS-Block-Parser, Style-Sammler.                                                     |

## Theme-Mechanik

`useTheme.ts` setzt `html[data-theme]` (Dark ist Standard, Light bei `data-theme='light'`); die
SSI-Partials lesen dasselbe Attribut. Beide Token-Selektoren treffen `<html>`, deshalb lösen
Tokens mit `var()`-Verweis (`--eq-boost`, `--eq-cut`) im Light-Theme automatisch um.

Der Block `[data-theme='light'] .global-nav` in `style.css` stellt die Light-Palette des externen
Nav-Partials nach; seine Variablen stehen in `tokens.json` unter `color.nav-light`.

## Verwenden

```css
.panel {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}
```

```js
import { colorToken, themeColors } from '@/design-system/tokens'

colorToken('dark', '--accent-primary') // '#c9984d'
themeColors('light')['--primary-bg'] // '#f6f2e8'
```

Keine Literal-Fallbacks (`var(--card-bg, #252530)`): `tokens.css` ist immer geladen, und ein
Fallback verdeckt nur Tippfehler. Der Test `designTokens.spec.ts` lehnt sie ab.

## Token hinzufügen oder ändern

1. Wert in `tokens.css` setzen (theme-abhängig in `:root` **und** `[data-theme='light']`).
2. Denselben Wert in `tokens.json` eintragen (`color.dark` / `color.light`).
3. `npm test` ausführen. Die Tests schlagen fehl bei Abweichungen zwischen JSON und
   CSS, fehlenden Light-Gegenstücken, Variablen ohne Definition und neuen Farb-Literalen in
   Komponenten.

## Offen (Schritt 2)

- 57 Farb-Literale in Komponenten und `style.css` (Overlays, Schatten, Meter-Farben,
  Status-Tints auf der App-Seite) sind in `designTokens.spec.ts` eingefroren und werden mit
  den Ui-Komponenten auf Tokens umgestellt.
- Die Skalen in `tokens.json` (`spacing`, `radius`, `shadow`, `motion`, …) sind noch keine
  CSS-Variablen; sie beschreiben die im Code verwendeten Werte.
