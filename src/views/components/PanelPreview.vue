<template>
  <!-- a block's preview on a page in the panel (the block plugins' own
       preview uses it): the project's saved values from the shared store,
       the device by the width it has – with switches (a plugin's preview
       in the wizard, e.g. the Form Wizard's): the variant and the device
       chosen above it, as in the wizard's other previews -->
  <div class="pw-panel-preview" @click.capture="guardLinks">
    <div v-if="switches && data" class="pw-preview-switches">
      <pw-theme-select :value="shownTheme" :themes="themeList" :colors="variantColors" class="pw-preview-theme" @input="pickTheme" />
      <!-- a form: its errors shown, as after sending with gaps -->
      <div v-if="type === 'pwform'" class="pw-pill pw-guides-switch" role="group">
        <button
          type="button"
          class="pw-tool"
          :title="$t('prw.preview.errors')"
          :aria-label="$t('prw.preview.errors')"
          :aria-pressed="errors ? 'true' : 'false'"
          :data-theme="errors ? 'pink' : null"
          @click="errors = !errors"
        >
          <k-icon type="alert" />
        </button>
      </div>
      <pw-device-select :value="bp" @input="pickDevice" />
    </div>
    <div class="pw-panel-preview-device" :data-device="deviceMark">
      <component
        :is="sub ? 'pw-panel-sub' : 'pw-panel-render'"
        v-if="data && block"
        :block-type="type"
        :content="shownContent"
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
        v-bind="sub ? { item: sub, standalone: true } : {}"
      />
      <!-- (until the values are there: room kept, nothing jumps much) -->
      <div v-else class="pw-panel-preview-wait"></div>
    </div>
  </div>
</template>

<script>
import { previewState, ensurePreviewData, shownDevice, setPreviewTheme, setDesignBp } from '../../preview/store.js';
import { readPreviewBp, savePreviewBp } from '../../helpers/preview-bp.js';
import { themes, bodyDefaultFont, bodyBackground } from '../../preview/derive.js';

export default {
  props: {
    // the block type (pwtext, pwhero …)
    type: { type: String, required: true },
    // the block's content
    content: { type: Object, default: null },
    // a multicolumn sub-block alone ({ type, content }): only it, on the
    // block's background (the drawer)
    sub: { type: Object, default: null },
    // the variant and device switches above it (the theme of the content
    // then only the start)
    switches: { type: Boolean, default: false },
  },
  data() {
    return {
      theme: null,
      errors: false,
      device: this.switches ? readPreviewBp() : null,
    };
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
    // the variants' backgrounds (the dots of the switch)
    variantColors() {
      const g = this.data.global;
      return Object.fromEntries(this.themeList.map((t) => [t, ((g.overrides.global || {})[t] || {})['block-background'] || g.defaults.colors?.colors?.['block-background']?.[t] || '#ffffff']));
    },
    shownTheme() {
      const own = this.content && this.content.theme;
      // (switches: the variant chosen here or in the design beside it)
      const theme = (this.switches && this.state.theme) || this.theme || own || 'default';
      return this.themeList.includes(theme) ? theme : 'default';
    },
    shownContent() {
      if (!this.switches) return this.content || {};
      return { ...(this.content || {}), theme: this.shownTheme === 'default' ? '' : this.shownTheme, _errors: this.errors, _interactive: true };
    },
    deviceMark() {
      if (this.sub) return null;
      if (this.switches) return this.bp;
      return this.state.device && this.bp === this.state.device ? this.state.device : null;
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
      // (switches: the one chosen there; chosen above the blocks: that
      // device; else the window's)
      if (this.switches && (this.state.designBp || this.device)) return this.state.designBp || this.device;
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
  // soft hyphens as in the frontend: "[-]" in the texts becomes a place to
  // break a long word – after each change of the preview too
  mounted() {
    this.softHyphens();
    if (typeof MutationObserver === 'undefined') return;
    this._shyObserver = new MutationObserver(() => this.softHyphens());
    this._shyObserver.observe(this.$el, { childList: true, subtree: true, characterData: true });
  },
  beforeDestroy() {
    if (this._shyObserver) this._shyObserver.disconnect();
  },
  methods: {
    pickTheme(theme) {
      this.theme = theme;
      setPreviewTheme(theme);
    },
    pickDevice(device) {
      this.device = device;
      setDesignBp(device);
      savePreviewBp(device);
    },
    softHyphens() {
      if (!this.$el || !this.$el.textContent || !this.$el.textContent.includes('[-]')) return;
      const walker = document.createTreeWalker(this.$el, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.nodeValue.includes('[-]')) node.nodeValue = node.nodeValue.split('[-]').join('\u00AD');
      }
    },
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
.pw-panel-preview-device[data-device="default"] {
  max-width: 390px;
  margin-inline: auto;
}
.pw-panel-preview-device[data-device="sm"] {
  max-width: 640px;
  margin-inline: auto;
}
.pw-panel-preview-device[data-device="md"] {
  max-width: 768px;
  margin-inline: auto;
}
.pw-panel-preview-device[data-device="lg"] {
  max-width: 1024px;
  margin-inline: auto;
}
.pw-panel-preview-wait {
  min-height: 6rem;
}
</style>
