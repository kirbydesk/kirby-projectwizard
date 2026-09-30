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

const state = window.Vue.observable({ data: null, error: null, version: 0, device: readDevice() });

export function setPreviewDevice(device) {
  state.device = ['default', 'lg', 'xl'].includes(device) ? device : null;
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
