// Values derived from the project's settings, shared by the wizard and the
// panel's block previews.

// the colour variants offered: "default" and the active ones
export function themes(activeVariants) {
  return ['default', ...(activeVariants || [])];
}

// the body font: the global default, the project's own choice first
export function bodyDefaultFont(globalDefaults, globalOverrides) {
  let def = 'Inter';
  for (const group of Object.values(globalDefaults || {})) {
    if (group && group.vars && group.vars['font-family-default']) {
      def = group.vars['font-family-default'].value || def;
    }
  }
  const ov = globalOverrides && globalOverrides.global;
  return (ov && ov['font-family-default']) || def;
}

// the page's background behind the blocks
export function bodyBackground(globalDefaults, globalOverrides) {
  const ov = ((globalOverrides || {}).global || {})['body-background'];
  if (ov) return ov;
  const def = globalDefaults && globalDefaults.colors && globalDefaults.colors.vars && globalDefaults.colors.vars['body-background'];
  return (def && def.value) || '#E8E8E8';
}

/**
 * The weights an element's font has (e.g. "heading": its font family under
 * Elements, else the default font) as a test (weight → bool) – null when
 * the font or its files are unknown. As Elements › font weight offers them.
 */
export function fontWeights(data, element) {
  if (!data) return null;
  const varName = element + '-font-family';
  let family = ((data.elements?.overrides || {}).global || {})[varName] || '';
  if (!family) {
    for (const group of Object.values(data.elements?.defaults || {})) {
      if (group && group.vars && group.vars[varName]) family = group.vars[varName].value;
    }
  }
  if (!family || family === 'default') family = bodyDefaultFont(data.global?.defaults, data.global?.overrides);
  const all = { ...(data.fonts?.builtin || {}), ...(data.fonts?.project || {}) };
  const font = Object.values(all).find((f) => f && f.family === family);
  if (!font || !Array.isArray(font.files) || !font.files.length) return null;
  const single = new Set();
  for (const file of font.files) {
    const parts = String(file.weight || '400').split(' ');
    // a variable font: every weight within its range
    if (parts.length === 2) return (w) => parseInt(w) >= parseInt(parts[0]) && parseInt(w) <= parseInt(parts[1]);
    single.add(parts[0]);
  }
  return (w) => single.has(String(w));
}
