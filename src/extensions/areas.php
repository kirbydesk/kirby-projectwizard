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
$blockViews = [];
$blockMenuEntries = [];

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

foreach ($blocks as $blockType => $info) {
	$plugin = $info['plugin'];
	$label  = $blockLabel($plugin, $blockType);

	// View inside projectwizard area
	$blockViews[] = [
		'pattern' => 'projectwizard/block/' . $blockType,
		'action'  => fn() => [
			'component' => 'pw-wizard-overview',
			'title'     => $label,
			'breadcrumb' => [
				['label' => $label, 'link' => 'projectwizard/block/' . $blockType],
			],
			'props'     => [
				'blockType' => $blockType,
			],
		],
	];

	// Sidebar menu entry
	$slug = strtolower($blockType);
	$blockMenuEntries['pw-block-' . $slug] = [
		'label' => $label,
		'icon'  => $info['icon'] ?? 'box',
		'menu'  => true,
		'link'  => 'projectwizard/block/' . $blockType,
	];
}

// Main projectwizard area with all views
$areas['projectwizard'] = [
	'label' => 'Project Wizard',
	'icon'  => 'wand',
	'menu'  => true,
	'views' => array_merge(
		[
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
		$blockViews
	),
];

// Add block menu entries after projectwizard (preserves order)
foreach ($blockMenuEntries as $key => $entry) {
	$areas[$key] = $entry;
}

return $areas;
