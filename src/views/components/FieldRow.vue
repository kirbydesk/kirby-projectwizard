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
          <!-- start value: the option a new block starts with (Kirby's toggles) -->
          <k-toggles-input
            :value="defaultValue"
            :options="allowedOptions.map(o => ({ value: o, text: optionLabel(o) }))"
            :grow="false"
            :required="true"
            @input="setDefault"
          />
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
    required: { type: Boolean, default: false },
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
    // start value shown: the chosen one, else the current/plugin default
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

.pw-field-required {
  color: var(--color-red-600, #dc2626);
  margin-left: 2px;
}

/* Hover */
</style>
