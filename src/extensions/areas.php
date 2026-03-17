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

// Global settings
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

// Dynamic block entries
$blocks = ProjectConfig::detectBlocks();
foreach ($blocks as $blockType => $info) {
	$label = ucfirst(preg_replace('/^pw/', '', $blockType));
	$label = preg_replace('/([a-z])([A-Z])/', '$1 $2', $label);
	$slug  = strtolower($blockType);

	$areas['pw-block-' . $slug] = [
		'label' => $label,
		'icon'  => 'box',
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
