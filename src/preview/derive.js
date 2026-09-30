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
