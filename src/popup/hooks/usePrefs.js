import { useCallback, useEffect, useState } from 'react';
import {
	PREFS_KEY,
	resolvePopupPrefs,
	mergeSaveGlobalAdminBar,
	mergeSaveSitePref,
} from '../../../lib/prefs.js';

const DEFAULT_PREFS = resolvePopupPrefs({}, '');

export function usePrefs(origin) {
	const [prefs, setPrefs] = useState(DEFAULT_PREFS);

	useEffect(() => {
		if (!origin) {
			return;
		}
		(async () => {
			const data = await chrome.storage.local.get(PREFS_KEY);
			const all = data[PREFS_KEY] || {};
			setPrefs(resolvePopupPrefs(all, origin));
		})();
	}, [origin]);

	const savePref = useCallback(
		async (key, value) => {
			setPrefs((prev) => ({ ...prev, [key]: value }));
			const data = await chrome.storage.local.get(PREFS_KEY);
			const all = data[PREFS_KEY] || {};
			const next =
				key === 'adminBarHidden'
					? mergeSaveGlobalAdminBar(all, value)
					: mergeSaveSitePref(all, origin, key, value);
			await chrome.storage.local.set({ [PREFS_KEY]: next });
		},
		[origin],
	);

	return [prefs, savePref];
}
