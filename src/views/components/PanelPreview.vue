<template>
  <!-- a block's preview on a page in the panel (the block plugins' own
       preview uses it): the project's saved values from the shared store,
       the device by the width it has -->
  <div class="pw-panel-preview" :data-device="state.device && bp === state.device ? state.device : null" @click.capture="guardLinks">
    <pw-panel-render
      v-if="data && block"
      :block-type="type"
      :content="content || {}"
      :config="block.config"
      :overrides="block.overrides"
      :value-defaults="block.valueDefaults"
      :value-overrides="block.valueOverrides"
      :element-defaults="data.elements.defaults"
      :element-overrides="data.elements.overrides"
      :global-defaults="data.global.defaults"
      :global-overrides="data.global.overrides"
      :font-defaults="data.fontsizes.defaults"
      :font-overrides="data.fontsizes.overrides"
      :fonts="data.fonts"
      :body-default-font="bodyFont"
      :body-background="background"
      :themes="themeList"
      :bp="bp"
      :guides="false"
      :with-block-guides="false"
      :grid-lines="state.gridLines"
    />
    <!-- (until the values are there: room kept, nothing jumps much) -->
    <div v-else class="pw-panel-preview-wait"></div>
  </div>
</template>

<script>
import { previewState, ensurePreviewData, shownDevice } from '../../preview/store.js';
import { themes, bodyDefaultFont, bodyBackground } from '../../preview/derive.js';

export default {
  props: {
    // the block type (pwtext, pwhero …)
    type: { type: String, required: true },
    // the block's content
    content: { type: Object, default: null },
  },
  computed: {
    state() {
      return previewState();
    },
    data() {
      return this.state.data;
    },
    block() {
      return this.data ? this.data.blocks[this.type] : null;
    },
    themeList() {
      return themes(this.data.variants);
    },
    bodyFont() {
      return bodyDefaultFont(this.data.global.defaults, this.data.global.overrides);
    },
    background() {
      return bodyBackground(this.data.global.defaults, this.data.global.overrides);
    },
    // the device by the browser window, as the frontend and the old
    // preview do: desktop from 1280 px (its grid values), tablet from
    // 1024 px, below as a phone (no grid)
    bp() {
      // (chosen above the blocks: that device; else the window's)
      return shownDevice();
    },
  },
  watch: {
    // (dropped after a save in the wizard: loaded again)
    'state.version'() {
      ensurePreviewData(this.$api);
    },
  },
  created() {
    ensurePreviewData(this.$api);
  },
  methods: {
    // links in the text lead nowhere here (a click selects the block)
    guardLinks(event) {
      if (event.target.closest && event.target.closest('a')) event.preventDefault();
    },
  },
};
</script>

<style>
/* a size chosen above the blocks: at most its width (XS as wide as a
   phone), centred */
.pw-panel-preview[data-device="default"] {
  max-width: 390px;
  margin-inline: auto;
}
.pw-panel-preview[data-device="sm"] {
  max-width: 640px;
  margin-inline: auto;
}
.pw-panel-preview[data-device="md"] {
  max-width: 768px;
  margin-inline: auto;
}
.pw-panel-preview[data-device="lg"] {
  max-width: 1024px;
  margin-inline: auto;
}
.pw-panel-preview-wait {
  min-height: 6rem;
}
</style>
