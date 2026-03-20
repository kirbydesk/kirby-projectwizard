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
          <div
            v-for="(def, varName) in group.vars"
            v-if="def.type !== 'dual-pair'"
            :key="varName"
            class="pw-field-row"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label">{{ propLabel(varName) }}</label>
                </div>
                <div class="pw-field-row-options">
                  <!-- Toggles for options -->
                  <k-toggles-input
                    v-if="def.options"
                    :value="getOverrideValue(varName) || def.value"
                    :options="def.options.map(o => ({ value: String(o), text: String(o) }))"
                    :grow="false"
                    :required="true"
                    @input="setValue(varName, $event, def.value)"
                  />
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
          <!-- Dual-pair rows -->
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
                      <label class="pw-field-row-label">{{ row.label }}</label>
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
  },
  data() {
    return {
      openSections: {},
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
    propLabel(varName) {
      const tKey = 'prw.nav.' + varName;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      // Strip group prefix and format
      const parts = varName.replace(/^(global|desktop|tablet|mobile|footer)-/, '').replace(/^(padding|margin|radius)-/, '').split('-');
      return parts.join(' ').replace(/\b\w/g, c => c.toUpperCase());
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
</style>
