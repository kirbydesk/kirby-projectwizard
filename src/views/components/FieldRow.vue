<template>
  <div
    class="pw-field-row"
    :class="{ 'is-disabled': !enabled, 'is-modified': modified || touched }"
  >
    <input
      :id="'pw-prop-' + uid"
      type="checkbox"
      class="pw-field-row-check"
      :checked="active"
      @change="toggleActive($event.target.checked)"
    />
    <label class="pw-field-row-label" :for="'pw-prop-' + uid">{{ propertyLabel(label) }}</label>
    <div v-if="active" class="pw-field-row-options">
      <button
        v-for="opt in allOptions"
        :key="opt"
        type="button"
        class="pw-field-row-option"
        :class="{
          'is-active': activeOptions.includes(opt),
          'is-default': opt === currentDefault,
          'is-plugin-default': opt === pluginDefault && !modified,
        }"
        @click="handleClick(opt)"
      >
        {{ optionLabel(opt) }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    uid: String,
    label: String,
    allOptions: Array,
    activeOptions: Array,
    currentDefault: String,
    pluginDefault: String,
    enabled: { type: Boolean, default: true },
    modified: { type: Boolean, default: false },
  },
  data() {
    return {
      active: this.enabled,
      touched: false,
    };
  },
  methods: {
    toggleActive(checked) {
      this.active = checked;
      if (!checked) {
        // Deactivated — emit empty options to remove from settings
        this.$emit('update:options', []);
      } else {
        // Reactivated — restore all options
        this.$emit('update:options', this.allOptions);
      }
    },
    propertyLabel(key) {
      return this.$t('pw.property.' + key);
    },
    optionLabel(opt) {
      return this.$t('pw.option.' + opt);
    },
    handleClick(opt) {
      this.touched = true;
      const isActive = this.activeOptions.includes(opt);
      const isDefault = opt === this.currentDefault;

      if (!isActive) {
        // Not active → activate (add to allowed)
        const updated = this.allOptions.filter(
          o => this.activeOptions.includes(o) || o === opt
        );
        this.$emit('update:options', updated);
      } else if (isActive && !isDefault) {
        // Active but not default → make default
        this.$emit('update:default', opt);
      } else if (isActive && isDefault) {
        // Active and default → deactivate (but not if it's the last one)
        const updated = this.activeOptions.filter(o => o !== opt);
        if (updated.length === 0) return;
        this.$emit('update:options', updated);
        // If we removed the default, set first remaining as default
        if (opt === this.currentDefault) {
          this.$emit('update:default', updated[0]);
        }
      }
    },
  },
};
</script>

<style>
.pw-field-row {
  display: flex;
  align-items: center;
  padding: var(--spacing-2) 0;
  padding-left: 5px;
  height: 36px;
}

.pw-field-row.is-disabled {
  display: none;
}

.pw-field-row-check {
  accent-color: var(--color-black);
  cursor: pointer;
  flex-shrink: 0;
}

.pw-field-row-label {
  font-size: var(--text-sm);
  font-weight: 500;
  min-width: 100px;
  margin-left: 10px;
  cursor: pointer;
}

.pw-field-row-options {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

/* Option: plain text by default */
.pw-field-row-option {
  padding: var(--spacing-1) var(--spacing-2);
  border: none;
  background: none;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  color: var(--color-text);
  cursor: pointer;
  border-radius: var(--rounded);
  transition: all 0.15s;
}

/* Not active — dimmed */
.pw-field-row-option:not(.is-active) {
  color: var(--color-text-dimmed);
  opacity: 0.35;
}

/* Active — dimmed text, no background */
.pw-field-row-option.is-active {
  color: var(--color-text-dimmed);
}

/* Unmodified state: default is underlined, dimmed */
.pw-field-row-option.is-plugin-default {
  text-decoration: underline;
  color: var(--color-text-dimmed);
}

/* Modified state: active options get grey pilled badge */
.pw-field-row.is-modified .pw-field-row-option.is-active {
  background: var(--color-gray-200);
  color: var(--color-text);
  border-radius: 999px;
}

/* Modified state: not active — lower opacity */
.pw-field-row.is-modified .pw-field-row-option:not(.is-active) {
  opacity: 0.25;
}

/* Modified state: default gets blue pilled badge */
.pw-field-row.is-modified .pw-field-row-option.is-default.is-active {
  background: var(--color-blue-600);
  color: var(--color-white);
  border-radius: 999px;
}

/* Hover */
.pw-field-row-option:hover {
  opacity: 1;
}
</style>
