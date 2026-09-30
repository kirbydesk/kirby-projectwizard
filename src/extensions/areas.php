<?php

/* -------------- Areas --------------*/

// If setup is needed, show only the setup wizard
if (SetupWizard::isNeeded()) {
	return [
		'projectwizard' => fn() => [
			'label' => t('prw.area.title', 'Project Wizard'),
			'icon'  => 'wand',
			'menu'  => true,
			'dialogs' => [
				'projectwizard/setup' => [
					'pattern' => 'projectwizard/setup',
					'load'    => fn() => [
						'component' => 'pw-setup-dialog',
						'props'     => SetupWizard::detect(),
					],
					'submit'  => fn() => true,
				],
			],
			'views' => [
				[
					'pattern' => 'projectwizard',
					'action'  => fn() => [
						'component' => 'pw-wizard-setup',
						'title'     => t('prw.area.setup', 'Project Setup'),
						'props'     => [],
					],
				],
			],
		],
	];
}

$areas = [];

// Detect blocks for views + menu entries (only activated blocks)
$allBlocks  = ProjectConfig::detectBlocks();
$active     = ProjectConfig::activeBlocks();
$blocks     = array_filter($allBlocks, fn($type) => in_array($type, $active), ARRAY_FILTER_USE_KEY);

// Per-block display label: <plugin>.name in the panel's language (worked out
// when the area is used – the user's language is known only then), else the
// name from detectBlocks() (package.json, i18n, fallback)
$blockLabel = function(array $info, string $blockType): string {
	$key = ($info['plugin'] ?? '') . '.name';
	$translated = t($key, '');
	if (is_string($translated) && $translated !== '' && $translated !== $key) return $translated;
	if (!empty($info['name'])) return $info['name'];
	$fallback = ucfirst(preg_replace('/^pw/', '', $blockType));
	return preg_replace('/([a-z])([A-Z])/', '$1 $2', $fallback);
};

// Main projectwizard area (global settings only)
$areas['projectwizard'] = fn() => [
	'label' => t('prw.area.title', 'Project Wizard'),
	'icon'  => 'wand',
	'menu'  => true,
	'views' => [
		[
			'pattern' => 'projectwizard',
			'action'  => fn() => [
				'component' => 'pw-wizard-overview',
				'title'     => t('prw.area.title', 'Project Wizard'),
				'props'     => [
					'blockType' => null,
				],
			],
		],
	],
];

// Block areas — each with its own view so Kirby highlights the active menu entry.
// Project-related blocks (non-pw prefix, e.g. site-*) are static and have no
// configurable defaults — they're available in the wizard's Blocks tab as a
// toggle and in the page editor's block picker, but get no panel menu entry.
foreach ($blocks as $blockType => $info) {
	if (!str_starts_with($blockType, 'pw')) continue;

	$slug = strtolower($blockType);

	// (a closure: Kirby evaluates it with the user's language set)
	$areas['pw-block-' . $slug] = fn() => [
		'label' => $label = $blockLabel($info, $blockType),
		'icon'  => $info['icon'] ?? 'box',
		// reached via the "Blocks" dropdown in the wizard's header, not the panel menu
		'menu'  => false,
		'link'  => 'projectwizard/block/' . $blockType,
		'views' => [
			[
				'pattern' => 'projectwizard/block/' . $blockType,
				'action'  => fn() => [
					'component' => 'pw-wizard-overview',
					'title'     => $blockLabel($info, $blockType),
					'props'     => [
						'blockType' => $blockType,
					],
				],
			],
		],
	];
}

return $areas;
