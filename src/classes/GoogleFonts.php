<?php

use Kirby\Http\Remote;

/**
 * Google Fonts in the Project Wizard: the list of all families to choose
 * from, and installing one – the files are downloaded into the project
 * (content/.projectwizard/fonts), the website loads nothing from Google.
 */
class GoogleFonts
{
	/** Google's list of families (not documented, but what fonts.google.com itself uses) */
	public const LIST_URL = 'https://fonts.google.com/metadata/fonts';
	/** The official CSS API – it names the woff2 files of the chosen styles */
	public const CSS_URL = 'https://fonts.googleapis.com/css2';
	/** Only these character sets: Latin and Latin Extended */
	public const SUBSETS = ['latin', 'latin-ext'];
	/** The list is kept a week */
	public const LIST_MAX_AGE = 7 * 86400;
	/** A current browser – otherwise Google answers with other formats than woff2 */
	private const AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

	private const CATEGORIES = [
		'Sans Serif'  => 'sans-serif',
		'Serif'       => 'serif',
		'Monospace'   => 'monospace',
		'Display'     => 'display',
		'Handwriting' => 'cursive',
	];

	private static function cacheFile(): string
	{
		return kirby()->root('cache') . '/projectwizard/google-fonts.json';
	}

	/**
	 * All families, most popular first: [family, category, styles, min, max] –
	 * styles like "300,300i,400"; min/max the weight range of a variable
	 * font, else null. An outdated list is used when Google can't be reached.
	 */
	public static function list(): array
	{
		$file = self::cacheFile();
		$cached = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
		if (is_array($cached) && filemtime($file) > time() - self::LIST_MAX_AGE) return $cached;

		try {
			$response = Remote::get(self::LIST_URL, ['agent' => self::AGENT, 'timeout' => 15]);
			// (the answer may start with an XSSI guard)
			$data = $response->code() === 200 ? json_decode(preg_replace('/^\)\]\}\'\s*/', '', $response->content()), true) : null;
		} catch (\Throwable) {
			$data = null;
		}
		if (!is_array($data['familyMetadataList'] ?? null)) {
			if (is_array($cached)) return $cached;
			throw new \Exception(t('prw.fonts.google.error.list'));
		}

		$families = $data['familyMetadataList'];
		usort($families, fn ($a, $b) => ($a['popularity'] ?? 9999) <=> ($b['popularity'] ?? 9999));
		$list = [];
		foreach ($families as $font) {
			if (empty($font['family']) || empty($font['fonts'])) continue;
			$wght = null;
			foreach ($font['axes'] ?? [] as $axis) {
				if (($axis['tag'] ?? '') === 'wght') $wght = [(int) $axis['min'], (int) $axis['max']];
			}
			$list[] = [
				$font['family'],
				self::CATEGORIES[$font['category'] ?? ''] ?? 'sans-serif',
				implode(',', array_keys($font['fonts'])),
				$wght[0] ?? null,
				$wght[1] ?? null,
			];
		}
		if (!is_dir(dirname($file))) mkdir(dirname($file), 0755, true);
		file_put_contents($file, json_encode($list, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
		return $list;
	}

	/**
	 * Install a family: all its styles (a variable font: its weight range,
	 * with and without italic) in Latin and Latin Extended. Returns the
	 * project's font entry or throws with a message for the Panel.
	 */
	public static function install(string $family): array
	{
		$entry = null;
		foreach (self::list() as $font) {
			if ($font[0] === $family) $entry = $font;
		}
		if ($entry === null) throw new \Exception(tt('prw.fonts.google.error.unknown', null, ['family' => $family]));
		[, $category, $styles, $min, $max] = $entry;

		$styles = explode(',', $styles);
		$hasItalic = (bool) array_filter($styles, fn ($s) => str_ends_with($s, 'i'));
		// the CSS API wants: ital,wght@0,300;0,400;1,300 – normal first, weights ascending
		if ($min !== null) {
			$axes = $hasItalic
				? 'ital,wght@0,' . $min . '..' . $max . ';1,' . $min . '..' . $max
				: 'wght@' . $min . '..' . $max;
		} else {
			$tuples = [];
			foreach ($styles as $style) {
				$tuples[] = [str_ends_with($style, 'i') ? 1 : 0, (int) rtrim($style, 'i')];
			}
			sort($tuples);
			$axes = 'ital,wght@' . implode(';', array_map(fn ($t) => $t[0] . ',' . $t[1], $tuples));
		}
		$url = self::CSS_URL . '?family=' . str_replace('%20', '+', rawurlencode($family)) . ':' . $axes . '&display=swap';
		$css = self::fetch($url);

		// /* latin */ @font-face { font-style: …; font-weight: …; src: url(…) …; unicode-range: …; }
		preg_match_all('/\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/i', $css, $blocks, PREG_SET_ORDER);
		$slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($family)), '-');
		$dir = ProjectConfig::fontsDir();
		if (!is_dir($dir)) mkdir($dir, 0755, true);
		$files = [];
		foreach ($blocks as [, $subset, $body]) {
			if (!in_array($subset, self::SUBSETS, true)) continue;
			preg_match('/font-style:\s*([a-z]+)/', $body, $style);
			preg_match('/font-weight:\s*([0-9 ]+)/', $body, $weight);
			preg_match('/src:\s*url\(([^)]+\.woff2)\)/', $body, $src);
			preg_match('/unicode-range:\s*([^;]+)/', $body, $range);
			if (!$src) continue;
			$weight = trim($weight[1] ?? '400');
			$style = $style[1] ?? 'normal';
			$name = $slug . '-' . $subset . '-' . str_replace(' ', '-', $weight) . ($style === 'italic' ? '-italic' : '') . '.woff2';
			$binary = self::fetch($src[1]);
			if (!str_starts_with($binary, 'wOF2')) throw new \Exception(t('prw.fonts.google.error.download'));
			file_put_contents($dir . '/' . $name, $binary);
			$files[] = ['src' => $name, 'weight' => $weight, 'style' => $style, 'unicodeRange' => trim($range[1] ?? '')];
		}
		if ($files === []) throw new \Exception(t('prw.fonts.google.error.download'));

		$key = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $family));
		// a family installed before (also from own files): replaced, not mixed
		ProjectConfig::removeFontFiles($key);
		ProjectConfig::addFont($key, [
			'family'   => $family,
			'category' => $category,
			'italic'   => false,
			'source'   => 'google',
			'files'    => $files,
		]);
		return $files;
	}

	private static function fetch(string $url): string
	{
		try {
			$response = Remote::get($url, ['agent' => self::AGENT, 'timeout' => 20]);
		} catch (\Throwable) {
			throw new \Exception(t('prw.fonts.google.error.download'));
		}
		if ($response->code() !== 200) throw new \Exception(t('prw.fonts.google.error.download'));
		return $response->content();
	}
}
