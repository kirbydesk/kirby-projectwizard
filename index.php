<?php

require_once __DIR__ . '/src/classes/ProjectConfig.php';

Kirby::plugin('kirbydesk/kirby-projectwizard', [

	/* -------------- Extensions --------------*/
	'api'          => require_once 'src/extensions/api.php',
	'areas'        => require_once 'src/extensions/areas.php',
	'translations' => require_once 'src/extensions/translations.php',
]);
