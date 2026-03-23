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
            <!-- Section label -->
            <div v-if="fieldGroup.isLabel" :key="'gl-' + gIdx" class="pw-nav-label">
              {{ fieldGroup.labelText }}
            </div>
            <template v-else>
              <!-- Group header row -->
              <div v-if="fieldGroup.header" :key="'gh-' + gIdx" class="pw-group-header">
                <div class="pw-field-row-label-col"></div>
                <div class="pw-group-header-labels" :class="'pw-group-type-' + fieldGroup.fieldType">
                  <span v-for="label in fieldGroup.header" :key="label" class="pw-group-column-cell"><span class="pw-group-column-label">{{ label }}</span></span>
                </div>
              </div>
              <!-- Field rows in group -->
              <template v-for="(field, fIdx) in fieldGroup.fields">
              <div
                :key="'gf-' + gIdx + '-' + fIdx"
                class="pw-field-row"
              >
                <div class="k-input" data-type="text">
                  <span class="k-input-element pw-field-row-inner">
                    <div class="pw-field-row-label-col">
                      <label class="pw-field-row-label">{{ field.label }}</label>
                    </div>
                    <div class="pw-field-row-options" :class="fieldGroup.header ? 'pw-group-type-' + fieldGroup.fieldType : ''">
                      <!-- Visibility toggle -->
                      <button
                        v-if="field.def.type === 'visibility'"
                        type="button"
                        class="pw-tab-visibility"
                        @click="setValue(field.varName, (getOverrideValue(field.varName) || field.def.value) === 'true' ? 'false' : 'true', field.def.value)"
                      >
                        <k-icon :type="(getOverrideValue(field.varName) || field.def.value) === 'true' ? 'preview' : 'hidden'" />
                      </button>
                      <!-- Icon selector -->
                      <div v-else-if="field.def.type === 'icon-select'" class="pw-icon-select">
                        <button
                          v-for="icon in field.def.options"
                          :key="icon"
                          type="button"
                          class="pw-icon-option"
                          :class="{ 'is-active': (getOverrideValue(field.varName) || field.def.value) === icon && (getOverrideValue(field.varName) || field.def.value) !== 'none' }"
                          @click="toggleIcon(field.varName, icon, field.def.value)"
                          v-html="inlineIcons[icon]"
                        >
                        </button>
                      </div>
                      <!-- Font family selector -->
                      <select
                        v-else-if="field.def.type === 'font-family'"
                        class="pw-element-input pw-font-select"
                        :value="getOverrideValue(field.varName) || field.def.value"
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
                      <!-- Color group -->
                      <template v-else-if="field.type === 'color-group'">
                        <pw-color-field-row
                          v-for="(cgField, cgName) in field.def.fields"
                          :key="cgName"
                          :group="'nav'"
                          :var-name="cgName"
                          :default-value="cgField.value"
                          :override-value="getOverrideValue(cgName)"
                          @update:value="setValue(cgName, $event || '', cgField.value)"
                        />
                      </template>
                      <!-- Color picker -->
                      <template v-else-if="field.def.type === 'color'">
                        <pw-color-field-row
                          :group="'nav'"
                          :var-name="field.varName"
                          :default-value="field.def.value"
                          :override-value="getOverrideValue(field.varName)"
                          @update:value="setValue(field.varName, $event || '', field.def.value)"
                        />
                      </template>
                      <!-- Multi-value (padding: 1 row, N inputs) -->
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
                      </template>
                      <!-- SVG + dependent height field -->
                      <template v-else-if="field.def.type === 'svg'">
                        <template v-if="getOverrideValue(field.varName)">
                          <div class="pw-svg-preview" @click="openSvgDialog(field.varName, field.def.value)"><div class="pw-svg-preview-checker" v-html="getOverrideValue(field.varName)"></div></div>
                          <template v-if="dependentField(field.varName)">
                            <span class="pw-element-field">
                              <span class="pw-group-column-label" style="margin-right: var(--spacing-2)">Height</span>
                              <span class="pw-element-input-wrap">
                                <input
                                  type="number"
                                  :step="dependentField(field.varName).def.step || 0.1"
                                  :min="dependentField(field.varName).def.min"
                                  :max="dependentField(field.varName).def.max"
                                  class="pw-element-input pw-element-input-number pw-px-calculator-input"
                                  :class="{ 'is-default': !getOverrideValue(dependentField(field.varName).varName) }"
                                  :value="stripUnit(getOverrideValue(dependentField(field.varName).varName) || dependentField(field.varName).def.value)"
                                  @input="setUnitValue(dependentField(field.varName).varName, $event.target.value, dependentField(field.varName).def.value, dependentField(field.varName).def.unit)"
                                />
                                <span class="pw-element-unit">{{ dependentField(field.varName).def.unit }}</span>
                              </span>
                              <span class="pw-px-calculator">{{ toPx(getOverrideValue(dependentField(field.varName).varName) || dependentField(field.varName).def.value, dependentField(field.varName).def.unit) }}</span>
                            </span>
                          </template>
                          <k-button
                            text="Remove"
                            icon="remove"
                            size="xs"
                            @click="removeSvg(field.varName)"
                          />
                        </template>
                        <k-button
                          v-else
                          text="Add SVG"
                          icon="code"
                          size="xs"
                          variant="filled"
                          @click="openSvgDialog(field.varName, field.def.value)"
                        />
                      </template>
                      <!-- Text input -->
                      <input
                        v-else
                        type="text"
                        class="pw-element-input"
                        :placeholder="field.def.value"
                        :value="getOverrideValue(field.varName)"
                        @input="setValue(field.varName, $event.target.value, field.def.value)"
                      />
                    </div>
                  </span>
                </div>
              </div>
              </template>
              <!-- Group end spacing -->
              <div v-if="fieldGroup.header" :key="'ge-' + gIdx" class="pw-group-end"></div>
            </template>
          </template>
          <!-- Multi-theme colors -->
          <template v-if="group.colors">
            <div v-if="hasColors(group)" class="pw-group-header">
              <div class="pw-field-row-label-col"></div>
              <div class="pw-group-header-labels pw-group-type-theme-color">
                <span class="pw-group-column-cell"><span class="pw-group-column-label">Default</span></span>
                <span class="pw-group-column-cell"><span class="pw-group-column-label">Variant</span></span>
                <span class="pw-group-column-cell"><span class="pw-group-column-label">Variant2</span></span>
              </div>
            </div>
            <div
              v-for="(colorVal, varName, index) in group.colors"
              :key="'color-' + varName"
              class="pw-field-row"
              :class="{
                'pw-dual-first': isFollowedByColorState(group.colors, index),
                'pw-dual-next': varName.endsWith('-hover') || varName.endsWith('-active'),
              }"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ propLabel(varName) }}</label>
                  </div>
                  <div class="pw-field-row-options pw-group-type-theme-color">
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
            <div class="pw-group-end"></div>
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
    hasColors(group) {
      return group.colors && Object.keys(group.colors).length > 0;
    },
    isFollowedByColorState(colors, index) {
      const keys = Object.keys(colors);
      const next = keys[index + 1];
      return next && (next.endsWith('-hover') || next.endsWith('-active'));
    },

    // --- Field signature + grouping ---
    fieldSignature(varName, def) {
      if (def.type === 'color-group' && def.fields && def.labels) {
        return { type: 'color-group', labels: def.labels };
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

      if (group.vars) {
        for (const [varName, def] of Object.entries(group.vars)) {
          // Labels break groups
          if (def.type === 'label') {
            allFields.push({ isLabel: true, labelText: varName.replace('_label_', '') });
            continue;
          }
          // Skip fields with requires if dependency not met, or if rendered inline (dependentField)
          if (def.requires) {
            if (!this.getOverrideValue(def.requires)) {
              continue;
            }
            // Height fields are rendered inline in SVG row via dependentField
            if (varName.endsWith('-display-height')) {
              continue;
            }
          }
          const sig = this.fieldSignature(varName, def);
          allFields.push({
            varName,
            def,
            label: def.label || this.propLabel(varName),
            type: sig.type,
            sigLabels: sig.labels,
            sigKey: sig.type === 'single' ? 'single-' + varName : sig.type + ':' + (sig.labels || []).join(','),
          });
        }
      }

      // Group consecutive fields with same signature
      const groups = [];
      let currentGroup = null;

      for (const field of allFields) {
        if (field.isLabel) {
          if (currentGroup) {
            groups.push(currentGroup);
            currentGroup = null;
          }
          groups.push({ isLabel: true, labelText: field.labelText });
          continue;
        }

        if (field.type === 'single') {
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

    dependentField(svgVarName) {
      // Find the field that has requires: svgVarName
      for (const [, group] of Object.entries(this.navDefaults)) {
        if (!group.vars) continue;
        for (const [varName, def] of Object.entries(group.vars)) {
          if (def.requires === svgVarName) {
            return { varName, def };
          }
        }
      }
      return null;
    },
    toggleIcon(varName, icon, defaultVal) {
      const current = this.getOverrideValue(varName) || defaultVal;
      if (current === icon) {
        this.setValue(varName, 'none', defaultVal);
      } else {
        this.setValue(varName, icon, defaultVal);
      }
    },
    sanitizeSvg(raw) {
      if (!raw) return '';
      // Remove XML prolog, DOCTYPE, comments
      let svg = raw.replace(/<\?xml[^?]*\?>\s*/gi, '')
                    .replace(/<!DOCTYPE[^>]*>\s*/gi, '')
                    .replace(/<!--[\s\S]*?-->\s*/g, '');
      // Extract just the <svg>...</svg>
      const match = svg.match(/<svg[\s\S]*<\/svg>/i);
      if (!match) return '';
      svg = match[0];
      // Replace percentage or missing width/height with real values from viewBox
      const vbMatch = svg.match(/viewBox=["'][\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)["']/);
      if (vbMatch) {
        const w = Math.round(parseFloat(vbMatch[1]));
        const h = Math.round(parseFloat(vbMatch[2]));
        // Remove existing width/height
        svg = svg.replace(/(<svg[^>]*?)\s+width="[^"]*"/i, '$1');
        svg = svg.replace(/(<svg[^>]*?)\s+height="[^"]*"/i, '$1');
        // Add real dimensions
        svg = svg.replace(/<svg/, '<svg width="' + w + '" height="' + h + '"');
      }
      return svg.trim();
    },
    openSvgDialog(varName, defaultVal) {
      const current = this.getOverrideValue(varName) || '';
      this.$panel.dialog.open({
        component: 'k-form-dialog',
        props: {
          fields: {
            svg: {
              type: 'textarea',
              label: 'SVG Code',
              buttons: false,
              value: current,
              font: 'monospace',
              size: 'medium',
              placeholder: 'Paste SVG code here...',
            },
          },
          value: { svg: current },
          submitBtn: { text: 'Apply', icon: 'check' },
        },
        on: {
          submit: (values) => {
            const cleaned = this.sanitizeSvg(values.svg || '');
            if (!cleaned) {
              this.$panel.notification.error('No valid SVG found');
              return;
            }
            const dims = this.parseSvgDimensions(cleaned);
            if (!dims) {
              this.$panel.notification.error('SVG must have a viewBox or width/height attributes');
              return;
            }
            this.$panel.dialog.close();
            this.onSvgInput(varName, cleaned, defaultVal);
          },
        },
      });
    },
    removeSvg(varName) {
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));
      if (overrides.global) {
        delete overrides.global[varName];
        delete overrides.global[varName + '-width'];
        delete overrides.global[varName + '-height'];
        if (Object.keys(overrides.global).length === 0) {
          delete overrides.global;
        }
      }
      this.$emit('update:overrides', overrides);
    },
    onSvgInput(varName, value, defaultVal) {
      if (!value) {
        this.setValue(varName, '', defaultVal);
        return;
      }
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));
      if (!overrides.global) overrides.global = {};
      overrides.global[varName] = value;

      const dims = this.parseSvgDimensions(value);
      if (dims) {
        overrides.global[varName + '-width'] = String(dims.width);
        overrides.global[varName + '-height'] = String(dims.height);
      }

      this.$emit('update:overrides', overrides);
    },
    parseSvgDimensions(svgCode) {
      if (!svgCode || !svgCode.includes('<svg')) return null;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCode, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) return null;
        const vb = svg.getAttribute('viewBox');
        if (vb) {
          const parts = vb.trim().split(/\s+/);
          if (parts.length === 4) {
            return { width: Math.round(parseFloat(parts[2])), height: Math.round(parseFloat(parts[3])) };
          }
        }
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
    getResponsiveOverride(varName, bp) {
      return ((this.navOverrides.global || {})[bp] || {})[varName] || '';
    },
    setResponsiveValue(varName, bp, value, defaultVal, unit) {
      const withUnit = value === '' ? '' : value + (unit || '');
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));

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
/* Uses pw-element-* and pw-group-* classes from GlobalElementStyles */

.pw-svg-preview {
  height: 30px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.15s;
  display: flex;
  align-items: center;
}

.pw-svg-preview:hover {
  opacity: 1;
}

.pw-svg-preview-checker {
  display: inline-flex;
  padding: 4px;
  border-radius: var(--rounded);
  background-image:
    linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
  height: 100%;
}

.pw-svg-preview-checker svg {
  height: 100%;
  width: auto;
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


.pw-nav-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
  color: var(--color-text-dimmed);
  padding: var(--spacing-4) var(--spacing-3) var(--spacing-1);
}

/* Color-group header labels align over color pickers */
.pw-group-type-color-group {
  gap: var(--spacing-4);
}

.pw-group-type-color-group .pw-group-column-cell {
  width: 160px;
}
</style>
