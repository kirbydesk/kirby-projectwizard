<template>
  <div class="pw-color-field">
    <span v-if="hasLabel" class="pw-quad-label">{{ $t('pw.option.' + group) || group }}</span>
    <k-color-field
      :value="displayValue"
      :alpha="true"
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
    hasLabel() {
      return this.group === 'default' || this.group === 'variant' || this.group === 'variant2';
    },
    displayValue() {
      const val = this.overrideValue || this.defaultValue;
      if (!val) return '#000000';
      return val;
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
  display: flex;
  align-items: center;
}

.pw-color-field .k-color-field {
  height: auto;
  width: 160px;
}

.pw-color-field .k-input[data-type="color"] {
  background: light-dark(#f9f9f9, #1a1a1a);
  border-radius: 0 !important;
}

.pw-color-field .k-color-field-preview {
  width: 22px;
  height: 22px;
}

.pw-color-field .k-string-input {
  padding-right: 0;
}
</style>
