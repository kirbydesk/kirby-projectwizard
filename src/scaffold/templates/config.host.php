<?php

return [

	/** Dev settings -------------------------------------------------------------*/
	'debug' => true,
	// local development: project builder, setup wizard and npm only run here
	'kirbydesk.projectwizard.development' => true,
	'hooks' => require __DIR__ . '/../../projectbuilder.php',
	'cache' => [
		'pages' => [
			'active' => false,
		],
	],

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
