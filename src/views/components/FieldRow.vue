<template>
  <div
    class="pw-field-row"
    :class="{ 'is-disabled': !enabled, 'is-modified': modified }"
  >
    <label class="pw-field-row-check">
      <input
        type="checkbox"
        :checked="enabled"
        @change="$emit('toggle', $event.target.checked)"
      />
    </label>
    <span class="pw-field-row-label">{{ propertyLabel(label) }}</span>
    <div v-if="enabled" class="pw-field-row-options">
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
    label: String,
    allOptions: Array,
    activeOptions: Array,
    currentDefault: String,
    pluginDefault: String,
    enabled: { type: Boolean, default: true },
    modified: { type: Boolean, default: false },
  },
  methods: {
    propertyLabel(key) {
      return this.$t('pw.property.' + key);
    },
    optionLabel(opt) {
      return this.$t('pw.option.' + opt);
    },
    handleClick(opt) {
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
  min-height: 32px;
  border-bottom: 1px solid var(--color-gray-100);
}

.pw-field-row:last-child {
  border-bottom: none;
}

.pw-field-row.is-disabled {
  display: none;
}

.pw-field-row-check {
  cursor: pointer;
  flex-shrink: 0;
}

.pw-field-row-check input {
  accent-color: var(--color-black);
}

.pw-field-row-label {
  font-size: var(--text-sm);
  font-weight: 500;
  min-width: 100px;
  margin-left: 10px;
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

/* Active — normal text, no background */
.pw-field-row-option.is-active {
  color: var(--color-text);
}

/* Unmodified state: default is underlined */
.pw-field-row-option.is-plugin-default {
  text-decoration: underline;
}

/* Modified state: active options get grey chip */
.pw-field-row.is-modified .pw-field-row-option.is-active {
  background: var(--color-gray-200);
}

/* Modified state: default gets blue chip */
.pw-field-row.is-modified .pw-field-row-option.is-default.is-active {
  background: var(--color-blue-600);
  color: var(--color-white);
}

/* Hover */
.pw-field-row-option:hover {
  opacity: 1;
}
</style>
