<?php

/**
 * Panel-side config management for kirby-projectwizard.
 *
 * Companion to pwConfig (in kirby-pagewizard). Split of concerns:
 *
 *   - pwConfig      — runtime reads used during Kirby's boot + Blueprint
 *                     assembly + CSS-var generation (loadValues, load,
 *                     settings, tailwindSetup, panelColorsSetup). Also
 *                     hosts the public I/O helpers readJson(),
 *                     pluginConfig(), projectOverride(), pluginDir(),
 *                     projectDir() — this class delegates every file
 *                     read to those.
 *
 *   - ProjectConfig — Panel-facing CRUD + Setup: detect blocks, load/save
 *                     per-section overrides (footer, navigation, global,
 *                     elements, fontsizes, blockValues), font management,
 *                     first-run scaffold.
 *
 * Rule of thumb: reads → pwConfig; writes + panel-API glue → ProjectConfig.
 */
class ProjectConfig
{
	/**
	 * Detect every plugin that exposes a block. Registry is the primary
	 * source (pwConfig::register() runs during plugin boot, so by the time
	 * any panel-facing code calls detectBlocks() every block is registered).
	 * A filesystem scan runs afterwards as a fallback that only picks up
	 * blocks not yet in the registry — useful for very early boot calls or
	 * legacy plugins that expose a settings.json without calling register().
	 *
	 * Cached per request: the underlying JSON files don't change mid-request
	 * and this is called from multiple areas of the panel API.
	 */
	public static function detectBlocks(): array
	{
		static $cache = null;
		if ($cache !== null) return $cache;

		$blocks = [];

		// Primary: registered blocks — configDir is known, no filesystem scan.
		foreach (pwConfig::registered() as $blockType => $configDir) {
			$dir = dirname($configDir, 2); // <plugin>/src/config → <plugin>
			$blocks[$blockType] = self::buildBlockInfo($blockType, $dir, $configDir);
		}

		// Fallback: filesystem scan for any plugin with settings.json that
		// isn't in the registry (e.g. wasn't loaded yet, or doesn't call register()).
		$pluginsDir = kirby()->root('plugins');
		foreach (glob($pluginsDir . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
			$configDir = $dir . '/src/config';
			if (!is_file($configDir . '/settings.json')) continue;

			$indexFile = $dir . '/index.php';
			if (!file_exists($indexFile)) continue;
			$content = file_get_contents($indexFile);
			if (!preg_match("/pwConfig::register\('([^']+)'/", $content, $m)) continue;
			$blockType = $m[1];

			if (isset($blocks[$blockType])) continue; // already picked up via registry
			$blocks[$blockType] = self::buildBlockInfo($blockType, $dir, $configDir);
		}

		return $cache = $blocks;
	}

	/**
	 * Assemble the metadata array for a single block (plugin folder name,
	 * display name, icon, plus its settings + editor JSON). Same shape the
	 * detectBlocks() foreach used to build inline.
	 */
	private static function buildBlockInfo(string $blockType, string $dir, string $configDir): array
	{
		$plugin = basename($dir);

		// Optional package.json — Kirby's panel reads it too; we use it for
		// the human-readable label + icon. `description` is the npm-standard
		// field for a display name; `name` is the package id (e.g.
		// "kirbyblock-heading") and explicitly NOT used here.
		$pkg     = pwConfig::readJson($dir . '/package.json');
		$pkgDesc = is_string($pkg['description'] ?? null) ? trim($pkg['description']) : '';
		$pkgIcon = is_string($pkg['icon'] ?? null) ? trim($pkg['icon']) : '';

		// Resolve display name: package.json.description → i18n <plugin>.name → auto-slug
		$name = $pkgDesc !== '' ? $pkgDesc : self::resolveBlockNameFromI18n($dir, $plugin);
		if ($name === '') {
			$name = preg_replace('/([a-z])([A-Z])/', '$1 $2', ucfirst(preg_replace('/^pw/', '', $blockType)));
		}

		// Resolve icon: package.json.icon → blueprints.php → 'box'
		$icon = $pkgIcon !== '' ? $pkgIcon : 'box';
		if ($pkgIcon === '') {
			$bpFile = $dir . '/src/extensions/blueprints.php';
			if (file_exists($bpFile)) {
				$bpContent = file_get_contents($bpFile);
				if (preg_match("/'icon'\s*=>\s*'([^']+)'/", $bpContent, $iconMatch)) {
					$icon = $iconMatch[1];
				}
			}
		}

		return [
			'plugin'   => $plugin,
			'name'     => $name,
			'icon'     => $icon,
			'settings' => pwConfig::readJson($configDir . '/settings.json'),
			'editor'   => pwConfig::readJson($configDir . '/editor.json'),
		];
	}

	/**
	 * Look up the legacy '<plugin-folder>.name' translation in src/i18n/en.php.
	 * Returns '' if no key is found — caller falls back to an auto-slug.
	 */
	private static function resolveBlockNameFromI18n(string $dir, string $plugin): string
	{
		$i18nFile = $dir . '/src/i18n/en.php';
		if (!file_exists($i18nFile)) return '';

		$content = file_get_contents($i18nFile);
		$key = preg_quote($plugin . '.name', '/');
		if (preg_match("/'$key'\s*=>\s*'([^']+)'/", $content, $m)) {
			return $m[1];
		}
		return '';
	}

	/**
	 * Load overrides for a single block from the central overrides.json.
	 */
	public static function loadBlockOverrides(string $blockType): array
	{
		$allOverrides = pwConfig::readJson(self::overridesFile());
		return $allOverrides[$blockType] ?? [];
	}

	/**
	 * Save overrides for a single block to the central overrides.json.
	 */
	public static function saveBlockOverrides(string $blockType, array $config): void
	{
		$path = self::overridesFile();
		$allOverrides = pwConfig::readJson($path);

		if (empty($config)) {
			unset($allOverrides[$blockType]);
		} else {
			$allOverrides[$blockType] = $config;
		}

		if (empty($allOverrides)) {
			if (file_exists($path)) unlink($path);
		} else {
			$dir = dirname($path);
			if (!is_dir($dir)) mkdir($dir, 0755, true);
			file_put_contents($path, json_encode($allOverrides, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
		}
	}

	/**
	 * Return merged config for a single block: defaults from plugin + stored overrides.
	 */
	public static function blockConfig(string $blockType): array
	{
		$detected = self::detectBlocks();

		$pluginDefaults = $detected[$blockType] ?? [
			'plugin'   => null,
			'settings' => [],
			'editor'   => [],
		];

		$blockOverrides = self::loadBlockOverrides($blockType);

		return [
			'blockType' => $blockType,
			'plugin'    => $pluginDefaults['plugin'],
			'defaults'  => [
				'settings' => $pluginDefaults['settings'],
				'editor'   => $pluginDefaults['editor'],
			],
			'overrides' => $blockOverrides,
			'merged'    => self::mergeBlockConfig($pluginDefaults, $blockOverrides),
		];
	}

	/**
	 * Save overrides for a single block.
	 */
	public static function saveBlockConfig(string $blockType, array $config): void
	{
		self::saveBlockOverrides($blockType, $config);
	}

	/**
	 * Reset a block to plugin defaults (remove all override files).
	 */
	public static function resetBlockConfig(string $blockType): void
	{
		self::saveBlockOverrides($blockType, []);
	}

	/**
	 * Get/set the active blocks list.
	 */
	public static function activeBlocks(?array $blocks = null): array
	{
		$path = self::configDir() . '/blocks.json';
		if ($blocks !== null) {
			$dir = self::configDir();
			if (!is_dir($dir)) mkdir($dir, 0755, true);
			file_put_contents($path, json_encode(
				['blocks' => $blocks],
				JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
			));
		}
		if (!file_exists($path)) return [];
		$data = json_decode(file_get_contents($path), true);
		return $data['blocks'] ?? [];
	}

	/**
	 * Return the full config in the format config.php expects.
	 * Assembles from blocks.json + central overrides.json.
	 */
	public static function mergedConfig(): array
	{
		$config = [];
		$config['blocks'] = self::activeBlocks();
		$config['kirbyblocks'] = [];

		$allOverrides = pwConfig::readJson(self::overridesFile());
		foreach ($allOverrides as $blockType => $overrides) {
			if (!empty($overrides)) {
				$config['kirbyblocks'][$blockType] = $overrides;
			}
		}

		return $config;
	}

	/**
	 * Merge plugin defaults with overrides for a single block.
	 */
	private static function mergeBlockConfig(array $pluginDefaults, array $overrides): array
	{
		return [
			'settings' => self::deepMerge(
				$pluginDefaults['settings'] ?? [],
				$overrides['settings'] ?? []
			),
			'editor' => self::deepMerge(
				$pluginDefaults['editor'] ?? [],
				$overrides['editor'] ?? []
			),
		];
	}

	/**
	 * Deep merge two arrays (overrides win).
	 */
	private static function deepMerge(array $base, array $override): array
	{
		$merged = $base;
		foreach ($override as $key => $value) {
			if (is_array($value) && isset($merged[$key]) && is_array($merged[$key]) && !array_is_list($value)) {
				$merged[$key] = self::deepMerge($merged[$key], $value);
			} else {
				$merged[$key] = $value;
			}
		}
		return $merged;
	}

	private static function configDir(): string
	{
		return pwConfig::projectDir();
	}

	private static function overridesFile(): string
	{
		return self::configDir() . '/overrides.json';
	}

	private static function globalFile(): string
	{
		return self::configDir() . '/global.json';
	}

	private static function blockValuesFile(string $blockType): string
	{
		// Per-block CSS-variable overrides live next to the global.json, one file
		// per block type. Pattern: content/.projectwizard/<blockType>.json.
		// The slash-stripping protects against blockTypes with unusual chars.
		$safe = preg_replace('/[^a-zA-Z0-9_-]/', '', $blockType);
		return self::configDir() . '/' . $safe . '.json';
	}

	private static function fontsizesFile(): string
	{
		return self::configDir() . '/fontsizes.json';
	}

	private static function elementsFile(): string
	{
		return self::configDir() . '/elements.json';
	}

	private static function navigationFile(): string
	{
		return self::configDir() . '/navigation.json';
	}

	private static function footerFile(): string
	{
		return self::configDir() . '/footer.json';
	}

	/**
	 * Load footer defaults from pagewizard plugin + project overrides.
	 */
	public static function loadFooter(): array
	{
		$defaults  = pwConfig::pluginConfig('footer');
		$overrides = pwConfig::readJson(self::footerFile());

		return [
			'defaults'  => $defaults,
			'overrides' => $overrides,
		];
	}

	/**
	 * Save footer overrides.
	 */
	public static function saveFooter(array $overrides): void
	{
		$path = self::footerFile();

		if (empty($overrides)) {
			if (file_exists($path)) unlink($path);
			return;
		}

		$dir = dirname($path);
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		file_put_contents($path, json_encode($overrides, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	}

	/**
	 * Load navigation defaults from pagewizard plugin + project overrides.
	 */
	public static function loadNavigation(): array
	{
		$defaults  = pwConfig::pluginConfig('navigation');
		$overrides = pwConfig::readJson(self::navigationFile());

		return [
			'defaults'  => $defaults,
			'overrides' => $overrides,
		];
	}

	/**
	 * Save navigation overrides.
	 */
	public static function saveNavigation(array $overrides): void
	{
		$path = self::navigationFile();

		if (empty($overrides)) {
			if (file_exists($path)) unlink($path);
			return;
		}

		$dir = dirname($path);
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		file_put_contents($path, json_encode($overrides, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	}

	/**
	 * Load element style defaults from pagewizard plugin + project overrides.
	 */
	public static function loadElements(): array
	{
		$defaults  = pwConfig::pluginConfig('elements');
		$overrides = pwConfig::readJson(self::elementsFile());

		return [
			'defaults'  => $defaults,
			'overrides' => $overrides,
		];
	}

	/**
	 * Save element style overrides.
	 */
	public static function saveElements(array $overrides): void
	{
		$path = self::elementsFile();

		if (empty($overrides)) {
			if (file_exists($path)) unlink($path);
			return;
		}

		$dir = dirname($path);
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		file_put_contents($path, json_encode($overrides, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	}

	/**
	 * Load fontsize defaults from pagewizard plugin + project overrides.
	 */
	public static function loadFontsizes(): array
	{
		$defaults  = pwConfig::pluginConfig('fontsizes');
		$overrides = pwConfig::readJson(self::fontsizesFile());

		return [
			'defaults'  => $defaults,
			'overrides' => $overrides,
		];
	}

	/**
	 * Save fontsize overrides.
	 */
	public static function saveFontsizes(array $overrides): void
	{
		$path = self::fontsizesFile();

		if (empty($overrides)) {
			if (file_exists($path)) unlink($path);
			return;
		}

		$dir = dirname($path);
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		file_put_contents($path, json_encode($overrides, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	}

	/**
	 * Load global defaults from pagewizard plugin + project overrides.
	 */
	public static function loadGlobal(): array
	{
		$defaults  = pwConfig::pluginConfig('global');
		$overrides = pwConfig::readJson(self::globalFile());

		return [
			'defaults'  => $defaults,
			'overrides' => $overrides,
		];
	}

	/**
	 * Save global overrides (only differences from plugin defaults).
	 */
	public static function saveGlobal(array $overrides): void
	{
		$path = self::globalFile();

		if (empty($overrides)) {
			if (file_exists($path)) unlink($path);
			return;
		}

		$dir = dirname($path);
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		file_put_contents($path, json_encode($overrides, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	}

	/**
	 * Load per-block CSS-variable defaults (from the plugin's settings.json
	 * 'values' section) plus user overrides from content/.projectwizard/<blockType>.json.
	 */
	public static function loadBlockValues(string $blockType): array
	{
		// pwConfig::loadValues already merges plugin defaults + the override file.
		return \pwConfig::loadValues($blockType);
	}

	/**
	 * Save per-block CSS-variable overrides to content/.projectwizard/<blockType>.json.
	 */
	public static function saveBlockValues(string $blockType, array $overrides): void
	{
		$path = self::blockValuesFile($blockType);

		if (empty($overrides)) {
			if (file_exists($path)) unlink($path);
			return;
		}

		$dir = dirname($path);
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		file_put_contents($path, json_encode($overrides, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	}

	private static function fontsConfigFile(): string
	{
		return self::configDir() . '/fonts.json';
	}

	/**
	 * Load all fonts: builtin from pagewizard plugin + project uploaded fonts.
	 */
	public static function loadFonts(): array
	{
		$builtinFonts = pwConfig::pluginConfig('fonts');
		$projectFonts = pwConfig::readJson(self::fontsConfigFile());
		$defaultFont = $projectFonts['_default'] ?? 'Inter';
		unset($projectFonts['_default']);

		return [
			'builtin'  => $builtinFonts,
			'project'  => $projectFonts,
			'default'  => $defaultFont,
		];
	}

	/**
	 * Save project fonts config (uploaded fonts + default selection).
	 */
	public static function saveFontsConfig(array $config): void
	{
		$path = self::fontsConfigFile();
		$dir = dirname($path);
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		file_put_contents($path, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	}

	/**
	 * Add an uploaded font to the project fonts config.
	 */
	public static function addFont(string $key, array $fontData): void
	{
		$config = pwConfig::readJson(self::fontsConfigFile());
		if (isset($config[$key])) {
			// Append new files to existing font
			$config[$key]['files'] = array_merge($config[$key]['files'] ?? [], $fontData['files'] ?? []);
		} else {
			$config[$key] = $fontData;
		}
		self::saveFontsConfig($config);
	}

	/**
	 * Remove a single file from a font entry. Removes the font if no files remain.
	 */
	public static function removeFontFile(string $key, int $fileIndex): void
	{
		$config = pwConfig::readJson(self::fontsConfigFile());
		if (!isset($config[$key]['files'][$fileIndex])) return;

		$fontsDir = kirby()->root('index') . '/assets/fonts';
		$file = $config[$key]['files'][$fileIndex];
		$path = $fontsDir . '/' . $file['src'];
		if (file_exists($path)) unlink($path);

		array_splice($config[$key]['files'], $fileIndex, 1);

		if (empty($config[$key]['files'])) {
			unset($config[$key]);
		}

		if (empty($config) || (count($config) === 1 && isset($config['_default']))) {
			$cfgPath = self::fontsConfigFile();
			if (file_exists($cfgPath)) unlink($cfgPath);
		} else {
			self::saveFontsConfig($config);
		}
	}

	/**
	 * Remove a font from the project fonts config and delete its files.
	 */
	public static function removeFont(string $key): void
	{
		$config = pwConfig::readJson(self::fontsConfigFile());
		$fontsDir = kirby()->root('index') . '/assets/fonts';

		// Delete font files
		if (isset($config[$key]['files'])) {
			foreach ($config[$key]['files'] as $file) {
				$path = $fontsDir . '/' . $file['src'];
				if (file_exists($path)) unlink($path);
			}
		}

		unset($config[$key]);

		if (empty($config) || (count($config) === 1 && isset($config['_default']))) {
			$path = self::fontsConfigFile();
			if (file_exists($path)) unlink($path);
		} else {
			self::saveFontsConfig($config);
		}
	}

	/**
	 * Set the default font family.
	 */
	public static function setDefaultFont(string $family): void
	{
		$config = pwConfig::readJson(self::fontsConfigFile());
		$config['_default'] = $family;
		self::saveFontsConfig($config);
	}

	// I/O helpers moved to pwConfig::readJson()/pluginConfig()/projectOverride().

	/**
	 * Run scaffold once on first panel access.
	 * Copies template files and pagewizard assets to the project.
	 */
	public static function scaffold(): void
	{
		$lockFile = self::configDir() . '/.initialized';
		if (file_exists($lockFile)) return;

		$projectRoot = kirby()->root('index') . '/..';
		$wizardDir   = __DIR__ . '/../..';
		$pwDir       = pwConfig::pluginDir();

		// --- Projectwizard: copy files (only if not existing) ---
		$copyDir = $wizardDir . '/src/scaffold/copy';
		if (is_dir($copyDir)) {
			self::copyDir($copyDir, $projectRoot);
		}

		// --- Projectwizard: generate templates ---
		$templateDir = $wizardDir . '/src/scaffold/templates';
		if (is_dir($templateDir)) {
			$projectName = basename(realpath($projectRoot));
			$valetHost   = $projectName . '.test';

			$replacements = [
				'{{PROJECT_NAME}}' => $projectName,
				'{{VALET_HOST}}'   => $valetHost,
			];

			// package.json → root
			self::generateTemplate($templateDir . '/package.json', $projectRoot . '/package.json', $replacements);

			// composer.json → root
			self::generateTemplate($templateDir . '/composer.json', $projectRoot . '/composer.json', $replacements);

			// .env → root
			self::generateTemplate($templateDir . '/.env', $projectRoot . '/.env', $replacements);

			// config.{host}.php → site/config/
			self::generateTemplate(
				$templateDir . '/config.host.php',
				$projectRoot . '/site/config/config.' . $valetHost . '.php',
				$replacements
			);
		}

		// --- Pagewizard: copy fonts ---
		$fontsSource = $pwDir . '/src/scaffold/fonts';
		$fontsDest   = $projectRoot . '/public/assets/fonts';
		if (is_dir($fontsSource)) {
			if (!is_dir($fontsDest)) mkdir($fontsDest, 0755, true);
			foreach (glob($fontsSource . '/*.woff2') as $font) {
				$dest = $fontsDest . '/' . basename($font);
				if (!file_exists($dest)) {
					copy($font, $dest);
				}
			}
		}

		// --- Pagewizard: copy projectbuilder.php ---
		$builderSource = $pwDir . '/src/scaffold/projectbuilder.php';
		$builderDest   = $projectRoot . '/projectbuilder.php';
		if (file_exists($builderSource) && !file_exists($builderDest)) {
			copy($builderSource, $builderDest);
		}

		// Write lock file
		$dir = self::configDir();
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		file_put_contents($lockFile, date('Y-m-d H:i:s'));
	}

	/**
	 * Recursively copy directory, skip existing files.
	 */
	private static function copyDir(string $src, string $dest): void
	{
		foreach (scandir($src) as $item) {
			if ($item === '.' || $item === '..') continue;
			$srcPath  = $src . '/' . $item;
			$destPath = $dest . '/' . $item;
			if (is_dir($srcPath)) {
				if (!is_dir($destPath)) mkdir($destPath, 0755, true);
				self::copyDir($srcPath, $destPath);
			} elseif (!file_exists($destPath)) {
				copy($srcPath, $destPath);
			}
		}
	}

	/**
	 * Generate file from template, replacing placeholders. Skip if target exists.
	 */
	private static function generateTemplate(string $template, string $target, array $replacements): void
	{
		if (file_exists($target) || !file_exists($template)) return;
		$content = file_get_contents($template);
		$content = str_replace(array_keys($replacements), array_values($replacements), $content);
		file_put_contents($target, $content);
	}
}
