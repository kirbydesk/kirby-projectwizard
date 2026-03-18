<template>
  <div
    class="pw-field-row"
    :class="{ 'is-disabled': !enabled, 'is-modified': modified || touched }"
  >
    <div class="k-input" data-type="text">
      <span class="k-input-element pw-field-row-inner">
        <div class="pw-field-row-label-col">
          <input
            v-if="!noCheckbox"
            :id="'pw-prop-' + uid"
            type="checkbox"
            class="pw-field-row-check"
            :checked="active"
            @change="toggleActive($event.target.checked)"
          />
          <label class="pw-field-row-label" :for="noCheckbox ? null : 'pw-prop-' + uid">{{ noCheckbox ? label : propertyLabel(label) }}</label>
        </div>
        <div v-if="active" class="pw-field-row-options">
          <button
            v-for="opt in allOptions"
            :key="opt"
            type="button"
            class="pw-field-row-option"
            :class="{
              'is-active': localActive.includes(opt),
              'is-default': !noDefault && opt === localDefault,
              'is-plugin-default': !noDefault && opt === pluginDefault && !touched && !modified,
            }"
            @click="handleClick(opt)"
          >
            {{ optionLabel(opt) }}
          </button>
        </div>
      </span>
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
    noDefault: { type: Boolean, default: false },
    noCheckbox: { type: Boolean, default: false },
  },
  data() {
    return {
      active: this.enabled,
      touched: false,
      localDefault: null,
      localActive: [...(this.activeOptions || [])],
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
      const tKey = 'prw.property.' + key;
      const translated = this.$t(tKey);
      return (translated && translated !== tKey) ? translated : key;
    },
    optionLabel(opt) {
      // Try prw.option.* first, then pw.option.* (pagewizard), then raw value
      const prwKey = 'prw.option.' + opt;
      const prwTranslated = this.$t(prwKey);
      if (prwTranslated && prwTranslated !== prwKey) return prwTranslated;
      const pwKey = 'pw.option.' + opt;
      const pwTranslated = this.$t(pwKey);
      if (pwTranslated && pwTranslated !== pwKey) return pwTranslated;
      return opt;
    },
    handleClick(opt) {
      if (this.noDefault) {
        if (!this.touched) {
          this.touched = true;
          this.localActive = [opt];
        } else {
          const isActive = this.localActive.includes(opt);
          if (isActive) {
            const updated = this.localActive.filter(o => o !== opt);
            if (updated.length === 0) {
              // All deselected → reset to defaults
              this.touched = false;
              this.localActive = [...this.allOptions];
              this.$emit('update:options', this.allOptions);
              return;
            }
            this.localActive = updated;
          } else {
            this.localActive = this.allOptions.filter(
              o => this.localActive.includes(o) || o === opt
            );
          }
        }
        this.$emit('update:options', this.localActive);
        return;
      }

      if (!this.touched) {
        this.touched = true;
        this.localActive = [opt];
        this.$emit('update:options', [opt]);
        return;
      }

      const isActive = this.localActive.includes(opt);
      const isLocalDefault = opt === this.localDefault;

      if (!isActive) {
        // Aus → Grau
        const updated = this.allOptions.filter(
          o => this.localActive.includes(o) || o === opt
        );
        this.localActive = updated;
        this.$emit('update:options', updated);
      } else if (isActive && !isLocalDefault) {
        // Grau → Blau
        this.localDefault = opt;
        this.$emit('update:default', opt);
      } else if (isActive && isLocalDefault) {
        // Blau → Aus
        const updated = this.localActive.filter(o => o !== opt);
        if (updated.length === 0) {
          // All deselected → reset to defaults
          this.touched = false;
          this.localDefault = null;
          this.localActive = [...this.allOptions];
          this.$emit('update:default', this.pluginDefault);
          this.$emit('update:options', this.allOptions);
          return;
        }
        this.localDefault = null;
        this.localActive = updated;
        this.$emit('update:options', updated);
      }
    },
  },
};
</script>

<style>
.pw-field-row {
  padding: var(--spacing-1) 0;
}

[data-object="content-field"] .pw-field-row {
  padding: 1px 0;
}

.pw-field-row-inner {
  display: grid;
  grid-template-columns: 160px 1fr;
  align-items: center;
  padding: 0 var(--spacing-3);
}

.pw-field-row.is-disabled {
  display: none;
}

.pw-field-row-label-col {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pw-field-row-check {
  accent-color: var(--color-black);
  cursor: pointer;
  flex-shrink: 0;
}

.pw-field-row-label {
  font-size: var(--text-sm);
  font-weight: 400;
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
  transition: none;
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
  background: var(--color-gray-300);
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
