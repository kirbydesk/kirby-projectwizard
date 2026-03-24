# Kirbydesk — Frische Projektinstallation (Setup-Dokumentation)

Alle manuellen Schritte für eine neue Kirby-Installation mit dem kirbydesk-Ökosystem.
Dient als Grundlage für **Phase 2** (Automatisierung via Projectwizard).

Struktur entspricht dem atlas-Projekt (public/-Unterordner, storage/).

---

## Schritt 1 — Projektverzeichnis anlegen

```bash
mkdir ~/Projects/projektname
cd ~/Projects/projektname
```

---

## Schritt 2 — composer.json anlegen

Datei: `composer.json` im Projektstamm.

```json
{
  "name": "projektname/project",
  "description": "Kirby CMS project",
  "type": "project",
  "license": "proprietary",
  "config": {
    "allow-plugins": {
      "getkirby/composer-installer": true
    },
    "optimize-autoloader": true,
    "preferred-install": "dist",
    "sort-packages": true
  },
  "extra": {
    "kirby-cms-path": "kirby",
    "kirby-plugins-path": "site/plugins"
  },
  "minimum-stability": "dev",
  "prefer-stable": true,
  "require": {
    "getkirby/cms": "^5.0",
    "getkirby/composer-installer": "^1.0",
    "kirbydesk/kirby-projectwizard": "^1.0",
    "kirbydesk/kirby-pagewizard": "^1.0",
    "kirbydesk/kirbyblock-hero": "^1.0",
    "kirbydesk/kirbyblock-heading": "^1.0",
    "kirbydesk/kirbyblock-text": "^1.0",
    "kirbydesk/kirbyblock-quote": "^1.0",
    "kirbydesk/kirbyblock-cardlets": "^1.0",
    "kirbydesk/kirbyblock-featurelist": "^1.0",
    "kirbydesk/kirbyblock-media": "^1.0",
    "kirbydesk/kirbyblock-multicolumn": "^1.0"
  }
}
```

> `kirby-projectwizard` zieht `kirby-pagewizard` automatisch mit. Beide können
> explizit gelistet werden (wie oben) oder nur `kirby-projectwizard`.

---

## Schritt 3 — Composer install ausführen

```bash
composer install
```

Installiert:
- Kirby CMS nach `kirby/`
- Alle Plugins nach `site/plugins/`
- Autoloader nach `vendor/`

---

## Schritt 4 — Verzeichnisstruktur anlegen

```bash
# Public (Document Root für Valet/Webserver)
mkdir -p public/assets/css
mkdir -p public/assets/js
mkdir -p public/assets/fonts
mkdir -p public/media

# Storage (außerhalb des Web-Roots)
mkdir -p storage/cache
mkdir -p storage/sessions
mkdir -p storage/temp
```

---

## Schritt 5 — public/index.php anlegen

Datei: `public/index.php`

```php
<?php

// Autoloader (Composer)
require __DIR__ . '/../vendor/autoload.php';

// Kirby initialization
$kirby = new Kirby([
    'roots' => [
        'index'     => __DIR__,
        'content'   => dirname(__DIR__) . '/content',
        'site'      => dirname(__DIR__) . '/site',
        'cache'     => dirname(__DIR__) . '/storage/cache',
        'sessions'  => dirname(__DIR__) . '/storage/sessions',
        'logs'      => dirname(__DIR__) . '/storage/logs',
        'temp'      => dirname(__DIR__) . '/storage/temp',
        'assets'    => __DIR__ . '/assets',
        'media'     => __DIR__ . '/media',
    ]
]);

// Custom functions
include_once(kirby()->roots()->index() . '/functions.php');

echo $kirby->render();
```

> Alle Roots werden hier zentral definiert — nicht in config.php.
> `temp` wird vom `projectbuilder.php`-Hook für Tailwind-CSS-Generierung benötigt.

---

## Schritt 6 — public/.htaccess anlegen

Datei: `public/.htaccess`

```apache
# Kirby .htaccess

<IfModule mod_rewrite.c>
RewriteEngine on

# Force Redirect to https and non-www
RewriteCond %{HTTP_HOST} !=localhost
RewriteCond %{HTTP_HOST} ^www\. [NC,OR]
RewriteCond %{HTTPS} off
RewriteCond %{HTTP_HOST} ^(?:www\.)?(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L,NE]

# Block dotfiles (except .well-known)
RewriteRule (^|/)\.(?!well-known\/) index.php [L]

# Block direct access to content, site and kirby folders
RewriteRule ^content/(.*) index.php [L]
RewriteRule ^site/(.*) index.php [L]
RewriteRule ^kirby/(.*) index.php [L]

# Make site links work
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*) index.php [L]
</IfModule>

# Pass Authorization header to PHP
SetEnvIf Authorization "(.+)" HTTP_AUTHORIZATION=$1

# Compress text responses
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/plain
AddOutputFilterByType DEFLATE text/html
AddOutputFilterByType DEFLATE text/css
AddOutputFilterByType DEFLATE text/javascript
AddOutputFilterByType DEFLATE application/json
AddOutputFilterByType DEFLATE application/javascript
AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Security headers
<IfModule mod_headers.c>
Header set Content-Type "text/plain" "expr=-z %{CONTENT_TYPE}"
Header set X-Content-Type-Options "nosniff"
</IfModule>
```

---

## Schritt 7 — public/robots.txt anlegen

Datei: `public/robots.txt`

```
User-agent: *
Allow: /
```

---

## Schritt 8 — public/functions.php anlegen

Datei: `public/functions.php`

Enthält Helper-Funktionen: `cleanURL()`, `cleanTel()`, `generateUUID()`, `excerpt()`, `human_filesize()`, `startsWith()`.

Vorlage: aus dem atlas-Projekt kopieren (`public/functions.php`).

---

## Schritt 9 — Valet einrichten

```bash
cd ~/Projects/projektname
valet link projektname
valet secure projektname
```

Danach erreichbar unter: `https://projektname.test`

> Valet erkennt den `public/`-Unterordner automatisch als Document Root.
> Kein spezielles Flag oder Neulink nötig.

---

## Schritt 10 — .env anlegen

Datei: `.env` im Projektstamm.

```
VALET_HOST=projektname.test
```

---

## Schritt 11 — .gitignore anlegen

Datei: `.gitignore` im Projektstamm.

```gitignore
# General
Icon
.DS_Store

# Editors
*.sublime-workspace
/.vscode
/.idea

# Composer
/vendor
/site/plugins/*
!/site/plugins/site-*

# Node
node_modules/
package-lock.json

# Plugin Stub files
site/patches/css/*/_*.css
site/patches/js/_*.js
site/snippets/_*.php
site/snippets/blocks/_*.php
site/templates/_*.php

# Temporary files
/public/media/*
!/public/media/index.html

# Lock files
.lock

# Content
/content

# Cache / Storage
/storage/*

# Accounts
/site/accounts/*
!/site/accounts/index.html

# Env
.env
```

---

## Schritt 12 — site/config/config.php anlegen

Datei: `site/config/config.php`

```php
<?php

return [

    /** Panel settings */
    'panel' => [
        'install' => true,
        'css' => 'assets/css/panel.min.css'
    ],

    /** PLUGIN: Kirby Pagewizard */
    'kirbydesk.pagewizard.protected' => '',
    'ready' => fn($kirby) => [
        'kirbydesk.pagewizard.reloadOnSave' => $kirby->user() !== null,
    ],

    /** Keine Update-Checks für kirbydesk-Plugins (nicht im Kirby Marketplace) */
    'updates' => [
        'plugins' => [
            'kirbydesk/*' => false,
        ],
    ],

];
```

> Roots werden NICHT hier definiert — die stehen alle in `public/index.php`.

---

## Schritt 13 — Dev-Config anlegen

Datei: `site/config/config.projektname.test.php`
(Kirby lädt diese automatisch wenn die Domain `projektname.test` ist)

```php
<?php

return [

    /** Dev-Einstellungen */
    'debug' => true,
    'hooks' => require __DIR__ . '/../plugins/kirby-projectwizard/projectbuilder.php',
    'cache' => [
        'pages' => [
            'active' => false,
        ],
    ],

    /** Mehrsprachigkeit */
    'languages' => true,

    /** Lokale Mailhog-Konfiguration */
    'email' => [
        'transport' => [
            'type'     => 'smtp',
            'host'     => 'localhost',
            'port'     => 1025,
            'security' => false
        ]
    ]

];
```

---

## Schritt 14 — Panel aufrufen & Admin-Account anlegen

Browser: `https://projektname.test/panel`

- Ersten Admin-Account anlegen (E-Mail + Passwort)
- Danach `'install' => true` aus `config.php` entfernen

---

## Schritt 15 — Projectwizard im Panel konfigurieren

- Im Panel unter "Project Wizard" gewünschte Blocks aktivieren
- Tabs, Fields und Defaults pro Block einstellen
- Wird gespeichert unter `site/config/projectwizard/overrides.json`

---

## Schritt 16 — Scaffold-Dateien kopieren

Die Build-Konfigurationsdateien liegen als Templates im Plugin unter `src/scaffold/`.

```bash
SCAFFOLD=site/plugins/kirby-projectwizard/src/scaffold

# package.json — Platzhalter ersetzen
sed 's/{{PROJECT_NAME}}/projektname/g' "$SCAFFOLD/templates/package.json" > package.json

# Build-Configs direkt kopieren
cp "$SCAFFOLD/copy/build-js.config.js" build-js.config.js
cp "$SCAFFOLD/copy/kirbyup-sync.config.js" kirbyup-sync.config.js

# Panel CSS
cp "$SCAFFOLD/copy/site/config/panel.css" site/config/panel.css
```

**Was kopiert wird:**
- `package.json` — npm Scripts + Dependencies (Tailwind, kirbyup, terser etc.)
- `build-js.config.js` — JS-Concat + Minify via terser
- `kirbyup-sync.config.js` — Vue Panel-Component Watcher für alle Plugins
- `site/config/panel.css` — Panel-CSS (wird zu `public/assets/css/panel.min.css` gebaut)

---

## Schritt 17 — npm install

```bash
npm install
```

---

## Schritt 18 — Initiale Content-Dateien anlegen

Kirby benötigt mindestens `site.txt`, `home/home.txt` und `error/error.txt` um die Seite aufrufen zu können.

Die Vorlagen liegen im Scaffold-Ordner des Plugins unter `src/scaffold/copy/content/`.

```bash
SCAFFOLD=site/plugins/kirby-projectwizard/src/scaffold

mkdir -p content/home content/error

# site.txt — Platzhalter ersetzen
sed 's/{{PROJECT_TITLE}}/Projektname/g' "$SCAFFOLD/copy/content/site.txt" > content/site.txt

cp "$SCAFFOLD/copy/content/home/home.txt" content/home/home.txt
cp "$SCAFFOLD/copy/content/error/error.txt" content/error/error.txt
```

Inhalt der Dateien:

`content/site.txt` — Sitetitel (Platzhalter `{{PROJECT_TITLE}}`)
`content/home/home.txt` — leere Homepage
`content/error/error.txt` — leere Fehlerseite

---

## Schritt 19 — Erste Seite aufrufen (projectbuilder-Hook)

Browser: `https://projektname.test`

Der `projectbuilder.php`-Hook läuft automatisch beim ersten Aufruf im Debug-Modus und erstellt:
- Alle fehlenden Verzeichnisse (`site/patches/`, `site/snippets/`, `site/templates/` etc.)
- CSS- und JS-Stubs für alle installierten Plugins in `site/patches/`
- Snippet- und Template-Stubs in `site/snippets/` und `site/templates/`
- `storage/temp/tailwind.css` mit allen `@import`- und `@source`-Direktiven

---

## Schritt 20 — npm run dev

```bash
npm run dev
```

Startet parallel:
- `tailwindWatch` — Tailwind CSS aus `storage/temp/tailwind.css` → `public/assets/css/site.min.css`
- `panelWatch` — Panel CSS aus `site/config/panel.css` → `public/assets/css/panel.min.css`
- `kirbyupSynced` — Vue Panel-Komponenten rebuilden bei Änderungen

---

## Ergebnis — vollständige Dateistruktur

```
projektname/
├── .env
├── .gitignore
├── composer.json
├── composer.lock
├── package.json                ← Schritt 16 (Scaffold)
├── build-js.config.js          ← Schritt 16 (Scaffold)
├── kirbyup-sync.config.js      ← Schritt 16 (Scaffold)
├── node_modules/
├── kirby/
├── vendor/
├── content/
├── storage/
│   ├── cache/
│   ├── sessions/
│   └── temp/
├── public/                     ← Document Root (Valet)
│   ├── .htaccess
│   ├── index.php               ← Kirby Bootstrap + alle Roots
│   ├── functions.php
│   ├── robots.txt
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── fonts/
│   └── media/
└── site/
    ├── accounts/
    ├── config/
    │   ├── config.php
    │   ├── config.projektname.test.php
    │   └── projectwizard/
    │       ├── .initialized
    │       └── overrides.json  ← nach Schritt 15
    ├── patches/
    │   ├── css/
    │   └── js/
    ├── snippets/
    │   └── blocks/
    ├── templates/
    └── plugins/
        ├── kirby-pagewizard/
        ├── kirby-projectwizard/
        ├── kirbyblock-cardlets/
        ├── kirbyblock-featurelist/
        ├── kirbyblock-heading/
        ├── kirbyblock-hero/
        ├── kirbyblock-media/
        ├── kirbyblock-multicolumn/
        ├── kirbyblock-quote/
        └── kirbyblock-text/
```

---

## Offene Punkte für Phase 2 (Automatisierung via Projectwizard)

- [ ] Block-Auswahl im Panel → `composer.json` generieren
- [ ] `composer install` via Shell triggern
- [ ] Alle Verzeichnisse anlegen (public/, storage/, assets/)
- [ ] `public/index.php`, `.htaccess`, `robots.txt`, `functions.php` generieren
- [ ] `config.php` + Dev-Config generieren
- [ ] `.env` + `.gitignore` generieren
- [ ] `valet link` + `valet secure` via Shell triggern
- [ ] `panel.install` nach erster Einrichtung automatisch deaktivieren
