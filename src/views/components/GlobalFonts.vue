<template>
  <div>
    <section v-for="(group, groupKey) in groups" :key="groupKey" class="pw-font-section">
      <div class="pw-section-header">
        <button class="pw-section-toggle" @click="toggle(groupKey)">
          <span>{{ groupLabel(groupKey) }}</span>
          <k-icon :type="isOpen(groupKey) ? 'angle-down' : 'angle-right'" />
        </button>
        <div v-if="isOpen(groupKey)" class="pw-font-bp-labels">
          <span class="pw-font-bp-label">Default</span>
          <span class="pw-font-bp-label">≥ 1024px (LG)</span>
          <span class="pw-font-bp-label">≥ 1280px (XL)</span>
        </div>
      </div>
      <transition name="pw-slide">
        <div v-show="isOpen(groupKey)" class="pw-font-list">
          <div
            v-for="(value, varName) in group.vars"
            :key="varName"
            class="pw-field-row"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label">{{ sizeLabel(varName) }}</label>
                </div>
                <div class="pw-field-row-options pw-font-options">
                  <span v-for="bp in ['default', 'lg', 'xl']" :key="bp" class="pw-font-field">
                    <span class="pw-font-input-wrap">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        class="pw-font-input pw-px-calculator-input"
                        :placeholder="stripRem(value[bp])"
                        :value="stripRem(getOverrideValue(bp, varName))"
                        @input="setRemValue(bp, varName, $event.target.value, value[bp] || '')"
                      />
                      <span class="pw-font-unit">rem</span>
                    </span>
                    <span class="pw-px-calculator">{{ remToPx(getOverrideValue(bp, varName) || value[bp]) }}</span>
                  </span>
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
      for (const [key, val] of Object.entries(this.fontDefaults)) {
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
      const tKey = 'prw.fontgroup.' + key;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      return key.charAt(0).toUpperCase() + key.slice(1);
    },
    sizeLabel(varName) {
      // "heading-size-2xl" → "XX-Large (2XL)"
      const match = varName.match(/-size-(.+)$/);
      if (!match) return varName;
      const size = match[1];
      const tKey = 'pw.option.' + size;
      const t = this.$t(tKey);
      const label = (t && t !== tKey) ? t : size.toUpperCase();
      return label + ' (' + size.toUpperCase() + ')';
    },
    stripRem(val) {
      if (!val) return '';
      return val.replace(/rem$/, '');
    },
    setRemValue(bp, varName, value, defaultVal) {
      const remVal = value === '' ? '' : value + 'rem';
      this.setValue(bp, varName, remVal, defaultVal);
    },
    remToPx(val) {
      if (!val) return '';
      const match = val.match(/^([\d.]+)rem$/);
      if (!match) return '';
      return Math.round(parseFloat(match[1]) * 16) + 'px';
    },
    getOverrideValue(bp, varName) {
      return ((this.fontOverrides.global || {})[bp] || {})[varName] || '';
    },
    setValue(bp, varName, value, defaultVal) {
      const overrides = JSON.parse(JSON.stringify(this.fontOverrides));

      if (value === '' || value === defaultVal) {
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
        overrides.global[bp][varName] = value;
      }

      this.$emit('update:overrides', overrides);
    },
  },
};
</script>

<style>
.pw-font-section {
  margin-bottom: 0;
}

.pw-font-section .pw-section-toggle {
  min-width: 200px;
}

.pw-font-options {
  width: fit-content;
}

.pw-font-bp-labels {
  display: flex;
  gap: var(--spacing-4);
}

.pw-font-bp-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-dimmed);
  width: 145px;
  padding-left: 5px;
}

.pw-font-list {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--spacing-10);
}

.pw-font-options {
  gap: var(--spacing-4);
}

.pw-font-input {
  width: 100px;
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  padding: var(--spacing-1) 2.5rem var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  background: light-dark(#f9f9f9, #1a1a1a);
}

.pw-font-input::-webkit-inner-spin-button,
.pw-font-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.pw-font-input {
  -moz-appearance: textfield;
}

.pw-font-input:focus {
  outline: none;
  border-color: var(--color-focus);
}

.pw-font-input::placeholder {
  color: var(--color-text-dimmed);
}

.pw-font-field {
  display: flex;
  align-items: center;
  gap: 0;
}

.pw-font-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.pw-font-unit {
  position: absolute;
  right: var(--spacing-2);
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  pointer-events: none;
}

</style>
