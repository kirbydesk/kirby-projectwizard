// The project's fonts in the panel: @font-face rules for the built-in and
// the project fonts (one style element, rewritten on each call) – for the
// wizard and the block previews on the pages alike.
export function injectFontFaces(fontsData) {
  const id = 'pw-panel-fontfaces';
  let style = document.getElementById(id);
  if (!style) {
    style = document.createElement('style');
    style.id = id;
    document.head.appendChild(style);
  }
  // (from the site's address: also in a subfolder install)
  const base = ((window.panel && window.panel.urls && window.panel.urls.site) || '').replace(/\/$/, '');
  const allFonts = { ...((fontsData || {}).builtin || {}), ...((fontsData || {}).project || {}) };
  const rules = [];
  for (const font of Object.values(allFonts)) {
    for (const file of (font.files || [])) {
      rules.push(
        '@font-face { ' +
        "font-family: '" + font.family + "'; " +
        "src: url('" + base + '/assets/fonts/' + file.src + "') format('woff2'); " +
        'font-weight: ' + (file.weight || '400') + '; ' +
        'font-style: ' + (file.style || 'normal') + '; ' +
        'font-display: swap; }'
      );
    }
  }
  style.textContent = rules.join('\n');
}
