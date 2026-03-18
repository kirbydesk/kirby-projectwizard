# Plan: defaults.json in settings.json zusammenführen

## Context

Jedes kirbyblock-* Plugin hat aktuell 3 Config-Dateien: `settings.json` (Optionen/UI-Schema), `defaults.json` (Default-Werte), `editor.json` (Editor-Config). Die Defaults sollen in `settings.json` integriert werden, damit es nur noch eine Quelle gibt. Gleichzeitig wird die Override-Speicherung des Projectwizards von Einzel-Dateien pro Block auf eine zentrale `overrides.json` umgestellt. Required-Support mit `*` Labels kommt mit.

## Entscheidungen

- **Harter Cut** — kein Dual-Format, alle Plugins gleichzeitig migrieren
- **Multicolumn**: ein Default für beide Seiten (left/right), separate Werte nur als Override
- **Override-Speicherung**: eine zentrale `overrides.json` statt Verzeichnisse pro Block
- **blocks.json**: bleibt offen — könnte später Content-Blueprint steuern (verfügbare Blöcke + Reihenfolge)

---

## Neues settings.json Format

Felder mit Optionen werden zu Objekten mit `options`, `default`, optional `required`:

```json
{
  "tabs": { "layout": true, "style": true, "grid": true, "settings": true },
  "fields": {
    "content": {
      "heading": {
        "align": { "options": ["left", "center", "right"], "default": "left" },
        "level": { "options": ["h1", "h2", "h3", "h4"], "default": "h2" },
        "sizes": { "options": ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"], "default": "lg" }
      }
    },
    "layout": {
      "padding": "enabled",
      "padding-top": { "default": "large" },
      "padding-bottom": { "default": "large" },
      "padding-left": { "default": true },
      "padding-right": { "default": true },
      "radius": "enabled",
      "radius-top-left": { "default": false },
      "radius-top-right": { "default": false },
      "radius-bottom-left": { "default": false },
      "radius-bottom-right": { "default": false }
    },
    "style": {
      "theme": { "options": ["default", "variant", "variant2", "custom"], "required": true, "default": "default" }
    },
    "grid": {
      "grid-size-sm": { "default": 12 },
      "grid-size-md": { "default": 12 },
      "grid-size-lg": { "default": 12 },
      "grid-size-xl": { "default": 12 },
      "grid-offset-sm": { "default": 0 },
      "grid-offset-md": { "default": 0 },
      "grid-offset-lg": { "default": 0 },
      "grid-offset-xl": { "default": 0 }
    },
    "settings": {
      "fragment": "enabled",
      "block-size": { "default": "content" },
      "margin-top": { "default": false },
      "margin-bottom": { "default": false }
    }
  }
}
```

**Regeln:**
- `"enabled"` = Feld verfügbar, kein konfigurierbarer Default (Projectwizard kann es abschalten)
- Nicht angegeben = Feld gibt es nicht für diesen Block
- `{ "options": [...], "default": "..." }` = Options mit Default
- `{ "default": ... }` = Nur Default, keine Options (Boolean, String, Number)
- `{ ..., "required": true }` = Pflichtfeld, kann nicht leer sein
- Plain Array `[...]` = Nur bei speziellen Fällen wie `column-blocks`

## Neue Override-Speicherung

```
site/config/projectwizard/
├── blocks.json          (aktive Blöcke — bleibt)
├── overrides.json       (alle Block-Overrides zentral)
├── colors.json          (globale + pro-Block Farb-Overrides)
```

Format `overrides.json`:
```json
{
  "pwhero": {
    "settings": { ... },
    "editor": { ... }
  },
  "pwtext": {
    "settings": { ... }
  }
}
```

Format `colors.json`:
```json
{
  "global": {
    "default": {
      "block-background": "#ffffff",
      "element-heading-text": "#262626",
      "element-tagline-text": "#1D548B",
      "element-button-background": "#1D548B"
    },
    "variant": {
      "block-background": "#1D548B",
      "element-heading-text": "#ffffff"
    },
    "variant2": {
      "block-background": "#2C3E50",
      "element-heading-text": "#ffffff"
    }
  },
  "blocks": {
    "pwhero": {
      "default": {
        "element-heading-text": "#ff0000"
      }
    }
  }
}
```

**Farb-Architektur:**
- Plugin-Defaults liegen als JSON in `kirby-pagewizard/config/colors.json`
- Die CSS-Regeln (Selektoren → `var(--element-*)`) ändern sich nie — nur die Variablen-Werte
- Global-Overrides überschreiben `:root`-Werte für alle Blöcke
- Block-Overrides werden als `section[data-block="hero"] { --element-heading-text: #ff0000; }` generiert
- Gespeicherte JSON-Werte → generierte CSS-Datei (z.B. `colors-override.css`) die vom Build eingebunden wird

## Color-Editor

Der Projectwizard bekommt einen Color-Editor für Farbvariablen. Die Plugin-Defaults liegen als JSON in `kirby-pagewizard/config/colors.json`. Der Projectwizard liest diese Defaults, zeigt Color-Picker, und speichert Overrides in `site/config/projectwizard/colors.json`.

**Aufspaltung von `colors.css`:**
- Farbwerte (bisher `:root`-Variablen) → `kirby-pagewizard/config/colors.json` (Plugin-Defaults, JSON)
- CSS-Regeln (Selektoren mit `var(--*)`) → bleiben in `src/css/colors.css` im Stub-System
- Gleiches Prinzip für weitere CSS-Dateien mit Variablen (`body.css`, `media.css`) — wird später entschieden

**Generierter Output:** Aus den JSON-Overrides wird eine CSS-Datei generiert (z.B. `colors-override.css`) mit `:root`-Overrides + block-spezifischen Scopes, die vom Build eingebunden wird.

**PHP/JS/Snippet-Stubs bleiben im Filesystem** — diese werden weiterhin manuell per Underscore-Rename + Texteditor bearbeitet.

### Tabs im Projectwizard

**Global-Ansicht:**
- **"Elements"**: Aktive Blöcke (besteht bereits)
- **"Colors"**: Color-Picker für `:root`-Variablen (Element- und Block-Farben)

**Block-Ansicht:**
- **"Settings"**: Block-Config (besteht bereits)
- **"Colors"**: Color-Picker für block-spezifische Variablen-Overrides

---

## Implementierung

### Phase 1: pwConfig::load() anpassen + Block-Plugins migrieren
**Dateien:** `kirby-pagewizard/src/helpers/blocks/config.php`, alle `kirbyblock-*/src/config/settings.json` + `defaults.json`

Harter Cut — alles in einem Schritt:

**pwConfig::load():**
- `defaults.json` Lese-Logik entfernen
- Neue Methoden zum Extrahieren von Defaults aus dem Objekt-Format:
  - `extractContentDefaults()` — liest `default` aus Content-Feld-Objekten, mappt `sizes`→`size`
  - `extractCategoryDefaults()` — liest `default` aus Layout/Style/Grid/Settings/Effects
  - `extractCategoryOptions()` — liest `options` Arrays aus Kategorie-Feldern
  - `"enabled"`-Werte erkennen und korrekt behandeln
- Return-Format von `load()` bleibt identisch → **Blueprints brauchen null Änderungen**

**Alle 8 Blocks migrieren** (einfach → komplex):
1. kirbyblock-heading
2. kirbyblock-quote
3. kirbyblock-media
4. kirbyblock-text
5. kirbyblock-featurelist
6. kirbyblock-hero (hat effects)
7. kirbyblock-cardlets (hat item-* Felder)
8. kirbyblock-multicolumn (hat column-blocks, left/right)

Pro Block: defaults.json Werte in settings.json Objekt-Format einbauen, defaults.json löschen.

### Phase 2: ProjectConfig.php anpassen
**Datei:** `kirby-projectwizard/src/classes/ProjectConfig.php`

- `detectBlocks()`: `defaults` Key entfernen, nur noch `settings` + `editor`
- `loadBlockOverrides()`: Liest aus `overrides.json` statt Einzel-Dateien
- `saveBlockOverrides()`: Schreibt in `overrides.json`
- `mergedConfig()`: Anpassen für neues Format — muss Defaults aus Objekt-Format extrahieren + Overrides mergen
- `"enabled"`-Handling: Overrides können `"enabled"`-Felder abschalten (Override `false` → Feld deaktiviert)
- Alte Verzeichnis-Struktur (`blocks/{blockType}/*.json`) Migration/Cleanup

### Phase 3: FieldRow.vue — Required-Support
**Datei:** `kirby-projectwizard/src/views/components/FieldRow.vue`

- Neues Prop: `required: Boolean`
- Label bekommt `*` Suffix bei required
- CSS: `.pw-field-required { color: var(--color-negative-600) }`

### Phase 4: Overview.vue anpassen
**Datei:** `kirby-projectwizard/src/views/Overview.vue`

- `getContentFields()`: Defaults direkt aus Feld-Objekten lesen statt separatem `defaults.content`
- `getCategories()`: Defaults aus `settings.fields.{cat}` Objekten extrahieren
- `getItemFields()`: Gleiches Muster
- Override-Pfade: `defaults.content.heading.align` → `settings.fields.content.heading.align.default`
- `"enabled"`-Felder: Toggle an/aus im Projectwizard
- Required-Support in Toggle-Feldern (nutzt `required`-Prop aus Phase 3)

### Phase 5: colors.css aufsplitten
**Dateien:** `kirby-pagewizard/src/css/colors.css`, `kirby-pagewizard/config/colors.json`

- `:root`-Variablen (Farbwerte, Zeile 9-109) extrahieren → `config/colors.json`
- CSS-Regeln (Selektoren, Zeile 112-411) bleiben in `src/css/colors.css`
- **Kritisch:** `projectbuilder.php` / Tailwind-Build anpassen: `colors.json` → generierte `:root`-Variablen in CSS einbinden (ohne das sind alle Farben weg)

### Phase 6: Color-Editor — Daten & API
**Dateien:** `ProjectConfig.php`, `api.php`

- Default-Farbwerte aus `kirby-pagewizard/config/colors.json` lesen
- Variablen-Gruppen: body/footer (`--body-*`, `--footer-*`), block (`--block-*`), elements (`--element-*`)
- Pro Theme (default, variant, variant2) getrennte Werte
- `loadColors()` / `saveColors()` für `colors.json`
- API-Endpunkte: `GET/POST projectwizard/colors`
- CSS-Generator: JSON → `colors-override.css` mit `:root`-Overrides + Block-spezifische Scopes

### Phase 7: Color-Editor — UI
**Dateien:** `Overview.vue`, neue Komponente `ColorEditor.vue`

- **Global-Tab "Colors"**: Alle `:root`-Variablen als Color-Picker, gruppiert (Body, Block, Elements, Buttons)
- **Per-Block "Colors"-Tab**: Block-spezifische Farb-Overrides, erbt visuell Global-Defaults
- Pro Theme (default/variant/variant2) eigene Spalte oder Tab
- Reset pro Farbe / pro Gruppe / komplett auf Plugin-Default

### Phase 8: Bestehende Projekte migrieren
- sandbox + kirbydesk: gespeicherte Override-Dateien in neues Format konvertieren
- Alte `blocks/{blockType}/` Verzeichnisse aufräumen
- Bestehende `_colors.css` Patch-Werte nach `colors.json` migrieren (sofern aktiviert)

---

## Verifizierung

1. Block im Panel öffnen → Felder korrekt, Defaults richtig gesetzt
2. Projectwizard → Alle Blöcke sichtbar, Options + Defaults + Unterstreichung korrekt
3. Override speichern → Reload → Override korrekt geladen
4. Reset → Plugin-Defaults wiederhergestellt
5. Required-Felder → `*` Label, nicht deselektierbar
6. Multicolumn → column-blocks, left/right Content-Felder funktionieren
7. Cardlets → item-* Felder funktionieren
8. Global Colors → Farbwerte editieren → generierte CSS korrekt
9. Per-Block Colors → Block-spezifische Overrides → CSS mit korrektem Scope
10. Color Reset → Plugin-Defaults wiederhergestellt
