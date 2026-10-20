<?php

/**
 * Project builder (local development only): creates stub files and
 * storage/temp/tailwind.css for the Tailwind build. The logic lives in
 * kirby-pagewizard and stays in sync with the installed plugin.
 * CSS variables and fonts are not built: pagewizard serves them at runtime.
 */
return ['route:after' => fn () => pwConfig::runProjectBuilder()];
