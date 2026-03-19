<template>
  <div>
    <section v-for="(group, groupKey) in groups" :key="groupKey" class="pw-nav-section">
      <div class="pw-section-header">
        <button class="pw-section-toggle" @click="toggle(groupKey)">
          <span>{{ groupLabel(groupKey) }}</span>
          <k-icon :type="isOpen(groupKey) ? 'angle-down' : 'angle-right'" />
        </button>
      </div>
      <transition name="pw-slide">
        <div v-show="isOpen(groupKey)" class="pw-nav-list">
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
                  <!-- Text input -->
                  <input
                    v-else
                    type="text"
                    class="pw-nav-input"
                    :placeholder="def.value"
                    :value="getOverrideValue(varName)"
                    @input="setValue(varName, $event.target.value, def.value)"
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
      const parts = varName.replace(/^(desktop|tablet|mobile|footer)-/, '').split('-');
      return parts.join(' ').replace(/\b\w/g, c => c.toUpperCase());
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
.pw-nav-section {
  margin-bottom: 0;
}

.pw-nav-list {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--spacing-10);
}

.pw-nav-input {
  width: 200px;
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  background: light-dark(#f9f9f9, #1a1a1a);
}

.pw-nav-input:focus {
  outline: none;
  border-color: var(--color-focus);
}

.pw-nav-input::placeholder {
  color: var(--color-text-dimmed);
}
</style>
