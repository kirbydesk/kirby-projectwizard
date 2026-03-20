<?php

/* -------------- API Routes --------------*/
return [
	'routes' => [
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
						'active'     => in_array($blockType, $activeBlocks),
						'customized' => !empty($blockOverrides),
						'settings'   => $info['settings'],
						'editor'     => $info['editor'],
					];
				}

				return [
					'blocks'       => $blocks,
					'activeBlocks' => $activeBlocks,
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
				return ProjectConfig::blockConfig($blockType);
			}
		],
		// Reset a block to plugin defaults
		[
			'pattern' => 'projectwizard/block/(:any)/reset',
			'method'  => 'POST',
			'action'  => function (string $blockType) {
				ProjectConfig::resetBlockConfig($blockType);
				return ProjectConfig::blockConfig($blockType);
			}
		],
		// Get/set active blocks list
		[
			'pattern' => 'projectwizard/blocks/active',
			'method'  => 'GET',
			'action'  => function () {
				return ['blocks' => ProjectConfig::activeBlocks()];
			}
		],
		[
			'pattern' => 'projectwizard/blocks/active',
			'method'  => 'POST',
			'action'  => function () {
				$data = kirby()->request()->body()->toArray();
				$blocks = $data['blocks'] ?? [];
				return ['blocks' => ProjectConfig::activeBlocks($blocks)];
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
				return ProjectConfig::loadGlobal();
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
				return ProjectConfig::loadNavigation();
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
				return ProjectConfig::loadFontsizes();
			}
		],
	]
];
