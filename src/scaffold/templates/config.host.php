<?php

return [

	/** Dev settings -------------------------------------------------------------*/
	'debug' => true,
	'hooks' => require __DIR__ . '/../plugins/kirby-projectwizard/projectbuilder.php',
	'cache' => [
		'pages' => [
			'active' => false,
		],
	],

	/** Language settings -------------------------------------------------------------*/
	'languages' => true,

	/** Local Mailhog configuration -------------------------------------------------------------*/
	'email' => [
		'transport' => [
			'type' => 'smtp',
			'host' => 'localhost',
			'port' => 1025,
			'security' => false
		]
	]
];
