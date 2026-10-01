// A start value among the field's options – else (options narrowed by an
// exception, an older start value) the first option; as the pagewizard's
// pwConfig::validStart. Options are values or objects with a "value";
// true/false and empty values stay as they are, and so does the value a
// field allows for "nothing chosen" (its "empty", e.g. an icon: none).
export function validStart(value, options, empty) {
  if (!Array.isArray(options) || !options.length) return value;
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'object') return value;
  if (empty !== undefined && String(value) === String(empty)) return value;
  const values = options.map(o => (o && typeof o === 'object' ? o.value : o));
  return values.some(v => String(v) === String(value)) ? value : values[0];
}
