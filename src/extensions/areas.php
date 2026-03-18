<?php

/* -------------- Areas --------------*/
$areas = [];

// Divider before Project Wizard section
$areas['pw-divider'] = [
	'label'    => '',
	'icon'     => 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"></svg>',
	'menu'     => true,
	'link'     => false,
	'disabled' => true,
];

// Detect blocks for views + menu entries
$blocks = ProjectConfig::detectBlocks();

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

// Block areas — each with its own view so Kirby highlights the active menu entry
foreach ($blocks as $blockType => $info) {
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
					'breadcrumb' => [
						['label' => 'Project Wizard', 'link' => 'projectwizard'],
						['label' => $label],
					],
					'props'     => [
						'blockType' => $blockType,
					],
				],
			],
		],
	];
}

return $areas;
