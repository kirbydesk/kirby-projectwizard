<template>
  <!-- a block's preview on a page in the panel (the block plugins' own
       preview uses it): the project's saved values from the shared store,
       the device by the width it has -->
  <div class="pw-panel-preview" @click.capture="guardLinks">
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
    />
    <!-- (until the values are there: room kept, nothing jumps much) -->
    <div v-else class="pw-panel-preview-wait"></div>
  </div>
</template>

<script>
import { previewState, ensurePreviewData } from '../../preview/store.js';
import { themes, bodyDefaultFont, bodyBackground } from '../../preview/derive.js';

export default {
  props: {
    // the block type (pwtext, pwhero …)
    type: { type: String, required: true },
    // the block's content
    content: { type: Object, default: null },
  },
  data() {
    return { width: 0 };
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
      if (this.width >= 1280) return 'xl';
      if (this.width >= 1024) return 'lg';
      return 'default';
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
  mounted() {
    this._onResize = () => { this.width = window.innerWidth; };
    this._onResize();
    window.addEventListener('resize', this._onResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this._onResize);
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
.pw-panel-preview-wait {
  min-height: 6rem;
}
</style>
