<template>
  <!-- the overlay's strength on an image (pagewizard's pwoverlay): Kirby's
       range with a square in the overlay colour of the block's variant
       before it; a new block starts with the project's value -->
  <k-field
    v-bind="$props"
    :class="['k-range-field', 'pw-overlay-field', $attrs.class]"
    :style="$attrs.style"
    :input="id"
  >
    <div class="pw-overlay-row">
      <span class="pw-overlay-swatch" :style="{ backgroundColor: overlayColor }" :title="overlayColor"></span>
      <k-input
        ref="input"
        v-bind="$props"
        :value="shownValue"
        type="range"
        class="pw-overlay-range"
        @input="$emit('input', $event)"
      />
    </div>
  </k-field>
</template>

<script>
import { previewState, ensurePreviewData } from '../../preview/store.js';
import { themes } from '../../preview/derive.js';

export default {
  extends: 'k-range-field',
  props: {
    // the block whose overlay colour it shows (pwcardlets …)
    block: { type: String, default: '' },
  },
  computed: {
    blockData() {
      const data = previewState().data;
      return data ? data.blocks[this.block] : null;
    },
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
      const b = this.blockData;
      if (!b) return '#000000';
      const own = ((b.valueOverrides || {})[this.theme] || {})['item-overlay'];
      if (own) return own;
      for (const group of Object.values(b.valueDefaults || {})) {
        if (group && group.colors && group.colors['item-overlay']) return group.colors['item-overlay'][this.theme] || '#000000';
      }
      return '#000000';
    },
    // the project's strength (Project Wizard › Cards › Design)
    projectValue() {
      const b = this.blockData;
      if (!b) return null;
      let raw = (b.valueOverrides || {})['item-overlay-strength'];
      if (raw === undefined || raw === '') {
        for (const group of Object.values(b.valueDefaults || {})) {
          if (group && group.vars && group.vars['item-overlay-strength']) raw = group.vars['item-overlay-strength'].value;
        }
      }
      const n = parseFloat(raw);
      return isNaN(n) ? null : n;
    },
    // the block's value (a new block starts with the project's); a block
    // from before without one: the project's
    shownValue() {
      return this.value !== null && this.value !== undefined && this.value !== '' ? this.value : this.projectValue;
    },
  },
  created() {
    ensurePreviewData(this.$api);
  },
};
</script>

<style>
.pw-overlay-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}
.pw-overlay-swatch {
  flex: 0 0 auto;
  width: var(--input-height, 2.25rem);
  height: var(--input-height, 2.25rem);
  border-radius: var(--rounded);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}
.pw-overlay-range {
  flex: 1;
  min-width: 0;
}
</style>
