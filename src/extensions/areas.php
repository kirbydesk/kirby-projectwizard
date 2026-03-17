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

foreach ($blocks as $blockType => $info) {
	$label = ucfirst(preg_replace('/^pw/', '', $blockType));
	$label = preg_replace('/([a-z])([A-Z])/', '$1 $2', $label);

	// Add view to projectwizard area
	$blockViews[] = [
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
	];

	// Sidebar menu entry (links into the projectwizard area)
	$slug = strtolower($blockType);
	$areas['pw-block-' . $slug] = [
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

return $areas;
