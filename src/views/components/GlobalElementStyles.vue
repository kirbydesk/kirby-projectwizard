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
                    :options="def.options.map(o => ({ value: o, text: o }))"
                    :grow="false"
                    :required="true"
                    @input="setValue(varName, $event, def.value)"
                  />
                  <!-- Number input with unit -->
                  <template v-else-if="def.unit !== undefined">
                    <span class="pw-element-field">
                      <span class="pw-element-input-wrap">
                        <input
                          type="number"
                          step="any"
                          class="pw-element-input pw-element-input-number pw-px-calculator-input"
                          :placeholder="stripUnit(def.value)"
                          :value="stripUnit(getOverrideValue(varName))"
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
        if (val && typeof val === 'object' && val.vars) {
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

.pw-element-input {
  width: 150px;
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



.pw-element-help {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  white-space: nowrap;
  align-self: center;
}
</style>
