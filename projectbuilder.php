<?php
return [
    'route:after' => function () {

				// Die Hook stellt sicher dass alle relevanten Verzeichnisse und Dateien existieren
				// npm run ... schreibt die finalen css und js-Datei in das Verzeichnis /public/assets/

				$jsDir = kirby()->root('index') . '/assets/js';
				if (!is_dir($jsDir)) {
						mkdir($jsDir, 0777, true);
				}

				$cssDir = kirby()->root('index') . '/assets/css';
				if (!is_dir($cssDir)) {
						mkdir($cssDir, 0777, true);
				}

				$patchesCssDir = kirby()->root('site') . '/patches/css';
				if (!is_dir($patchesCssDir)) {
						mkdir($patchesCssDir, 0777, true);
				}

				$patchesJsDir = kirby()->root('site') . '/patches/js';
				if (!is_dir($patchesJsDir)) {
						mkdir($patchesJsDir, 0777, true);
				}

				$blocksDir = kirby()->root('site') . '/blueprints/blocks';
				if (!is_dir($blocksDir)) {
						mkdir($blocksDir, 0777, true);
				}

				$pagesDir = kirby()->root('site') . '/blueprints/pages';
				if (!is_dir($pagesDir)) {
						mkdir($pagesDir, 0777, true);
				}

				$snippetsDir = kirby()->root('site') . '/snippets';
				if (!is_dir($snippetsDir)) {
						mkdir($snippetsDir, 0777, true);
				}

				$templatesDir = kirby()->root('site') . '/templates';
				if (!is_dir($templatesDir)) {
						mkdir($templatesDir, 0777, true);
				}

				// Temp directory for temporary css file
				$tempDir = kirby()->root('temp');
				if (!is_dir($tempDir)) {
						mkdir($tempDir, 0777, true);
				}

				$outputFile = $tempDir . '/tailwind.css';
				$imports = [];

				// Plugins auf .stub-file prüfen
				foreach (kirby()->plugins() as $plugin) {
						$marker = $plugin->root() . '/src/css/.stub';

						if (file_exists($marker)) {
								$pluginDir = $plugin->root();
								$dirName = basename($pluginDir);
								$pluginName = $plugin->name();
								$packageName = substr(strrchr($pluginName, '/'), 1);

								$imports[] = "\n/* Plugin: " . $packageName . " */";

								// Plugin-specific tailwind setup (CSS vars, stubs)
								if (method_exists('pwConfig', 'tailwindSetup')) {
									pwConfig::tailwindSetup($pluginDir, $imports);
								}

								// Pfade definieren
								$patchDir = kirby()->root('site') . '/patches/css/' . $packageName;
								$pluginCssDir = $plugin->root() . '/src/css';

								// Check for modular patches directory
								if (is_dir($patchDir)) {
										// Alle .css Dateien scannen und sortieren (Nummern-Order!)
										$cssFiles = glob($pluginCssDir . '/*.css');
										sort($cssFiles);  // Sortiert nach Namen (01-, 02-, etc.)

										foreach ($cssFiles as $cssFile) {
												$moduleName = basename($cssFile);

												// Check for active patch (without underscore)
												$modulePatch = $patchDir . '/' . $moduleName;
												$moduleDefault = $cssFile;

												// Use patch if exists, otherwise use default
												if (file_exists($modulePatch)) {
														$imports[] = "@import '../../site/patches/css/" . $packageName . "/" . $moduleName . "';";
												} elseif (file_exists($moduleDefault)) {
														$imports[] = "@import '../../site/plugins/" . $dirName . "/src/css/" . $moduleName . "';";
												}
										}
								}
								// Default: Kein Patch-Directory - scanne Plugin CSS
								else {
										$cssFiles = glob($pluginCssDir . '/*.css');
										sort($cssFiles);

										foreach ($cssFiles as $cssFile) {
												$moduleName = basename($cssFile);
												$imports[] = "@import '../../site/plugins/" . $dirName . "/src/css/" . $moduleName . "';";
										}
								}

								// Tailwind Watcher - Snippets/Templates (für Tailwind-Klassen!)
								$imports[] = "@source '../../site/plugins/" . $dirName . "/snippets';";
								$imports[] = "@source '../../site/plugins/" . $dirName . "/templates';";

								// Stub-Dateien mit deaktivierten Modulen erzeugen
								if (is_dir($pluginCssDir)) {
										$cssFiles = glob($pluginCssDir . '/*.css');

										if (!empty($cssFiles)) {
												if (!is_dir($patchDir)) {
														mkdir($patchDir, 0777, true);
												}

												foreach ($cssFiles as $cssFile) {
														$fileName = basename($cssFile);
														$activeFile = $patchDir . '/' . $fileName;
														$stubFile = $patchDir . '/_' . $fileName;

														// Nur erstellen wenn weder aktive noch stub Datei existiert
														if (!file_exists($activeFile) && !file_exists($stubFile)) {
																$comment = "/* Remove the leading underscore from filename and start editing */\n\n";
																$cssContent = preg_replace('/^\/\* DO NOT MODIFY THIS FILE[^\*]*\*\/\n?/m', '', file_get_contents($cssFile));
																file_put_contents($stubFile, $comment . ltrim($cssContent));
														}
												}
										}
								}

								// JS-Stubs erzeugen (src/js/*.js)
								$pluginJsDir = $plugin->root() . '/src/js';
								if (is_dir($pluginJsDir)) {
								$jsFiles = glob($pluginJsDir . '/*.js') ?: [];
										foreach ($jsFiles as $jsFile) {
												$fileName = basename($jsFile);
												$activeFile = $patchesJsDir . '/' . $fileName;
												$stubFile   = $patchesJsDir . '/_' . $fileName;

												// Nur erstellen wenn weder aktive noch stub Datei existiert
												if (!file_exists($activeFile) && !file_exists($stubFile)) {
														$comment = "/* Remove the leading underscore from filename and start editing */\n\n";
														file_put_contents($stubFile, $comment . file_get_contents($jsFile));
												}
										}
								}

								// Snippet-Stubs erzeugen (nur wenn snippets/.stub existiert)
								$snippetMarker = $plugin->root() . '/snippets/.stub';
								$pluginSnippetsDir = $plugin->root() . '/snippets';
								if (file_exists($snippetMarker) && is_dir($pluginSnippetsDir)) {

										// Unterscheidung: kirbyblock-* vs kirby-pagewizard
										if (strpos($packageName, 'kirbyblock-') === 0) {
												// kirbyblock-* Plugins → snippets/blocks/
												$snippetBlocksDir = kirby()->root('site') . '/snippets/blocks';
												if (!is_dir($snippetBlocksDir)) {
														mkdir($snippetBlocksDir, 0777, true);
												}

												// Snippet-Name aus Package-Name ableiten (kirbyblock-text → pwtext)
												$blockName = str_replace('kirbyblock-', '', $packageName);
												$snippetName = 'pw' . strtolower($blockName);

												// Prüfe ob index.php existiert (Standard für Blocks)
												$snippetFile = $pluginSnippetsDir . '/index.php';
												if (file_exists($snippetFile)) {
														$stubSnippet = $snippetBlocksDir . '/_' . $snippetName . '.php';
														$activeSnippet = $snippetBlocksDir . '/' . $snippetName . '.php';

														// Nur erstellen wenn aktive Datei NICHT existiert
														if (!file_exists($activeSnippet) && !file_exists($stubSnippet)) {
																$originalContent = file_get_contents($snippetFile);
																// Remove first <?php tag from original content to avoid duplication
																$originalContent = preg_replace('/^<\?php\s*\n?/', '', $originalContent, 1);
																$comment = "<?php\n/* Remove the leading underscore from filename and start editing */\n\n";
																file_put_contents($stubSnippet, $comment . $originalContent);
														}
												}
										}
										elseif ($packageName === 'kirby-pagewizard') {
												// kirby-pagewizard → snippets/ (alle .php files, flach)
												$projectSnippetsDir = kirby()->root('site') . '/snippets';
												if (!is_dir($projectSnippetsDir)) {
														mkdir($projectSnippetsDir, 0777, true);
												}

												// Alle .php Dateien im Snippets-Verzeichnis scannen
												$snippetFiles = glob($pluginSnippetsDir . '/*.php');
												foreach ($snippetFiles as $snippetFile) {
														$snippetName = basename($snippetFile);
														$stubSnippet = $projectSnippetsDir . '/_' . $snippetName;
														$activeSnippet = $projectSnippetsDir . '/' . $snippetName;

														// Nur erstellen wenn aktive Datei NICHT existiert
														if (!file_exists($activeSnippet) && !file_exists($stubSnippet)) {
																$originalContent = file_get_contents($snippetFile);

																// Check if file starts with <?php
																if (preg_match('/^<\?php/', $originalContent)) {
																		// PHP file: Remove first <?php tag and add PHP comment
																		$originalContent = preg_replace('/^<\?php\s*\n?/', '', $originalContent, 1);
																		$comment = "<?php\n/* Remove the leading underscore from filename and start editing */\n\n";
																		file_put_contents($stubSnippet, $comment . $originalContent);
																} else {
																		// HTML file: Add PHP comment block at the beginning, then close it
																		$comment = "<?php /* Remove the leading underscore from filename and start editing */ ?>\n";
																		file_put_contents($stubSnippet, $comment . $originalContent);
																}
														}
												}
										}
								}

								// Template-Stubs erzeugen (nur wenn templates/.stub existiert)
								$templateMarker = $plugin->root() . '/templates/.stub';
								$pluginTemplatesDir = $plugin->root() . '/templates';
								if (file_exists($templateMarker) && is_dir($pluginTemplatesDir)) {
										$projectTemplatesDir = kirby()->root('site') . '/templates';
										if (!is_dir($projectTemplatesDir)) {
												mkdir($projectTemplatesDir, 0777, true);
										}

										// Alle .php Dateien im Template-Verzeichnis scannen
										$templateFiles = glob($pluginTemplatesDir . '/*.php');
										foreach ($templateFiles as $templateFile) {
												$templateName = basename($templateFile);
												$stubTemplate = $projectTemplatesDir . '/_' . $templateName;
												$activeTemplate = $projectTemplatesDir . '/' . $templateName;

												// Nur erstellen wenn aktive Datei NICHT existiert
												if (!file_exists($activeTemplate) && !file_exists($stubTemplate)) {
														$originalContent = file_get_contents($templateFile);
														// Remove first <?php tag from original content to avoid duplication
														$originalContent = preg_replace('/^<\?php\s*\n?/', '', $originalContent, 1);
														$comment = "<?php\n/* Remove the leading underscore from filename and start editing */\n\n";
														file_put_contents($stubTemplate, $comment . $originalContent);
												}
										}
								}

								// panel-colors.css generieren (für pagewizard/colors API)
								if (method_exists('pwConfig', 'panelColorsSetup')) {
									pwConfig::panelColorsSetup($pluginDir);
								}
						}
				}

				// Tailwind Watcher - Projekt-Verzeichnisse immer einbinden
				$watchers = [
						"@source '../../site/snippets';",
						"@source '../../site/templates';",
				];

				// tailwind.css generieren
				file_put_contents(
						$outputFile,
						"/* This file is automatically generated by a hook, when \n" .
						"Kirby is in debug mode. Do not edit this file manually! */\n\n" .
						"/* TailwindCSS */\n@import 'tailwindcss';\n\n" .
						"@plugin 'tailwindcss-debug-screens' {\n\tclassName: \"debug-screens\";\n\tposition: \"bottom, left\";\n\tprefix: \"\";\n}\n\n" .
						"/* Tailwind Watcher */\n" . implode("\n", $watchers) . "\n" .
						implode("\n", $imports)
				);
    }
];
