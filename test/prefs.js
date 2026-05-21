/**
 * Smoke tests for lib/prefs.js — global admin bar preference + migration.
 *
 *   cd test && node prefs.js
 */
const fs = require('fs');
const path = require('path');

const prefsSrc = fs.readFileSync(path.join(__dirname, '..', 'lib', 'prefs.js'), 'utf8');
new Function('globalThis', prefsSrc)(globalThis);

const {
	isAdminBarHidden,
	isBlockInspectorEnabled,
	resolvePopupPrefs,
	mergeSaveGlobalAdminBar,
	mergeSaveSitePref,
	GLOBAL_KEY,
} = globalThis.WPPrefs;

let failures = 0;
function assert(cond, msg) {
	if (!cond) {
		failures++;
		console.error('  FAIL:', msg);
	} else {
		console.log('  ok  :', msg);
	}
}

function main() {
	console.log('\n[prefs] default shows admin bar when storage is empty');
	assert(isAdminBarHidden({}) === false, 'empty storage → visible admin bar');

	console.log('\n[prefs] global hide preference applies everywhere');
	assert(
		isAdminBarHidden({ [GLOBAL_KEY]: { adminBarHidden: true } }) === true,
		'global hide → hidden',
	);

	console.log('\n[prefs] global show preference applies everywhere');
	assert(
		isAdminBarHidden({ [GLOBAL_KEY]: { adminBarHidden: false } }) === false,
		'global show → visible',
	);

	console.log('\n[prefs] legacy per-origin show migrates until global is saved');
	assert(
		isAdminBarHidden({ 'https://a.test': { adminBarHidden: false } }) === false,
		'legacy show on one origin → visible',
	);

	console.log('\n[prefs] legacy per-origin hide still honored');
	assert(
		isAdminBarHidden({ 'https://a.test': { adminBarHidden: true } }) === true,
		'legacy hide on one origin → hidden',
	);

	console.log('\n[prefs] conflicting legacy values prefer show');
	assert(
		isAdminBarHidden({
			'https://a.test': { adminBarHidden: true },
			'https://b.test': { adminBarHidden: false },
		}) === false,
		'show wins over hide across origins',
	);

	console.log('\n[prefs] global slot overrides legacy per-origin values');
	assert(
		isAdminBarHidden({
			[GLOBAL_KEY]: { adminBarHidden: true },
			'https://a.test': { adminBarHidden: false },
		}) === true,
		'global hide wins',
	);

	console.log('\n[prefs] mergeSaveGlobalAdminBar clears stale per-origin keys');
	const merged = mergeSaveGlobalAdminBar(
		{
			'https://a.test': { adminBarHidden: false, blockInspectorEnabled: true },
			'https://b.test': { adminBarHidden: true },
		},
		true,
	);
	assert(merged[GLOBAL_KEY].adminBarHidden === true, 'writes global hide');
	assert(merged['https://a.test'].adminBarHidden === undefined, 'removes legacy hide key on a');
	assert(merged['https://a.test'].blockInspectorEnabled === true, 'keeps other site prefs');
	assert(merged['https://b.test'] === undefined, 'drops empty origin after cleanup');

	console.log('\n[prefs] block inspector remains per-origin');
	const sitePrefs = mergeSaveSitePref({}, 'https://example.test', 'blockInspectorEnabled', true);
	assert(
		isBlockInspectorEnabled(sitePrefs, 'https://example.test') === true,
		'block inspector enabled for matching origin',
	);
	assert(
		isBlockInspectorEnabled(sitePrefs, 'https://other.test') === false,
		'block inspector off for other origins',
	);

	console.log('\n[prefs] resolvePopupPrefs merges global + site values');
	assert(
		resolvePopupPrefs(
			{
				[GLOBAL_KEY]: { adminBarHidden: false },
				'https://example.test': { blockInspectorEnabled: true },
			},
			'https://example.test',
		).adminBarHidden === false,
		'popup sees global admin bar pref',
	);
	assert(
		resolvePopupPrefs(
			{
				[GLOBAL_KEY]: { adminBarHidden: false },
				'https://example.test': { blockInspectorEnabled: true },
			},
			'https://example.test',
		).blockInspectorEnabled === true,
		'popup sees site block inspector pref',
	);

	if (failures) {
		console.error(`\n${failures} preference test(s) failed.\n`);
		process.exit(1);
	}

	console.log('\nAll preference tests passed.\n');
}

main();
