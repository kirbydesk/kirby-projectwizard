<?php

class ProjectConfig
{
	/**
	 * Detect all installed kirbyblock-* plugins and read their config files.
	 */
	public static function detectBlocks(): array
	{
		$pluginsDir = kirby()->root('plugins');
		$blocks = [];

		foreach (glob($pluginsDir . '/kirbyblock-*') as $dir) {
			$configDir = $dir . '/src/config';
			if (!is_dir($configDir)) continue;

			// Extract block type from pwConfig::register() call
			$indexFile = $dir . '/index.php';
			$blockType = null;
			if (file_exists($indexFile)) {
				$content = file_get_contents($indexFile);
				if (preg_match("/pwConfig::register\('([^']+)'/", $content, $m)) {
					$blockType = $m[1];
				}
			}
			if (!$blockType) continue;

			// Extract icon from blueprints.php
			$icon = 'box';
			$bpFile = $dir . '/src/extensions/blueprints.php';
			if (file_exists($bpFile)) {
				$bpContent = file_get_contents($bpFile);
				if (preg_match("/'icon'\s*=>\s*'([^']+)'/", $bpContent, $iconMatch)) {
					$icon = $iconMatch[1];
				}
			}

			$blocks[$blockType] = [
				'plugin'   => basename($dir),
				'icon'     => $icon,
				'settings' => self::readJson($configDir . '/settings.json'),
				'editor'   => self::readJson($configDir . '/editor.json'),
			];
		}

		return $blocks;
	}

	/**
	 * Load overrides for a single block from the central overrides.json.
	 */
	public static function loadBlockOverrides(string $blockType): array
	{
		$allOverrides = self::readJson(self::overridesFile());
		return $allOverrides[$blockType] ?? [];
	}

	/**
	 * Save overrides for a single block to the central overrides.json.
	 */
	public static function saveBlockOverrides(string $blockType, array $config): void
	{
		$path = self::overridesFile();
		$allOverrides = self::readJson($path);

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

		$allOverrides = self::readJson(self::overridesFile());
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
		return kirby()->root('site') . '/config/projectwizard';
	}

	private static function overridesFile(): string
	{
		return self::configDir() . '/overrides.json';
	}

	private static function globalFile(): string
	{
		return self::configDir() . '/global.json';
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
		$pluginDir = kirby()->root('plugins') . '/kirby-pagewizard';
		$defaults = self::readJson($pluginDir . '/config/footer.json');
		$overrides = self::readJson(self::footerFile());

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
		$pluginDir = kirby()->root('plugins') . '/kirby-pagewizard';
		$defaults = self::readJson($pluginDir . '/config/navigation.json');
		$overrides = self::readJson(self::navigationFile());

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
		$pluginDir = kirby()->root('plugins') . '/kirby-pagewizard';
		$defaults = self::readJson($pluginDir . '/config/elements.json');
		$overrides = self::readJson(self::elementsFile());

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
		$pluginDir = kirby()->root('plugins') . '/kirby-pagewizard';
		$defaults = self::readJson($pluginDir . '/config/fontsizes.json');
		$overrides = self::readJson(self::fontsizesFile());

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
		$pluginDir = kirby()->root('plugins') . '/kirby-pagewizard';
		$defaults = self::readJson($pluginDir . '/config/global.json');
		$overrides = self::readJson(self::globalFile());

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

	private static function fontsConfigFile(): string
	{
		return self::configDir() . '/fonts.json';
	}

	/**
	 * Load all fonts: builtin from pagewizard plugin + project uploaded fonts.
	 */
	public static function loadFonts(): array
	{
		$pluginDir = kirby()->root('plugins') . '/kirby-pagewizard';
		$builtinFonts = self::readJson($pluginDir . '/config/fonts.json');
		$projectFonts = self::readJson(self::fontsConfigFile());
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
		$config = self::readJson(self::fontsConfigFile());
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
		$config = self::readJson(self::fontsConfigFile());
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
		$config = self::readJson(self::fontsConfigFile());
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
		$config = self::readJson(self::fontsConfigFile());
		$config['_default'] = $family;
		self::saveFontsConfig($config);
	}

	private static function readJson(string $path): array
	{
		if (!file_exists($path)) return [];
		$data = json_decode(file_get_contents($path), true);
		return is_array($data) ? $data : [];
	}

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
		$pwDir       = kirby()->root('plugins') . '/kirby-pagewizard';

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
