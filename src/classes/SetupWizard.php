<?php

class SetupWizard
{
	/**
	 * Check if setup is needed (no .initialized lock file).
	 */
	public static function isNeeded(): bool
	{
		return !file_exists(
			kirby()->root('site') . '/config/projectwizard/.initialized'
		);
	}

	/**
	 * Auto-detect project settings.
	 */
	public static function detect(): array
	{
		$projectRoot = static::projectRoot();
		$projectName = basename($projectRoot);
		$hasPublic = is_dir($projectRoot . '/public');
		$isPublic = basename(kirby()->root('index')) === 'public';
		return [
			'projectName' => $projectName,
			'valetHost'   => $projectName . '.test',
			'projectRoot' => $projectRoot,
			'isPublic'    => $isPublic,
			'hasPublic'   => $hasPublic,
		];
	}

	/**
	 * Resolve the project root directory (parent of kirby/).
	 */
	public static function projectRoot(): string
	{
		// In a standard Kirby setup, the project root is where composer.json lives
		$root = kirby()->root('index');
		// Walk up until we find composer.json
		for ($i = 0; $i < 5; $i++) {
			if (file_exists($root . '/composer.json')) return $root;
			$root = dirname($root);
		}
		return dirname(kirby()->root('index'));
	}

	/**
	 * Step 1: Clean slate — delete everything except protected items.
	 */
	public static function cleanSlate(): array
	{
		$root = static::projectRoot();
		$keep = ['kirby', 'vendor', 'site', 'public', 'content', 'composer.json', 'composer.lock', '.git', '.kirbydesk'];
		$deleted = [];

		foreach (scandir($root) as $item) {
			if ($item === '.' || $item === '..') continue;
			if (in_array($item, $keep)) continue;

			$path = $root . '/' . $item;
			if (is_dir($path)) {
				static::deleteDir($path);
			} else {
				unlink($path);
			}
			$deleted[] = $item;
		}

		// Within public/, keep index.php (currently running) and .htaccess
		$publicDir = $root . '/public';
		if (is_dir($publicDir)) {
			foreach (scandir($publicDir) as $item) {
				if ($item === '.' || $item === '..' || $item === 'index.php' || $item === '.htaccess') continue;
				$path = $publicDir . '/' . $item;
				if (is_dir($path)) {
					static::deleteDir($path);
				} else {
					unlink($path);
				}
				$deleted[] = 'public/' . $item;
			}
		}

		// Within site/, keep plugins/ and accounts/
		$siteDir = $root . '/site';
		if (is_dir($siteDir)) {
			foreach (scandir($siteDir) as $item) {
				if ($item === '.' || $item === '..' || $item === 'plugins' || $item === 'accounts') continue;
				$path = $siteDir . '/' . $item;
				if (is_dir($path)) {
					static::deleteDir($path);
				} else {
					unlink($path);
				}
				$deleted[] = 'site/' . $item;
			}
		}

		return ['deleted' => $deleted];
	}

	/**
	 * Step 2: Create directory structure.
	 */
	public static function createDirectories(): array
	{
		$root = static::projectRoot();
		$dirs = [
			'public/assets/css',
			'public/assets/js',
			'public/assets/fonts',
			'public/media',
			'storage/cache',
			'storage/sessions',
			'storage/logs',
			'storage/temp',
			'content/home',
			'content/error',
			'site/config',
		];

		$created = [];
		foreach ($dirs as $dir) {
			$path = $root . '/' . $dir;
			if (!is_dir($path)) {
				mkdir($path, 0755, true);
				$created[] = $dir;
			}
		}

		return ['created' => $created];
	}

	/**
	 * Step 3: Generate files from scaffold.
	 */
	public static function generateFiles(string $projectName, string $valetHost): array
	{
		$root = static::projectRoot();
		$pluginDir = kirby()->root('plugins') . '/kirby-projectwizard';
		$scaffoldCopy = $pluginDir . '/src/scaffold/copy';
		$scaffoldTemplates = $pluginDir . '/src/scaffold/templates';
		$generated = [];

		// Clean content/ directory (deferred from cleanSlate to keep Kirby alive)
		$contentDir = $root . '/content';
		if (is_dir($contentDir)) {
			foreach (scandir($contentDir) as $item) {
				if ($item === '.' || $item === '..') continue;
				$path = $contentDir . '/' . $item;
				if (is_dir($path)) {
					static::deleteDir($path);
				} else {
					unlink($path);
				}
			}
		}

		$replacements = [
			'{{PROJECT_NAME}}'  => $projectName,
			'{{PROJECT_TITLE}}' => ucfirst($projectName),
			'{{VALET_HOST}}'    => $valetHost,
		];

		// Copy static files
		$copyMap = [
			'public/index.php'      => 'public/index.php',
			'public/.htaccess'      => 'public/.htaccess',
			'public/robots.txt'     => 'public/robots.txt',
			'public/functions.php'  => 'public/functions.php',
			'.gitignore'            => '.gitignore',
			'site/config/config.php' => 'site/config/config.php',
			'site/config/panel.css' => 'site/config/panel.css',
			'content/home/home.txt' => 'content/home/home.txt',
			'content/error/error.txt' => 'content/error/error.txt',
			'build-js.config.js'    => 'build-js.config.js',
			'kirbyup-sync.config.js' => 'kirbyup-sync.config.js',
		];

		foreach ($copyMap as $source => $dest) {
			$srcPath = $scaffoldCopy . '/' . $source;
			if (file_exists($srcPath)) {
				$destPath = $root . '/' . $dest;
				$destDir = dirname($destPath);
				if (!is_dir($destDir)) mkdir($destDir, 0755, true);
				copy($srcPath, $destPath);
				$generated[] = $dest;
			}
		}

		// Process templates (files with placeholders)
		$templateMap = [
			'.env'          => '.env',
			'package.json'  => 'package.json',
			'site.txt'      => 'content/site.txt',
			'config.host.php' => 'site/config/config.' . $valetHost . '.php',
		];

		foreach ($templateMap as $source => $dest) {
			$srcPath = $scaffoldTemplates . '/' . $source;
			if (file_exists($srcPath)) {
				$content = file_get_contents($srcPath);
				$content = str_replace(
					array_keys($replacements),
					array_values($replacements),
					$content
				);
				$destPath = $root . '/' . $dest;
				$destDir = dirname($destPath);
				if (!is_dir($destDir)) mkdir($destDir, 0755, true);
				file_put_contents($destPath, $content);
				$generated[] = $dest;
			}
		}

		return ['generated' => $generated];
	}

	/**
	 * Step 5: Trigger projectbuilder hook.
	 */
	public static function triggerProjectbuilder(): array
	{
		try {
			$hookFile = kirby()->root('plugins') . '/kirby-projectwizard/projectbuilder.php';
			if (!file_exists($hookFile)) {
				return ['success' => false, 'output' => 'projectbuilder.php not found'];
			}
			// The projectbuilder returns a hooks array; invoke the route:after hook
			// to generate storage/temp/tailwind.css during setup
			$hooks = require $hookFile;
			if (isset($hooks['route:after']) && is_callable($hooks['route:after'])) {
				$hooks['route:after']();
			}
			return ['success' => true];
		} catch (Exception $e) {
			return ['success' => false, 'output' => $e->getMessage()];
		}
	}

	/**
	 * Step 6: Finalize — write lock file.
	 */
	public static function finalize(): array
	{
		$configDir = kirby()->root('site') . '/config/projectwizard';
		if (!is_dir($configDir)) mkdir($configDir, 0755, true);
		file_put_contents($configDir . '/.initialized', date('Y-m-d H:i:s'));
		return ['success' => true];
	}

	/**
	 * Recursively delete a directory.
	 */
	private static function deleteDir(string $dir): void
	{
		if (!is_dir($dir)) return;
		$items = scandir($dir);
		foreach ($items as $item) {
			if ($item === '.' || $item === '..') continue;
			$path = $dir . '/' . $item;
			if (is_dir($path)) {
				static::deleteDir($path);
			} else {
				unlink($path);
			}
		}
		rmdir($dir);
	}
}
