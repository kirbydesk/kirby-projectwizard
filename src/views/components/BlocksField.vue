<template>
  <!-- the pages' blocks field (pagewizard's pwblocks): Kirby's blocks
       field with the device of the block previews next to its "Add" button
       – otherwise as Kirby's own (kirby/panel: k-blocks-field); the nested
       blocks fields stay Kirby's -->
  <k-field
    v-bind="$props"
    :class="['k-blocks-field', $attrs.class]"
    :style="$attrs.style"
    :input="false"
  >
    <template v-if="!disabled && hasFieldsets" #options>
      <div class="pw-blocks-field-options">
        <!-- the grid's twelve columns over all blocks (magenta), on/off;
             XS has no grid: no button -->
        <k-button
          v-if="device !== 'default'"
          :title="$t('prw.panel.gridlines')"
          :aria-pressed="gridLines ? 'true' : 'false'"
          :theme="gridLines ? 'pink' : null"
          icon="prw-guides"
          variant="filled"
          size="xs"
          @click="toggleGridLines"
        />
        <!-- the size: Kirby's own button (as "Add"), its menu the five
             breakpoints of the frontend -->
        <k-button
          :text="deviceCode(device)"
          :title="deviceLabel(device)"
          :dropdown="true"
          variant="filled"
          size="xs"
          @click="$refs.device.toggle()"
        />
        <!-- (its entries as Kirby's language menu: the width grey on the
             right, its classes for the same look) -->
        <k-dropdown-content ref="device" align-x="end">
          <k-dropdown-item
            v-for="option in deviceOptions"
            :key="option.value"
            :current="option.current"
            :disabled="option.disabled"
            :title="option.title"
            class="k-languages-dropdown-item"
            @click="chooseDevice(option.value)"
          >
            {{ option.text }}
            <span v-if="option.width" class="k-languages-dropdown-item-info">
              <span class="k-languages-dropdown-item-code">{{ option.width }}</span>
            </span>
          </k-dropdown-item>
        </k-dropdown-content>
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
import { previewState, setPreviewDevice, shownDevice, deviceFits, setGridLines, PANEL_SIZES } from '../../preview/store.js';

export default {
  extends: 'k-blocks-field',
  computed: {
    // the menu's entries (a list: Kirby calls an options function with a
    // callback); the one shown marked
    deviceOptions() {
      const widths = { default: '', sm: '≥ 640 px', md: '≥ 768 px', lg: '≥ 1024 px', xl: '≥ 1280 px' };
      return PANEL_SIZES.map(bp => ({
        value: bp,
        text: this.deviceCode(bp),
        width: widths[bp],
        title: this.deviceLabel(bp),
        current: this.device === bp,
        // (wider than the window: greyed out until it is wide enough)
        disabled: !deviceFits(bp),
      }));
    },
    gridLines() {
      return previewState().gridLines;
    },
    // the device shown: the one chosen, else by the browser window
    device() {
      // (read so the button follows the store)
      const state = previewState();
      return state.device || state.windowDevice ? shownDevice() : 'xl';
    },
  },
  mounted() {
    // the block edited in the drawer stays selected when the drawer closes:
    // Kirby selects it again, but the click that closed the drawer lands
    // outside the field and takes the selection away right after – that
    // one is undone (a later click elsewhere deselects as usual)
    this.$watch(() => this.$refs.blocks && this.$refs.blocks.selected, (now) => {
      if (Array.isArray(now) && now.length === 1) {
        this._lastSelected = now[0];
        return;
      }
      if (Array.isArray(now) && now.length === 0 && this._lastSelected && Date.now() < (this._restoreUntil || 0)) {
        const id = this._lastSelected;
        this.$nextTick(() => {
          if (this.$refs.blocks && this.$refs.blocks.find(id)) this.$refs.blocks.selected = [id];
        });
      }
    });
    this.$watch(() => this.$panel.drawer.isOpen, (open, was) => {
      if (was && !open) this._restoreUntil = Date.now() + 600;
    });
  },
  methods: {
    chooseDevice(bp) {
      setPreviewDevice(bp);
      this.$refs.device.close();
    },
    toggleGridLines() {
      setGridLines(!this.gridLines);
    },
    deviceLabel(bp) {
      return this.$t('prw.panel.size.' + bp);
    },
    deviceCode(bp) {
      return { default: 'XS', sm: 'SM', md: 'MD', lg: 'LG', xl: 'XL' }[bp];
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
</style>
