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
          { key: 'elements', icon: 'dashboard' },
          { key: 'colors', icon: 'palette' },
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
          <div v-show="globalActiveTab === 'elements'" class="pw-wizard-global-content">
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

          <!-- Header -->
          <div v-show="globalActiveTab === 'header'" class="pw-wizard-global-content">
            <p class="pw-wizard-hint">Header and navigation configuration coming soon.</p>
          </div>

          <!-- Footer -->
          <div v-show="globalActiveTab === 'footer'" class="pw-wizard-global-content">
            <p class="pw-wizard-hint">Footer configuration coming soon.</p>
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
      globalActiveTab: 'elements',
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
