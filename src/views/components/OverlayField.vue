<template>
  <!-- the overlay's strength on an image (pagewizard's pwoverlay): Kirby's
       toggles, each step with a swatch – the overlay of the block's colour
       variant in that strength on a sample picture -->
  <k-field
    v-bind="$props"
    :class="['k-toggles-field', 'pw-overlay-field', $attrs.class]"
    :style="[$attrs.style, swatchVars]"
    :input="id"
  >
    <k-input
      v-if="options && options.length"
      ref="input"
      v-bind="$props"
      :class="{ grow }"
      type="toggles"
      @input="$emit('input', $event)"
    />
  </k-field>
</template>

<script>
import { previewState, ensurePreviewData } from '../../preview/store.js';
import { themes } from '../../preview/derive.js';

export default {
  extends: 'k-toggles-field',
  props: {
    // the block whose overlay colour it shows (pwcardlets …)
    block: { type: String, default: '' },
  },
  computed: {
    // the form's values: of the fieldset around the field
    formValues() {
      let vm = this.$parent;
      while (vm && vm.$options.name !== 'k-fieldset') vm = vm.$parent;
      return (vm && vm.value) || {};
    },
    // the block's colour variant (custom colours, one no longer active: the
    // default one)
    theme() {
      const data = previewState().data;
      const list = data ? themes(data.variants) : ['default'];
      const chosen = this.formValues.theme || 'default';
      return list.includes(chosen) ? chosen : 'default';
    },
    // the overlay colour of that variant (the project's, else the plugin's)
    overlayColor() {
      const data = previewState().data;
      const b = data && data.blocks[this.block];
      if (!b) return '#000000';
      const own = ((b.valueOverrides || {})[this.theme] || {})['item-overlay'];
      if (own) return own;
      for (const group of Object.values(b.valueDefaults || {})) {
        if (group && group.colors && group.colors['item-overlay']) return group.colors['item-overlay'][this.theme] || '#000000';
      }
      return '#000000';
    },
    // the colour and each step's strength, for the swatches (CSS)
    swatchVars() {
      const vars = { '--pw-overlay': this.overlayColor };
      (this.options || []).forEach((option, i) => {
        vars['--pw-strength-' + (i + 1)] = (parseFloat(option.value) || 0) + '%';
      });
      return vars;
    },
  },
  created() {
    ensurePreviewData(this.$api);
  },
};
</script>

<style>
/* each step: a small picture with the overlay in its strength */
.pw-overlay-field .k-toggles-input label::before {
  content: "";
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  margin-inline-end: var(--spacing-2);
  border-radius: var(--rounded-sm);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  background:
    linear-gradient(color-mix(in srgb, var(--pw-overlay) var(--pw-strength), transparent), color-mix(in srgb, var(--pw-overlay) var(--pw-strength), transparent)),
    linear-gradient(160deg, #9cc3e6 0%, #e8d9a8 55%, #6f8f5f 56%, #4d6b45 100%);
}
.pw-overlay-field .k-toggles-input li:nth-child(1) label { --pw-strength: var(--pw-strength-1); }
.pw-overlay-field .k-toggles-input li:nth-child(2) label { --pw-strength: var(--pw-strength-2); }
.pw-overlay-field .k-toggles-input li:nth-child(3) label { --pw-strength: var(--pw-strength-3); }
.pw-overlay-field .k-toggles-input li:nth-child(4) label { --pw-strength: var(--pw-strength-4); }
.pw-overlay-field .k-toggles-input li:nth-child(5) label { --pw-strength: var(--pw-strength-5); }
.pw-overlay-field .k-toggles-input li:nth-child(6) label { --pw-strength: var(--pw-strength-6); }
</style>
