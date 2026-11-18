<template>
  <!-- flat: the colour first (like the px badge of the number fields), then
       the value as text; a click on the colour opens Kirby's picker -->
  <div class="pw-color-field" :class="{ 'is-default': !overrideValue, 'is-empty': isEmpty }">
    <!-- (no colour as start value: the text's, shown as a note) -->
    <k-colorname-input
      class="pw-color-value"
      :value="isEmpty ? '' : displayValue"
      :placeholder="isEmpty ? $t('prw.color.inherit') : null"
      :alpha="true"
      format="hex"
      @input="onInput"
    />
    <button type="button" class="pw-color-swatch" :title="isEmpty ? $t('prw.color.inherit') : displayValue" @click="$refs.picker.toggle()">
      <k-color-frame :color="isEmpty ? 'transparent' : displayValue" ratio="1/1" />
    </button>
    <k-dropdown-content ref="picker" align-x="start" class="k-color-field-picker">
      <k-colorpicker-input
        :value="displayValue"
        :alpha="true"
        format="hex"
        @input="onInput"
        @click.native.stop
      />
    </k-dropdown-content>
  </div>
</template>

<script>
export default {
  props: {
    group: String,
    varName: String,
    defaultValue: String,
    overrideValue: String,
    // no value of its own: the colour that applies then (shown as its value)
    fallback: { type: String, default: '' },
  },
  computed: {
    isEmpty() {
      return !this.overrideValue && !this.defaultValue && !this.fallback;
    },
    displayValue() {
      const val = this.overrideValue || this.defaultValue || this.fallback;
      if (!val) return '#000000';
      return val;
    },
  },
  methods: {
    onInput(value) {
      this.$emit('update:value', value === (this.defaultValue || this.fallback) ? '' : (value || ''));
    },
  },
};
</script>

<style>
.pw-color-field {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 160px;
}

.pw-color-field .pw-color-value {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text);
}
.pw-color-field .pw-color-value:focus {
  outline: 0;
}

.pw-color-swatch {
  --color-frame-size: 22px;
  --color-frame-rounded: var(--rounded-sm);
  order: -1;
  display: inline-flex;
  flex-shrink: 0;
  border-radius: var(--color-frame-rounded);
  cursor: pointer;
}

/* no colour: the frame as an outline */
.pw-color-field.is-empty .pw-color-swatch .k-color-frame {
  box-shadow: inset 0 0 0 1px var(--color-border);
}

/* in the table the field fills the cell */
.pw-field-table .pw-color-field {
  flex: 1;
  width: auto;
}
.pw-field-table .pw-element-field:has(> .pw-color-field) {
  flex: 1;
}
</style>
