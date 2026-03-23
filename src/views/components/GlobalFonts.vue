<template>
  <div>
    <div class="pw-font-help" style="margin-bottom: var(--spacing-4)">
      These sizes are used when the "sizes" option is enabled in block settings. Otherwise, the font-size from the Elements tab is used as fallback.
    </div>
    <section v-for="(group, groupKey) in groups" :key="groupKey" class="pw-element-section">
      <div class="pw-section-header">
        <button class="pw-section-toggle" @click="toggle(groupKey)">
          <span>{{ groupLabel(groupKey) }}</span>
          <k-icon :type="isOpen(groupKey) ? 'angle-down' : 'angle-right'" />
        </button>
      </div>
      <transition name="pw-slide">
        <div v-show="isOpen(groupKey)" class="pw-element-list">
          <div class="pw-group-header">
            <div class="pw-field-row-label-col"></div>
            <div class="pw-group-header-labels pw-group-type-responsive">
              <span class="pw-group-column-cell"><span class="pw-group-column-label">Mobile</span></span>
              <span class="pw-group-column-cell"><span class="pw-group-column-label">Tablet</span></span>
              <span class="pw-group-column-cell"><span class="pw-group-column-label">Desktop</span></span>
            </div>
          </div>
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
                <div class="pw-field-row-options pw-group-type-responsive">
                  <span v-for="bp in ['default', 'lg', 'xl']" :key="bp" class="pw-element-field">
                    <span class="pw-element-input-wrap">
                      <input
                        type="number"
                        :step="group.step || 0.1"
                        min="0.1"
                        max="20"
                        class="pw-element-input pw-element-input-number pw-px-calculator-input"
                        :class="{ 'is-default': !getOverrideValue(bp, varName) }"
                        :value="stripRem(getOverrideValue(bp, varName) || value[bp])"
                        @input="setRemValue(bp, varName, $event.target.value, value[bp] || '')"
                      />
                      <span class="pw-element-unit">rem</span>
                    </span>
                    <span class="pw-px-calculator">{{ remToPx(getOverrideValue(bp, varName) || value[bp]) }}</span>
                  </span>
                </div>
              </span>
            </div>
          </div>
          <div class="pw-group-end"></div>
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
.pw-font-help {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  padding: 0 var(--spacing-3);
}
</style>
