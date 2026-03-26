<?php

// Autoloader (Composer)
require __DIR__ . '/../vendor/autoload.php';

// Kirby initialization
$kirby = new Kirby([
	'roots' => [
		'index'     => __DIR__,
		'content'   => dirname(__DIR__) . '/content',
		'site'      => dirname(__DIR__) . '/site',
		'cache'     => dirname(__DIR__) . '/storage/cache',
		'sessions'  => dirname(__DIR__) . '/storage/sessions',
		'logs'      => dirname(__DIR__) . '/storage/logs',
		'temp'      => dirname(__DIR__) . '/storage/temp',
		'assets'    => __DIR__ . '/assets',
		'media'     => __DIR__ . '/media',
	]
]);

// Custom functions
include_once(kirby()->roots()->index() . '/functions.php');

echo $kirby->render();
