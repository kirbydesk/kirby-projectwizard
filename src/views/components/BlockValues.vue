<template>
  <!-- nothing without rows (several of these can share one card) -->
  <div v-if="Object.keys(groups).length">
    <section v-for="(group, groupKey) in groups" :key="groupKey" class="pw-element-section">
      <div v-if="!hideSectionHeaders" class="pw-section-header">
        <span class="pw-tab-visibility pw-tab-visibility-static">
          <k-icon type="settings" />
        </span>
        <button class="pw-section-toggle" @click="toggle(groupKey)">
          <span>{{ groupLabel(groupKey) }}</span>
          <k-icon :type="isOpen(groupKey) ? 'angle-down' : 'angle-right'" />
        </button>
      </div>
      <transition name="pw-slide">
        <div v-show="isOpen(groupKey)" class="pw-element-list">

          <!-- Multi-theme colors header (Default / Variant / Variant2) -->
          <div v-if="!theme && Object.keys(group.colors || {}).length" class="pw-group-header">
            <div class="pw-field-row-label-col"></div>
            <div class="pw-group-header-labels pw-group-type-theme-color">
              <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('pw.option.default') || 'Default' }}</span></span>
              <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('pw.option.variant') || 'Variant' }}</span></span>
              <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('pw.option.variant2') || 'Variant 2' }}</span></span>
              <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('pw.option.variant3') || 'Variant 3' }}</span></span>
            </div>
          </div>

          <!-- Multi-theme colors (default / variant / variant2) -->
          <div
            v-for="(themes, varName) in group.colors"
            :key="'color-' + varName"
            class="pw-field-row"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label" v-html="varLabel(varName)"></label>
                </div>
                <div class="pw-field-row-options" :class="{ 'pw-group-type-theme-color': !theme }">
                  <span
                    v-for="(themeValue, themeKey) in visibleThemes(themes)"
                    :key="themeKey"
                    class="pw-element-field"
                  >
                    <pw-color-field-row
                      :group="'block-values-' + themeKey"
                      :var-name="varName"
                      :default-value="themeValue"
                      :override-value="getThemeOverride(themeKey, varName) || ''"
                      @update:value="setThemeColor(themeKey, varName, $event || '', themeValue)"
                    />
                  </span>
                </div>
              </span>
              <k-button v-if="hasColorOverride(varName)" class="pw-field-reset" :text="$t('prw.label.reset')" icon="undo" size="xs" variant="filled" @click="resetColor(varName)" />
            </div>
          </div>

          <!-- Plain vars (single / multi-value / quad / responsive) -->
          <template v-for="(def, varName) in group.vars">
          <!-- Responsive header (Mobile / Tablet / Desktop), like the element sizes -->
          <div v-if="isResponsive(def) && !bp" :key="'rh-' + varName" class="pw-group-header">
            <div class="pw-field-row-label-col"></div>
            <div class="pw-group-header-labels pw-group-type-responsive">
              <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('prw.label.mobile') }}</span></span>
              <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('prw.label.tablet') }}</span></span>
              <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('prw.label.desktop') }}</span></span>
            </div>
          </div>
          <div
            :key="varName"
            class="pw-field-row"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label" v-html="varLabel(varName)"></label>
                </div>
                <div class="pw-field-row-options" :class="{ 'pw-group-type-responsive': isResponsive(def) && !bp, 'pw-corner-grid': isCorners(def) }">

                  <!-- Color -->
                  <template v-if="def.type === 'color'">
                    <pw-color-field-row
                      :group="'block-values'"
                      :var-name="varName"
                      :default-value="def.value"
                      :override-value="getOverride(varName) || ''"
                      @update:value="setSingle(varName, $event || '', def.value)"
                    />
                  </template>

                  <!-- Responsive (default / lg / xl) -->
                  <template v-else-if="isResponsive(def)">
                    <span
                      v-for="bp in (bp ? [bp] : ['default', 'lg', 'xl'])"
                      :key="bp"
                      class="pw-element-field"
                    >
                      <span class="pw-element-input-wrap">
                        <input
                          v-pw-autosize
                          type="text"
                          inputmode="decimal"
                          class="pw-element-input pw-element-input-number"
                          :class="{ 'pw-px-calculator-input': showCalculator(def.unit), 'is-default': !responsiveAt(varName, bp) }"
                          :value="stripUnit(responsiveAt(varName, bp) || def[bp], def.unit)"
                          @change="setResponsive(varName, bp, $event.target.value, def)"
                        />
                        <span class="pw-element-unit">{{ def.unit }}</span>
                      </span>
                      <span v-if="showCalculator(def.unit)" class="pw-px-calculator">{{ toPx(responsiveAt(varName, bp) || def[bp], def.unit, varName, bp) }}</span>
                    </span>
                    <!-- switch the breakpoint (shared by all rows) -->
                    <span v-if="bp" class="pw-pill pw-bp-switch" role="group">
                      <button
                        v-for="b in ['default', 'lg', 'xl']"
                        :key="'sw-' + b"
                        type="button"
                        class="pw-tool"
                        :title="bpLabel(b)"
                        :aria-label="bpLabel(b)"
                        :aria-pressed="bp === b ? 'true' : 'false'"
                        @click="$emit('update:bp', b)"
                      ><k-icon :type="bpIcon(b)" /></button>
                    </span>
                  </template>

                  <!-- Multi-value with suffixes (small/large or quad) -->
                  <template v-else-if="Array.isArray(def.value) && def.suffixes">
                    <span
                      v-for="(suffix, idx) in def.suffixes"
                      :key="suffix"
                      class="pw-element-field"
                    >
                      <span class="pw-element-input-wrap">
                        <input
                          v-pw-autosize
                          type="text"
                          inputmode="decimal"
                          class="pw-element-input pw-element-input-number"
                          :class="{ 'pw-px-calculator-input': showCalculator(def.unit), 'is-default': !overrideAt(varName, idx) }"
                          :value="stripUnit(overrideAt(varName, idx) || def.value[idx], def.unit)"
                          @change="setMulti(varName, idx, $event.target.value, def.value, def.unit)"
                        />
                        <span class="pw-element-unit">{{ def.unit }}</span>
                      </span>
                      <span v-if="showCalculator(def.unit)" class="pw-px-calculator">{{ toPx(overrideAt(varName, idx) || def.value[idx], def.unit) }}</span>
                    </span>
                  </template>

                  <!-- Plain array (no suffixes) -->
                  <template v-else-if="Array.isArray(def.value)">
                    <span
                      v-for="(_, idx) in def.value"
                      :key="idx"
                      class="pw-element-field"
                    >
                      <span class="pw-element-input-wrap">
                        <input
                          v-pw-autosize
                          type="text"
                          inputmode="decimal"
                          class="pw-element-input pw-element-input-number"
                          :class="{ 'pw-px-calculator-input': showCalculator(def.unit) }"
                          :value="stripUnit(overrideAt(varName, idx) || def.value[idx], def.unit)"
                          @change="setMulti(varName, idx, $event.target.value, def.value, def.unit)"
                        />
                        <span class="pw-element-unit">{{ def.unit }}</span>
                      </span>
                      <span v-if="showCalculator(def.unit)" class="pw-px-calculator">{{ toPx(overrideAt(varName, idx) || def.value[idx], def.unit) }}</span>
                    </span>
                  </template>

                  <!-- Single value -->
                  <template v-else>
                    <span class="pw-element-field">
                      <span class="pw-element-input-wrap">
                        <input
                          v-pw-autosize
                          type="text"
                          inputmode="decimal"
                          class="pw-element-input pw-element-input-number"
                          :class="{ 'pw-px-calculator-input': showCalculator(def.unit), 'is-default': !getOverride(varName) }"
                          :value="stripUnit(getOverride(varName) || def.value, def.unit)"
                          @change="setSingleUnit(varName, $event.target.value, def.value, def.unit)"
                        />
                        <span v-if="def.unit" class="pw-element-unit">{{ def.unit }}</span>
                      </span>
                      <span v-if="showCalculator(def.unit)" class="pw-px-calculator">{{ toPx(getOverride(varName) || def.value, def.unit, varName) }}</span>
                    </span>
                  </template>

                </div>
              </span>
              <k-button v-if="hasVarOverride(varName)" class="pw-field-reset" :text="$t('prw.label.reset')" icon="undo" size="xs" variant="filled" @click="resetVar(varName)" />
            </div>
          </div>
          </template>

        </div>
      </transition>
    </section>
  </div>
</template>

<script>
import autosize from '../../directives/autosize.js';

export default {
  directives: { 'pw-autosize': autosize },
  props: {
    defaults: { type: Object, default: () => ({}) },
    overrides: { type: Object, default: () => ({}) },
    groupLabels: { type: Object, default: null },
    hideSectionHeaders: { type: Boolean, default: false },
    showOnly: { type: Array, default: null },
    // one theme (e.g. "variant"): the colour rows show only its value
    theme: { type: String, default: null },
    // one breakpoint (default / lg / xl): responsive rows show only its
    // value plus the device switch (.sync)
    bp: { type: String, default: null },
  },
  data() {
    return { open: {} };
  },
  computed: {
    groups() {
      const out = {};
      for (const [k, v] of Object.entries(this.defaults || {})) {
        if (!v || typeof v !== 'object') continue;
        const hasVars = !!v.vars;
        const hasColors = !!v.colors;
        if (!hasVars && !hasColors) continue;

        let filteredVars = v.vars || {};
        let filteredColors = v.colors || {};

        if (Array.isArray(this.showOnly)) {
          filteredVars = {};
          for (const [vn, def] of Object.entries(v.vars || {})) {
            if (this.showOnly.includes(vn)) filteredVars[vn] = def;
          }
          filteredColors = {};
          for (const [vn, def] of Object.entries(v.colors || {})) {
            if (this.showOnly.includes(vn)) filteredColors[vn] = def;
          }
        }

        if (Object.keys(filteredVars).length === 0 && Object.keys(filteredColors).length === 0) continue;
        out[k] = { ...v, vars: filteredVars, colors: filteredColors };
      }
      return out;
    },
  },
  methods: {
    // four corner values (top-left, top-right, bottom-left, bottom-right):
    // shown as a 2×2 grid in the cell, like the corners themselves
    isCorners(def) {
      // four values named by corner, either as CSS suffixes or as labels
      const names = (def && (def.suffixes || def.labels)) || [];
      return Array.isArray(names) && names.length === 4 && names.some(n => String(n).includes('top-left'));
    },
    bpIcon(bp) {
      return { default: 'mobile', lg: 'tablet', xl: 'display' }[bp];
    },
    bpLabel(bp) {
      return { default: this.$t('prw.label.mobile'), lg: this.$t('prw.label.tablet'), xl: this.$t('prw.label.desktop') }[bp];
    },
    visibleThemes(themes) {
      if (!this.theme) return themes;
      return this.theme in themes ? { [this.theme]: themes[this.theme] } : {};
    },
    toggle(key) {
      this.$set(this.open, key, !this.isOpen(key));
    },
    isOpen(key) {
      return this.open[key] !== false;
    },
    groupLabel(key) {
      if (this.groupLabels && this.groupLabels[key]) return this.groupLabels[key];
      const t = this.$t('prw.valuegroup.' + key);
      if (t && t !== 'prw.valuegroup.' + key) return t;
      return key.charAt(0).toUpperCase() + key.slice(1);
    },
    varLabel(varName) {
      // A value may bring its own label key (block-specific wording, e.g.
      // logocloud's gap) — the shared prw.prop.* keys are global.
      for (const group of Object.values(this.defaults || {})) {
        const def = group && ((group.vars && group.vars[varName]) || (group.colors && group.colors[varName]));
        if (def && def.label) {
          const own = this.$t(def.label);
          if (own && own !== def.label) return own;
        }
      }
      const t = this.$t('prw.prop.' + varName);
      if (t && t !== 'prw.prop.' + varName) return t;
      return varName.replace(/^item-/, '').replace(/-/g, ' ');
    },
    stripUnit(val, unit) {
      if (val === undefined || val === null || val === '') return '';
      const v = String(val);
      if (unit) return v.replace(new RegExp(unit + '$'), '');
      return v.replace(/(rem|em|px|%|s)$/, '');
    },
    parseNum(val) {
      const n = parseFloat(String(val).replace(',', '.'));
      return isNaN(n) ? null : n;
    },
    // px of a value; a line height without unit is a factor of the row's
    // font size (e.g. item-title-line-height × item-title-size)
    toPx(val, unit, varName, bp) {
      if (!val) return '';
      const n = this.parseNum(val);
      if (n === null) return '';
      if (!unit && varName && varName.endsWith('-line-height')) {
        const size = this.fontSizePx(varName.replace(/line-height$/, ''), bp);
        return size ? Math.round(n * size) + 'px' : '';
      }
      const u = unit || (String(val).match(/(rem|em|px|%)$/) || [, ''])[1];
      if (u === 'rem' || u === 'em') return Math.round(n * 16) + 'px';
      if (u === 'px') return Math.round(n) + 'px';
      return '';
    },
    // font size in px next to a line height ("item-title-" → item-title-size
    // or item-title-font-size), at the same breakpoint
    fontSizePx(prefix, bp) {
      for (const group of Object.values(this.defaults || {})) {
        const vars = (group && group.vars) || {};
        for (const name of [prefix + 'size', prefix + 'font-size']) {
          const def = vars[name];
          if (!def) continue;
          const val = this.isResponsive(def)
            ? (this.responsiveAt(name, bp || 'default') || def[bp || 'default'])
            : (this.getOverride(name) || def.value);
          const px = this.toPx(val, def.unit, name, bp);
          return px ? parseFloat(px) : null;
        }
      }
      return null;
    },
    showCalculator(unit) {
      return unit !== 'px';
    },
    getOverride(varName) {
      return this.overrides[varName];
    },
    overrideAt(varName, idx) {
      const v = this.overrides[varName];
      return Array.isArray(v) ? v[idx] : undefined;
    },
    getThemeOverride(theme, varName) {
      const t = this.overrides[theme];
      return (t && typeof t === 'object') ? t[varName] : undefined;
    },
    setThemeColor(theme, varName, value, defaultVal) {
      const next = JSON.parse(JSON.stringify(this.overrides || {}));
      if (!next[theme] || typeof next[theme] !== 'object') next[theme] = {};
      if (value === '' || value === defaultVal) {
        delete next[theme][varName];
        if (Object.keys(next[theme]).length === 0) delete next[theme];
      } else {
        next[theme][varName] = value;
      }
      this.$emit('update:overrides', next);
    },
    setSingle(varName, value, defaultVal) {
      const next = JSON.parse(JSON.stringify(this.overrides || {}));
      if (value === '' || value === defaultVal) delete next[varName];
      else next[varName] = value;
      this.$emit('update:overrides', next);
    },
    setSingleUnit(varName, value, defaultVal, unit) {
      const next = JSON.parse(JSON.stringify(this.overrides || {}));
      if (value === '') {
        delete next[varName];
      } else {
        const num = this.parseNum(value);
        if (num === null) return;
        const composed = num + (unit || '');
        if (composed === defaultVal) delete next[varName];
        else next[varName] = composed;
      }
      this.$emit('update:overrides', next);
    },
    hasVarOverride(varName) {
      return this.overrides[varName] !== undefined;
    },
    hasColorOverride(varName) {
      for (const theme of ['default', 'variant', 'variant2', 'variant3']) {
        const t = this.overrides[theme];
        if (t && typeof t === 'object' && t[varName] !== undefined) return true;
      }
      return false;
    },
    resetVar(varName) {
      const next = JSON.parse(JSON.stringify(this.overrides || {}));
      delete next[varName];
      this.$emit('update:overrides', next);
    },
    resetColor(varName) {
      const next = JSON.parse(JSON.stringify(this.overrides || {}));
      for (const theme of ['default', 'variant', 'variant2', 'variant3']) {
        if (next[theme] && typeof next[theme] === 'object') {
          delete next[theme][varName];
          if (Object.keys(next[theme]).length === 0) delete next[theme];
        }
      }
      this.$emit('update:overrides', next);
    },
    isResponsive(def) {
      return !!def && typeof def === 'object' && def.value === undefined
        && def.default !== undefined && def.lg !== undefined;
    },
    responsiveAt(varName, bp) {
      const v = this.overrides[varName];
      return (v && typeof v === 'object' && !Array.isArray(v)) ? v[bp] : undefined;
    },
    setResponsive(varName, bp, value, def) {
      const next = JSON.parse(JSON.stringify(this.overrides || {}));
      const current = (next[varName] && typeof next[varName] === 'object' && !Array.isArray(next[varName])) ? next[varName] : {};
      if (value === '') {
        delete current[bp];
      } else {
        const num = this.parseNum(value);
        if (num === null) return;
        const composed = num + (def.unit || '');
        if (composed === def[bp]) delete current[bp];
        else current[bp] = composed;
      }
      if (Object.keys(current).length === 0) delete next[varName];
      else next[varName] = current;
      this.$emit('update:overrides', next);
    },
    setMulti(varName, idx, value, defaultArr, unit) {
      const next = JSON.parse(JSON.stringify(this.overrides || {}));
      const current = Array.isArray(next[varName]) ? [...next[varName]] : [...defaultArr];
      if (value === '') {
        current[idx] = defaultArr[idx];
      } else {
        const num = this.parseNum(value);
        if (num === null) return;
        current[idx] = num + (unit || '');
      }
      const allDefault = current.every((v, i) => v === defaultArr[i]);
      if (allDefault) delete next[varName];
      else next[varName] = current;
      this.$emit('update:overrides', next);
    },
  },
};
</script>
