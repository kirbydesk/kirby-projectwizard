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
                  <input
                    v-for="bp in ['default', 'lg', 'xl']"
                    :key="bp"
                    type="text"
                    class="pw-font-input"
                    :placeholder="value[bp] || ''"
                    :value="getOverrideValue(bp, varName)"
                    @input="setValue(bp, varName, $event.target.value, value[bp] || '')"
                  />
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
  width: fit-content;
}

.pw-font-section .pw-section-header {
  justify-content: space-between;
}

.pw-font-bp-labels {
  display: flex;
  gap: var(--spacing-4);
}

.pw-font-bp-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-dimmed);
  width: 100px;
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
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  background: light-dark(#f9f9f9, #1a1a1a);
}

.pw-font-input:focus {
  outline: none;
  border-color: var(--color-focus);
}

.pw-font-input::placeholder {
  color: var(--color-text-dimmed);
}
</style>
