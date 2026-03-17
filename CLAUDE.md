# CLAUDE.md

This file provides guidance to Claude Code when working with this plugin.

## What This Is

**kirby-projectwizard** is a Kirby CMS v5.1+ plugin that provides a Panel UI for managing project configuration. It replaces the former Python-based scaffolding tool and the static `pagewizard.php` config file with a persistent, Panel-editable configuration system.

## Plugin Ecosystem

This plugin works alongside:
- **kirby-pagewizard** — The core page builder plugin. Reads block config via `option('kirbydesk.pagewizard.kirbyblocks.{blockType}')`. Has a `pwConfig` class that merges plugin defaults with project overrides.
- **kirbyblock-*** — Individual block plugins (hero, text, media, etc.). Each ships with `src/config/settings.json`, `defaults.json`, `editor.json` defining their default configuration.

## Architecture

### Data Flow
```
kirbyblock-* plugins (src/config/*.json defaults)
       ↓
projectwizard reads defaults + shows in Panel UI
       ↓
User edits overrides → saved to content/_projectwizard/projectwizard.json
       ↓
config.php reads JSON → Kirby options
       ↓
pwConfig::load() picks up overrides seamlessly
```

### Key Directories
- `src/extensions/` — Kirby extension points (api.php, areas.php)
- `src/classes/` — PHP classes (ProjectConfig.php)
- `src/views/` — Vue panel components (kirbyup)
- `src/views/components/` — Reusable Vue sub-components

### Config Storage
Overrides are stored as JSON in `content/_projectwizard/projectwizard.json`. The format is identical to what `pagewizard.php` used to return, so `pwConfig::load()` works without changes.

### Block Detection
`ProjectConfig::detectBlocks()` scans `site/plugins/kirbyblock-*` directories, reads their `src/config/` JSON files, and extracts block types via `pwConfig::register()` calls in each block's `index.php`.

## Commands

```bash
npx kirbyup src/index.js              # Build Vue panel components (one-time)
npx kirbyup src/index.js --watch      # Watch mode for development
```

## Development Setup

The plugin is developed in `~/Projects/kirbydesk/site/plugins/kirby-projectwizard` and symlinked into project directories (sandbox, etc.) for testing.

## Related Projects
- `~/Projects/kirbydesk/site/plugins/kirby-pagewizard` — Core pagewizard plugin
- `~/Projects/kirbydesk/site/plugins/kirbyblock-*` — Block plugins
- `~/Projects/sandbox/` — Reference project showing current working state
- `~/Projects/kirby-projectwizard-python/` — Original Python tool (being replaced)
