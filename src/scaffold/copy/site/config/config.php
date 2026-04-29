<?php

/** Env variable settings -------------------------------------------------------------*/
$env = [];
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
	foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
		if (str_starts_with(trim($line), '#')) continue;
		[$key, $value] = array_pad(explode('=', $line, 2), 2, '');
		$env[trim($key)] = trim($value);
	}
}

return [

	/** Panel settings -------------------------------------------------------------*/
	'panel' =>[
		'install' => true,
		'css' => 'assets/css/panel.min.css'
	],

	/** Language settings -------------------------------------------------------------*/
	'languages' => true,

	/** PLUGIN: Kirby Pagewizard ----------------------------------------*/
	'kirbydesk.pagewizard.protected' => '',
	'ready' => fn($kirby) => [
		'kirbydesk.pagewizard.reloadOnSave' => $kirby->user() !== null,
	],

	/** Disable update checks for kirbydesk plugins (not on Kirby marketplace) */
	'updates' => [
		'plugins' => [
			'kirbydesk/*' => false,
		],
	],
];
