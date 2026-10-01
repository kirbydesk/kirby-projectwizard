/**
 * The device shown in the preview sidebar (default / lg / xl), remembered
 * in the browser: blocks and elements start with the last one chosen, the
 * first time with the desktop. Storage may be unavailable (private window,
 * blocked site data): then it simply starts with the desktop.
 */
const KEY = 'pw-preview-bp';

// the screen height of each device (px): vh values in the preview and next
// to their inputs are worked out with it
// (sm, md: the panel's previews by the window)
export const SCREEN_HEIGHTS = { default: 800, sm: 800, md: 1024, lg: 768, xl: 900 };
const DEVICES = ['default', 'lg', 'xl'];

export function readPreviewBp() {
	try {
		const bp = window.localStorage.getItem(KEY);
		return DEVICES.includes(bp) ? bp : 'xl';
	} catch (e) {
		return 'xl';
	}
}

export function savePreviewBp(bp) {
	try {
		if (DEVICES.includes(bp)) window.localStorage.setItem(KEY, bp);
	} catch (e) {
		// not remembered, nothing else changes
	}
}
