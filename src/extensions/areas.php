<?php

/* -------------- Areas --------------*/

// If setup is needed, show only the setup wizard
if (SetupWizard::isNeeded()) {
	return [
		'projectwizard' => [
			'label' => 'Project Wizard',
			'icon'  => 'wand',
			'menu'  => true,
			'dialogs' => [
				'projectwizard/setup' => [
					'pattern' => 'projectwizard/setup',
					'load'    => fn() => [
						'component' => 'pw-setup-dialog',
						'props'     => SetupWizard::detect(),
					],
					'submit'  => fn() => true,
				],
			],
			'views' => [
				[
					'pattern' => 'projectwizard',
					'action'  => fn() => [
						'component' => 'pw-wizard-setup',
						'title'     => 'Project Setup',
						'props'     => [],
					],
				],
			],
		],
	];
}

$areas = [];

// Divider before Project Wizard section
$areas['pw-divider'] = [
	'label'    => '',
	'icon'     => 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"></svg>',
	'menu'     => true,
	'link'     => false,
	'disabled' => true,
];

// Detect blocks for views + menu entries (only activated blocks)
$allBlocks  = ProjectConfig::detectBlocks();
$active     = ProjectConfig::activeBlocks();
$blocks     = array_filter($allBlocks, fn($type) => in_array($type, $active), ARRAY_FILTER_USE_KEY);

// Read block labels directly from plugin i18n files
$blockLabel = function(string $plugin, string $blockType): string {
	$fallback = ucfirst(preg_replace('/^pw/', '', $blockType));
	$fallback = preg_replace('/([a-z])([A-Z])/', '$1 $2', $fallback);

	$i18nFile = kirby()->root('plugins') . '/' . $plugin . '/src/i18n/en.php';
	if (file_exists($i18nFile)) {
		$content = file_get_contents($i18nFile);
		if (preg_match("/'$plugin\.name'\s*=>\s*'([^']+)'/", $content, $m)) {
			return $m[1];
		}
	}
	return $fallback;
};

// Main projectwizard area (global settings only)
$areas['projectwizard'] = [
	'label' => 'Project Wizard',
	'icon'  => 'wand',
	'menu'  => true,
	'views' => [
		[
			'pattern' => 'projectwizard',
			'action'  => fn() => [
				'component' => 'pw-wizard-overview',
				'title'     => 'Project Wizard',
				'props'     => [
					'blockType' => null,
				],
			],
		],
	],
];

// Block areas — each with its own view so Kirby highlights the active menu entry.
// Project-related blocks (non-pw prefix, e.g. site-*) are static and have no
// configurable defaults — they're available in the wizard's Blocks tab as a
// toggle and in the page editor's block picker, but get no panel menu entry.
foreach ($blocks as $blockType => $info) {
	if (!str_starts_with($blockType, 'pw')) continue;

	$plugin = $info['plugin'];
	$label  = $blockLabel($plugin, $blockType);
	$slug   = strtolower($blockType);

	$areas['pw-block-' . $slug] = [
		'label' => $label,
		'icon'  => $info['icon'] ?? 'box',
		'menu'  => true,
		'link'  => 'projectwizard/block/' . $blockType,
		'views' => [
			[
				'pattern' => 'projectwizard/block/' . $blockType,
				'action'  => fn() => [
					'component' => 'pw-wizard-overview',
					'title'     => $label,
					'props'     => [
						'blockType' => $blockType,
					],
				],
			],
		],
	];
}

return $areas;
