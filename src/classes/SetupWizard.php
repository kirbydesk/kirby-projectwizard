<?php

class SetupWizard
{
	/** @var array<string,string> Session files preserved across cleanSlate */
	private static array $preservedSessions = [];

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
		$keep = ['kirby', 'vendor', 'site', 'public', 'content', 'storage', 'composer.json', 'composer.lock', '.git', '.kirbydesk'];
		$deleted = [];

		// Preserve existing sessions before we delete anything. Kirby's default
		// session root is site/sessions/, but the new public/index.php points
		// to storage/sessions/ — restore the files to the new location so the
		// admin stays logged in across the bootstrap change.
		self::$preservedSessions = [];
		$sessionsRoot = kirby()->root('sessions');
		if ($sessionsRoot && is_dir($sessionsRoot)) {
			foreach (glob($sessionsRoot . '/*.sess') ?: [] as $sessFile) {
				self::$preservedSessions[basename($sessFile)] = file_get_contents($sessFile);
			}
		}

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

		// Within storage/, keep only sessions/ — cache and temp hold stale
		// plugin registrations and build artefacts that must be invalidated
		// when the project config is regenerated.
		$storageDir = $root . '/storage';
		if (is_dir($storageDir)) {
			foreach (scandir($storageDir) as $item) {
				if ($item === '.' || $item === '..' || $item === 'sessions') continue;
				$path = $storageDir . '/' . $item;
				if (is_dir($path)) {
					static::deleteDir($path);
				} else {
					unlink($path);
				}
				$deleted[] = 'storage/' . $item;
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

		// Restore sessions preserved in cleanSlate into the new storage/sessions/ root
		$newSessionsDir = $root . '/storage/sessions';
		foreach (self::$preservedSessions as $name => $content) {
			$target = $newSessionsDir . '/' . $name;
			if (!file_exists($target)) {
				file_put_contents($target, $content);
			}
		}
		$restored = count(self::$preservedSessions);
		self::$preservedSessions = [];

		return ['created' => $created, 'sessionsRestored' => $restored];
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
			'projectbuilder.php'    => 'projectbuilder.php',
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
			$hookFile = static::projectRoot() . '/projectbuilder.php';
			if (!file_exists($hookFile)) {
				return ['success' => false, 'output' => 'projectbuilder.php not found at ' . $hookFile];
			}

			// The projectbuilder returns a hooks array; invoke the route:after hook
			// to generate storage/temp/tailwind.css and storage/temp/vars.css
			$hooks = require $hookFile;
			if (!isset($hooks['route:after']) || !is_callable($hooks['route:after'])) {
				return ['success' => false, 'output' => 'route:after hook missing in ' . $hookFile];
			}
			$hooks['route:after']();
			return ['success' => true];
		} catch (\Throwable $e) {
			return [
				'success' => false,
				'output'  => $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine(),
			];
		}
	}

	/**
	 * Step 5b: Run npm install (if node_modules missing) + npm run build.
	 * Builds public/assets/css/site.min.css and public/assets/js/site.min.js.
	 */
	public static function npmBuild(): array
	{
		$root = static::projectRoot();

		// PHP under php-fpm/valet often has a minimal PATH — locate npm explicitly.
		$npm = trim(shell_exec('command -v npm 2>/dev/null') ?? '');
		if ($npm === '') {
			foreach (['/opt/homebrew/bin/npm', '/usr/local/bin/npm'] as $candidate) {
				if (is_executable($candidate)) {
					$npm = $candidate;
					break;
				}
			}
		}
		if ($npm === '') {
			return ['success' => false, 'output' => 'npm not found in PATH'];
		}

		$cdRoot = 'cd ' . escapeshellarg($root) . ' && ';
		$npmCmd = escapeshellarg($npm);
		$logs = [];

		if (!is_dir($root . '/node_modules')) {
			$installOut = [];
			$installCode = 0;
			exec($cdRoot . $npmCmd . ' install --silent 2>&1', $installOut, $installCode);
			$logs[] = '$ npm install';
			$logs = array_merge($logs, $installOut);
			if ($installCode !== 0) {
				return ['success' => false, 'output' => implode("\n", $logs)];
			}
		}

		$buildOut = [];
		$buildCode = 0;
		exec($cdRoot . $npmCmd . ' run build 2>&1', $buildOut, $buildCode);
		$logs[] = '$ npm run build';
		$logs = array_merge($logs, $buildOut);
		if ($buildCode !== 0) {
			return ['success' => false, 'output' => implode("\n", $logs)];
		}

		return ['success' => true, 'output' => implode("\n", $logs)];
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
