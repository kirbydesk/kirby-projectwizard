const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root       = __dirname;
const patchesDir = path.join(root, 'site/patches/js');
const pluginsDir = path.join(root, 'site/plugins');

const files       = [];
const pluginFiles = new Set();

function jsFilesIn(dir) {
	if (!fs.existsSync(dir)) return [];
	return fs.readdirSync(dir)
		.filter(f => f.endsWith('.js'))
		.sort()
		.map(f => path.join(dir, f));
}

// Plugins with src/css/.stub marker: active patch → plugin src fallback
if (fs.existsSync(pluginsDir)) {
	for (const pluginName of fs.readdirSync(pluginsDir).sort()) {
		const pluginDir  = path.join(pluginsDir, pluginName);
		const stubMarker = path.join(pluginDir, 'src/css/.stub');
		const jsDir      = path.join(pluginDir, 'src/js');

		if (!fs.existsSync(stubMarker) || !fs.existsSync(jsDir)) continue;

		for (const srcFile of jsFilesIn(jsDir)) {
			const name        = path.basename(srcFile);
			const activePatch = path.join(patchesDir, name);

			pluginFiles.add(name);
			files.push(fs.existsSync(activePatch) ? activePatch : srcFile);
		}
	}
}

// Active patches not covered by any plugin (project-specific JS)
if (fs.existsSync(patchesDir)) {
	for (const f of jsFilesIn(patchesDir)) {
		const name = path.basename(f);
		if (!name.startsWith('_') && !pluginFiles.has(name)) {
			files.push(f);
		}
	}
}

if (files.length === 0) {
	console.log('No JS files to concatenate.');
	process.exit(0);
}

const output = path.join(root, 'public/assets/js/site.min.js');
console.log('Building site.min.js from:');
files.forEach(f => console.log('  ' + path.relative(root, f)));

execSync(
	`npx terser ${files.map(f => `"${f}"`).join(' ')} -o "${output}" -c -m`,
	{ stdio: 'inherit' }
);
