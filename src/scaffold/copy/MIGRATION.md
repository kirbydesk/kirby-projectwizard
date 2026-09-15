# Kirbydesk Plugin-Update — Migration Guide

Prozedur um dieses Projekt auf die aktuellen Packagist-Versionen der Kirbydesk-Plugins zu updaten, **ohne dass sich das Design ändert**.

---

## Warum diese Prozedur nötig ist

Kirbydesk-Projekte laufen oft auf älteren Plugin-Versionen (composer.lock pinnt z.B. `1.0.2/1.0.10`). Zwischenzeitlich sind auf Packagist neuere Versionen released worden, die deutlich mehr CSS-Vars generieren und/oder Blueprint-Formate anders lesen.

**Zusätzliche Komplikation:** Live-Server wurden früher manchmal von Dev-Rechnern mit unreleaseten Dev-Snapshots gebaut. Die entstehende `site.min.css` wird ins Repo committet, aber:
- Die Plugin-Sources sind auf Live per `.gitignore` (`/site/plugins/*`) ausgeschlossen
- Die `content/.projectwizard/*.json`-Overrides sind meist **nur auf Live** und nicht committet

**Ergebnis:** Nach einem `git pull` auf einem neuen Rechner hat man die Live-`site.min.css`, aber alte Plugin-Versionen und fehlende JSON-Overrides. Ein `npm run build` würde das Design brechen.

**Ziel des Updates:**
- Plugins auf **aktuelle Packagist-Versionen** heben
- Design bleibt gleich (Live-CSS als Referenz)
- Nur Config-Overrides — **keine CSS-Patches**

---

## Voraussetzungen

- SSH-Zugang zum Live-Server
- `composer`, `npm` und `node` verfügbar
- Lokales Valet/Herd-Setup für `<projekt>.test`
- Aktueller `git pull` des Projekts

---

## Prozedur — 5+1 Schritte

### Schritt 1: Referenz-Files von Live holen

```bash
# Referenz-CSS zum Diffen
scp -P <PORT> <USER>@<SERVER>:<TARGET_PATH>/public/assets/css/site.min.css \
  public/assets/css/site.min.live.css

# Alle projectwizard-JSONs
scp -P <PORT> <USER>@<SERVER>:<TARGET_PATH>/content/.projectwizard/*.json \
  content/.projectwizard/
```

Typischerweise fehlen im Repo: `overrides.json`, `<blockType>.json`, `fontsizes.json`.

### Schritt 2: Composer-Update

```bash
composer update "kirbydesk/*" --dry-run  # Kontrolle
composer update "kirbydesk/*" --no-interaction
```

### Schritt 3: Hook triggern + build

```bash
curl -sk https://<projekt>.test/ -o /dev/null   # regeneriert storage/temp/vars.css
npm run build                                    # baut site.min.css / site.min.js
```

### Schritt 4: Diff-Vergleich

```bash
grep -oE '\-\-[a-zA-Z0-9_-]+:[^;)]+' public/assets/css/site.min.css      | sort -u > /tmp/vars_local.txt
grep -oE '\-\-[a-zA-Z0-9_-]+:[^;)]+' public/assets/css/site.min.live.css | sort -u > /tmp/vars_live.txt

echo "Nur in Live:";  comm -13 /tmp/vars_local.txt /tmp/vars_live.txt | wc -l
echo "Nur in Lokal:"; comm -23 /tmp/vars_local.txt /tmp/vars_live.txt | wc -l
```

Zielwert: unter 10 verbleibende Diffs, alle unkritisch. Wenn mehr: JSON-Overrides von Live nachziehen. Verbleibende Diffs auswerten:

```bash
comm -13 /tmp/vars_local.txt /tmp/vars_live.txt   # nur in Live
comm -23 /tmp/vars_local.txt /tmp/vars_live.txt   # nur in Lokal
```

### Schritt 4.5: Deprecation-Check — Legacy-Files aufspüren

Nach jedem Plugin-Update können projekt-lokale Dateien, die aus einer älteren Plugin-Version kopiert wurden, das neue Plugin **stumm überschreiben**. Kirby lädt sie automatisch bevorzugt vor der Plugin-Version → man sieht keinen Error, nur "falsches" Verhalten im Frontend.

**Typische Symptome:**
- Falsche font-sizes oder line-heights an einzelnen Blöcken
- Fehlende border-radius (Ecken bleiben eckig, obwohl im Panel eingestellt)
- Alte HTML-Struktur (fehlende `data-*`-Attribute, `<section>` statt `<div>` etc.)
- CSS-Variablen im generierten `vars.css` sind vorhanden, aber sichtbar keine Wirkung → Snippet-Override rendert die zugehörigen Klassen nicht mehr

**Prüfstellen:**

1. **CSS-Patches** in `site/patches/css/`
   ```bash
   find site/patches/css -name 'styles.css' -type f
   ```
   Jede gefundene Datei ist ein full-replacement der Plugin-CSS. Bei jedem Plugin-Update prüfen, ob die dortigen Selektoren/Vars noch mit dem aktuellen Plugin übereinstimmen. Falls nicht ausdrücklich benötigt: umbenennen mit `_`-Prefix (`styles.css` → `_styles.css`), dann Frontend testen. Wenn nichts bricht — löschen.

2. **Snippet-Overrides** in `site/snippets/blocks/`
   ```bash
   ls site/snippets/blocks/*.php 2>/dev/null
   ```
   Namen wie `text.php`, `quote.php`, `heading.php` etc. überschreiben die gleichnamigen Plugin-Snippets. Wenn sie ohne besondere Anpassung existieren, sind sie fast immer alte Kopien. `_`-Prefix + Frontend-Test → wenn Design unverändert bleibt: löschen. (Bei kirbyblock-* v1.0.3+ nutzen alle Snippets den `pwSnippet`-Helper — ältere lokale Kopien produzieren manuelles HTML und blockieren die Helper-Ausgabe.)

3. **Projekt-lokale `projectbuilder.php`**
   ```bash
   head -10 projectbuilder.php
   ```
   Soll ab kirby-pagewizard v1.1.35 nur noch **eine Zeile Logik** enthalten:
   ```php
   return ['route:after' => fn() => pwConfig::runProjectBuilder()];
   ```
   Falls dort noch die ~230 Zeilen aus dem alten Scaffold stehen (Reflection-Workarounds, `method_exists()`-Checks etc.), ersetzen. Der aktuelle Wrapper delegiert an die Plugin-Version, die immer synchron mit dem installierten Plugin bleibt.

4. **Alte projectwizard-Overrides** in `content/.projectwizard/`
   - Separates `defaults.json` neben `settings.json` in Custom-Plugins → in `settings.json` unter Top-Level-Key `"defaults"` konsolidieren, dann löschen (ab kirby-pagewizard v1.1.39).
   - Flat overrides in `overrides.json` (z.B. `pwtext.editor: {...}`) → unter `pwtext.settings.editor` schieben. Ab kirby-pagewizard v1.1.40 werden Flat-Keys nicht mehr gelesen.

**Vorgehen:**
- Alle verdächtigen Files zuerst per `_`-Prefix deaktivieren
- Frontend + Panel visuell testen
- Wenn Design identisch bleibt → File löschen
- Wenn ein Unterschied auftritt → das File enthält eine echte projekt-spezifische Anpassung, die ins Plugin oder eine JSON-Override wandern muss (nicht wieder als lokaler Snippet/CSS-Patch)

**Ohne diesen Check:** die Update-Prozedur läuft technisch durch, aber ein Kunde meldet nach ein paar Tagen "diese Section sieht komisch aus" — und man sucht stundenlang, weil im vars.css alles richtig steht.

### Schritt 5: Aufräumen, Panel-Test, Commit

```bash
rm public/assets/css/site.min.live.css
```

**Panel visuell prüfen** (`/panel` → Project Wizard) und **Frontend visuell prüfen** mit Hard-Reload.

**Commit + push:**
```bash
git add composer.lock composer.json content/.projectwizard/ public/assets/
git commit -m "Update kirbydesk plugins to Packagist versions"
git push
```

---

## Wichtige Regeln

1. **Keine CSS-Patches** in `site/patches/css/*/styles.css` — wenn eine Style-Anpassung nicht via JSON-Overrides erreichbar ist, erst mit dem Team besprechen. Patches sind Full-Replacements der Plugin-CSS und müssen bei jedem Update manuell nachgezogen werden.

2. **Live ist die Design-Referenz** — nicht das lokale Repo. Der lokale Git-Stand kann veraltete Overrides enthalten. Immer erst Live-JSONs holen.

3. **Design darf sich nicht ändern** — bestehende Kunden sind an das aktuelle Design gewohnt. Nach jedem Update visuellen Vergleich machen.

4. **`site.min.live.css` wird nur zum Vergleich genutzt** — nach Schritt 5 immer löschen. Nicht committen.
