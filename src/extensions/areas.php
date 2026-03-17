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
		],
	],
];
