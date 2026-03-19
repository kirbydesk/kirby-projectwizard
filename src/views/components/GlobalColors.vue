<template>
  <div>
    <section v-for="(group, groupKey) in groups" :key="groupKey" class="pw-color-section">
      <div class="pw-section-header">
        <button class="pw-section-toggle" @click="toggle(groupKey)">
          <span>{{ groupLabel(groupKey) }}</span>
          <k-icon :type="isOpen(groupKey) ? 'angle-down' : 'angle-right'" />
        </button>
        <div v-if="group.type !== 'single' && isOpen(groupKey)" class="pw-color-theme-labels">
          <span class="pw-color-theme-label">Default</span>
          <span class="pw-color-theme-label">Variant</span>
          <span class="pw-color-theme-label">Variant 2</span>
        </div>
      </div>
      <transition name="pw-slide">
        <div v-show="isOpen(groupKey)" class="pw-color-list">
          <div
            v-for="(value, varName, index) in group.vars"
            :key="varName"
            class="pw-field-row"
            :class="{
              'pw-color-row-grouped': isFollowedByState(group.vars, varName, index),
              'pw-color-row-state': isStateVar(varName),
            }"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label">{{ colorLabel(varName) }}</label>
                </div>
                <div class="pw-field-row-options pw-color-options">
                  <!-- Single theme (body/footer) -->
                  <pw-color-field-row
                    v-if="group.type === 'single'"
                    :group="'body'"
                    :var-name="varName"
                    :default-value="value"
                    :override-value="getOverrideValue('body', varName)"
                    @update:value="setColor('body', varName, $event, value)"
                  />
                  <span v-if="group.type === 'single'" class="pw-color-spacer"></span>
                  <span v-if="group.type === 'single'" class="pw-color-spacer"></span>
                  <!-- Multi theme -->
                  <template v-else>
                    <pw-color-field-row
                      v-for="theme in ['default', 'variant', 'variant2']"
                      :key="theme"
                      :group="theme"
                      :var-name="varName"
                      :default-value="value[theme] || ''"
                      :override-value="getOverrideValue(theme, varName)"
                      @update:value="setColor(theme, varName, $event, value[theme] || '')"
                    />
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
    colorDefaults: {
      type: Object,
      default: () => ({}),
    },
    colorOverrides: {
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
      for (const [key, val] of Object.entries(this.colorDefaults)) {
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
      const tKey = 'prw.colorgroup.' + key;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      return key.charAt(0).toUpperCase() + key.slice(1);
    },
    isStateVar(varName) {
      return varName.endsWith('-hover') || varName.endsWith('-active');
    },
    isFollowedByState(vars, varName, index) {
      const keys = Object.keys(vars);
      const next = keys[index + 1];
      return next && (next.endsWith('-hover') || next.endsWith('-active'));
    },
    getOverrideValue(group, varName) {
      return ((this.colorOverrides.global || {})[group] || {})[varName] || '';
    },
    setColor(group, varName, value, defaultVal) {
      const overrides = JSON.parse(JSON.stringify(this.colorOverrides));

      if (value === '' || value === defaultVal) {
        if (overrides.global && overrides.global[group]) {
          delete overrides.global[group][varName];
          if (Object.keys(overrides.global[group]).length === 0) {
            delete overrides.global[group];
          }
          if (overrides.global && Object.keys(overrides.global).length === 0) {
            delete overrides.global;
          }
        }
      } else {
        if (!overrides.global) overrides.global = {};
        if (!overrides.global[group]) overrides.global[group] = {};
        overrides.global[group][varName] = value;
      }

      this.$emit('update:overrides', overrides);
    },
    colorLabel(varName) {
      const tKey = 'prw.color.' + varName;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      return varName;
    },
  },
};
</script>

<style>
.pw-color-section {
  margin-bottom: 0;
}


.pw-color-section .pw-section-toggle {
  min-width: 200px;
}

.pw-color-theme-labels {
  display: flex;
  gap: 0;
}

.pw-color-theme-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-dimmed);
  width: 180px;
  text-align: left;
  padding-left: 5px;
}

.pw-color-options {
  width: fit-content;
}

.pw-color-list {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--spacing-10);
}

.pw-color-options {
  gap: 0;
}

.pw-color-options .pw-color-field {
  margin: 0;
}

.pw-color-spacer {
  width: 180px;
}

.pw-color-row-grouped {
  padding-bottom: 1px;
}

.pw-color-row-state {
  padding: 1px 0;
}

.pw-color-row-state:not(.pw-color-row-grouped) {
  padding-bottom: var(--spacing-1);
}

</style>
