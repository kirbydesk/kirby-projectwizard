<template>
  <!-- Kirby's blocks field, with the device of the block previews next to
       its "Add" button (the Project Wizard's block previews) – otherwise
       as Kirby's own (kirby/panel: k-blocks-field) -->
  <k-field
    v-bind="$props"
    :class="['k-blocks-field', $attrs.class]"
    :style="$attrs.style"
    :input="false"
  >
    <template v-if="!disabled && hasFieldsets" #options>
      <div class="pw-blocks-field-options">
        <pw-device-select :value="device" @input="setDevice" />
        <k-button-group layout="collapsed">
          <k-button
            :autofocus="autofocus"
            :disabled="isFull"
            :responsive="true"
            :text="$t('add')"
            icon="add"
            variant="filled"
            size="xs"
            class="input-focus"
            @click="$refs.blocks.choose(value.length)"
          />
          <k-button
            :title="$t('options')"
            icon="dots"
            variant="filled"
            size="xs"
            @click="$refs.options.toggle()"
          />
          <k-dropdown-content ref="options" :options="options" align-x="end" />
        </k-button-group>
      </div>
    </template>

    <k-input-validator v-bind="{ min, max, required }" :value="JSON.stringify(value)">
      <k-blocks
        ref="blocks"
        v-bind="$props"
        @close="opened = $event"
        @open="opened = $event"
        @input="$emit('input', $event)"
      />
    </k-input-validator>

    <footer v-if="!disabled && !isEmpty && !isFull && hasFieldsets">
      <k-button
        :title="$t('add')"
        icon="add"
        size="xs"
        variant="filled"
        @click="$refs.blocks.choose(value.length)"
      />
    </footer>
  </k-field>
</template>

<script>
import { previewState, setPreviewDevice } from '../../preview/store.js';

export default {
  extends: 'k-blocks-field',
  data() {
    return { windowWidth: window.innerWidth };
  },
  computed: {
    // the device shown: the one chosen, else by the browser window
    device() {
      const chosen = previewState().device;
      if (chosen) return chosen;
      if (this.windowWidth >= 1280) return 'xl';
      if (this.windowWidth >= 1024) return 'lg';
      return 'default';
    },
  },
  mounted() {
    this._onResize = () => { this.windowWidth = window.innerWidth; };
    window.addEventListener('resize', this._onResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this._onResize);
  },
  methods: {
    setDevice(device) {
      setPreviewDevice(device);
    },
  },
};
</script>

<style>
.pw-blocks-field-options {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}
/* the device select as small as Kirby's buttons beside it */
.pw-blocks-field-options .pw-device-select {
  --tool-size: var(--height-xs, 1.5rem);
}
</style>
