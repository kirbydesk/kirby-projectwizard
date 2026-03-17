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

$blockLabelFn = function(string $plugin, string $blockType): string {
	$fallback = ucfirst(preg_replace('/^pw/', '', $blockType));
	$fallback = preg_replace('/([a-z])([A-Z])/', '$1 $2', $fallback);
	$label = t($plugin . '.name', $fallback);
	return is_string($label) ? $label : $fallback;
};

foreach ($blocks as $blockType => $info) {
	$plugin = $info['plugin'];

	// View inside projectwizard area
	$blockViews[] = [
		'pattern' => 'projectwizard/block/' . $blockType,
		'action'  => function() use ($blockType, $plugin, $blockLabelFn) {
			$label = $blockLabelFn($plugin, $blockType);
			return [
				'component' => 'pw-wizard-overview',
				'title'     => $label,
				'breadcrumb' => [
					['label' => $label, 'link' => 'projectwizard/block/' . $blockType],
				],
				'props'     => [
					'blockType' => $blockType,
				],
			];
		},
	];

	// Sidebar menu entry — use closure for label so translations are resolved at render time
	$slug = strtolower($blockType);
	$blockMenuEntries['pw-block-' . $slug] = [
		'label' => function() use ($plugin, $blockType, $blockLabelFn) {
			return $blockLabelFn($plugin, $blockType);
		},
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
