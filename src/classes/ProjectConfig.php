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

	private static function colorsFile(): string
	{
		return self::configDir() . '/colors.json';
	}

	private static function fontsizesFile(): string
	{
		return self::configDir() . '/fontsizes.json';
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
	 * Load color defaults from pagewizard plugin + project overrides.
	 */
	public static function loadColors(): array
	{
		$pluginDir = kirby()->root('plugins') . '/kirby-pagewizard';
		$defaults = self::readJson($pluginDir . '/config/colors.json');
		$overrides = self::readJson(self::colorsFile());

		return [
			'defaults'  => $defaults,
			'overrides' => $overrides,
		];
	}

	/**
	 * Save color overrides (only differences from plugin defaults).
	 */
	public static function saveColors(array $overrides): void
	{
		$path = self::colorsFile();

		if (empty($overrides)) {
			if (file_exists($path)) unlink($path);
			return;
		}

		$dir = dirname($path);
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		file_put_contents($path, json_encode($overrides, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	}

	private static function readJson(string $path): array
	{
		if (!file_exists($path)) return [];
		$data = json_decode(file_get_contents($path), true);
		return is_array($data) ? $data : [];
	}
}
