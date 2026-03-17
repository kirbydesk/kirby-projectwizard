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

foreach ($blocks as $blockType => $info) {
	$translationKey = $info['plugin'] . '.name';
	$label = t($translationKey, ucfirst(preg_replace('/^pw/', '', $blockType)));
	$label = is_string($label) ? $label : ucfirst(preg_replace('/^pw/', '', $blockType));

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

	// Sidebar menu entry — collected in order, added after projectwizard
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
