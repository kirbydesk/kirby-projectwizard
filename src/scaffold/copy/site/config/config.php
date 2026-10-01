<?php

/**
 * Project configuration (from the Project Wizard's scaffold).
 * Host-specific settings (debug, mail …) live in config.{host}.php; the API
 * keys of the AI plugins live in the project's .env, managed in the Project
 * Wizard – the plugins read them from there.
 */
return [

	/** Panel ------------------------------------------------------------------------*/
	'panel' => [
		'install' => true,
		'css'     => 'assets/css/panel.min.css',
	],

	/** Languages --------------------------------------------------------------------*/
	'languages' => true,

	/** Updates: no update checks for kirbydesk plugins (not on the Kirby marketplace) */
	'updates' => [
		'plugins' => [
			'kirbydesk/*' => false,
		],
	],

	/** PLUGIN: Kirby Pagewizard -----------------------------------------------------*/
	'kirbydesk.pagewizard.protected' => '',

	/** Set once all plugins are loaded ---------------------------------------------*/
	'ready' => fn ($kirby) => [
		'kirbydesk.pagewizard.reloadOnSave' => $kirby->user() !== null,

		// the buttons above a page and the site: the AI buttons only with
		// their plugins installed
		'panel' => [
			'viewButtons' => [
				'page' => array_values(array_filter([
					'open', '-', 'settings',
					$kirby->plugin('kirbydesk/kirby-contentwizard') ? 'contentwizard' : null,
					$kirby->plugin('kirbydesk/kirby-translatewizard') ? 'translatewizard' : null,
					'languages', 'status',
				])),
				'site' => ['open', 'languages'],
			],
		],
	],
];
