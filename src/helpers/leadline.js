// The tagline's line (Project Wizard › Elements › Tagline) in the previews: the
// same rules and look as on the website (kirby-pagewizard config.php
// taglineLeadline(), elements.css). The CSS for `.pw-leadline` is in
// BlockPreview.vue (unscoped, shared by all previews).

const CHOICES = {
  'tagline-leadline': ['off', 'straight', 'bent'],
  'tagline-leadline-style': ['solid', 'dashed', 'dotted', 'wavy'],
  'tagline-leadline-reach': ['screen', 'grid'],
  'tagline-leadline-motion': ['none', 'in', 'flow'],
  'tagline-leadline-glow': ['on', 'off'],
};

/**
 * @param {function} get   name → the element value (override, else default)
 * @param {string} own     the block's own form: default | off | straight | bent
 * @param {string} align   the tagline's alignment (only left gets a line)
 * @returns {object|null}  { form, style, reach, motion, glow } or null
 */
export function leadlineState(get, own = 'default', align = 'left') {
  if (align && align !== 'left') return null;
  // (an unknown value: the first choice – as the website's start values)
  const value = (name) => (CHOICES[name].includes(get(name)) ? get(name) : CHOICES[name][0]);
  const form = ['off', 'straight', 'bent'].includes(own) ? own : value('tagline-leadline');
  if (!['straight', 'bent'].includes(form)) return null;
  let style = value('tagline-leadline-style');
  if (style === 'wavy' && form !== 'straight') style = 'solid';
  let motion = value('tagline-leadline-motion');
  if (motion === 'flow' && (form !== 'straight' || style === 'solid')) motion = 'none';
  return { form, style, reach: value('tagline-leadline-reach'), motion, glow: get('tagline-leadline-glow') !== 'off' };
}

// the wave as an image in the line's colour, drawn beyond its tile (no gaps)
export function leadlineWave(color) {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='8' viewBox='0 0 16 8'><path d='M-8 4 Q-4 0 0 4 T8 4 T16 4 T24 4' fill='none' stroke='" + String(color).replace(/'/g, '') + "' stroke-width='2'/></svg>";
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
}

/**
 * The attributes and variables for an element showing the line.
 * @param {object} state   from leadlineState()
 * @param {function} get   name → the element value (the measures)
 * @param {string} color   the line's colour
 * @param {string} lead    the length from the text start to the preview's edge
 */
export function leadlineBinding(state, get, color, lead) {
  if (!state) return { attrs: {}, style: {} };
  const attrs = {
    'data-leadline': state.form,
    'data-leadline-style': state.style,
    'data-leadline-motion': state.motion,
    'data-leadline-ready': '',
    // (running in: each time it is drawn anew)
    'data-leadline-play': state.motion === 'in' ? 'run' : null,
    'data-leadline-glow': state.glow ? '' : null,
  };
  const style = {
    '--pw-ll-color': color,
    '--pw-leadline-wave': leadlineWave(color),
    '--pw-ll-stroke': get('tagline-leadline-stroke') || '2px',
    '--pw-ll-dot': get('tagline-leadline-dot') || '12px',
    '--pw-ll-offset': get('tagline-leadline-offset') || '3.25rem',
    '--pw-ll-x': get('tagline-leadline-dot-offset') || '8px',
    '--pw-ll-bend': get('tagline-leadline-bend') || '3.5rem',
    '--pw-ll-length': lead,
  };
  return { attrs, style };
}

// the space above the tagline for its line
export function leadlineTop(state, get) {
  if (!state) return null;
  return state.form === 'bent'
    ? (get('tagline-leadline-offset') || '3.25rem') + ' + ' + (get('tagline-leadline-bend') || '3.5rem')
    : (get('tagline-leadline-offset') || '3.25rem') + ' + ' + (get('tagline-leadline-dot') || '12px') + ' / 2';
}
