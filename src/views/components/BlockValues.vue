<template>
  <div>
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
          <div v-if="Object.keys(group.colors || {}).length" class="pw-group-header">
            <div class="pw-field-row-label-col"></div>
            <div class="pw-group-header-labels pw-group-type-theme-color">
              <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('pw.option.default') || 'Default' }}</span></span>
              <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('pw.option.variant') || 'Variant' }}</span></span>
              <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('pw.option.variant2') || 'Variant 2' }}</span></span>
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
                <div class="pw-field-row-options pw-group-type-theme-color">
                  <span
                    v-for="(themeValue, themeKey) in themes"
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
            </div>
          </div>

          <!-- Plain vars (single / multi-value / quad) -->
          <div
            v-for="(def, varName) in group.vars"
            :key="varName"
            class="pw-field-row"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label" v-html="varLabel(varName)"></label>
                </div>
                <div class="pw-field-row-options">

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

                  <!-- Multi-value with suffixes (small/large or quad) -->
                  <template v-else-if="Array.isArray(def.value) && def.suffixes">
                    <span
                      v-for="(suffix, idx) in def.suffixes"
                      :key="suffix"
                      class="pw-element-field"
                    >
                      <span class="pw-element-input-wrap">
                        <input
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
                          type="text"
                          inputmode="decimal"
                          class="pw-element-input pw-element-input-number"
                          :class="{ 'pw-px-calculator-input': showCalculator(def.unit), 'is-default': !getOverride(varName) }"
                          :value="stripUnit(getOverride(varName) || def.value, def.unit)"
                          @change="setSingleUnit(varName, $event.target.value, def.value, def.unit)"
                        />
                        <span v-if="def.unit" class="pw-element-unit">{{ def.unit }}</span>
                      </span>
                      <span v-if="showCalculator(def.unit)" class="pw-px-calculator">{{ toPx(getOverride(varName) || def.value, def.unit) }}</span>
                    </span>
                  </template>

                </div>
              </span>
            </div>
          </div>

        </div>
      </transition>
    </section>
  </div>
</template>

<script>
export default {
  props: {
    defaults: { type: Object, default: () => ({}) },
    overrides: { type: Object, default: () => ({}) },
    groupLabels: { type: Object, default: null },
    hideSectionHeaders: { type: Boolean, default: false },
    showOnly: { type: Array, default: null },
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
    toPx(val, unit) {
      if (!val) return '';
      const n = this.parseNum(val);
      if (n === null) return '';
      const u = unit || (String(val).match(/(rem|em|px|%)$/) || [, ''])[1];
      if (u === 'rem' || u === 'em') return Math.round(n * 16) + 'px';
      if (u === 'px') return Math.round(n) + 'px';
      return '';
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
