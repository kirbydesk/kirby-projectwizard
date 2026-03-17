<?php

/* -------------- API Routes --------------*/
return [
	'routes' => [
		// List all detected blocks with their defaults and current overrides
		[
			'pattern' => 'projectwizard/blocks',
			'action'  => function () {
				$detected  = ProjectConfig::detectBlocks();
				$overrides = ProjectConfig::loadOverrides();
				$activeBlocks = $overrides['blocks'] ?? [];

				$blocks = [];
				foreach ($detected as $blockType => $info) {
					$blockOverrides = $overrides['kirbyblocks'][$blockType] ?? [];
					$blocks[] = [
						'blockType'  => $blockType,
						'plugin'     => $info['plugin'],
						'active'     => in_array($blockType, $activeBlocks),
						'customized' => !empty($blockOverrides),
						'settings'   => $info['settings'],
						'defaults'   => $info['defaults'],
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
	]
];
