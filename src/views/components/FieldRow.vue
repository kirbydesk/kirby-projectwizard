<template>
  <div
    class="pw-field-row"
    :class="{ 'is-disabled': !enabled, 'is-modified': modified }"
  >
    <div class="k-input" data-type="text">
      <span class="k-input-element pw-field-row-inner">
        <div class="pw-field-row-label-col">
          <label class="pw-field-row-label">{{ propertyLabel(label) }}<span v-if="required" class="pw-field-required">*</span></label>
        </div>
        <div class="pw-field-row-options">
          <!-- per option: the tick allows it for the editors, the dot marks
               the preset (only on allowed options) -->
          <span
            v-for="opt in options"
            :key="opt"
            class="pw-option-choice"
            :class="{ 'is-allowed': localActive.includes(opt) }"
          >
            <label class="pw-option-allow" :title="$t('prw.label.allowed')">
              <input
                type="checkbox"
                :checked="localActive.includes(opt)"
                :disabled="localActive.includes(opt) && allowedOptions.length <= 1"
                @change="toggleOption(opt)"
              />
              <span class="pw-option-name">{{ optionLabel(opt) }}</span>
            </label>
            <input
              v-if="!noDefault"
              type="radio"
              class="pw-option-preset"
              :name="uid + '-preset'"
              :title="$t('prw.label.presetValue')"
              :aria-label="$t('prw.label.presetValue') + ': ' + optionLabel(opt)"
              :checked="opt === defaultValue"
              :disabled="!localActive.includes(opt)"
              @change="setDefault(opt)"
            />
          </span>
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
    required: { type: Boolean, default: false },
  },
  data() {
    return {
      localActive: [...(this.activeOptions || [])],
      localDefault: null,
    };
  },
  computed: {
    options() {
      return (this.allOptions || []).filter(o => o !== '|');
    },
    allowedOptions() {
      return this.options.filter(o => this.localActive.includes(o));
    },
    // preset shown in the dropdown: the chosen one, else the current/plugin default
    defaultValue() {
      const value = this.localDefault ?? this.currentDefault ?? this.pluginDefault;
      return this.allowedOptions.includes(value) ? value : this.allowedOptions[0];
    },
  },
  watch: {
    modified(val) {
      if (!val) {
        this.localDefault = null;
        this.localActive = [...(this.activeOptions || [])];
      }
    },
    activeOptions(newVal) {
      this.localActive = [...(newVal || [])];
    },
    currentDefault() {
      this.localDefault = null;
    },
  },
  methods: {
    propertyLabel(key) {
      const tKey = 'prw.property.' + key;
      const translated = this.$t(tKey);
      return (translated && translated !== tKey) ? translated : key;
    },
    optionLabel(opt) {
      const pwKey = 'pw.option.' + opt;
      const pwTranslated = this.$t(pwKey);
      if (pwTranslated && pwTranslated !== pwKey) return pwTranslated;
      // Try kirbyblock plugin sub-block keys (e.g. multicolumnheadline → kirbyblock-multicolumn.sub.headline)
      const prefixes = ['multicolumn'];
      for (const prefix of prefixes) {
        if (opt.startsWith(prefix)) {
          const subKey = 'kirbyblock-' + prefix + '.sub.' + opt.slice(prefix.length);
          const subTranslated = this.$t(subKey);
          if (subTranslated && subTranslated !== subKey) return subTranslated;
        }
      }
      return opt;
    },
    // pill clicked: allow/disallow the option (at least one stays allowed)
    toggleOption(opt) {
      const allowed = this.localActive.includes(opt);
      if (allowed && this.allowedOptions.length <= 1) return;
      const updated = allowed
        ? this.options.filter(o => this.localActive.includes(o) && o !== opt)
        : this.options.filter(o => this.localActive.includes(o) || o === opt);
      this.localActive = updated;
      this.$emit('update:options', updated);
      // the preset must stay one of the allowed options
      if (!this.noDefault && allowed && opt === this.defaultValue) {
        this.setDefault(updated[0]);
      }
    },
    setDefault(opt) {
      this.localDefault = opt;
      this.$emit('update:default', opt);
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
  grid-template-columns: 200px 1fr;
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


.pw-field-row-label {
  font-size: var(--text-sm);
  font-weight: 400;
  cursor: pointer;
}

.pw-field-row-options {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

/* an option: tick (allowed) with its name, then the dot (preset); options
   not allowed are faded and have no dot */
.pw-field-row-options:has(> .pw-option-choice) {
  column-gap: var(--spacing-4);
  row-gap: var(--spacing-1);
}
.pw-option-choice {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  --choice-height: 1rem;
}
.pw-option-allow {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--text-sm);
  cursor: pointer;
}
.pw-option-choice:not(.is-allowed) .pw-option-name {
  color: var(--color-text-dimmed);
}
.pw-option-choice:not(.is-allowed) .pw-option-preset {
  visibility: hidden;
}

.pw-field-required {
  color: var(--color-red-600, #dc2626);
  margin-left: 2px;
}

/* Hover */
</style>
