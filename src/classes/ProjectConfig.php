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
				'defaults' => self::readJson($configDir . '/defaults.json'),
				'editor'   => self::readJson($configDir . '/editor.json'),
			];
		}

		return $blocks;
	}

	/**
	 * Load overrides for a single block from its directory.
	 */
	public static function loadBlockOverrides(string $blockType): array
	{
		$dir = self::blockDir($blockType);
		$overrides = [];

		$settings = self::readJson($dir . '/settings.json');
		$defaults = self::readJson($dir . '/defaults.json');
		$editor   = self::readJson($dir . '/editor.json');

		if (!empty($settings)) $overrides['settings'] = $settings;
		if (!empty($defaults)) $overrides['defaults'] = $defaults;
		if (!empty($editor))   $overrides['editor']   = $editor;

		return $overrides;
	}

	/**
	 * Save overrides for a single block to its directory.
	 */
	public static function saveBlockOverrides(string $blockType, array $config): void
	{
		$dir = self::blockDir($blockType);

		$settings = $config['settings'] ?? [];
		$defaults = $config['defaults'] ?? [];
		$editor   = $config['editor']   ?? [];

		// Write files that have content, remove files that don't
		self::writeOrRemoveJson($dir . '/settings.json', $settings);
		self::writeOrRemoveJson($dir . '/defaults.json', $defaults);
		self::writeOrRemoveJson($dir . '/editor.json', $editor);

		// Remove directory if empty
		if (is_dir($dir) && count(glob($dir . '/*')) === 0) {
			rmdir($dir);
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
			'defaults' => [],
			'editor'   => [],
		];

		$blockOverrides = self::loadBlockOverrides($blockType);

		return [
			'blockType' => $blockType,
			'plugin'    => $pluginDefaults['plugin'],
			'defaults'  => [
				'settings' => $pluginDefaults['settings'],
				'defaults' => $pluginDefaults['defaults'],
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
	 * Assembles from blocks.json + individual block directories.
	 */
	public static function mergedConfig(): array
	{
		$config = [];
		$config['blocks'] = self::activeBlocks();
		$config['kirbyblocks'] = [];

		$blocksDir = self::blocksDir();
		if (is_dir($blocksDir)) {
			foreach (glob($blocksDir . '/*', GLOB_ONLYDIR) as $dir) {
				$blockType = basename($dir);
				$overrides = self::loadBlockOverrides($blockType);
				if (!empty($overrides)) {
					$config['kirbyblocks'][$blockType] = $overrides;
				}
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
			'defaults' => self::deepMerge(
				$pluginDefaults['defaults'] ?? [],
				$overrides['defaults'] ?? []
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

	private static function writeOrRemoveJson(string $path, array $data): void
	{
		if (empty($data)) {
			if (file_exists($path)) unlink($path);
			return;
		}
		$dir = dirname($path);
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	}

	private static function configDir(): string
	{
		return kirby()->root('site') . '/config/projectwizard';
	}

	private static function blocksDir(): string
	{
		return self::configDir() . '/blocks';
	}

	private static function blockDir(string $blockType): string
	{
		return self::blocksDir() . '/' . $blockType;
	}

	private static function readJson(string $path): array
	{
		if (!file_exists($path)) return [];
		$data = json_decode(file_get_contents($path), true);
		return is_array($data) ? $data : [];
	}
}
