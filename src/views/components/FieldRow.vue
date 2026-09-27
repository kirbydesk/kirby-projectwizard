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
          <!-- the options as Kirby's toggles: black = preset, white = allowed,
               greyed = not allowed; a click moves on to the next state -->
          <span class="pw-option-toggles" :style="{ '--options': options.length }">
            <button
              v-for="opt in options"
              :key="opt"
              type="button"
              :data-state="optionState(opt)"
              :title="$t('prw.option.state.' + optionState(opt))"
              @click="cycleOption(opt)"
            >{{ optionLabel(opt) }}</button>
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
    // preset (black), allowed (white) or not allowed (greyed)
    optionState(opt) {
      if (!this.localActive.includes(opt)) return 'disabled';
      return !this.noDefault && opt === this.defaultValue ? 'preset' : 'allowed';
    },
    // click: allowed → preset → not allowed → allowed; without presets just
    // allowed ↔ not allowed
    cycleOption(opt) {
      const state = this.optionState(opt);
      if (state === 'allowed' && !this.noDefault) this.setDefault(opt);
      else this.toggleOption(opt);
    },
    // allow/disallow the option (at least one stays allowed)
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

/* the options as Kirby's toggles (k-toggles-input): preset black, allowed
   white, not allowed greyed */
.pw-option-toggles {
  display: grid;
  grid-template-columns: repeat(var(--options), auto);
  gap: 1px;
  border-radius: var(--rounded);
  background: var(--color-border);
  overflow: hidden;
  line-height: 1.25;
}
.pw-option-toggles button {
  height: var(--field-input-height);
  padding: 0 var(--spacing-3);
  font-size: var(--text-sm);
  background: light-dark(var(--color-white), var(--color-gray-850));
  cursor: pointer;
}
.pw-option-toggles button[data-state="preset"] {
  background: light-dark(var(--color-black), var(--color-gray-950));
  color: var(--color-white);
}
.pw-option-toggles button[data-state="disabled"] {
  background: var(--panel-color-back);
  color: var(--color-text-dimmed);
}

.pw-field-required {
  color: var(--color-red-600, #dc2626);
  margin-left: 2px;
}

/* Hover */
</style>
