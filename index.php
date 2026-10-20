<?php

require_once __DIR__ . '/src/classes/ProjectConfig.php';
require_once __DIR__ . '/src/classes/SetupWizard.php';

Kirby::plugin('kirbydesk/kirby-projectwizard', [
	/* -------------- Extensions --------------*/
	'api'          => require_once 'src/extensions/api.php',
	'areas'        => require_once 'src/extensions/areas.php',
	'translations' => require_once 'src/extensions/translations.php',
	'hooks'        => [
		'route:before' => function () {
			// only in local development – never write project files on a server
			if (SetupWizard::isDevelopment() && !SetupWizard::isNeeded()) {
				ProjectConfig::scaffold();
			}
		},
	],
]);
