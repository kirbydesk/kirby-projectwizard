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
          <!-- Grouped fields -->
          <template v-for="(fieldGroup, gIdx) in groupedFields(group)">
            <!-- Group header row -->
            <div v-if="fieldGroup.header" :key="'gh-' + gIdx" class="pw-group-header">
              <div class="pw-field-row-label-col"></div>
              <div class="pw-group-header-labels" :class="'pw-group-type-' + fieldGroup.fieldType">
                <span v-for="label in fieldGroup.header" :key="label" class="pw-group-column-cell"><span class="pw-group-column-label">{{ translateLabel(label) }}</span></span>
              </div>
            </div>
            <!-- Field rows in group -->
            <template v-for="(field, fIdx) in fieldGroup.fields">
            <div
              :key="'gf-' + gIdx + '-' + fIdx"
              class="pw-field-row"
              :class="{
                'pw-dual-first': field.isFollowedByState || (field.varName.endsWith('-font-size') && fontSizesForGroup(groupKey) && openSections[groupKey + '-sizes']),
                'pw-dual-next': field.isState,
              }"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <template v-if="field.varName.endsWith('-font-size') && fontSizesForGroup(groupKey)">
                      <button
                        type="button"
                        class="pw-sizes-toggle"
                        @click.prevent="$set(openSections, groupKey + '-sizes', !openSections[groupKey + '-sizes'])"
                      >
                        <k-icon class="pw-sizes-chevron" :type="openSections[groupKey + '-sizes'] ? 'angle-down' : 'angle-right'" />
                        <span>{{ field.label }}</span>
                      </button>
                    </template>
                    <label v-else class="pw-field-row-label" v-html="field.label"></label>
                  </div>
                  <div class="pw-field-row-options" :class="fieldGroup.header ? 'pw-group-type-' + fieldGroup.fieldType : ''">
                    <!-- Font family selector -->
                    <select
                      v-if="field.def.type === 'font-family'"
                      class="pw-element-input pw-font-select"
                      :value="fontSelectValue(field.varName, field.def.value)"
                      @change="setValue(field.varName, $event.target.value, field.def.value)"
                    >
                      <option v-for="opt in fontFamilyOptions" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                    </select>
                    <!-- Toggles for options -->
                    <k-toggles-input
                      v-else-if="field.def.options"
                      :value="getOverrideValue(field.varName) || field.def.value"
                      :options="filteredOptions(field.varName, field.def.options)"
                      :grow="false"
                      :required="true"
                      @input="setValue(field.varName, $event, field.def.value)"
                    />
                    <!-- Multi-value (padding, border-radius: 1 row, N inputs) -->
                    <template v-else-if="field.type === 'multi-value'">
                      <span v-for="(val, idx) in field.def.value" :key="idx" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getQuadValue(field.varName, idx) }"
                            :value="stripUnit(getQuadValue(field.varName, idx) || val)"
                            @input="setQuadValue(field.varName, idx, $event.target.value, field.def)"
                          />
                          <span v-if="field.def.unit" class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getQuadValue(field.varName, idx) || val, field.def.unit) }}</span>
                      </span>
                    </template>
                    <!-- Responsive (default/lg/xl) -->
                    <template v-else-if="field.type === 'responsive'">
                      <span v-for="bp in ['default', 'lg', 'xl']" :key="bp" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getResponsiveOverride(field.varName, bp) }"
                            :value="stripUnit(getResponsiveOverride(field.varName, bp) || field.def[bp])"
                            @input="setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit)"
                          />
                          <span v-if="field.def.unit" class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit) }}</span>
                      </span>
                    </template>
                    <!-- Theme colors (default/variant/variant2) -->
                    <template v-else-if="field.type === 'theme-color'">
                      <pw-color-field-row
                        v-for="theme in ['default', 'variant', 'variant2']"
                        :key="theme"
                        :group="theme"
                        :var-name="field.varName"
                        :default-value="field.colorVal[theme] || ''"
                        :override-value="getColorOverrideValue(theme, field.varName)"
                        @update:value="setColorValue(theme, field.varName, $event, field.colorVal[theme] || '')"
                      />
                    </template>
                    <!-- Number input with unit -->
                    <template v-else-if="field.def.unit !== undefined">
                      <span class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getOverrideValue(field.varName) }"
                            :value="stripUnit(getOverrideValue(field.varName) || field.def.value)"
                            @input="setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit)"
                          />
                          <span v-if="field.def.unit" class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getOverrideValue(field.varName) || field.def.value, field.def.unit) }}</span>
                      </span>
                      <span v-if="field.def.help" class="pw-element-help">{{ helpText(field.def.help) }}</span>
                    </template>
                    <!-- Text input -->
                    <template v-else>
                      <input
                        type="text"
                        class="pw-element-input"
                        :placeholder="field.def.value"
                        :value="getOverrideValue(field.varName)"
                        @input="setValue(field.varName, $event.target.value, field.def.value)"
                      />
                      <span v-if="field.def.help" class="pw-element-help">{{ helpText(field.def.help) }}</span>
                    </template>
                  </div>
                </span>
              </div>
            </div>
            <!-- Sizes rows (appear after font-size row when toggled) -->
            <template v-if="field.varName.endsWith('-font-size') && fontSizesForGroup(groupKey) && openSections[groupKey + '-sizes']">
              <div
                v-for="(sizeVal, sizeName) in fontSizesForGroup(groupKey).vars"
                :key="'size-' + sizeName"
                class="pw-field-row pw-dual-first pw-dual-next"
              >
                <div class="k-input" data-type="text">
                  <span class="k-input-element pw-field-row-inner">
                    <div class="pw-field-row-label-col">
                      <label class="pw-field-row-label pw-sizes-label">{{ $t('pw.option.' + sizeName.split('-').pop()) }}</label>
                    </div>
                    <div class="pw-field-row-options pw-group-type-responsive">
                      <span v-for="bp in ['default', 'lg', 'xl']" :key="bp" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="fontSizesForGroup(groupKey).step || 0.1"
                            min="0.1"
                            max="20"
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
            <!-- Group end spacing -->
            <div v-if="fieldGroup.header" :key="'ge-' + gIdx" class="pw-group-end"></div>
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
    bodyDefaultFont: {
      type: String,
      default: 'Inter',
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
      const options = [{ value: 'default', text: 'Default (' + this.bodyDefaultFont + ')' }];
      for (const font of Object.values(allFonts)) {
        if (!seen.has(font.family) && font.family !== this.bodyDefaultFont) {
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
      return (t && t !== tKey) ? t : key;
    },
    propLabel(varName) {
      const tKey = 'prw.element.' + varName;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      const firstDash = varName.indexOf('-');
      if (firstDash > 0) {
        const propKey = 'prw.prop.' + varName.substring(firstDash + 1);
        const propT = this.$t(propKey);
        if (propT && propT !== propKey) return propT;
      }
      return varName;
    },
    // --- Field signature + grouping ---
    fieldSignature(varName, def, isColor) {
      if (isColor) {
        return { type: 'theme-color', labels: ['Default', 'Variant', 'Variant2'] };
      }
      if (Array.isArray(def.value) && def.labels) {
        return { type: 'multi-value', labels: def.labels };
      }
      if (def.default !== undefined && def.lg !== undefined && def.variant === undefined) {
        return { type: 'responsive', labels: ['Mobile', 'Tablet', 'Desktop'] };
      }
      return { type: 'single', labels: null };
    },
    groupedFields(group) {
      const allFields = [];

      // Build color fields
      const colorFields = [];
      if (group.colors) {
        const colorKeys = Object.keys(group.colors);
        for (let i = 0; i < colorKeys.length; i++) {
          const varName = colorKeys[i];
          const colorVal = group.colors[varName];
          const sig = this.fieldSignature(varName, {}, true);
          const nextKey = colorKeys[i + 1] || '';
          const isState = varName.endsWith('-hover') || varName.endsWith('-active');
          const isFollowedByState = nextKey.endsWith('-hover') || nextKey.endsWith('-active');
          colorFields.push({
            varName,
            def: {},
            colorVal,
            label: this.colorLabel(varName),
            isState,
            isFollowedByState,
            type: 'theme-color',
            sigLabels: sig.labels,
            sigKey: sig.type + ':' + sig.labels.join(','),
          });
        }
      }

      // Collect vars, insert colors after singles (before responsive/multi-value groups)
      if (group.vars) {
        let colorsInserted = false;
        for (const [varName, def] of Object.entries(group.vars)) {
          const sig = this.fieldSignature(varName, def, false);
          // Insert colors before first non-single field
          if (!colorsInserted && sig.type !== 'single' && colorFields.length > 0) {
            allFields.push(...colorFields);
            colorsInserted = true;
          }
          allFields.push({
            varName,
            def,
            label: this.propLabel(varName),
            type: sig.type,
            sigLabels: sig.labels,
            sigKey: sig.type === 'single' ? 'single-' + varName : sig.type + ':' + (sig.labels || []).join(','),
          });
        }
        // If all fields were singles, append colors at end
        if (!colorsInserted && colorFields.length > 0) {
          allFields.push(...colorFields);
        }
      } else if (colorFields.length > 0) {
        allFields.push(...colorFields);
      }

      // Group consecutive fields with same signature
      const groups = [];
      let currentGroup = null;

      for (const field of allFields) {
        if (field.type === 'single') {
          // Singles don't group
          if (currentGroup) {
            groups.push(currentGroup);
            currentGroup = null;
          }
          groups.push({ header: null, fields: [field] });
        } else if (currentGroup && currentGroup.sigKey === field.sigKey) {
          currentGroup.fields.push(field);
        } else {
          if (currentGroup) groups.push(currentGroup);
          currentGroup = {
            sigKey: field.sigKey,
            header: field.sigLabels,
            fieldType: field.type,
            fields: [field],
          };
        }
      }
      if (currentGroup) groups.push(currentGroup);

      return groups;
    },

    filteredOptions(varName, options) {
      if (!varName.endsWith('-font-weight')) {
        return options.map(o => ({ value: o, text: o }));
      }
      const prefix = varName.replace('-font-weight', '');
      const fontFamilyVar = prefix + '-font-family';
      let selectedFamily = this.getOverrideValue(fontFamilyVar);
      if (!selectedFamily) {
        // Read default from element config
        for (const group of Object.values(this.elementDefaults)) {
          if (group && group.vars && group.vars[fontFamilyVar]) {
            selectedFamily = group.vars[fontFamilyVar].value;
            break;
          }
        }
      }
      if (!selectedFamily || selectedFamily === 'default') selectedFamily = this.bodyDefaultFont;
      const font = this.getFontByFamily(selectedFamily);
      if (!font || !font.files || !font.files.length) {
        return options.map(o => ({ value: o, text: o }));
      }
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
      return [{ value: parts[0], text: parts[0] }];
    },
    getFontByFamily(family) {
      const allFonts = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      return Object.values(allFonts).find(f => f.family === family) || null;
    },

    translateLabel(label) {
      const slug = label.toLowerCase().replace(/\s+/g, '-');
      const pwKey = 'pw.option.' + slug;
      const pwT = this.$t(pwKey);
      if (pwT && pwT !== pwKey) return pwT;
      const prwKey = 'prw.label.' + slug;
      const prwT = this.$t(prwKey);
      return (prwT && prwT !== prwKey) ? prwT : label;
    },

    // --- Color methods ---
    colorLabel(varName) {
      const tKey = 'prw.color.' + varName;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      return varName;
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

      const current = Array.isArray(overrides.global[varName])
        ? [...overrides.global[varName]]
        : [...def.value];

      current[index] = value === '' ? def.value[index] : value + (def.unit || '');

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
    fontSelectValue(varName, defValue) {
      const ov = this.getOverrideValue(varName);
      if (ov && ov === this.bodyDefaultFont) return 'default';
      return ov || defValue;
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


.pw-group-header {
  display: flex;
  gap: 0;
  padding: var(--spacing-1) var(--spacing-3) var(--spacing-1);
  margin-top: var(--spacing-4);
}

.pw-group-end + .pw-group-header {
  margin-top: 0;
}

.pw-group-header .pw-field-row-label-col {
  width: 200px;
  flex-shrink: 0;
}

.pw-group-header-labels {
  display: flex;
  gap: var(--spacing-6);
}

.pw-group-column-label {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: var(--color-black);
  background: var(--color-yellow-300);
  border: 1px solid var(--color-yellow-600);
  padding: 2px var(--spacing-2);
  border-radius: 999px;
  white-space: nowrap;
  width: fit-content;
}

.pw-group-end {
  margin-bottom: var(--spacing-4);
}

/* Column cell — fixed width wrapper, pill centered inside */
.pw-group-column-cell {
  display: flex;
}

.pw-group-type-multi-value,
.pw-group-type-responsive {
  gap: var(--spacing-4);
}

.pw-group-type-multi-value .pw-group-column-cell,
.pw-group-type-responsive .pw-group-column-cell {
  width: 145px; /* 100px input + 45px px-calculator */
}

.pw-group-type-theme-color {
  gap: var(--spacing-4);
}

.pw-group-type-theme-color .pw-group-column-cell {
  width: 160px; /* color picker width */
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
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--color-text);
  padding: 0;
}

.pw-sizes-chevron {
  color: var(--color-text-dimmed);
  width: 18px;
  height: 18px;
}

.pw-sizes-chevron svg {
  width: 18px;
  height: 18px;
}

.pw-sizes-label {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
}

.pw-element-help {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  white-space: nowrap;
  align-self: center;
}
</style>
