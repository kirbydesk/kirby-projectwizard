# Requirements — kirby-projectwizard

## Overview

Kirby CMS Plugin mit Panel GUI. Ersetzt das Python-basierte Scaffolding-Tool und die statisch generierte `pagewizard.php`. Ermöglicht die Verwaltung der Projekt- und Block-Konfiguration direkt im Kirby Panel — nicht nur initial, sondern auch bei späteren Änderungen.

## Abhängigkeiten

**kirby-pagewizard** ist eine Dependency von kirby-projectwizard (nicht umgekehrt).

Gewünschter Installations-Flow:
1. Frische Kirby-Installation
2. `kirby-projectwizard` installieren (via Composer)
3. projectwizard installiert/aktiviert alles andere — **inklusive kirby-pagewizard** und gewählte kirbyblock-* Plugins

Das Plugin definiert `kirbydesk/kirby-pagewizard` als Composer-Dependency in seiner `composer.json`.

## Phase 1 — Block-Config-Management (MVP)

### 1.1 Block-Erkennung
- Automatisches Erkennen installierter `kirbyblock-*` Plugins via Filesystem-Scan
- Lesen der Plugin-Defaults aus `src/config/settings.json`, `defaults.json`, `editor.json`
- Block-Typ-Erkennung via `pwConfig::register()` in der jeweiligen `index.php`

### 1.2 Panel UI — Übersicht
- Eigene Panel-Area "Project Wizard" mit Menüeintrag
- Karten-Grid aller erkannten Blocks
- Status pro Block: Default / Customized
- Verwaltung der aktiven Block-Liste (welche Blocks im Content-Tab verfügbar sind)

### 1.3 Panel UI — Block-Editor
- Pro Block editierbar:
  - **Tabs** — Welche Tabs aktiv sind (content, layout, style, effects, grid, settings)
  - **Fields** — Welche Felder pro Kategorie sichtbar sind (content, layout, style, effects, settings)
  - **Defaults** — Standardwerte pro Kategorie (padding, theme, alignment, heading-size, etc.)
  - **Editor** — Toolbar-Konfiguration (marks, nodes, headings)
- Visuelle Unterscheidung: Plugin-Default vs. Override
- Reset auf Plugin-Defaults möglich

### 1.4 Persistenz
- Overrides gespeichert als JSON: `content/_projectwizard/projectwizard.json`
- Format identisch mit bisheriger `pagewizard.php`-Rückgabe
- Einbindung via `config.php` (JSON-Read statt PHP-Include)

### 1.5 Kompatibilität
- Keine Änderungen an `kirby-pagewizard` nötig
- `pwConfig::load()` liest Overrides wie bisher via `option()`
- Kirby CMS v5.1+

## Phase 2 — Plugin-Installation & -Verwaltung (geplant)

- Plugin-Registry mit verfügbaren Plugins (analog `settings.json` im Python-Tool)
- Installation/Aktivierung/Update von kirbyblock-* Plugins über das Panel
- Verwaltung von Plugin-Abhängigkeiten (Composer require/update)
- Der projectwizard ist das zentrale **Installations- und Update-Tool** für das gesamte Ökosystem

## Phase 3 — Boilerplate & Build-Config-Generierung (geplant)

Alle Dateien die bisher vom Python-Tool generiert werden, soll das Plugin erzeugen und verwalten:

### Root-Level Build-Configs
- `package.json` — npm Scripts + Dependencies (Tailwind, kirbyup, terser, browser-sync)
- `composer.json` — Kirby + Plugin-Dependencies (Composer-Installer, VCS-Repos)
- `projectbuilder.php` — Kirby-Hook für Stub-Generierung (CSS/JS/Snippets/Templates)
- `build-js.config.js` — JS-Concat + Minify via terser
- `browser-sync.config.js` — Live-Reload Proxy (Valet)
- `kirbyup-sync.config.js` — Vue Panel-Component Watcher
- `.gitignore` — Projekt-spezifische Ignores (vendor, node_modules, stubs, content, storage)
- `.env` — VALET_HOST + API-Keys
- `BUILD.md` — Build-Dokumentation

### Public
- `public/index.php` — Kirby-Bootstrap (Composer-Variante mit autoload + Custom Roots)
- `public/functions.php` — Helper-Funktionen (cleanURL, cleanTel, generateUUID, excerpt, etc.)
- `public/.htaccess` — Rewrites, HTTPS, Security Headers, Gzip
- `public/robots.txt`
- `public/assets/fonts/` — Inter Variable Fonts

### Site/Config
- `site/config/config.php` — Haupt-Config (.env-Loading, Panel-Settings, pagewizard-Include)
- `site/config/config.{project}.test.php` — Dev-Config (debug, hooks, cache, mailhog)
- `site/config/panel.css` — Activation-Button verstecken

### Content (Initial)
- `content/site.txt`, `content/home/home.txt`, `content/error/error.txt`

### Valet-Integration
- `valet link` + optional `valet secure`

## Technische Rahmenbedingungen

- **Kirby CMS v5.1+** Plugin
- **kirbyup** für Vue Panel-Komponenten
- **Kein externes Tool** — alles läuft innerhalb von Kirby
- **Dual-Repo-Setup**: Entwicklung in `~/Projects/kirbydesk/`, Testing via Symlink in Projektverzeichnissen
- **Test-Projekt**: `~/Projects/atlas/` (Panel: https://atlas.test/panel)
