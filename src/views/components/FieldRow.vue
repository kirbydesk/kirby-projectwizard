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
          <!-- preset (left): one of the allowed options (Kirby's black menu) -->
          <div v-if="!noDefault" class="pw-tab-menu pw-default-menu">
            <button type="button" class="pw-default-button" aria-haspopup="menu" :title="$t('prw.label.presetValue')" @click="$refs.defaultMenu.toggle()">
              <span class="pw-default-value">{{ optionLabel(defaultValue) }}</span>
              <k-icon type="angle-down" class="pw-tab-menu-chevron" />
            </button>
            <k-dropdown-content ref="defaultMenu" align-x="start">
              <nav class="k-navigate">
                <button
                  v-for="opt in allowedOptions"
                  :key="opt"
                  type="button"
                  class="k-dropdown-item k-button pw-menu-item"
                  data-has-text="true"
                  :aria-current="opt === defaultValue ? 'true' : undefined"
                  @click="setDefault(opt)"
                >
                  <span class="k-button-text">{{ optionLabel(opt) }}</span>
                </button>
              </nav>
            </k-dropdown-content>
          </div>
          <!-- allowed options (right): each pill switches on/off -->
          <span class="pw-pill pw-option-pills" role="group">
            <button
              v-for="opt in options"
              :key="opt"
              type="button"
              class="pw-tool"
              :aria-pressed="localActive.includes(opt) ? 'true' : 'false'"
              @click="toggleOption(opt)"
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
      this.$refs.defaultMenu?.close();
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

/* allowed options as pills: allowed = white, not allowed = faded + struck */
.pw-pill.pw-option-pills {
  --tool-size: 24px;
}
.pw-option-pills .pw-tool {
  font-size: var(--text-xs);
  padding-inline: var(--spacing-2);
}
.pw-option-pills .pw-tool[aria-pressed="true"],
.pw-option-pills .pw-tool[aria-pressed="true"]:hover {
  background: var(--color-white);
  color: var(--color-text);
  font-weight: var(--font-normal);
}
.pw-option-pills .pw-tool[aria-pressed="false"],
.pw-option-pills .pw-tool[aria-pressed="false"]:hover {
  background: light-dark(var(--color-gray-100), var(--color-gray-850));
  color: var(--color-text-dimmed);
  text-decoration: line-through;
}
/* preset dropdown on the left of the row, the allowed options on the right */
.pw-default-menu + .pw-option-pills {
  margin-inline-start: auto;
}
.pw-default-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  height: 24px;
  padding-inline: var(--spacing-2) var(--spacing-1);
  border-radius: var(--rounded);
  font-size: var(--text-xs);
  color: var(--color-text);
  white-space: nowrap;
}
.pw-default-button:hover {
  background: light-dark(var(--color-gray-100), var(--color-gray-850));
}
.pw-default-value {
  font-weight: var(--font-semi);
}

.pw-field-required {
  color: var(--color-red-600, #dc2626);
  margin-left: 2px;
}

/* Hover */
</style>
