<template>
  <k-panel-inside class="pw-wizard">
    <k-header>
      {{ blockType ? blockLabel(blockType) : 'Project Wizard' }}
      <template v-if="isDirty" #buttons>
        <div class="k-form-controls">
          <div data-layout="collapsed" class="k-button-group">
            <k-button
              text="Discard"
              icon="undo"
              theme="notice"
              variant="filled"
              size="sm"
              responsive="true"
              class="k-form-controls-button"
              @click="discardChanges"
            />
            <k-button
              text="Save"
              icon="check"
              theme="notice"
              variant="filled"
              size="sm"
              class="k-form-controls-button"
              @click="saveCurrentView"
            />
          </div>
        </div>
      </template>
    </k-header>

    <!-- Kirby-native tab navigation (global view) -->
    <nav v-if="!loading && activeTab === 'global'" class="k-tabs k-model-tabs">
      <button
        v-for="tab in [
          { key: 'blocks', icon: 'dashboard' },
          { key: 'colors', icon: 'palette' },
          { key: 'elements', icon: 'layers' },
          { key: 'fontsizes', icon: 'title' },
          { key: 'header', icon: 'header' },
          { key: 'footer', icon: 'footer' },
        ]"
        :key="tab.key"
        type="button"
        class="k-tabs-button k-button"
        :aria-current="globalActiveTab === tab.key ? 'true' : null"
        data-has-icon="true"
        data-has-text="true"
        data-variant="dimmed"
        @click="globalActiveTab = tab.key"
      >
        <span class="k-button-icon"><k-icon :type="tab.icon" /></span>
        <span class="k-button-text">{{ $t('prw.tab.' + tab.key) }}</span>
      </button>
    </nav>


    <div v-if="loading" class="pw-wizard-loading">Loading...</div>

    <div v-else class="pw-wizard-content">

        <!-- ==================== Global Settings ==================== -->
        <div v-if="activeTab === 'global'" class="pw-wizard-panel">

          <!-- Elements -->
          <div v-show="globalActiveTab === 'blocks'" class="pw-wizard-global-content">
            <pw-global-elements
              :blocks="blocks"
              @toggle="toggleBlock($event.blockType, $event.checked)"
            />
          </div>

          <!-- Colors -->
          <div v-show="globalActiveTab === 'colors'" class="pw-wizard-global-content">
            <pw-global-colors
              :color-defaults="colorDefaults"
              :color-overrides="colorOverrides"
              @update:overrides="onColorOverridesUpdate"
            />
          </div>

          <!-- Elements -->
          <div v-show="globalActiveTab === 'elements'" class="pw-wizard-global-content">
            <pw-global-elements-styles
              :element-defaults="elementDefaults"
              :element-overrides="elementOverrides"
              @update:overrides="onElementOverridesUpdate"
            />
          </div>

          <!-- Fonts -->
          <div v-show="globalActiveTab === 'fontsizes'" class="pw-wizard-global-content">
            <pw-global-fonts
              :font-defaults="fontDefaults"
              :font-overrides="fontOverrides"
              @update:overrides="onFontOverridesUpdate"
            />
          </div>

          <!-- Header -->
          <div v-show="globalActiveTab === 'header'" class="pw-wizard-global-content">
            <pw-global-navigation
              :nav-defaults="navDefaults"
              :nav-overrides="navOverrides"
              @update:overrides="onNavOverridesUpdate"
            />
          </div>

          <!-- Footer -->
          <div v-show="globalActiveTab === 'footer'" class="pw-wizard-global-content">
            <pw-global-navigation
              :nav-defaults="footerDefaults"
              :nav-overrides="footerOverrides"
              @update:overrides="onFooterOverridesUpdate"
            />
          </div>

        </div>

        <!-- ==================== Block Tabs ==================== -->
        <div
          v-for="block in blocks"
          :key="block.blockType"
          v-show="activeTab === block.blockType"
          class="pw-wizard-panel"
        >

          <!-- Settings tab -->
          <div v-show="blockViewTab === 'settings'" v-if="blockConfigs[block.blockType]">
            <pw-block-settings
              :block="block"
              :config="blockConfigs[block.blockType]"
              :overrides="blockOverrides[block.blockType] || {}"
              :writer-active="writerActive[block.blockType] !== false"
              @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
              @update:writer-active="$set(writerActive, block.blockType, $event)"
            />
          </div>


        </div>

    </div>
  </k-panel-inside>
</template>

<script>
export default {
  props: {
    blockType: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      loading: true,
      blocks: [],
      activeBlocks: [],
      activeTab: 'global',
      globalActiveTab: 'blocks',
      blockConfigs: {},
      blockOverrides: {},
      originalOverrides: {},
      originalActiveBlocks: [],
      dirtyTabs: {},
      snapshots: {},
      writerActive: {},
      blockViewTab: 'settings',
      colorDefaults: {},
      colorOverrides: {},
      originalColorOverrides: {},
      fontDefaults: {},
      fontOverrides: {},
      originalFontOverrides: {},
      elementDefaults: {},
      elementOverrides: {},
      originalElementOverrides: {},
      navDefaults: {},
      navOverrides: {},
      originalNavOverrides: {},
      footerDefaults: {},
      footerOverrides: {},
      originalFooterOverrides: {},
    };
  },
  computed: {
    isDirty() {
      if (this.activeTab === 'global') {
        return this.dirtyTabs['global'] || this.dirtyTabs[this.globalActiveTab];
      }
      return this.dirtyTabs[this.activeTab];
    },
  },
  watch: {
    blockType: {
      immediate: true,
      handler(val) {
        this.activeTab = val || 'global';
      },
    },
  },
  async created() {
    await this.load();
    this._onKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (this.isDirty) {
          this.saveCurrentView();
        }
      }
    };
    window.addEventListener('keydown', this._onKeydown);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this._onKeydown);
  },
  methods: {
    async load() {
      try {
        const res = await this.$api.get('projectwizard/blocks');
        this.blocks = res.blocks || [];
        this.activeBlocks = res.activeBlocks || [];

        this.originalActiveBlocks = [...this.activeBlocks];
        this.$set(this.snapshots, 'global', JSON.stringify(this.activeBlocks));

        for (const block of this.blocks) {
          const config = await this.$api.get('projectwizard/block/' + block.blockType);
          this.$set(this.blockConfigs, block.blockType, config);
          const overrides = (config.overrides && !Array.isArray(config.overrides)) ? config.overrides : {};
          this.$set(this.blockOverrides, block.blockType, JSON.parse(JSON.stringify(overrides)));
          this.$set(this.originalOverrides, block.blockType, JSON.parse(JSON.stringify(overrides)));
          this.$set(this.snapshots, block.blockType, JSON.stringify(overrides));
        }

        // Load colors
        const colors = await this.$api.get('projectwizard/colors');
        this.colorDefaults = colors.defaults || {};
        const colorOv = (colors.overrides && !Array.isArray(colors.overrides)) ? colors.overrides : {};
        this.colorOverrides = JSON.parse(JSON.stringify(colorOv));
        this.originalColorOverrides = JSON.parse(JSON.stringify(colorOv));
        this.$set(this.snapshots, 'colors', JSON.stringify(colorOv));

        // Load fontsizes
        const fonts = await this.$api.get('projectwizard/fontsizes');
        this.fontDefaults = fonts.defaults || {};
        const fontOv = (fonts.overrides && !Array.isArray(fonts.overrides)) ? fonts.overrides : {};
        this.fontOverrides = JSON.parse(JSON.stringify(fontOv));
        this.originalFontOverrides = JSON.parse(JSON.stringify(fontOv));
        this.$set(this.snapshots, 'fontsizes', JSON.stringify(fontOv));

        // Load elements
        const elems = await this.$api.get('projectwizard/elements');
        this.elementDefaults = elems.defaults || {};
        const elemOv = (elems.overrides && !Array.isArray(elems.overrides)) ? elems.overrides : {};
        this.elementOverrides = JSON.parse(JSON.stringify(elemOv));
        this.originalElementOverrides = JSON.parse(JSON.stringify(elemOv));
        this.$set(this.snapshots, 'elements', JSON.stringify(elemOv));

        // Load navigation
        const navData = await this.$api.get('projectwizard/navigation');
        this.navDefaults = navData.defaults || {};
        const navOv = (navData.overrides && !Array.isArray(navData.overrides)) ? navData.overrides : {};
        this.navOverrides = JSON.parse(JSON.stringify(navOv));
        this.originalNavOverrides = JSON.parse(JSON.stringify(navOv));
        this.$set(this.snapshots, 'header', JSON.stringify(navOv));

        // Load footer
        const footerData = await this.$api.get('projectwizard/footer');
        this.footerDefaults = footerData.defaults || {};
        const footerOv = (footerData.overrides && !Array.isArray(footerData.overrides)) ? footerData.overrides : {};
        this.footerOverrides = JSON.parse(JSON.stringify(footerOv));
        this.originalFooterOverrides = JSON.parse(JSON.stringify(footerOv));
        this.$set(this.snapshots, 'footer', JSON.stringify(footerOv));

        this.loading = false;
      } catch (e) {
        console.error('Failed to load', e);
      }
    },

    blockLabel(blockType) {
      const block = this.blocks.find(b => b.blockType === blockType);
      if (block) {
        const translated = this.$t(block.plugin + '.name');
        if (translated && translated !== block.plugin + '.name') return translated;
      }
      const name = blockType.replace(/^pw/, '').replace(/([A-Z])/g, ' $1').trim() || blockType;
      return name.charAt(0).toUpperCase() + name.slice(1);
    },

    // --- Global: Elements ---
    toggleBlock(blockType, checked) {
      const block = this.blocks.find(b => b.blockType === blockType);
      if (block) block.active = checked;
      if (checked) {
        if (!this.activeBlocks.includes(blockType)) this.activeBlocks.push(blockType);
      } else {
        this.activeBlocks = this.activeBlocks.filter(b => b !== blockType);
      }
      this.$set(this.dirtyTabs, 'global', JSON.stringify(this.activeBlocks) !== this.snapshots['global']);
    },

    // --- Global: Colors ---
    onColorOverridesUpdate(overrides) {
      this.colorOverrides = overrides;
      this.$set(this.dirtyTabs, 'colors', JSON.stringify(this.colorOverrides) !== this.snapshots['colors']);
    },

    // --- Global: Fonts ---
    onFontOverridesUpdate(overrides) {
      this.fontOverrides = overrides;
      this.$set(this.dirtyTabs, 'fontsizes', JSON.stringify(this.fontOverrides) !== this.snapshots['fonts']);
    },

    async saveFonts() {
      try {
        const res = await this.$api.post('projectwizard/fontsizes', this.fontOverrides);
        this.fontOverrides = JSON.parse(JSON.stringify(res.overrides || {}));
        this.originalFontOverrides = JSON.parse(JSON.stringify(res.overrides || {}));
        this.$set(this.snapshots, 'fontsizes', JSON.stringify(res.overrides || {}));
        this.$set(this.dirtyTabs, 'fontsizes', false);
        this.$panel.notification.success('Font sizes saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save font sizes');
      }
    },

    // --- Global: Footer ---
    onFooterOverridesUpdate(overrides) {
      this.footerOverrides = overrides;
      this.$set(this.dirtyTabs, 'footer', JSON.stringify(this.footerOverrides) !== this.snapshots['footer']);
    },

    async saveFooter() {
      try {
        const res = await this.$api.post('projectwizard/footer', this.footerOverrides);
        this.footerOverrides = JSON.parse(JSON.stringify(res.overrides || {}));
        this.originalFooterOverrides = JSON.parse(JSON.stringify(res.overrides || {}));
        this.$set(this.snapshots, 'footer', JSON.stringify(res.overrides || {}));
        this.$set(this.dirtyTabs, 'footer', false);
        this.$panel.notification.success('Footer saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save footer');
      }
    },

    // --- Global: Elements ---
    onElementOverridesUpdate(overrides) {
      this.elementOverrides = overrides;
      this.$set(this.dirtyTabs, 'elements', JSON.stringify(this.elementOverrides) !== this.snapshots['elements']);
    },

    async saveElements() {
      try {
        const res = await this.$api.post('projectwizard/elements', this.elementOverrides);
        this.elementOverrides = JSON.parse(JSON.stringify(res.overrides || {}));
        this.originalElementOverrides = JSON.parse(JSON.stringify(res.overrides || {}));
        this.$set(this.snapshots, 'elements', JSON.stringify(res.overrides || {}));
        this.$set(this.dirtyTabs, 'elements', false);
        this.$panel.notification.success('Element styles saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save element styles');
      }
    },

    // --- Global: Navigation ---
    onNavOverridesUpdate(overrides) {
      this.navOverrides = overrides;
      this.$set(this.dirtyTabs, 'header', JSON.stringify(this.navOverrides) !== this.snapshots['header']);
    },

    async saveNavigation() {
      try {
        const res = await this.$api.post('projectwizard/navigation', this.navOverrides);
        this.navOverrides = JSON.parse(JSON.stringify(res.overrides || {}));
        this.originalNavOverrides = JSON.parse(JSON.stringify(res.overrides || {}));
        this.$set(this.snapshots, 'header', JSON.stringify(res.overrides || {}));
        this.$set(this.dirtyTabs, 'header', false);
        this.$panel.notification.success('Navigation saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save navigation');
      }
    },

    // --- Block overrides ---
    onBlockOverridesUpdate(blockType, overrides) {
      this.$set(this.blockOverrides, blockType, overrides);
      const current = JSON.stringify(overrides);
      const snapshot = this.snapshots[blockType] || '{}';
      this.$set(this.dirtyTabs, blockType, current !== snapshot);
      const config = this.blockConfigs[blockType];
      if (config) config.hasOverrides = Object.keys(overrides || {}).length > 0;
    },

    // --- Save / Discard ---
    async saveCurrentView() {
      if (this.activeTab === 'global') {
        if (this.globalActiveTab === 'colors') {
          await this.saveColors();
        } else if (this.globalActiveTab === 'fontsizes') {
          await this.saveFonts();
        } else if (this.globalActiveTab === 'elements') {
          await this.saveElements();
        } else if (this.globalActiveTab === 'header') {
          await this.saveNavigation();
        } else if (this.globalActiveTab === 'footer') {
          await this.saveFooter();
        } else {
          await this.saveGlobal();
        }
      } else {
        await this.saveBlock(this.activeTab);
      }
    },

    discardChanges() {
      if (this.activeTab === 'global') {
        if (this.globalActiveTab === 'colors') {
          this.colorOverrides = JSON.parse(JSON.stringify(this.originalColorOverrides));
          this.$set(this.dirtyTabs, 'colors', false);
        } else if (this.globalActiveTab === 'fontsizes') {
          this.fontOverrides = JSON.parse(JSON.stringify(this.originalFontOverrides));
          this.$set(this.dirtyTabs, 'fontsizes', false);
        } else if (this.globalActiveTab === 'elements') {
          this.elementOverrides = JSON.parse(JSON.stringify(this.originalElementOverrides));
          this.$set(this.dirtyTabs, 'elements', false);
        } else if (this.globalActiveTab === 'header') {
          this.navOverrides = JSON.parse(JSON.stringify(this.originalNavOverrides));
          this.$set(this.dirtyTabs, 'header', false);
        } else if (this.globalActiveTab === 'footer') {
          this.footerOverrides = JSON.parse(JSON.stringify(this.originalFooterOverrides));
          this.$set(this.dirtyTabs, 'footer', false);
        } else {
          this.activeBlocks = [...this.originalActiveBlocks];
          for (const block of this.blocks) {
            block.active = this.activeBlocks.includes(block.blockType);
          }
          this.$set(this.dirtyTabs, 'global', false);
        }
      } else {
        const bt = this.activeTab;
        this.$set(this.blockOverrides, bt, JSON.parse(JSON.stringify(this.originalOverrides[bt] || {})));
        this.$set(this.dirtyTabs, this.activeTab, false);
      }
    },

    async saveGlobal() {
      try {
        await this.$api.post('projectwizard/blocks/active', { blocks: this.activeBlocks });
        this.originalActiveBlocks = [...this.activeBlocks];
        this.$set(this.snapshots, 'global', JSON.stringify(this.activeBlocks));
        this.$set(this.dirtyTabs, 'global', false);
        this.$panel.notification.success('Active blocks saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save');
      }
    },

    async saveColors() {
      try {
        const res = await this.$api.post('projectwizard/colors', this.colorOverrides);
        this.colorOverrides = JSON.parse(JSON.stringify(res.overrides || {}));
        this.originalColorOverrides = JSON.parse(JSON.stringify(res.overrides || {}));
        this.$set(this.snapshots, 'colors', JSON.stringify(res.overrides || {}));
        this.$set(this.dirtyTabs, 'colors', false);
        this.$panel.notification.success('Colors saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save colors');
      }
    },

    async saveBlock(blockType) {
      try {
        const res = await this.$api.post(
          'projectwizard/block/' + blockType,
          this.blockOverrides[blockType] || {}
        );
        this.$set(this.blockConfigs, blockType, res);
        this.$set(this.blockOverrides, blockType, JSON.parse(JSON.stringify(res.overrides || {})));
        this.$set(this.originalOverrides, blockType, JSON.parse(JSON.stringify(res.overrides || {})));
        const block = this.blocks.find(b => b.blockType === blockType);
        if (block) block.customized = Object.keys(res.overrides || {}).length > 0;
        this.$set(this.snapshots, blockType, JSON.stringify(res.overrides || {}));
        this.$set(this.dirtyTabs, blockType, false);
        this.$panel.notification.success(this.blockLabel(blockType) + ' saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save');
      }
    },

    async resetBlock(blockType) {
      try {
        const res = await this.$api.post('projectwizard/block/' + blockType + '/reset');
        this.$set(this.blockConfigs, blockType, res);
        this.$set(this.blockOverrides, blockType, {});
        this.$set(this.originalOverrides, blockType, {});
        this.$set(this.snapshots, blockType, '{}');
        this.$set(this.dirtyTabs, blockType, false);
        const block = this.blocks.find(b => b.blockType === blockType);
        if (block) block.customized = false;
        this.$panel.notification.success(this.blockLabel(blockType) + ' reset to defaults');
      } catch (e) {
        this.$panel.notification.error('Failed to reset');
      }
    },
  },
};
</script>

<style>
/* Global px calculator badge */
.pw-px-calculator {
  font-size: var(--text-xs);
  color: var(--color-black);
  background: var(--color-yellow-400);
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-yellow-600);
  border-left: none;
  border-radius: 0 var(--rounded) var(--rounded) 0;
  height: 27px;
  width: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Input adjacent to px calculator */
.pw-px-calculator-input {
  border-radius: var(--rounded) 0 0 var(--rounded) !important;
  border-right: none !important;
}

.pw-wizard-loading {
  padding: var(--spacing-12);
  text-align: center;
  color: var(--color-text-dimmed);
}

.pw-wizard-content {
}

.pw-wizard-panel { min-width: 0; }
.pw-wizard-hint { font-size: var(--text-sm); color: var(--color-text-dimmed); margin-bottom: var(--spacing-4); }

.pw-wizard-global-content {
  min-height: 200px;
}

.pw-wizard-block-sections { display: flex; flex-direction: column; }
</style>
