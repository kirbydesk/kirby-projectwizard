<template>
  <div>
    <section v-for="(group, groupKey) in groups" :key="groupKey" class="pw-element-section">
      <div class="pw-section-header">
        <button class="pw-section-toggle" @click="toggle(groupKey)">
          <span>{{ groupLabel(groupKey) }}</span>
          <k-icon :type="isOpen(groupKey) ? 'angle-down' : 'angle-right'" />
        </button>
      </div>
      <transition name="pw-slide">
        <div v-show="isOpen(groupKey)" class="pw-element-list">
          <!-- Style vars -->
          <div
            v-for="(def, varName) in group.vars"
            v-if="def.type !== 'dual-pair'"
            :key="varName"
            class="pw-field-row"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label">{{ propLabel(varName) }}<span v-if="isRequired(varName)" class="pw-field-required"> *</span></label>
                </div>
                <div class="pw-field-row-options">
                  <!-- Font family selector -->
                  <select
                    v-if="def.type === 'font-family'"
                    class="pw-element-input pw-font-select"
                    :value="getOverrideValue(varName) || def.value"
                    @change="setValue(varName, $event.target.value, def.value)"
                  >
                    <option v-for="opt in fontFamilyOptions" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                  </select>
                  <!-- Toggles for options (font-weight filtered by font) -->
                  <k-toggles-input
                    v-else-if="def.options"
                    :value="getOverrideValue(varName) || def.value"
                    :options="filteredOptions(varName, def.options)"
                    :grow="false"
                    :required="true"
                    @input="setValue(varName, $event, def.value)"
                  />
                  <!-- Dual-pair: renders nothing here, handled below -->
                  <template v-else-if="def.type === 'dual-pair'"></template>
                  <!-- Responsive font-size (default/lg/xl) -->
                  <template v-else-if="def.default !== undefined && def.lg !== undefined">
                    <span v-for="bp in ['default', 'lg', 'xl']" :key="bp" class="pw-element-field">
                      <span class="pw-quad-label">{{ { 'default': 'Mobile', 'lg': 'Tablet', 'xl': 'Desktop' }[bp] }}</span>
                      <span class="pw-element-input-wrap">
                        <input
                          type="number"
                          :step="def.step || 0.1"
                          class="pw-element-input pw-element-input-number pw-px-calculator-input"
                          :class="{ 'is-default': !getResponsiveOverride(varName, bp) }"
                          :value="stripUnit(getResponsiveOverride(varName, bp) || def[bp])"
                          @input="setResponsiveValue(varName, bp, $event.target.value, def[bp], def.unit)"
                        />
                        <span v-if="def.unit" class="pw-element-unit">{{ def.unit }}</span>
                      </span>
                      <span class="pw-px-calculator">{{ toPx(getResponsiveOverride(varName, bp) || def[bp], def.unit) }}</span>
                    </span>
                  </template>
                  <!-- Number input with unit -->
                  <template v-else-if="def.unit !== undefined">
                    <span class="pw-element-field">
                      <span class="pw-element-input-wrap">
                        <input
                          type="number"
                          :step="def.step || 0.1"
                          class="pw-element-input pw-element-input-number pw-px-calculator-input"
                          :class="{ 'is-default': !getOverrideValue(varName) }"
                          :value="stripUnit(getOverrideValue(varName) || def.value)"
                          @input="setUnitValue(varName, $event.target.value, def.value, def.unit)"
                        />
                        <span v-if="def.unit" class="pw-element-unit">{{ def.unit }}</span>
                      </span>
                      <span class="pw-px-calculator">{{ toPx(getOverrideValue(varName) || def.value, def.unit) }}</span>
                    </span>
                    <span v-if="def.help" class="pw-element-help">{{ helpText(def.help) }}</span>
                  </template>
                  <!-- Text input for free values -->
                  <template v-else>
                    <input
                      type="text"
                      class="pw-element-input"
                      :placeholder="def.value"
                      :value="getOverrideValue(varName)"
                      @input="setValue(varName, $event.target.value, def.value)"
                    />
                    <span v-if="def.help" class="pw-element-help">{{ helpText(def.help) }}</span>
                  </template>
                </div>
              </span>
            </div>
          </div>
          <!-- Dual-pair rows (padding, border-radius with 2 inputs per row) -->
          <template v-for="(def, varName) in group.vars">
            <template v-if="def.type === 'dual-pair'">
              <div
                v-for="(row, rIdx) in def.rows"
                :key="varName + '-' + rIdx"
                class="pw-field-row"
                :class="{ 'pw-dual-first': rIdx === 0 && def.rows.length > 1, 'pw-dual-next': rIdx > 0 }"
              >
                <div class="k-input" data-type="text">
                  <span class="k-input-element pw-field-row-inner">
                    <div class="pw-field-row-label-col">
                      <label class="pw-field-row-label">{{ row.label }} {{ propLabel(varName) }}</label>
                    </div>
                    <div class="pw-field-row-options">
                      <span v-for="(idx, lIdx) in row.indices" :key="lIdx" class="pw-element-field">
                        <span class="pw-quad-label">{{ row.labels[lIdx] }}</span>
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="def.step || 0.1"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getQuadValue(varName, idx) }"
                            :value="stripUnit(getQuadValue(varName, idx) || def.value[idx])"
                            @input="setQuadValue(varName, idx, $event.target.value, def)"
                          />
                          <span v-if="def.unit" class="pw-element-unit">{{ def.unit }}</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getQuadValue(varName, idx) || def.value[idx], def.unit) }}</span>
                      </span>
                    </div>
                  </span>
                </div>
              </div>
            </template>
          </template>
          <!-- Colors (3 themes per row) -->
          <template v-if="group.colors">
            <div
              v-for="(colorVal, varName, index) in group.colors"
              :key="'color-' + varName"
              class="pw-field-row"
              :class="{
                'pw-color-row-grouped': isFollowedByColorState(group.colors, varName, index),
                'pw-color-row-state': varName.endsWith('-hover') || varName.endsWith('-active'),
              }"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ colorLabel(varName) }}</label>
                  </div>
                  <div class="pw-field-row-options pw-element-color-options">
                    <pw-color-field-row
                      v-for="theme in ['default', 'variant', 'variant2']"
                      :key="theme"
                      :group="theme"
                      :var-name="varName"
                      :default-value="colorVal[theme] || ''"
                      :override-value="getColorOverrideValue(theme, varName)"
                      @update:value="setColorValue(theme, varName, $event, colorVal[theme] || '')"
                    />
                  </div>
                </span>
              </div>
            </div>
          </template>
          <!-- Sizes (from fontsizes.json) -->
          <template v-if="fontSizesForGroup(groupKey)">
            <div class="pw-field-row pw-sizes-toggle">
              <button type="button" class="pw-section-toggle pw-sizes-header" @click="$set(openSections, groupKey + '-sizes', !openSections[groupKey + '-sizes'])">
                <span>Sizes</span>
                <k-icon :type="openSections[groupKey + '-sizes'] ? 'angle-down' : 'angle-right'" />
              </button>
            </div>
            <template v-if="openSections[groupKey + '-sizes']">
              <div class="pw-sizes-help">
                These sizes are used when the "sizes" option is enabled in block settings.
              </div>
              <div class="pw-sizes-bp-labels">
                <span class="pw-font-bp-label">Mobile</span>
                <span class="pw-font-bp-label">Tablet</span>
                <span class="pw-font-bp-label">Desktop</span>
              </div>
              <div
                v-for="(sizeVal, sizeName) in fontSizesForGroup(groupKey).vars"
                :key="'size-' + sizeName"
                class="pw-field-row"
              >
                <div class="k-input" data-type="text">
                  <span class="k-input-element pw-field-row-inner">
                    <div class="pw-field-row-label-col">
                      <label class="pw-field-row-label">{{ sizeName.split('-').pop() }}</label>
                    </div>
                    <div class="pw-field-row-options">
                      <span v-for="bp in ['default', 'lg', 'xl']" :key="bp" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="fontSizesForGroup(groupKey).step || 0.1"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getFontSizeOverride(bp, sizeName) }"
                            :value="stripUnit(getFontSizeOverride(bp, sizeName) || sizeVal[bp])"
                            @input="setFontSizeValue(bp, sizeName, $event.target.value, sizeVal[bp], 'rem')"
                          />
                          <span class="pw-element-unit">rem</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getFontSizeOverride(bp, sizeName) || sizeVal[bp], 'rem') }}</span>
                      </span>
                    </div>
                  </span>
                </div>
              </div>
            </template>
          </template>
        </div>
      </transition>
    </section>
  </div>
</template>

<script>
export default {
  props: {
    elementDefaults: {
      type: Object,
      default: () => ({}),
    },
    elementOverrides: {
      type: Object,
      default: () => ({}),
    },
    fonts: {
      type: Object,
      default: () => ({}),
    },
    fontDefaults: {
      type: Object,
      default: () => ({}),
    },
    fontOverrides: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      openSections: {},
    };
  },
  computed: {
    groups() {
      const result = {};
      for (const [key, val] of Object.entries(this.elementDefaults)) {
        if (val && typeof val === 'object' && (val.vars || val.colors)) {
          result[key] = val;
        }
      }
      return result;
    },
    fontFamilyOptions() {
      const allFonts = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      const seen = new Set();
      const options = [];
      for (const font of Object.values(allFonts)) {
        if (!seen.has(font.family)) {
          seen.add(font.family);
          options.push({ value: font.family, text: font.family });
        }
      }
      return options;
    },
  },
  methods: {
    toggle(key) {
      this.$set(this.openSections, key, !this.isOpen(key));
    },
    isOpen(key) {
      return this.openSections[key] !== false;
    },
    groupLabel(key) {
      const tKey = 'prw.elementgroup.' + key;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      return key.charAt(0).toUpperCase() + key.slice(1);
    },
    propLabel(varName) {
      // "heading-font-weight" → "Font Weight"
      const tKey = 'prw.element.' + varName;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      const parts = varName.split('-');
      // Remove element prefix (heading-, tagline-, etc.)
      const propParts = parts.slice(1);
      return propParts.join(' ').replace(/\b\w/g, c => c.toUpperCase());
    },
    isRequired(varName) {
      return varName.endsWith('-font-weight') && !this.getOverrideValue(varName);
    },
    filteredOptions(varName, options) {
      // Only filter font-weight fields
      if (!varName.endsWith('-font-weight')) {
        return options.map(o => ({ value: o, text: o }));
      }
      // Get the element prefix (e.g. "heading" from "heading-font-weight")
      const prefix = varName.replace('-font-weight', '');
      const fontFamilyVar = prefix + '-font-family';
      // Get selected font family for this element
      const selectedFamily = this.getOverrideValue(fontFamilyVar) || 'inherit';
      const font = this.getFontByFamily(selectedFamily);
      if (!font || !font.files || !font.files.length) {
        return options.map(o => ({ value: o, text: o }));
      }
      // Parse weight range from font files
      const weight = font.files[0].weight || '400';
      const parts = weight.split(' ');
      if (parts.length === 2) {
        const min = parseInt(parts[0]);
        const max = parseInt(parts[1]);
        return options.filter(o => {
          const n = parseInt(o);
          return n >= min && n <= max;
        }).map(o => ({ value: o, text: o }));
      }
      // Single weight
      return [{ value: parts[0], text: parts[0] }];
    },
    getFontByFamily(family) {
      const allFonts = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      return Object.values(allFonts).find(f => f.family === family) || null;
    },

    // --- Color methods ---
    colorLabel(varName) {
      const tKey = 'prw.color.' + varName;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      return varName;
    },
    isFollowedByColorState(colors, varName, index) {
      const keys = Object.keys(colors);
      const next = keys[index + 1];
      return next && (next.endsWith('-hover') || next.endsWith('-active'));
    },
    getColorOverrideValue(theme, varName) {
      return ((this.elementOverrides.global || {})[theme] || {})[varName] || '';
    },
    setColorValue(theme, varName, value, defaultVal) {
      const overrides = JSON.parse(JSON.stringify(this.elementOverrides));

      if (value === '' || value === defaultVal) {
        if (overrides.global && overrides.global[theme]) {
          delete overrides.global[theme][varName];
          if (Object.keys(overrides.global[theme]).length === 0) {
            delete overrides.global[theme];
          }
          if (overrides.global && Object.keys(overrides.global).length === 0) {
            delete overrides.global;
          }
        }
      } else {
        if (!overrides.global) overrides.global = {};
        if (!overrides.global[theme]) overrides.global[theme] = {};
        overrides.global[theme][varName] = value;
      }

      this.$emit('update:overrides', overrides);
    },

    // --- Quad methods ---
    getQuadValue(varName, index) {
      const override = (this.elementOverrides.global || {})[varName];
      if (Array.isArray(override)) return override[index] || '';
      return '';
    },
    setQuadValue(varName, index, value, def) {
      const overrides = JSON.parse(JSON.stringify(this.elementOverrides));
      if (!overrides.global) overrides.global = {};

      // Get current values (override or defaults)
      const current = Array.isArray(overrides.global[varName])
        ? [...overrides.global[varName]]
        : [...def.value];

      // Set the new value with unit
      current[index] = value === '' ? def.value[index] : value + (def.unit || '');

      // If all match defaults, remove override
      const allDefault = current.every((v, i) => v === def.value[i]);
      if (allDefault) {
        delete overrides.global[varName];
        if (Object.keys(overrides.global).length === 0) {
          delete overrides.global;
        }
      } else {
        overrides.global[varName] = current;
      }

      this.$emit('update:overrides', overrides);
    },

    // --- Style methods ---
    stripUnit(val) {
      if (!val) return '';
      return val.replace(/(rem|em|px)$/, '');
    },
    setUnitValue(varName, value, defaultVal, unit) {
      const withUnit = value === '' ? '' : value + (unit || '');
      this.setValue(varName, withUnit, defaultVal);
    },
    toPx(val, unit) {
      if (!val) return '';
      const num = parseFloat(val);
      if (isNaN(num)) return '';
      if (unit === 'rem' || val.endsWith('rem')) return Math.round(num * 16) + 'px';
      if (unit === 'em' || val.endsWith('em')) return Math.round(num * 16) + 'px';
      if (unit === '' && num > 0) return Math.round(num * 16) + 'px'; // unitless line-height
      return '';
    },
    helpText(key) {
      const tKey = 'prw.help.' + key;
      const t = this.$t(tKey);
      return (t && t !== tKey) ? t : key;
    },
    fontSizesForGroup(groupKey) {
      return this.fontDefaults[groupKey] || null;
    },
    getFontSizeOverride(bp, varName) {
      return ((this.fontOverrides.global || {})[bp] || {})[varName] || '';
    },
    setFontSizeValue(bp, varName, value, defaultVal, unit) {
      const withUnit = value === '' ? '' : value + (unit || '');
      const overrides = JSON.parse(JSON.stringify(this.fontOverrides));

      if (withUnit === '' || withUnit === defaultVal) {
        if (overrides.global && overrides.global[bp]) {
          delete overrides.global[bp][varName];
          if (Object.keys(overrides.global[bp]).length === 0) delete overrides.global[bp];
          if (overrides.global && Object.keys(overrides.global).length === 0) delete overrides.global;
        }
      } else {
        if (!overrides.global) overrides.global = {};
        if (!overrides.global[bp]) overrides.global[bp] = {};
        overrides.global[bp][varName] = withUnit;
      }

      this.$emit('update:font-overrides', overrides);
    },
    getResponsiveOverride(varName, bp) {
      return ((this.elementOverrides.global || {})[bp] || {})[varName] || '';
    },
    setResponsiveValue(varName, bp, value, defaultVal, unit) {
      const withUnit = value === '' ? '' : value + (unit || '');
      const overrides = JSON.parse(JSON.stringify(this.elementOverrides));

      if (withUnit === '' || withUnit === defaultVal) {
        if (overrides.global && overrides.global[bp]) {
          delete overrides.global[bp][varName];
          if (Object.keys(overrides.global[bp]).length === 0) {
            delete overrides.global[bp];
          }
          if (overrides.global && Object.keys(overrides.global).length === 0) {
            delete overrides.global;
          }
        }
      } else {
        if (!overrides.global) overrides.global = {};
        if (!overrides.global[bp]) overrides.global[bp] = {};
        overrides.global[bp][varName] = withUnit;
      }

      this.$emit('update:overrides', overrides);
    },
    getOverrideValue(varName) {
      return (this.elementOverrides.global || {})[varName] || '';
    },
    setValue(varName, value, defaultVal) {
      const overrides = JSON.parse(JSON.stringify(this.elementOverrides));

      if (value === '' || value === defaultVal) {
        if (overrides.global) {
          delete overrides.global[varName];
          if (Object.keys(overrides.global).length === 0) {
            delete overrides.global;
          }
        }
      } else {
        if (!overrides.global) overrides.global = {};
        overrides.global[varName] = value;
      }

      this.$emit('update:overrides', overrides);
    },
  },
};
</script>

<style>
.pw-element-section {
  margin-bottom: 0;
}

.pw-element-list {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--spacing-10);
}

.pw-element-color-header {
  display: flex;
  gap: 0;
  padding: 0 var(--spacing-3);
  margin-bottom: var(--spacing-1);
}

.pw-element-color-header .pw-field-row-label {
  width: 200px;
  flex-shrink: 0;
}

.pw-element-theme-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-dimmed);
  width: 180px;
  padding-left: 5px;
}

.pw-dual-first {
  padding-bottom: 1px;
}

.pw-dual-next {
  padding-top: 1px;
}

.pw-field-row-options:has(.pw-quad-label) {
  gap: var(--spacing-6);
}

.pw-quad-label {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: var(--color-black);
  background: var(--color-yellow-300);
  border: 1px solid var(--color-yellow-600);
  padding: 2px var(--spacing-2);
  border-radius: 999px;
  white-space: nowrap;
  margin-right: var(--spacing-1);
}

.pw-element-color-options {
  gap: 0;
}

/* Reduced spacing: row followed by :hover or :active */
.pw-color-row-grouped {
  padding-bottom: 1px;
}

/* :hover/:active rows get small top padding */
.pw-color-row-state {
  padding-top: 1px;
}

.pw-element-input {
  width: 100px;
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  background: light-dark(#f9f9f9, #1a1a1a);
}

.pw-element-input:focus {
  outline: none;
  border-color: var(--color-focus);
}

.pw-element-input-number {
  padding-right: 2.5rem;
  -moz-appearance: textfield;
}

.pw-element-input-number::-webkit-inner-spin-button,
.pw-element-input-number::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.pw-element-input::placeholder {
  color: var(--color-text-dimmed);
}

.pw-element-input.is-default {
  color: var(--color-text-dimmed);
}

.pw-element-field {
  display: flex;
  align-items: center;
  gap: 0;
}

.pw-element-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.pw-element-unit {
  position: absolute;
  right: var(--spacing-2);
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  pointer-events: none;
}



.pw-font-select {
  width: 200px;
  cursor: pointer;
  padding-right: var(--spacing-8);
  appearance: auto;
  font-family: var(--font-family);
}

.pw-sizes-toggle {
  padding: 0;
}

.pw-sizes-header {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-dimmed);
  padding: var(--spacing-2) var(--spacing-3);
}

.pw-sizes-help {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  padding: 0 var(--spacing-3) var(--spacing-2);
}

.pw-sizes-bp-labels {
  display: flex;
  gap: var(--spacing-6);
  padding: 0 var(--spacing-3);
  margin-left: 200px;
  margin-bottom: var(--spacing-1);
}

.pw-font-bp-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-dimmed);
  width: 100px;
}

.pw-element-help {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  white-space: nowrap;
  align-self: center;
}
</style>
