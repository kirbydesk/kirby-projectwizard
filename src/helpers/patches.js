// What the exceptions (Settings › Configuration) set wins over the wizard's
// own settings and values – as the pagewizard's pwConfig::withoutPatched and
// withoutPatchedValues: the own entries they set are dropped.

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

// own settings without what an exception sets (objects key by key; a value
// or a list it sets drops the own entry)
export function withoutPatched(own, patch) {
  if (!isObject(own) || !isObject(patch)) return own;
  const out = { ...own };
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in out)) continue;
    if (isObject(value) && isObject(out[key])) {
      out[key] = withoutPatched(out[key], value);
      if (!Object.keys(out[key]).length) delete out[key];
    } else {
      delete out[key];
    }
  }
  return out;
}

// own values (pw<block>.json) without those an exception sets: a var's value
// (values › group › vars › name › value), a colour per variant (› colors)
export function withoutPatchedValues(own, patch) {
  const out = JSON.parse(JSON.stringify(own || {}));
  for (const group of Object.values(patch || {})) {
    if (!isObject(group)) continue;
    for (const [name, v] of Object.entries(group.vars || {})) {
      if (isObject(v) && 'value' in v) delete out[name];
    }
    for (const [name, variants] of Object.entries(group.colors || {})) {
      if (!isObject(variants)) continue;
      for (const variant of Object.keys(variants)) {
        if (isObject(out[variant])) delete out[variant][name];
      }
    }
  }
  return out;
}
