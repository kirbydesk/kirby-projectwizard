/**
 * KirbyUp Sync Configuration
 *
 * Watches Kirby plugins for changes and automatically rebuilds them.
 * This is essential for PageWizard and KirbyBlock plugins development.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const pluginsDir = path.join(__dirname, 'site/plugins');
const kirbyupBin = path.join(__dirname, 'node_modules/.bin/kirbyup');

// Find all plugins that use kirbyup (have .kirbyup file)
const plugins = fs.readdirSync(pluginsDir).filter(dir => {
	const pluginPath = path.join(pluginsDir, dir);
	return fs.statSync(pluginPath).isDirectory() && fs.existsSync(path.join(pluginPath, '.kirbyup'));
});

console.log('🔍 Starting KirbyUp watch for plugins...');

// Run kirbyup --watch for each plugin
plugins.forEach(dir => {
	const cwd = path.join(pluginsDir, dir);
	const cmd = `${kirbyupBin} src/index.js --watch`;
	console.log(`   📦 ${dir}: ${cmd}`);

	exec(cmd, { cwd }, (err, stdout, stderr) => {
		if (err) {
			console.error(`❌ Error in ${dir}:`, stderr);
		} else {
			console.log(`✓ ${dir}:`, stdout);
		}
	});
});

// Tailwind only notices changes inside the project. Plugins symlinked from
// elsewhere (site/plugins/* → e.g. ../pluginsources/*) live outside of it, so
// the folders Tailwind reads from them (@import src/css, @source snippets and
// templates) are watched here; a change touches Tailwind's input file, which
// makes the Tailwind watcher rebuild.
const projectRoot   = fs.realpathSync(__dirname);
const tailwindInput = path.join(__dirname, 'storage/temp/tailwind.css');
let touchTimer = null;

const touchTailwind = (file) => {
	clearTimeout(touchTimer);
	touchTimer = setTimeout(() => {
		if (!fs.existsSync(tailwindInput)) return;
		const now = new Date();
		fs.utimesSync(tailwindInput, now, now);
		console.log(`🎨 Tailwind rebuild: ${file}`);
	}, 150);
};

fs.readdirSync(pluginsDir).forEach(dir => {
	const realPath = fs.realpathSync(path.join(pluginsDir, dir));
	if (!fs.statSync(realPath).isDirectory()) return;
	if (realPath.startsWith(projectRoot + path.sep)) return; // inside the project: Tailwind sees it

	['src/css', 'snippets', 'templates'].forEach(sub => {
		const watchPath = path.join(realPath, sub);
		if (!fs.existsSync(watchPath)) return;
		fs.watch(watchPath, { recursive: true }, (event, file) => touchTailwind(path.join(dir, sub, file || '')));
	});
});

console.log('\n✓ KirbyUp sync is running');
console.log('💡 Edit plugin files to trigger rebuild\n');
