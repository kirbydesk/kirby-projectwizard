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

			$blocks[$blockType] = [
				'plugin'   => basename($dir),
				'settings' => self::readJson($configDir . '/settings.json'),
				'defaults' => self::readJson($configDir . '/defaults.json'),
				'editor'   => self::readJson($configDir . '/editor.json'),
			];
		}

		return $blocks;
	}

	/**
	 * Get full stored config (the format that replaces pagewizard.php).
	 */
	public static function loadOverrides(): array
	{
		$path = self::storagePath();
		if (!file_exists($path)) return [];
		$data = json_decode(file_get_contents($path), true);
		return is_array($data) ? $data : [];
	}

	/**
	 * Save the full config.
	 */
	public static function saveOverrides(array $data): void
	{
		$path = self::storagePath();
		$dir = dirname($path);
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	}

	/**
	 * Return merged config for a single block: defaults from plugin + stored overrides.
	 */
	public static function blockConfig(string $blockType): array
	{
		$detected = self::detectBlocks();
		$overrides = self::loadOverrides();

		$pluginDefaults = $detected[$blockType] ?? [
			'plugin'   => null,
			'settings' => [],
			'defaults' => [],
			'editor'   => [],
		];

		$blockOverrides = $overrides['kirbyblocks'][$blockType] ?? [];

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
		$data = self::loadOverrides();
		if (!isset($data['kirbyblocks'])) $data['kirbyblocks'] = [];
		$data['kirbyblocks'][$blockType] = $config;
		self::saveOverrides($data);
	}

	/**
	 * Reset a block to plugin defaults (remove overrides).
	 */
	public static function resetBlockConfig(string $blockType): void
	{
		$data = self::loadOverrides();
		unset($data['kirbyblocks'][$blockType]);
		self::saveOverrides($data);
	}

	/**
	 * Get/set the active blocks list.
	 */
	public static function activeBlocks(?array $blocks = null): array
	{
		if ($blocks !== null) {
			$data = self::loadOverrides();
			$data['blocks'] = $blocks;
			self::saveOverrides($data);
		}
		$data = self::loadOverrides();
		return $data['blocks'] ?? [];
	}

	/**
	 * Return the full config in the format config.php expects
	 * (identical to what pagewizard.php used to return).
	 */
	public static function mergedConfig(): array
	{
		return self::loadOverrides();
	}

	/**
	 * Merge plugin defaults with overrides for a single block.
	 */
	private static function mergeBlockConfig(array $pluginDefaults, array $overrides): array
	{
		$merged = [];

		// Settings (tabs + fields)
		$merged['settings'] = self::deepMerge(
			$pluginDefaults['settings'] ?? [],
			$overrides['settings'] ?? []
		);

		// Defaults
		$merged['defaults'] = self::deepMerge(
			$pluginDefaults['defaults'] ?? [],
			$overrides['defaults'] ?? []
		);

		// Editor
		$merged['editor'] = self::deepMerge(
			$pluginDefaults['editor'] ?? [],
			$overrides['editor'] ?? []
		);

		return $merged;
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

	private static function storagePath(): string
	{
		return kirby()->root('content') . '/_projectwizard/projectwizard.json';
	}

	private static function readJson(string $path): array
	{
		if (!file_exists($path)) return [];
		$data = json_decode(file_get_contents($path), true);
		return is_array($data) ? $data : [];
	}
}
