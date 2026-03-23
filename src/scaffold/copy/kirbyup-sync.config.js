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

console.log('\n✓ KirbyUp sync is running');
console.log('💡 Edit plugin files to trigger rebuild\n');
