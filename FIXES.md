# Fixes

## ✅ `SetupWizard::npmBuild()` — `node` wird nicht gefunden

**Behoben am 2026-09-15.**

**Symptom**
Setup schlug bei Step `npmBuild` fehl mit:

```
$ npm install
env: node: No such file or directory
```

**Ursache**
`src/classes/SetupWizard.php::npmBuild()` suchte `npm` explizit (Fallback auf `/opt/homebrew/bin/npm` bzw. `/usr/local/bin/npm`), aber der `exec()`-Aufruf setzte keinen `PATH`. php-fpm/valet läuft mit minimalem PATH — sobald der `npm`-Subprozess intern `node` aufrufen wollte, fand er es nicht.

Betraf alle Setups auf Systemen, bei denen `node`/`npm` nicht in `/usr/bin` oder `/bin` liegen (Homebrew-Standard: `/opt/homebrew/bin/`).

**Fix**
Vor dem `cd` wird ein `PATH=` prependend gesetzt, das das Verzeichnis der gefundenen `npm`-Binary enthält (dort liegt typischerweise auch `node`):

```php
$nodeDir = dirname($npm);
$cdRoot  = 'PATH=' . escapeshellarg($nodeDir . ':/usr/bin:/bin') . ' cd ' . escapeshellarg($root) . ' && ';
```

**Gefunden bei**
Setup-Test in `/Users/christian/Projects/claude/` mit Valet + Homebrew-PHP 8.5 (2026-09-14).
