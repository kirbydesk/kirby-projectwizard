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
          <template v-for="(def, varName) in group.vars">
          <!-- Section label -->
          <div v-if="def.type === 'label'" :key="varName" class="pw-nav-label">
            {{ varName.replace('_label_', '') }}
          </div>
          <!-- Field row -->
          <div
            v-else-if="def.type !== 'dual-pair' && def.type !== 'dimensions'"
            :key="varName"
            class="pw-field-row"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label">{{ propLabel(varName) }}</label>
                </div>
                <div class="pw-field-row-options">
                  <!-- Visibility toggle (eye icon) -->
                  <button
                    v-if="def.type === 'visibility'"
                    type="button"
                    class="pw-tab-visibility"
                    @click="setValue(varName, (getOverrideValue(varName) || def.value) === 'true' ? 'false' : 'true', def.value)"
                  >
                    <k-icon :type="(getOverrideValue(varName) || def.value) === 'true' ? 'preview' : 'hidden'" />
                  </button>
                  <!-- Icon selector -->
                  <div v-else-if="def.type === 'icon-select'" class="pw-icon-select">
                    <button
                      v-for="icon in def.options"
                      :key="icon"
                      type="button"
                      class="pw-icon-option"
                      :class="{ 'is-active': (getOverrideValue(varName) || def.value) === icon && (getOverrideValue(varName) || def.value) !== 'none' }"
                      @click="toggleIcon(varName, icon, def.value)"
                      v-html="inlineIcons[icon]"
                    >
                    </button>
                  </div>
                  <!-- Font family selector -->
                  <select
                    v-else-if="def.type === 'font-family'"
                    class="pw-element-input pw-font-select"
                    :value="getOverrideValue(varName) || def.value"
                    @change="setValue(varName, $event.target.value, def.value)"
                  >
                    <option v-for="opt in fontFamilyOptions" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                  </select>
                  <!-- Toggles for options -->
                  <k-toggles-input
                    v-else-if="def.options"
                    :value="getOverrideValue(varName) || def.value"
                    :options="filteredOptions(varName, def.options)"
                    :grow="false"
                    :required="true"
                    @input="setValue(varName, $event, def.value)"
                  />
                  <!-- Color pair -->
                  <template v-else-if="def.type === 'color-pair'">
                    <span v-for="(field, fieldName) in def.fields" :key="fieldName" class="pw-color-pair-field">
                      <span class="pw-quad-label">{{ field.label }}</span>
                      <pw-color-field-row
                        :group="'nav'"
                        :var-name="fieldName"
                        :default-value="field.value"
                        :override-value="getOverrideValue(fieldName)"
                        @update:value="setValue(fieldName, $event || '', field.value)"
                      />
                    </span>
                  </template>
                  <!-- Color picker -->
                  <template v-else-if="def.type === 'color'">
                    <pw-color-field-row
                      :group="'nav'"
                      :var-name="varName"
                      :default-value="def.value"
                      :override-value="getOverrideValue(varName)"
                      @update:value="setValue(varName, $event || '', def.value)"
                    />
                  </template>
                  <!-- Number input with unit + px calculator -->
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
                  </template>
                  <!-- SVG textarea + dimensions -->
                  <template v-else-if="def.type === 'svg'">
                    <textarea
                      class="pw-element-input pw-svg-textarea"
                      :placeholder="'Paste SVG code here...'"
                      :value="getOverrideValue(varName)"
                      @input="onSvgInput(varName, $event.target.value, def.value)"
                    ></textarea>
                    <div v-if="getOverrideValue(varName)" class="pw-svg-dimensions">
                      <template v-if="svgErrors[varName]">
                        <span class="pw-svg-error">Error: Could not read dimensions</span>
                      </template>
                      <template v-else>
                        <span class="pw-nav-label">Dimensions</span>
                        <div class="pw-svg-dim-fields">
                          <span class="pw-element-field">
                            <span class="pw-quad-label">W</span>
                            <input
                              type="text"
                              class="pw-element-input pw-dimensions-input"
                              :value="getOverrideValue(varName + '-width')"
                              @input="setValue(varName + '-width', $event.target.value, '')"
                            />
                          </span>
                          <span class="pw-element-field">
                            <span class="pw-quad-label">H</span>
                            <input
                              type="text"
                              class="pw-element-input pw-dimensions-input"
                              :value="getOverrideValue(varName + '-height')"
                              @input="setValue(varName + '-height', $event.target.value, '')"
                            />
                          </span>
                        </div>
                      </template>
                    </div>
                  </template>
                  <!-- Text input -->
                  <input
                    v-else
                    type="text"
                    class="pw-element-input"
                    :placeholder="def.value"
                    :value="getOverrideValue(varName)"
                    @input="setValue(varName, $event.target.value, def.value)"
                  />
                </div>
              </span>
            </div>
          </div>
          <!-- Dual-pair rows (inline) -->
          <template v-else-if="def.type === 'dual-pair'">
            <div
              v-for="(row, rIdx) in def.rows"
              :key="varName + '-' + rIdx"
              class="pw-field-row"
              :class="{ 'pw-dual-first': rIdx === 0 && def.rows.length > 1, 'pw-dual-next': rIdx > 0 }"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ varName }} · {{ row.label }}</label>
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
          <!-- Multi-theme colors -->
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
                    <label class="pw-field-row-label">{{ propLabel(varName) }}</label>
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
        </div>
      </transition>
    </section>
  </div>
</template>

<script>
export default {
  props: {
    navDefaults: {
      type: Object,
      default: () => ({}),
    },
    navOverrides: {
      type: Object,
      default: () => ({}),
    },
    fonts: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      openSections: {},
      svgErrors: {},
      inlineIcons: {
        'arrow-down': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"/></svg>',
        'chevron-down': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
        'caret-down': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>',
        'plus-minus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>',
      },
    };
  },
  computed: {
    groups() {
      const result = {};
      for (const [key, val] of Object.entries(this.navDefaults)) {
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
      const tKey = 'prw.navgroup.' + key;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      return key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
    },
    toggleIcon(varName, icon, defaultVal) {
      const current = this.getOverrideValue(varName) || defaultVal;
      if (current === icon) {
        // Deselect: set override to 'none' (empty = no icon)
        this.setValue(varName, 'none', defaultVal);
      } else {
        this.setValue(varName, icon, defaultVal);
      }
    },
    onSvgInput(varName, value, defaultVal) {
      this.setValue(varName, value, defaultVal);
      if (!value) {
        this.$delete(this.svgErrors, varName);
        return;
      }
      const dims = this.parseSvgDimensions(value);
      if (dims) {
        this.$delete(this.svgErrors, varName);
        this.setValue(varName + '-width', String(dims.width), '');
        this.setValue(varName + '-height', String(dims.height), '');
      } else {
        this.$set(this.svgErrors, varName, true);
      }
    },
    parseSvgDimensions(svgCode) {
      if (!svgCode || !svgCode.includes('<svg')) return null;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCode, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) return null;
        // Prefer viewBox
        const vb = svg.getAttribute('viewBox');
        if (vb) {
          const parts = vb.trim().split(/\s+/);
          if (parts.length === 4) {
            return { width: Math.round(parseFloat(parts[2])), height: Math.round(parseFloat(parts[3])) };
          }
        }
        // Fallback to width/height attributes
        const w = parseFloat(svg.getAttribute('width'));
        const h = parseFloat(svg.getAttribute('height'));
        if (w && h) return { width: Math.round(w), height: Math.round(h) };
        return null;
      } catch (e) {
        return null;
      }
    },
    filteredOptions(varName, options) {
      if (!varName.endsWith('font-weight')) {
        return options.map(o => ({ value: String(o), text: this.optionLabel(o) }));
      }
      const prefix = varName.replace('font-weight', '');
      const fontFamilyVar = prefix + 'font-family';
      const selectedFamily = this.getOverrideValue(fontFamilyVar);
      const font = this.getFontByFamily(selectedFamily);
      if (!font || !font.files || !font.files.length) {
        return options.map(o => ({ value: String(o), text: this.optionLabel(o) }));
      }
      const weight = font.files[0].weight || '400';
      const parts = weight.split(' ');
      if (parts.length === 2) {
        const min = parseInt(parts[0]);
        const max = parseInt(parts[1]);
        return options.filter(o => {
          const n = parseInt(o);
          return n >= min && n <= max;
        }).map(o => ({ value: String(o), text: this.optionLabel(o) }));
      }
      return [{ value: parts[0], text: this.optionLabel(parts[0]) }];
    },
    getFontByFamily(family) {
      if (!family) {
        // Look up default from navDefaults
        for (const group of Object.values(this.navDefaults)) {
          if (group.vars && group.vars['font-family']) {
            family = group.vars['font-family'].value;
            break;
          }
        }
      }
      const allFonts = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      return Object.values(allFonts).find(f => f.family === family) || null;
    },
    optionLabel(val) {
      const tKey = 'prw.option.' + val;
      const t = this.$t(tKey);
      return (t && t !== tKey) ? t : String(val);
    },
    propLabel(varName) {
      const tKey = 'prw.nav.' + varName;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      return varName;
    },
    isFollowedByColorState(colors, varName, index) {
      const keys = Object.keys(colors);
      const next = keys[index + 1];
      return next && (next.endsWith('-hover') || next.endsWith('-active'));
    },
    getQuadValue(varName, index) {
      const override = (this.navOverrides.global || {})[varName];
      if (Array.isArray(override)) return override[index] || '';
      return '';
    },
    setQuadValue(varName, index, value, def) {
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));
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
      if (unit === '' && num > 0) return Math.round(num * 16) + 'px';
      return '';
    },
    getColorOverrideValue(theme, varName) {
      return ((this.navOverrides.global || {})[theme] || {})[varName] || '';
    },
    setColorValue(theme, varName, value, defaultVal) {
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));

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
    getOverrideValue(varName) {
      return (this.navOverrides.global || {})[varName] || '';
    },
    setValue(varName, value, defaultVal) {
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));

      if (value === '' || value === defaultVal || value === String(defaultVal)) {
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
/* Uses pw-element-* classes from GlobalElementStyles */

.pw-field-row:has(.pw-svg-textarea) .pw-field-row-label-col {
  align-self: start;
  padding-top: 6px;
}

.pw-field-row-options:has(.pw-svg-textarea) {
  flex-direction: column;
  align-items: start;
}

.pw-svg-textarea {
  width: 500px;
  min-height: 80px;
  max-height: 200px;
  resize: vertical;
  margin: var(--spacing-1) 0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.4;
  white-space: pre;
}

.pw-svg-dimensions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  margin-top: calc(-1 * var(--spacing-3));
  margin-bottom: var(--spacing-2);
  width: 500px;
}

.pw-icon-select {
  display: flex;
  gap: 0;
}

.pw-icon-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 26px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  cursor: pointer;
  margin-left: -1px;
}

.pw-icon-option:first-child {
  border-radius: var(--rounded) 0 0 var(--rounded);
  margin-left: 0;
}

.pw-icon-option:last-child {
  border-radius: 0 var(--rounded) var(--rounded) 0;
}

.pw-icon-option svg {
  width: 14px;
  height: 14px;
}

.pw-icon-option.is-active {
  background: var(--color-blue-600);
  color: var(--color-white);
  border-color: var(--color-blue-600);
  z-index: 1;
  position: relative;
}

.pw-color-pair-field {
  display: flex;
  align-items: center;
  gap: 0;
}

.pw-svg-dimensions .pw-nav-label {
  padding: 0;
}

.pw-svg-dim-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.pw-dimensions-input {
  width: 60px;
  text-align: center;
}

.pw-svg-error {
  font-size: var(--text-xs);
  color: var(--color-red-600, #dc2626);
  padding-top: var(--spacing-2);
}

.pw-nav-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
  color: var(--color-text-dimmed);
  padding: var(--spacing-4) var(--spacing-3) var(--spacing-1);
}
</style>
