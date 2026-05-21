/**
 * Shared preference helpers for chrome.storage.local.
 *
 * Admin bar visibility is a browser-wide setting; other toggles (e.g. block
 * inspector) remain per-origin. Attached to globalThis for content scripts
 * and Node smoke tests; webpack imports the same file in the popup bundle.
 */
(function () {
	'use strict';

	const PREFS_KEY = 'wp_preferences_v1';
	const GLOBAL_KEY = '_global';

	const DEFAULT_GLOBAL_PREFS = { adminBarHidden: false };
	const DEFAULT_SITE_PREFS = { blockInspectorEnabled: false };

	/**
	 * Whether the admin bar should be hidden for this browser profile.
	 *
	 * Reads the global slot first. Legacy per-origin `adminBarHidden` values
	 * are still honored until the user saves a global preference (popup save
	 * clears those stale keys). When both show and hide were set on different
	 * origins, show wins — matching the request to default toward visible.
	 */
	function isAdminBarHidden(allPrefs) {
		const global = allPrefs[GLOBAL_KEY];
		if (global && typeof global.adminBarHidden === 'boolean') {
			return global.adminBarHidden;
		}

		let sawHide = false;
		for (const [key, prefs] of Object.entries(allPrefs)) {
			if (key === GLOBAL_KEY || !prefs || typeof prefs !== 'object') {
				continue;
			}
			if (prefs.adminBarHidden === false) {
				return false;
			}
			if (prefs.adminBarHidden === true) {
				sawHide = true;
			}
		}

		if (sawHide) {
			return true;
		}

		return DEFAULT_GLOBAL_PREFS.adminBarHidden;
	}

	function isBlockInspectorEnabled(allPrefs, origin) {
		const site = allPrefs[origin];
		return !!(site && site.blockInspectorEnabled);
	}

	function resolvePopupPrefs(allPrefs, origin) {
		return {
			adminBarHidden: isAdminBarHidden(allPrefs),
			blockInspectorEnabled: isBlockInspectorEnabled(allPrefs, origin),
		};
	}

	function mergeSaveGlobalAdminBar(allPrefs, hidden) {
		const next = { ...allPrefs };
		next[GLOBAL_KEY] = { ...(next[GLOBAL_KEY] || {}), adminBarHidden: hidden };

		for (const key of Object.keys(next)) {
			if (key === GLOBAL_KEY) {
				continue;
			}
			if (next[key]?.adminBarHidden !== undefined) {
				const { adminBarHidden, ...rest } = next[key];
				if (Object.keys(rest).length === 0) {
					delete next[key];
				} else {
					next[key] = rest;
				}
			}
		}

		return next;
	}

	function mergeSaveSitePref(allPrefs, origin, key, value) {
		const next = { ...allPrefs };
		next[origin] = { ...(next[origin] || {}), [key]: value };
		return next;
	}

	const api = {
		PREFS_KEY,
		GLOBAL_KEY,
		DEFAULT_GLOBAL_PREFS,
		DEFAULT_SITE_PREFS,
		isAdminBarHidden,
		isBlockInspectorEnabled,
		resolvePopupPrefs,
		mergeSaveGlobalAdminBar,
		mergeSaveSitePref,
	};

	globalThis.WPPrefs = api;

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = api;
	}
})();
