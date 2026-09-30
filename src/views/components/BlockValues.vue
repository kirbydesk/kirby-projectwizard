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

          <!-- Multi-theme colors (default / variant / variant2); with one variant
               chosen, hover and active next to their colour in one row -->
          <div
            v-for="row in colorRows(group)"
            :key="'color-' + row.varName"
            class="pw-field-row"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label" v-html="varLabel(row.varName)"></label>
                  <pw-lock v-if="colorRowLocked(row, group)" />
                </div>
                <div class="pw-field-row-options" :class="{ 'pw-group-type-theme-color': !theme }">
                  <span v-if="row.states.length > 1" class="pw-state-grid">
                    <span v-for="st in row.states" :key="st.varName" class="pw-state-cell" :inert="colorLocked(st.varName, theme) || null">
                      <span v-if="st.state !== 'normal'" class="pw-state-pill" :class="'pw-state-' + st.state">:{{ $t('prw.state.' + st.state) }}</span>
                      <pw-color-field-row
                        :group="'block-values-' + theme"
                        :var-name="st.varName"
                        :default-value="group.colors[st.varName][theme] || ''"
                        :override-value="getThemeOverride(theme, st.varName) || ''"
                        @update:value="setThemeColor(theme, st.varName, $event || '', group.colors[st.varName][theme] || '')"
                      />
                    </span>
                  </span>
                  <template v-else>
                    <span
                      v-for="(themeValue, themeKey) in visibleThemes(group.colors[row.varName])"
                      :key="themeKey"
                      class="pw-element-field"
                      :inert="colorLocked(row.varName, themeKey) || null"
                    >
                      <pw-color-field-row
                        :group="'block-values-' + themeKey"
                        :var-name="row.varName"
                        :default-value="themeValue"
                        :override-value="getThemeOverride(themeKey, row.varName) || ''"
                        @update:value="setThemeColor(themeKey, row.varName, $event || '', themeValue)"
                      />
                    </span>
                  </template>
                </div>
              </span>
              <k-button v-if="row.states.some(st => hasColorOverride(st.varName))" class="pw-field-reset" :text="$t('prw.label.reset')" icon="undo" size="xs" variant="filled" @click="resetColors(row.states.map(st => st.varName))" />
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
          <!-- guides on: the cursor in the row's field tints the value's area
               in the preview -->
          <div
            :key="varName"
            class="pw-field-row"
            :class="{ 'is-locked': varLocked(varName) }"
            :data-guide="guides ? guides[varName] || null : null"
            @focusin="guides && guides[varName] && $emit('hover-var', varName)"
            @focusout="guides && guides[varName] && $emit('hover-var', null)"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label" v-html="varLabel(varName)"></label>
                  <pw-lock v-if="varLocked(varName)" />
                </div>
                <div class="pw-field-row-options" :class="{ 'pw-group-type-responsive': isResponsive(def) && !bp, 'pw-corner-grid': isCorners(def) }" :inert="varLocked(varName) || null">

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
                          :step="def.step"
                          :min="def.min"
                          :max="unitAt(varName, bp, def) === '%' ? 100 : def.max"
                          class="pw-element-input pw-element-input-number"
                          :class="{ 'pw-px-calculator-input': showCalculator(unitAt(varName, bp, def)), 'is-default': !responsiveAt(varName, bp) }"
                          :value="stripUnit(responsiveAt(varName, bp) || def[bp], unitAt(varName, bp, def))"
                          @change="setResponsive(varName, bp, $event.target.value, def, unitAt(varName, bp, def))"
                        />
                        <!-- values with a choice of unit (e.g. the cards' image
                             overhang: px or %): the unit as a dropdown -->
                        <span v-if="def.units" class="pw-element-unit pw-element-unit-choice">
                          <button
                            type="button"
                            class="pw-unit-button"
                            aria-haspopup="menu"
                            :aria-label="$t('prw.label.unit')"
                            @click="unitMenu(varName).toggle()"
                          >{{ unitAt(varName, bp, def) }}<k-icon type="angle-down" /></button>
                          <k-dropdown-content :ref="'unit-' + varName" align-x="start" class="pw-unit-menu">
                            <nav class="k-navigate">
                              <button
                                v-for="u in def.units"
                                :key="'u-' + u"
                                type="button"
                                class="k-dropdown-item k-button pw-menu-item"
                                data-has-text="true"
                                :aria-current="unitAt(varName, bp, def) === u ? 'true' : undefined"
                                @click="unitMenu(varName).close(); setUnit(varName, bp, def, u)"
                              >
                                <span class="k-button-text">{{ u }}</span>
                              </button>
                            </nav>
                          </k-dropdown-content>
                        </span>
                        <span v-else class="pw-element-unit">{{ def.unit }}</span>
                      </span>
                      <span v-if="showCalculator(unitAt(varName, bp, def))" class="pw-px-calculator">{{ toPx(responsiveAt(varName, bp) || def[bp], def.unit, varName, bp) }}</span>
                    </span>
                    <span v-if="hints && hints[varName]" class="pw-field-hint" :title="hintTitle">{{ hints[varName] }}</span>
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
                          :step="def.step"
                          :min="def.min"
                          :max="def.max"
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
                          :step="def.step"
                          :min="def.min"
                          :max="def.max"
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
                          :step="def.step"
                          :min="def.min"
                          :max="def.max"
                          class="pw-element-input pw-element-input-number"
                          :class="{ 'pw-px-calculator-input': showCalculator(def.unit), 'is-default': !getOverride(varName) }"
                          :value="stripUnit(getOverride(varName) || def.value, def.unit)"
                          @change="setSingleUnit(varName, $event.target.value, def.value, def.unit)"
                        />
                        <span v-if="def.unit" class="pw-element-unit">{{ def.unit }}</span>
                      </span>
                      <span v-if="showCalculator(def.unit)" class="pw-px-calculator">{{ toPx(getOverride(varName) || def.value, def.unit, varName) }}</span>
                    </span>
                    <span v-if="hints && hints[varName]" class="pw-field-hint" :title="hintTitle">{{ hints[varName] }}</span>
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
import { withoutPatchedValues } from '../../helpers/patches.js';

import autosize from '../../directives/autosize.js';
import { SCREEN_HEIGHTS } from '../../helpers/preview-bp.js';

export default {
  directives: { 'pw-autosize': autosize },
  props: {
    defaults: { type: Object, default: () => ({}) },
    overrides: { type: Object, default: () => ({}) },
    groupLabels: { type: Object, default: null },
    // guide stripes while the preview guides are on (varName → margin | padding)
    guides: { type: Object, default: null },
    hideSectionHeaders: { type: Boolean, default: false },
    showOnly: { type: Array, default: null },
    // own labels for some rows (varName → text), e.g. in a card that names the part
    labels: { type: Object, default: () => ({}) },
    // one theme (e.g. "variant"): the colour rows show only its value
    theme: { type: String, default: null },
    // one breakpoint (default / lg / xl): responsive rows show only its
    // value plus the device switch (.sync)
    bp: { type: String, default: null },
    // a reference value per row, grey at its end (varName → text), e.g. the
    // global elements' value next to a block's own
    hints: { type: Object, default: null },
    hintTitle: { type: String, default: '' },
    // the block's values the exceptions set (Settings › Configuration):
    // shown with the value that applies, locked
    patch: { type: Object, default: null },
  },
  data() {
    return { open: {} };
  },
  computed: {
    // the own values as shown: without those the exceptions set (their
    // rows show the value that applies, as the pagewizard drops them too)
    shown() {
      return withoutPatchedValues(this.overrides, this.patch);
    },
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
          // colours in the order of showOnly (the card decides it)
          filteredColors = {};
          for (const vn of this.showOnly) {
            if ((v.colors || {})[vn]) filteredColors[vn] = v.colors[vn];
          }
        }

        if (Object.keys(filteredVars).length === 0 && Object.keys(filteredColors).length === 0) continue;
        out[k] = { ...v, vars: filteredVars, colors: filteredColors };
      }
      return out;
    },
  },
  methods: {
    // a var whose value the exceptions set (values › group › vars › name › value)
    varLocked(varName) {
      return Object.values(this.patch || {}).some(g => {
        const v = g && g.vars && g.vars[varName];
        return !!v && typeof v === 'object' && 'value' in v;
      });
    },
    // a colour of a variant the exceptions set (values › group › colors › name › variant)
    colorLocked(varName, variant) {
      if (!variant) return false;
      return Object.values(this.patch || {}).some(g => {
        const c = g && g.colors && g.colors[varName];
        return !!c && typeof c === 'object' && variant in c;
      });
    },
    // a colour row with a locked colour among those it shows
    colorRowLocked(row, group) {
      return row.states.some(st => (this.theme ? [this.theme] : Object.keys(this.visibleThemes(group.colors[st.varName]) || {}))
        .some(variant => this.colorLocked(st.varName, variant)));
    },
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
    // the colour rows: with one variant chosen, a colour's hover and active
    // join it (states side by side, as the buttons' on the elements page)
    colorRows(group) {
      const names = Object.keys(group.colors || {});
      const rows = [];
      for (const name of names) {
        const state = name.endsWith('-hover') ? 'hover' : name.endsWith('-active') ? 'active' : 'normal';
        const base = state === 'normal' ? name : name.replace(/-(hover|active)$/, '');
        if (this.theme && state !== 'normal' && names.includes(base)) continue;
        const states = [{ varName: name, state: 'normal' }];
        if (this.theme && state === 'normal') {
          for (const s of ['hover', 'active']) if (names.includes(name + '-' + s)) states.push({ varName: name + '-' + s, state: s });
        }
        rows.push({ varName: name, states });
      }
      return rows;
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
      if (this.labels[varName]) return this.labels[varName];
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
      // vh: a share of the device's screen height (as in the preview)
      if (u === 'vh') return Math.round(n * SCREEN_HEIGHTS[bp || 'default'] / 100) + 'px';
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
      return unit !== 'px' && unit !== '%';
    },
    getOverride(varName) {
      return this.shown[varName];
    },
    overrideAt(varName, idx) {
      const v = this.shown[varName];
      return Array.isArray(v) ? v[idx] : undefined;
    },
    getThemeOverride(theme, varName) {
      const t = this.shown[theme];
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
      return this.shown[varName] !== undefined;
    },
    hasColorOverride(varName) {
      for (const theme of ['default', 'variant', 'variant2', 'variant3']) {
        const t = this.shown[theme];
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
      this.resetColors([varName]);
    },
    // several colours at once (a colour with its hover and active)
    resetColors(names) {
      const next = JSON.parse(JSON.stringify(this.overrides || {}));
      for (const theme of ['default', 'variant', 'variant2', 'variant3']) {
        if (next[theme] && typeof next[theme] === 'object') {
          for (const varName of names) delete next[theme][varName];
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
      const v = this.shown[varName];
      return (v && typeof v === 'object' && !Array.isArray(v)) ? v[bp] : undefined;
    },
    // unit of a responsive value at a device: % when set so, else the field's
    unitAt(varName, bp, def) {
      const val = this.responsiveAt(varName, bp) || def[bp] || '';
      return def.units && String(val).endsWith('%') ? '%' : def.unit;
    },
    // the unit dropdown of a row (refs inside v-for come as arrays)
    unitMenu(varName) {
      const ref = this.$refs['unit-' + varName];
      return Array.isArray(ref) ? ref[0] : ref;
    },
    // switching the unit: % starts at the field's percent start, the
    // field's unit at its default
    setUnit(varName, bp, def, unit) {
      if (unit === this.unitAt(varName, bp, def)) return;
      const value = unit === '%' ? String(def.percent ?? 50) : this.stripUnit(def[bp], def.unit);
      this.setResponsive(varName, bp, value, def, unit);
    },
    setResponsive(varName, bp, value, def, unit) {
      const next = JSON.parse(JSON.stringify(this.overrides || {}));
      const current = (next[varName] && typeof next[varName] === 'object' && !Array.isArray(next[varName])) ? next[varName] : {};
      if (value === '') {
        delete current[bp];
      } else {
        const num = this.parseNum(value);
        if (num === null) return;
        const composed = num + (unit || def.unit || '');
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
