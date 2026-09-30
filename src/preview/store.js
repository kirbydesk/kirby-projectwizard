// The project values for the panel's block previews: loaded once per panel
// session (one request for all blocks of a page), shared by every preview,
// dropped when the Project Wizard saves (this tab and others).
import { injectFontFaces } from './fonts.js';

// the device chosen above the blocks (null: by the browser window),
// remembered in the browser
const DEVICE_KEY = 'pw-panel-device';
const readDevice = () => {
  try {
    const d = window.localStorage.getItem(DEVICE_KEY);
    return ['default', 'lg', 'xl'].includes(d) ? d : null;
  } catch (e) {
    return null;
  }
};

const state = window.Vue.observable({ data: null, error: null, version: 0, device: readDevice(), windowDevice: null });

// the device by the browser window (frontend breakpoints)
export function windowDevice() {
  const w = window.innerWidth;
  if (w >= 1280) return 'xl';
  if (w >= 1024) return 'lg';
  return 'default';
}

// crossing a breakpoint while resizing the window: the window rules again
// (a device chosen by hand holds until then)
let lastWindowDevice = windowDevice();
state.windowDevice = lastWindowDevice;
window.addEventListener('resize', () => {
  const now = windowDevice();
  if (now === lastWindowDevice) return;
  lastWindowDevice = now;
  state.windowDevice = now;
  if (state.device) setPreviewDevice(null);
  markShownDevice();
});

// the devices from narrow to wide: one wider than the window cannot be shown
const RANK = { default: 0, lg: 1, xl: 2 };
export function deviceFits(device) {
  return RANK[device] <= RANK[state.windowDevice || 'xl'];
}

// the device the previews show: the one chosen while it fits the window,
// else the window's
export function shownDevice() {
  return state.device && deviceFits(state.device) ? state.device : (state.windowDevice || 'xl');
}

// the device shown, on the page's root element (data-pw-device): the
// drawers mark the values of that device (columns, grid, logos per row)
export function markShownDevice() {
  try { document.documentElement.dataset.pwDevice = shownDevice(); } catch (e) { /* no document */ }
}

export function setPreviewDevice(device) {
  state.device = ['default', 'lg', 'xl'].includes(device) ? device : null;
  markShownDevice();
  try {
    if (state.device) window.localStorage.setItem(DEVICE_KEY, state.device);
    else window.localStorage.removeItem(DEVICE_KEY);
  } catch (e) { /* not remembered */ }
}
let loading = null;

// (an empty object may come as [] from PHP)
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

export function previewState() {
  return state;
}

export function ensurePreviewData(api) {
  if (state.data || loading) return loading || Promise.resolve(state.data);
  loading = api.get('projectwizard/preview')
    .then((res) => {
      const blocks = {};
      for (const [type, b] of Object.entries(obj(res.blocks))) {
        blocks[type] = {
          config: b.config || { defaults: {} },
          overrides: obj(b.overrides),
          valueDefaults: obj(b.valueDefaults),
          valueOverrides: obj(b.valueOverrides),
        };
      }
      state.data = {
        variants: res.variants || [],
        global: { defaults: obj(res.global && res.global.defaults), overrides: obj(res.global && res.global.overrides) },
        elements: { defaults: obj(res.elements && res.elements.defaults), overrides: obj(res.elements && res.elements.overrides) },
        fontsizes: { defaults: obj(res.fontsizes && res.fontsizes.defaults), overrides: obj(res.fontsizes && res.fontsizes.overrides) },
        fonts: obj(res.fonts),
        blocks,
      };
      state.error = null;
      injectFontFaces(state.data.fonts);
      return state.data;
    })
    .catch((e) => {
      state.error = e && e.message ? e.message : String(e);
      return null;
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

// the saved values changed: previews load them again
export function invalidatePreviewData() {
  state.data = null;
  state.version++;
}

// tell the other tabs (the wizard saved)
let channel = null;
try {
  channel = new BroadcastChannel('pw-preview');
  channel.onmessage = (e) => {
    if (e.data === 'saved') invalidatePreviewData();
  };
} catch (e) { /* no BroadcastChannel */ }

export function announcePreviewSaved() {
  invalidatePreviewData();
  try { channel && channel.postMessage('saved'); } catch (e) { /* ignore */ }
}

markShownDevice();
