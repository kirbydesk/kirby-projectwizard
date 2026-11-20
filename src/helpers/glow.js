// The glow of cards, tiles and buttons (Project Wizard › Blocks / Elements):
// a fine line at the rim and a soft light around it (or below it), at rest and
// on hover. Three layers in both, so the change fades. The website has the same
// formula: kirbyblock-cardlets / kirbyblock-stats styles.css, kirby-pagewizard
// config.php buttonGlow() (buttons: half the size, `size` 0.5).

export const GLOW_COLORS = { cyan: '#22d3ee', pink: '#ec4899', violet: '#a78bfa', amber: '#f59e0b' };

/**
 * @param {string} mode   always | hover
 * @param {string} color  a CSS colour
 * @param {number} k      strength: 1 subtle, 1.6 strong
 * @param {number} down   0 all around, 1 downward
 * @param {number} size   1 cards, 0.5 buttons
 */
export function glowShadows(mode, color, k = 1, down = 0, size = 1) {
  const mix = (pct) => 'color-mix(in srgb, ' + color + ' ' + Math.min(100, Math.round(pct * k)) + '%, transparent)';
  const px = (v) => Math.round(v * k * size * 10) / 10 + 'px';
  const on = '0 0 0 1px ' + color + ', 0 ' + down * 6 + 'px ' + px(8) + ' 0 ' + mix(65) + ', 0 ' + down * 20 + 'px ' + px(36) + ' ' + down * -8 + 'px ' + mix(40);
  const rest = mode === 'always'
    ? '0 0 0 1px color-mix(in srgb, ' + color + ' 60%, transparent), 0 ' + down * 4 + 'px ' + px(6) + ' 0 ' + mix(45) + ', 0 ' + down * 14 + 'px ' + px(24) + ' ' + down * -6 + 'px ' + mix(28)
    : '0 0 0 1px transparent, 0 0 0 0 transparent, 0 0 0 0 transparent';
  return { rest, on };
}
