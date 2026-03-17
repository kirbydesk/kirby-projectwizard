<?php

/* -------------- Areas --------------*/
return [
	'projectwizard' => [
		'label' => 'Project Wizard',
		'icon'  => 'wand',
		'menu'  => true,
		'views' => [
			[
				'pattern' => 'projectwizard',
				'action'  => fn() => [
					'component' => 'pw-wizard-overview',
					'title'     => 'Project Wizard',
					'props'     => [],
				],
			],
			[
				'pattern' => 'projectwizard/block/(:any)',
				'action'  => fn(string $blockType) => [
					'component' => 'pw-wizard-block-editor',
					'title'     => 'Block: ' . $blockType,
					'props'     => [
						'blockType' => $blockType,
					],
				],
			],
		],
	],
];
