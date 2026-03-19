<template>
  <div class="pw-color-field">
    <k-color-field
      :value="displayValue"
      :alpha="false"
      format="hex"
      mode="picker"
      @input="onInput"
    />
  </div>
</template>

<script>
export default {
  props: {
    group: String,
    varName: String,
    defaultValue: String,
    overrideValue: String,
  },
  computed: {
    displayValue() {
      const val = this.overrideValue || this.defaultValue;
      // color input only accepts 7-char hex
      if (/^#[0-9a-fA-F]{6}$/.test(val)) return val;
      if (/^#[0-9a-fA-F]{3}$/.test(val)) {
        return '#' + val[1]+val[1] + val[2]+val[2] + val[3]+val[3];
      }
      return '#000000';
    },
  },
  methods: {
    onInput(value) {
      this.$emit('update:value', value === this.defaultValue ? '' : (value || ''));
    },
  },
};
</script>

<style>
.pw-color-field {
  max-width: 180px;
}

.pw-color-field .k-input[data-type="color"] {
  background: light-dark(#f9f9f9, #1a1a1a);
}
</style>
