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
          <!-- the options as Kirby's toggles (same markup, so they look like
               the other toggles): greyed = not allowed, black text = allowed,
               black pill = preset; a click switches greyed ↔ allowed, a double
               click makes the preset (the pill itself stays, nothing jumps) -->
          <div class="k-toggles-input pw-option-toggles">
            <ul>
              <li v-for="opt in options" :key="opt" :data-state="optionState(opt)">
                <!-- no checkbox: the state alone decides the look (a prevented
                     checkbox click let the browser undo it, two presets showed) -->
                <label
                  role="button"
                  tabindex="0"
                  :title="$t('prw.option.state.' + optionState(opt))"
                  @click="clickOption(opt)"
                  @dblclick="makePreset(opt)"
                  @keydown.enter.space.prevent="clickOption(opt)"
                >
                  <span class="k-toggles-text">{{ optionLabel(opt) }}</span>
                </label>
              </li>
            </ul>
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
    // click: not allowed ↔ allowed; the preset stays (another option has to
    // become the preset first)
    clickOption(opt) {
      if (this.optionState(opt) === 'preset') return;
      this.toggleOption(opt);
    },
    // double click: the option becomes the preset (allowed if it wasn't); the
    // old preset stays allowed
    makePreset(opt) {
      if (this.noDefault) return;
      if (!this.localActive.includes(opt)) this.toggleOption(opt);
      this.setDefault(opt);
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

/* the preset: a black pill */
/* no text selection on a double click */
.pw-option-toggles label {
  user-select: none;
}
.pw-option-toggles li[data-state="preset"] label {
  border-radius: 999px;
  background: var(--color-black);
  color: var(--color-white);
}
/* options not allowed: greyed text only */
.pw-option-toggles li[data-state="disabled"] label {
  color: var(--color-text-dimmed);
  opacity: 0.5;
}

.pw-field-required {
  color: var(--color-red-600, #dc2626);
  margin-left: 2px;
}

/* Hover */
</style>
