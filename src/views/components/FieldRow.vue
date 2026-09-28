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
          <!-- start values: the preset, one of the allowed options (Kirby's toggles) -->
          <k-toggles-input
            v-if="mode === 'preset'"
            :value="defaultValue"
            :options="allowedOptions.map(o => ({ value: o, text: optionLabel(o) }))"
            :grow="false"
            :required="true"
            @input="setDefault"
          />
          <!-- restrictions: each option with an eye (visible to the editors
               or hidden, then faded) and as in the drawer (its icon, else its
               name); a click switches -->
          <div v-else class="pw-option-eyes">
            <button
              v-for="opt in options"
              :key="opt"
              type="button"
              class="pw-option-eye"
              :data-state="optionState(opt)"
              :title="$t('prw.option.state.' + optionState(opt))"
              @click="toggleOption(opt)"
            >
              <k-icon :type="optionState(opt) === 'allowed' ? 'preview' : 'hidden'" class="pw-option-eye-icon" />
              <pw-option-icon v-if="drawerType" :type="drawerType" :value="opt" />
              <span v-else class="pw-option-eye-text">{{ optionLabel(opt) }}</span>
            </button>
          </div>
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
    // "allowed": which options editors may choose (restrictions);
    // "preset": which one a new block starts with (start values)
    mode: { type: String, default: 'allowed' },
    // the block's plugin (kirbyblock-steplist): its own option labels
    plugin: { type: String, default: '' },
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
    // a content field's property shown as in the drawer (pagewizard's
    // pw-option-icon); other rows show the option's name
    drawerType() {
      const types = { level: 'level', sizes: 'size', align: 'align', textbackground: 'textbackground', flourish: 'flourish', multiline: 'multiline', mode: 'mode' };
      return types[this.label] || null;
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
      // the block's own wording first (kirbyblock-steplist.item-style.centered …)
      if (this.plugin) {
        const ownKey = this.plugin + '.' + this.label + '.' + opt;
        const own = this.$t(ownKey);
        if (own && own !== ownKey) return own;
      }
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
    // allowed (black text) or not allowed (greyed)
    optionState(opt) {
      return this.localActive.includes(opt) ? 'allowed' : 'disabled';
    },
    // allow/disallow the option (at least one stays allowed; the start value
    // moves to the first allowed option when its own is disallowed)
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

/* restrictions: the options one below the other, each an eye with the option */
.pw-option-eyes {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-block: var(--spacing-1);
}
.pw-option-eye {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  height: 24px;
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
}
.pw-option-eye .k-button-icon,
.pw-option-eye .k-button-text {
  display: inline-flex;
  align-items: center;
}
.pw-option-eye-icon {
  --icon-size: 14px;
  color: var(--color-text-dimmed);
}
/* hidden from the editors: faded */
.pw-option-eye[data-state="disabled"] {
  opacity: 0.4;
}

.pw-field-required {
  color: var(--color-red-600, #dc2626);
  margin-left: 2px;
}

/* Hover */
</style>
