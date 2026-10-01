<?php

/* -------------- API Routes --------------*/
return [
	'routes' => [
		// Setup wizard: check status
		[
			'pattern' => 'projectwizard/setup/status',
			'method'  => 'GET',
			'action'  => function () {
				return [
					'needed'    => SetupWizard::isNeeded(),
					'defaults'  => SetupWizard::detect(),
					// the default languages to choose from: code => name
					'languages' => array_map(fn ($l) => $l[0], SetupWizard::LANGUAGES),
				];
			}
		],
		// Setup wizard: run all steps
		[
			'pattern' => 'projectwizard/setup/run',
			'method'  => 'POST',
			'action'  => function () {
				set_time_limit(300);
				$defaults = SetupWizard::detect();
				$projectName = $defaults['projectName'];
				$valetHost = $defaults['valetHost'];
				// the default language chosen in the setup dialog
				$language = (string) kirby()->request()->get('language', 'de');
				$results = [];

				$steps = [
					'clean'          => fn() => SetupWizard::cleanSlate(),
					'directories'    => fn() => SetupWizard::createDirectories(),
					'files'          => fn() => SetupWizard::generateFiles($projectName, $valetHost),
					'language'       => fn() => SetupWizard::createLanguage($language),
					'projectbuilder' => fn() => SetupWizard::triggerProjectbuilder(),
					'npmBuild'       => fn() => SetupWizard::npmBuild(),
					'finalize'       => fn() => SetupWizard::finalize(),
				];

				foreach ($steps as $key => $fn) {
					try {
						$result = $fn();
						if (isset($result['success']) && $result['success'] === false) {
							return ['success' => false, 'failedStep' => $key, 'error' => $result['output'] ?? 'Unknown error', 'results' => $results];
						}
						$results[$key] = $result;
					} catch (Exception $e) {
						return ['success' => false, 'failedStep' => $key, 'error' => $e->getMessage(), 'results' => $results];
					}
				}

				return ['success' => true, 'results' => $results];
			}
		],
		// How often each block type is used: top-level blocks of all block (and
		// layout) fields of the site and every page incl. drafts, default language
		// only so translations do not count twice
		[
			'pattern' => 'projectwizard/blocks/usage',
			'action'  => function () {
				$kirby  = kirby();
				$lang   = $kirby->multilang() ? $kirby->defaultLanguage()->code() : null;
				$counts = array_fill_keys(array_keys(ProjectConfig::detectBlocks()), 0);

				$countBlocks = function (array $blocks) use (&$counts): void {
					foreach ($blocks as $block) {
						$type = is_array($block) ? ($block['type'] ?? null) : null;
						if ($type !== null && isset($counts[$type])) $counts[$type]++;
					}
				};

				foreach ([$kirby->site(), ...$kirby->site()->index(true)] as $model) {
					foreach ($model->content($lang)->toArray() as $value) {
						if (!is_string($value) || !str_contains($value, '"type"')) continue;
						$data = json_decode($value, true);
						if (!is_array($data)) continue;
						foreach ($data as $entry) {
							// layout field: rows → columns → blocks
							if (is_array($entry) && isset($entry['columns'])) {
								foreach ($entry['columns'] as $column) $countBlocks($column['blocks'] ?? []);
							}
						}
						$countBlocks($data);
					}
				}

				return $counts;
			}
		],
		// The start page's figures: how many pages the site has
		[
			'pattern' => 'projectwizard/stats',
			'action'  => function () {
				return ['pages' => kirby()->site()->index(true)->count()];
			}
		],
		// The pages that use a block: path of titles, how often, panel link
		[
			'pattern' => 'projectwizard/blocks/usage/(:any)',
			'action'  => function (string $blockType) {
				$kirby = kirby();
				$lang  = $kirby->multilang() ? $kirby->defaultLanguage()->code() : null;
				$pages = [];

				$countIn = function (array $blocks) use ($blockType): int {
					$n = 0;
					foreach ($blocks as $block) {
						if (is_array($block) && ($block['type'] ?? null) === $blockType) $n++;
					}
					return $n;
				};

				foreach ([$kirby->site(), ...$kirby->site()->index(true)] as $model) {
					$count = 0;
					foreach ($model->content($lang)->toArray() as $value) {
						if (!is_string($value) || !str_contains($value, '"type"')) continue;
						$data = json_decode($value, true);
						if (!is_array($data)) continue;
						foreach ($data as $entry) {
							// layout field: rows → columns → blocks
							if (is_array($entry) && isset($entry['columns'])) {
								foreach ($entry['columns'] as $column) $count += $countIn($column['blocks'] ?? []);
							}
						}
						$count += $countIn($data);
					}
					if ($count === 0) continue;

					// the page's path of titles (parents first), the site its title
					$titles = [];
					if ($model instanceof \Kirby\Cms\Page) {
						foreach ($model->parents()->flip() as $parent) $titles[] = $parent->title()->value();
					}
					$titles[] = $model->title()->value();
					$pages[] = [
						'title' => implode(' › ', $titles),
						'count' => $count,
						'link'  => $model->panel()->url(true),
					];
				}

				return $pages;
			}
		],
		// List all detected blocks with their defaults and current overrides
		[
			'pattern' => 'projectwizard/blocks',
			'action'  => function () {
				$detected  = ProjectConfig::detectBlocks();
				$activeBlocks = ProjectConfig::activeBlocks();

				$blocks = [];
				foreach ($detected as $blockType => $info) {
					$blockOverrides = ProjectConfig::loadBlockOverrides($blockType);
					$blocks[] = [
						'blockType'  => $blockType,
						'plugin'     => $info['plugin'],
						'name'       => $info['name'] ?? null,
						'icon'       => $info['icon'] ?? null,
						'active'     => in_array($blockType, $activeBlocks),
						'customized' => !empty($blockOverrides),
						'settings'   => $info['settings'],
						'editor'     => $info['editor'],
					];
				}

				return [
					'blocks'       => $blocks,
					'activeBlocks' => $activeBlocks,
					'activeVariants' => ProjectConfig::activeVariants(),
				];
			}
		],
		// Get merged config for a single block
		[
			'pattern' => 'projectwizard/block/(:any)',
			'method'  => 'GET',
			'action'  => function (string $blockType) {
				return ProjectConfig::blockConfig($blockType);
			}
		],
		// Save overrides for a single block
		[
			'pattern' => 'projectwizard/block/(:any)',
			'method'  => 'POST',
			'action'  => function (string $blockType) {
				$data = kirby()->request()->body()->toArray();
				ProjectConfig::saveBlockConfig($blockType, $data);
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::blockConfig($blockType);
			}
		],
		// Reset a block to plugin defaults
		[
			'pattern' => 'projectwizard/block/(:any)/reset',
			'method'  => 'POST',
			'action'  => function (string $blockType) {
				ProjectConfig::resetBlockConfig($blockType);
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::blockConfig($blockType);
			}
		],
		// Get/set active blocks list
		[
			'pattern' => 'projectwizard/blocks/active',
			'method'  => 'GET',
			'action'  => function () {
				return ['blocks' => ProjectConfig::activeBlocks(), 'variants' => ProjectConfig::activeVariants()];
			}
		],
		[
			'pattern' => 'projectwizard/blocks/active',
			'method'  => 'POST',
			'action'  => function () {
				$data = kirby()->request()->body()->toArray();
				$blocks = $data['blocks'] ?? [];
				$result = ProjectConfig::activeBlocks($blocks);
				$variants = isset($data['variants']) ? ProjectConfig::activeVariants($data['variants']) : ProjectConfig::activeVariants();
				SetupWizard::triggerProjectbuilder();
				return ['blocks' => $result, 'variants' => $variants];
			}
		],
		// Get full stored config
		[
			'pattern' => 'projectwizard/config',
			'method'  => 'GET',
			'action'  => function () {
				return ProjectConfig::mergedConfig();
			}
		],
		// the panel's block previews: all project values at once
		[
			'pattern' => 'projectwizard/preview',
			'method'  => 'GET',
			'action'  => function () {
				return ProjectConfig::previewData();
			}
		],
		// Settings › Configuration: what currently applies per block (tree)
		[
			'pattern' => 'projectwizard/patches/tree',
			'method'  => 'GET',
			'action'  => function () {
				return ProjectConfig::effectiveTree();
			}
		],
		// Exceptions (Project › Exceptions): the raw JSON and unknown blocks
		[
			'pattern' => 'projectwizard/patches',
			'method'  => 'GET',
			'action'  => function () {
				return ProjectConfig::loadPatches();
			}
		],
		[
			'pattern' => 'projectwizard/patches',
			'method'  => 'POST',
			'action'  => function () {
				$data = kirby()->request()->body()->toArray();
				$result = ProjectConfig::savePatches((string) ($data['text'] ?? ''));
				SetupWizard::triggerProjectbuilder();
				return $result;
			}
		],
		// Get color defaults + overrides
		[
			'pattern' => 'projectwizard/global',
			'method'  => 'GET',
			'action'  => function () {
				return ProjectConfig::loadGlobal();
			}
		],
		// Save global overrides
		[
			'pattern' => 'projectwizard/global',
			'method'  => 'POST',
			'action'  => function () {
				$data = kirby()->request()->body()->toArray();
				ProjectConfig::saveGlobal($data);
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::loadGlobal();
			}
		],
		// Get per-block CSS-variable defaults + overrides
		[
			'pattern' => 'projectwizard/values/(:any)',
			'method'  => 'GET',
			'action'  => function (string $blockType) {
				return ProjectConfig::loadBlockValues($blockType);
			}
		],
		// Save per-block CSS-variable overrides
		[
			'pattern' => 'projectwizard/values/(:any)',
			'method'  => 'POST',
			'action'  => function (string $blockType) {
				$data = kirby()->request()->body()->toArray();
				ProjectConfig::saveBlockValues($blockType, $data);
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::loadBlockValues($blockType);
			}
		],
		// Get element style defaults + overrides
		[
			'pattern' => 'projectwizard/elements',
			'method'  => 'GET',
			'action'  => function () {
				return ProjectConfig::loadElements();
			}
		],
		// Save element style overrides
		[
			'pattern' => 'projectwizard/elements',
			'method'  => 'POST',
			'action'  => function () {
				$data = kirby()->request()->body()->toArray();
				ProjectConfig::saveElements($data);
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::loadElements();
			}
		],
		// Get footer defaults + overrides
		[
			'pattern' => 'projectwizard/footer',
			'method'  => 'GET',
			'action'  => function () {
				return ProjectConfig::loadFooter();
			}
		],
		// Save footer overrides
		[
			'pattern' => 'projectwizard/footer',
			'method'  => 'POST',
			'action'  => function () {
				$data = kirby()->request()->body()->toArray();
				ProjectConfig::saveFooter($data);
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::loadFooter();
			}
		],
		// Get navigation defaults + overrides
		[
			'pattern' => 'projectwizard/navigation',
			'method'  => 'GET',
			'action'  => function () {
				return ProjectConfig::loadNavigation();
			}
		],
		// Save navigation overrides
		[
			'pattern' => 'projectwizard/navigation',
			'method'  => 'POST',
			'action'  => function () {
				$data = kirby()->request()->body()->toArray();
				ProjectConfig::saveNavigation($data);
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::loadNavigation();
			}
		],
		// Get all fonts (builtin + project)
		[
			'pattern' => 'projectwizard/fonts',
			'method'  => 'GET',
			'action'  => function () {
				return ProjectConfig::loadFonts();
			}
		],
		// Add a font
		[
			'pattern' => 'projectwizard/fonts',
			'method'  => 'POST',
			'action'  => function () {
				$data = kirby()->request()->body()->toArray();
				$family = trim($data['family'] ?? 'font');
				$key = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $family));
				ProjectConfig::addFont($key, [
					'family'   => $family,
					'category' => $data['category'] ?? 'sans-serif',
					'italic'   => ($data['italic'] ?? false) === true || $data['italic'] === 'true',
					'files'    => $data['files'] ?? [],
				]);
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::loadFonts();
			}
		],
		// Upload font file (base64, must be before (:any) route)
		[
			'pattern' => 'projectwizard/fonts/upload',
			'method'  => 'POST',
			'action'  => function () {
				$data = kirby()->request()->body()->toArray();
				$name = basename($data['name'] ?? '');
				$base64 = $data['data'] ?? '';

				if (!$name || !str_ends_with(strtolower($name), '.woff2') || !$base64) {
					return ['error' => t('prw.error.invalidFile', 'Invalid file')];
				}

				$fontsDir = kirby()->root('index') . '/assets/fonts';
				if (!is_dir($fontsDir)) mkdir($fontsDir, 0777, true);

				file_put_contents($fontsDir . '/' . $name, base64_decode($base64));

				return ['uploaded' => [$name]];
			}
		],
		// Delete a single font file
		[
			'pattern' => 'projectwizard/fonts/(:any)/file/(:num)',
			'method'  => 'DELETE',
			'action'  => function (string $key, int $fileIndex) {
				ProjectConfig::removeFontFile($key, $fileIndex);
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::loadFonts();
			}
		],
		// Delete an entire font
		[
			'pattern' => 'projectwizard/fonts/(:any)',
			'method'  => 'DELETE',
			'action'  => function (string $key) {
				ProjectConfig::removeFont($key);
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::loadFonts();
			}
		],
		// Set default font
		[
			'pattern' => 'projectwizard/fonts/default',
			'method'  => 'POST',
			'action'  => function () {
				$data = kirby()->request()->body()->toArray();
				ProjectConfig::setDefaultFont($data['family'] ?? 'Inter');
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::loadFonts();
			}
		],
		// Get fontsize defaults + overrides
		[
			'pattern' => 'projectwizard/fontsizes',
			'method'  => 'GET',
			'action'  => function () {
				return ProjectConfig::loadFontsizes();
			}
		],
		// Save fontsize overrides
		[
			'pattern' => 'projectwizard/fontsizes',
			'method'  => 'POST',
			'action'  => function () {
				$data = kirby()->request()->body()->toArray();
				ProjectConfig::saveFontsizes($data);
				SetupWizard::triggerProjectbuilder();
				return ProjectConfig::loadFontsizes();
			}
		],
	]
];
