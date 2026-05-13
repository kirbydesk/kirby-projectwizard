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
          { key: 'blocks', icon: 'prw-blocks' },
          { key: 'elements', icon: 'layers' },
          { key: 'fonts', icon: 'title' },
          { key: 'header', icon: 'prw-header' },
          { key: 'footer', icon: 'prw-footer' },
          { key: 'settings', icon: 'settings' },
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

    <!-- Kirby-native tab navigation (per-block view) -->
    <nav v-if="!loading && activeTab !== 'global'" class="k-tabs k-model-tabs">
      <button
        v-for="tab in blockTabs(activeTab)"
        :key="tab.key"
        type="button"
        class="k-tabs-button k-button"
        :aria-current="blockViewTab === tab.key ? 'true' : null"
        data-has-icon="true"
        data-has-text="true"
        data-variant="dimmed"
        @click="blockViewTab = tab.key"
      >
        <span class="k-button-icon"><k-icon :type="tab.icon" /></span>
        <span class="k-button-text">{{ $t('prw.tab.' + tab.key) }}</span>
      </button>
    </nav>


    <div v-if="loading" class="pw-wizard-loading">Loading...</div>

    <div v-else class="pw-wizard-content">

        <!-- ==================== Global Settings ==================== -->
        <div v-if="activeTab === 'global'" class="pw-wizard-panel">

          <!-- Blocks -->
          <!-- Settings -->
          <div v-show="globalActiveTab === 'settings'" class="pw-wizard-global-content">
            <pw-global-elements
              :blocks="blocks"
              @toggle="toggleBlock($event.blockType, $event.checked)"
            />
          </div>

          <!-- Blocks -->
          <div v-show="globalActiveTab === 'blocks'" class="pw-wizard-global-content">
            <!-- Block Preview -->
            <div class="pw-block-preview-body" :style="blockPreviewBodyStyle">
                  <div class="pw-block-preview-row">
                    <div v-for="theme in ['default', 'variant', 'variant2']" :key="theme" class="pw-block-preview" :style="blockPreviewStyle(theme)">
                      <p :style="blockPreviewElementStyle('tagline', theme)">Tagline goes here</p>
                      <h2 :style="blockPreviewElementStyle('heading', theme)">The quick brown fox</h2>
                      <p :style="blockPreviewElementStyle('editor', theme)">Pack my box with <a :class="'pw-preview-link-' + theme" :style="blockPreviewLinkStyle(theme, '')">five dozen liquor jugs</a>. How vexingly quick daft zebras jump. The five boxing wizards jump quickly at dawn.</p>
                      <a :class="'pw-preview-btn-' + theme" :style="blockPreviewButtonStyle(theme, '')">Click here</a>
                    </div>
                  </div>
            </div>

            <!-- Layout / Colors subtabs -->
            <div class="pw-element-subtabs">
              <button type="button" class="pw-element-subtab" :class="{ 'is-active': (blocksSubtab || 'layout') === 'layout' }" @click="blocksSubtab = 'layout'">{{ $t('prw.subtab.layout') }}</button>
              <button type="button" class="pw-element-subtab" :class="{ 'is-active': blocksSubtab === 'colors' }" @click="blocksSubtab = 'colors'">{{ $t('prw.subtab.colors') }}</button>
            </div>

            <pw-global-navigation
              v-show="(blocksSubtab || 'layout') === 'layout'"
              :nav-defaults="globalDefaults"
              :nav-overrides="globalOverrides"
              :saved-overrides="originalGlobalOverrides"
              :discard-key="discardKey"
              :fonts="fontsData"
              :body-default-font="bodyDefaultFont"
              @update:overrides="onGlobalOverridesUpdate"
              :show-only="['global-margin-top', 'global-margin-bottom', 'global-padding-left', 'global-padding-right', 'global-padding-top', 'global-padding-bottom', 'global-']"
              :hide-section-headers="true"
            />

            <pw-global-navigation
              v-show="blocksSubtab === 'colors'"
              :nav-defaults="globalDefaults"
              :nav-overrides="globalOverrides"
              :saved-overrides="originalGlobalOverrides"
              :discard-key="discardKey"
              :fonts="fontsData"
              :body-default-font="bodyDefaultFont"
              @update:overrides="onGlobalOverridesUpdate"
              :show-only="['body-background']"
              :show-colors="true"
              :hide-section-headers="true"
            />
          </div>

          <!-- Fonts -->
          <div v-show="globalActiveTab === 'fonts'" class="pw-wizard-global-content">
            <!-- Font Preview -->
            <div class="pw-default-font-preview" :style="defaultFontPreviewStyle">The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.</div>

            <!-- Subtabs -->
            <div class="pw-element-subtabs">
              <button type="button" class="pw-element-subtab" :class="{ 'is-active': (fontsSubtab || 'default') === 'default' }" @click="fontsSubtab = 'default'">{{ $t('prw.subtab.default-font') }}</button>
              <button type="button" class="pw-element-subtab" :class="{ 'is-active': fontsSubtab === 'installed' }" @click="fontsSubtab = 'installed'">{{ $t('prw.subtab.installed-fonts') }}</button>
              <button type="button" class="pw-element-subtab" :class="{ 'is-active': fontsSubtab === 'add' }" @click="fontsSubtab = 'add'">{{ $t('prw.subtab.add-font') }}</button>
            </div>

            <pw-global-navigation
              v-show="(fontsSubtab || 'default') === 'default'"
              :nav-defaults="globalDefaults"
              :nav-overrides="globalOverrides"
              :fonts="fontsData"
              :body-default-font="bodyDefaultFont"
              @update:overrides="onGlobalOverridesUpdate"
              :show-only="['font-family-default']"
              :hide-section-headers="true"
            />
            <pw-global-font-manager
              v-show="fontsSubtab === 'installed'"
              :fonts="fontsData"
              :mode="'installed'"
              @update="loadFontsData"
            />
            <pw-global-font-manager
              v-show="fontsSubtab === 'add'"
              :fonts="fontsData"
              :mode="'add'"
              @update="loadFontsData"
            />
          </div>

          <!-- Elements -->
          <div v-show="globalActiveTab === 'elements'" class="pw-wizard-global-content">
            <pw-global-elements-styles
              :element-defaults="elementDefaults"
              :element-overrides="elementOverrides"
              :saved-overrides="originalElementOverrides"
              :discard-key="discardKey"
              :global-defaults="globalDefaults"
              :global-overrides="globalOverrides"
              :fonts="fontsData"
              :font-defaults="fontDefaults"
              :font-overrides="fontOverrides"
              :body-default-font="bodyDefaultFont"
              @update:overrides="onElementOverridesUpdate"
              @update:font-overrides="onFontOverridesUpdate"
            />
          </div>

          <!-- Header -->
          <div v-show="globalActiveTab === 'header'" class="pw-wizard-global-content">
            <!-- Pills: General / Desktop / Tablet / Mobile -->
            <div class="pw-element-pills">
              <button v-for="pill in ['general', 'desktop', 'tablet', 'mobile']" :key="pill" type="button" class="pw-element-pill" :class="{ 'is-active': (headerPill || 'general') === pill }" @click="headerPill = pill; headerSubtab = null">{{ $t('prw.prop.' + pill) || pill }}</button>
            </div>

            <!-- General: no preview, no subtabs -->
            <pw-global-navigation
              v-show="(headerPill || 'general') === 'general'"
              :nav-defaults="navDefaults"
              :nav-overrides="navOverrides"
              :saved-overrides="originalNavOverrides"
              :discard-key="discardKey"
              :fonts="fontsData"
              :body-default-font="bodyDefaultFont"
              @update:overrides="onNavOverridesUpdate"
              :show-group="'general'"
              :hide-section-headers="true"
            />

            <!-- Desktop / Tablet / Mobile: preview + subtabs -->
            <template v-if="headerPill && headerPill !== 'general'">
              <!-- Preview -->
              <pw-global-navigation
                :nav-defaults="navDefaults"
                :nav-overrides="navOverrides"
                :fonts="fontsData"
                :body-default-font="bodyDefaultFont"
                @update:overrides="onNavOverridesUpdate"
                :show-group="headerPill"
                :show-preview="true"
                :show-flyout="headerSubtab === 'flyout' || headerSubtab === 'flyout-colors'"
                :hide-section-headers="true"
              />

              <!-- Subtabs -->
              <div class="pw-element-subtabs">
                <button
                  v-for="st in headerSubtabs"
                  :key="st.key"
                  type="button"
                  class="pw-element-subtab"
                  :class="{ 'is-active': (headerSubtab || headerSubtabs[0].key) === st.key }"
                  @click="headerSubtab = st.key"
                >{{ st.label }}</button>
              </div>

              <!-- Fields -->
              <pw-global-navigation
                :nav-defaults="navDefaults"
                :nav-overrides="navOverrides"
                :saved-overrides="originalNavOverrides"
                :discard-key="discardKey"
                :fonts="fontsData"
                :body-default-font="bodyDefaultFont"
                @update:overrides="onNavOverridesUpdate"
                :show-group="headerPill"
                :show-only="headerNavShowOnly"
                :show-colors="true"
                :hide-section-headers="true"
                :hide-preview="true"
              />
            </template>
          </div>

          <!-- Footer -->
          <div v-show="globalActiveTab === 'footer'" class="pw-wizard-global-content">
            <pw-global-navigation
              :nav-defaults="footerDefaults"
              :nav-overrides="footerOverrides"
              :fonts="fontsData"
              :body-default-font="bodyDefaultFont"
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

          <!-- Defaults tab -->
          <div v-show="blockViewTab === 'defaults'" v-if="blockConfigs[block.blockType]">
            <pw-block-settings
              view="defaults"
              :block="block"
              :config="blockConfigs[block.blockType]"
              :overrides="blockOverrides[block.blockType] || {}"
              :writer-active="writerActive[block.blockType] !== false"
              @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
              @update:writer-active="$set(writerActive, block.blockType, $event)"
            />
          </div>

          <!-- Items tab — content + defaults sub-sections plus the Layout/Colors
               value editor (only when block has item fields). -->
          <div v-show="blockViewTab === 'items'" v-if="blockConfigs[block.blockType] && hasItemFields(block.blockType)">
            <pw-block-settings
              view="items"
              :block="block"
              :config="blockConfigs[block.blockType]"
              :overrides="blockOverrides[block.blockType] || {}"
              :writer-active="writerActive[block.blockType] !== false"
              @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
              @update:writer-active="$set(writerActive, block.blockType, $event)"
            />

            <!-- Defaults section (radius toggles, link-style, border) -->
            <section v-if="blockValueDefaults[block.blockType]" class="pw-wizard-section">
              <div class="pw-section-header">
                <button class="pw-section-toggle" @click="toggleItemSection(block.blockType, 'defaults')">
                  <span>{{ $t('prw.tab.defaults') || 'Defaults' }}</span>
                  <k-icon :type="isItemSectionOpen(block.blockType, 'defaults') ? 'angle-down' : 'angle-right'" />
                </button>
              </div>
              <transition name="pw-slide">
                <div v-show="isItemSectionOpen(block.blockType, 'defaults')" class="pw-field-block" data-collapsible="true">
                  <pw-block-settings
                    view="items-defaults"
                    :block="block"
                    :config="blockConfigs[block.blockType]"
                    :overrides="blockOverrides[block.blockType] || {}"
                    :writer-active="writerActive[block.blockType] !== false"
                    @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                    @update:writer-active="$set(writerActive, block.blockType, $event)"
                  />
                </div>
              </transition>
            </section>

            <!-- Layout section. Order is fixed:
                 padding → radius → border (toggle) → border-width (only if border on) → link-style.
                 Each row uses its own component so we can interleave field-default toggles
                 with css-variable inputs in the desired sequence. -->
            <section v-if="blockValueDefaults[block.blockType]" class="pw-wizard-section">
              <div class="pw-section-header">
                <button class="pw-section-toggle" @click="toggleItemSection(block.blockType, 'layout')">
                  <span>{{ $t('prw.subtab.layout') || 'Layout' }}</span>
                  <k-icon :type="isItemSectionOpen(block.blockType, 'layout') ? 'angle-down' : 'angle-right'" />
                </button>
              </div>
              <transition name="pw-slide">
                <div v-show="isItemSectionOpen(block.blockType, 'layout')" class="pw-field-block pw-items-layout-stack" data-collapsible="true">
                  <pw-block-values
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="['item-padding']"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                  <pw-block-values
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="['item-radius']"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                  <pw-block-settings
                    view="items-layout"
                    :block="block"
                    :config="blockConfigs[block.blockType]"
                    :overrides="blockOverrides[block.blockType] || {}"
                    :writer-active="writerActive[block.blockType] !== false"
                    :layout-keys="['item-border']"
                    @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                    @update:writer-active="$set(writerActive, block.blockType, $event)"
                  />
                  <pw-block-values
                    v-if="isItemBorderEnabled(block.blockType)"
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="['item-border-width']"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                  <pw-block-settings
                    view="items-layout"
                    :block="block"
                    :config="blockConfigs[block.blockType]"
                    :overrides="blockOverrides[block.blockType] || {}"
                    :writer-active="writerActive[block.blockType] !== false"
                    :layout-keys="['item-link-style']"
                    @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                    @update:writer-active="$set(writerActive, block.blockType, $event)"
                  />
                  <pw-block-settings
                    v-if="isItemLinkStyleButton(block.blockType)"
                    view="items-layout"
                    :block="block"
                    :config="blockConfigs[block.blockType]"
                    :overrides="blockOverrides[block.blockType] || {}"
                    :writer-active="writerActive[block.blockType] !== false"
                    :layout-keys="['item-button-style']"
                    @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                    @update:writer-active="$set(writerActive, block.blockType, $event)"
                  />
                </div>
              </transition>
            </section>

            <!-- Colors section (multi-theme) -->
            <section v-if="blockValueDefaults[block.blockType]" class="pw-wizard-section">
              <div class="pw-section-header">
                <button class="pw-section-toggle" @click="toggleItemSection(block.blockType, 'colors')">
                  <span>{{ $t('prw.subtab.colors') || 'Colors' }}</span>
                  <k-icon :type="isItemSectionOpen(block.blockType, 'colors') ? 'angle-down' : 'angle-right'" />
                </button>
              </div>
              <transition name="pw-slide">
                <div v-show="isItemSectionOpen(block.blockType, 'colors')" class="pw-field-block" data-collapsible="true">
                  <pw-block-values
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="itemColorsShowOnly(block.blockType)"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                </div>
              </transition>
            </section>
          </div>

          <!-- Layout tab — only used by non-items blocks (placeholder). -->
          <div v-show="blockViewTab === 'layout'">
            <div class="pw-wizard-empty">
              <p>{{ $t('prw.tab.layout.placeholder') || 'Layout configuration for this block will appear here.' }}</p>
            </div>
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
      blockPreviewOpen: true,
      blocksSubtab: 'layout',
      discardKey: 0,
      fontsSubtab: 'default',
      headerPill: 'general',
      headerSubtab: 'layout',
      blocks: [],
      activeBlocks: [],
      activeTab: 'global',
      globalActiveTab: 'blocks',
      blockConfigs: {},
      blockOverrides: {},
      originalOverrides: {},
      blockValueDefaults: {},
      blockValueOverrides: {},
      originalBlockValueOverrides: {},
      itemSectionOpen: {},
      originalActiveBlocks: [],
      dirtyTabs: {},
      snapshots: {},
      writerActive: {},
      blockViewTab: 'defaults',
      globalDefaults: {},
      globalOverrides: {},
      originalGlobalOverrides: {},
      fontsData: {},
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
    bodyDefaultFont() {
      // Resolve body default font from global defaults + overrides
      const groups = this.globalDefaults || {};
      let def = 'Inter';
      for (const group of Object.values(groups)) {
        if (group && group.vars && group.vars['font-family-default']) {
          def = group.vars['font-family-default'].value || def;
        }
      }
      const ov = this.globalOverrides && this.globalOverrides['global'];
      return (ov && ov['font-family-default']) || def;
    },
    blockPreviewBodyStyle() {
      const globalOv = this.globalOverrides.global || {};
      const globalDef = this.globalDefaults.layout?.vars || {};
      const get = (v) => globalOv[v] || globalDef[v]?.value || '';
      return {
        backgroundColor: this.bodyBackgroundColor,
        paddingTop: get('global-margin-top') || '3rem',
        paddingBottom: get('global-margin-bottom') || '3rem',
      };
    },
    headerSubtabs() {
      const pill = this.headerPill || 'general';
      const tabs = {
        desktop: [
          { key: 'logo', label: this.$t('prw.subtab.logo'), vars: ['desktop-logo-src', 'desktop-logo-display-height', 'desktop-logo-align', 'desktop-logo-padding'] },
          { key: 'navigation', label: this.$t('prw.subtab.navigation'), vars: ['home-desktop', 'desktop-height', 'desktop-items-align', 'desktop-items-padding', 'desktop-font-size', 'desktop-line-height', 'desktop-letter-spacing'] },
          { key: 'navigation-colors', label: this.$t('prw.subtab.navigation-colors'), vars: ['desktop-background', 'desktop-textcolor', 'desktop-textcolor-hover', 'desktop-textcolor-active'] },
          { key: 'flyout', label: this.$t('prw.subtab.flyout'), vars: ['desktop-flyout-icon', 'desktop-flyout-flip-from', 'desktop-flyout-min-width'] },
          { key: 'flyout-colors', label: this.$t('prw.subtab.flyout-colors'), vars: ['flyout-bordercolor', 'flyout-bgcolor', 'flyout-bgcolor-hover', 'flyout-bgcolor-active', 'flyout-textcolor', 'flyout-textcolor-hover', 'flyout-textcolor-active'] },
        ],
        tablet: [
          { key: 'logo', label: this.$t('prw.subtab.logo'), vars: ['tablet-logo-src', 'tablet-logo-display-height', 'tablet-logo-align', 'tablet-logo-padding'] },
          { key: 'navigation', label: this.$t('prw.subtab.navigation'), vars: ['home-tablet', 'tablet-height', 'tablet-items-align', 'tablet-items-padding', 'tablet-font-size', 'tablet-line-height', 'tablet-letter-spacing'] },
        ],
        mobile: [
          { key: 'layout', label: this.$t('prw.subtab.layout'), vars: ['home-mobile', 'mobile-height', 'mobile-logo-src', 'mobile-logo-display-height', 'mobile-font-size', 'mobile-line-height', 'mobile-letter-spacing'] },
          { key: 'colors', label: this.$t('prw.subtab.colors'), vars: ['mobile-title-color', 'mobile-language-color', 'mobile-l1-color', 'mobile-l1-active-color', 'mobile-l2-color', 'mobile-l2-active-color', 'mobile-l1-bordercolor', 'mobile-l2-bordercolor'] },
        ],
      };
      return tabs[pill] || [];
    },
    headerNavShowOnly() {
      const subtabs = this.headerSubtabs;
      if (!subtabs.length) return null;
      const active = subtabs.find(t => t.key === this.headerSubtab) || subtabs[0];
      return active.vars;
    },
    bodyBackgroundColor() {
      const ov = (this.globalOverrides.global || {})['body-background'];
      if (ov) return ov;
      const def = this.globalDefaults.colors?.vars?.['body-background'];
      if (def) return def.value || '#E8E8E8';
      return '#E8E8E8';
    },
    blockPreviewFontInfo() {
      const family = this.bodyDefaultFont;
      const allFonts = { ...(this.fontsData.builtin || {}), ...(this.fontsData.project || {}) };
      let category = 'sans-serif';
      for (const f of Object.values(allFonts)) {
        if (f.family === family) { category = f.category || 'sans-serif'; break; }
      }
      return { family, category };
    },
    defaultFontPreviewStyle() {
      const family = this.bodyDefaultFont;
      const allFonts = { ...(this.fontsData.builtin || {}), ...(this.fontsData.project || {}) };
      let category = 'sans-serif';
      for (const f of Object.values(allFonts)) {
        if (f.family === family) { category = f.category || 'sans-serif'; break; }
      }
      return { fontFamily: "'" + family + "', " + category };
    },
    isDirty() {
      if (this.activeTab === 'global') {
        const tab = this.globalActiveTab;
        if (tab === 'settings') return !!this.dirtyTabs['global'];
        if (tab === 'blocks' || tab === 'fonts') return !!this.dirtyTabs['global-settings'];
        return !!this.dirtyTabs[tab];
      }
      return !!this.dirtyTabs[this.activeTab];
    },
  },
  watch: {
    blockType: {
      immediate: true,
      handler(val) {
        this.activeTab = val || 'global';
      },
    },
    globalOverrides: { deep: true, handler() { this.injectPreviewStyles(); } },
    elementOverrides: { deep: true, handler() { this.injectPreviewStyles(); } },
    navOverrides: { deep: true, handler() { this.injectPreviewStyles(); } },
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

          // Load per-block CSS-variable defaults + overrides (only useful for items-blocks)
          if (this.hasItemFields(block.blockType)) {
            try {
              const valuesRes = await this.$api.get('projectwizard/values/' + block.blockType);
              this.$set(this.blockValueDefaults, block.blockType, valuesRes.defaults || {});
              const vov = (valuesRes.overrides && !Array.isArray(valuesRes.overrides)) ? valuesRes.overrides : {};
              this.$set(this.blockValueOverrides, block.blockType, JSON.parse(JSON.stringify(vov)));
              this.$set(this.originalBlockValueOverrides, block.blockType, JSON.parse(JSON.stringify(vov)));
              this.$set(this.snapshots, block.blockType + ':values', JSON.stringify(vov));
            } catch (e) {
              // Block has no values defined — silently skip
            }
          }
        }

        // Load global
        const globalData = await this.$api.get('projectwizard/global');
        this.globalDefaults = globalData.defaults || {};
        const globalOv = (globalData.overrides && !Array.isArray(globalData.overrides)) ? globalData.overrides : {};
        this.globalOverrides = JSON.parse(JSON.stringify(globalOv));
        this.originalGlobalOverrides = JSON.parse(JSON.stringify(globalOv));
        this.$set(this.snapshots, 'global-settings', JSON.stringify(globalOv));

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

        // Load fonts
        await this.loadFontsData();

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
      if (block && block.name) return block.name;
      if (block) {
        const translated = this.$t(block.plugin + '.name');
        if (translated && translated !== block.plugin + '.name') return translated;
      }
      const name = blockType.replace(/^pw/, '').replace(/([A-Z])/g, ' $1').trim() || blockType;
      return name.charAt(0).toUpperCase() + name.slice(1);
    },
    isItemSectionOpen(blockType, key) {
      return this.itemSectionOpen[blockType + ':' + key] !== false;
    },
    toggleItemSection(blockType, key) {
      this.$set(this.itemSectionOpen, blockType + ':' + key, !this.isItemSectionOpen(blockType, key));
    },
    isItemBorderEnabled(blockType) {
      return this.itemLayoutDefault(blockType, 'item-border') === true;
    },
    isItemLinkStyleButton(blockType) {
      return this.itemLayoutDefault(blockType, 'item-link-style') === 'button';
    },
    itemColorsShowOnly(blockType) {
      // Link colors only matter when link-style="text" (button mode pulls from
      // global element-button-*). Border color only matters when border is on.
      // Tagline color only shows when the item-tagline content field is enabled.
      const list = ['item-background', 'item-text'];
      if (this.isItemContentFieldEnabled(blockType, 'item-tagline')) {
        list.push('item-tagline-text');
      }
      if (this.isItemContentFieldEnabled(blockType, 'item-heading')) {
        list.push('item-heading-text');
      }
      if (this.isItemContentFieldEnabled(blockType, 'item-editor')) {
        list.push('item-editor-text');
      }
      if (!this.isItemLinkStyleButton(blockType)) {
        list.push('item-link', 'item-link-hover', 'item-link-active');
      }
      if (this.isItemBorderEnabled(blockType)) {
        list.push('item-border-color');
      }
      return list;
    },
    isItemContentFieldEnabled(blockType, fieldKey) {
      // Reads settings.fields.content.<fieldKey>._disabled (override). If absent
      // or false, the field is enabled (which is the default state).
      const ov = this.blockOverrides[blockType];
      const disabled = ov && ov.settings && ov.settings.fields && ov.settings.fields.content
        && ov.settings.fields.content[fieldKey]
        && ov.settings.fields.content[fieldKey]._disabled;
      return disabled !== true;
    },
    itemLayoutDefault(blockType, key) {
      // Resolve current default for a settings.fields.layout.<key>: override wins,
      // otherwise fall back to the plugin's default.
      const ov = this.blockOverrides[blockType];
      const ovVal = ov && ov.settings && ov.settings.fields && ov.settings.fields.layout
        && ov.settings.fields.layout[key] && ov.settings.fields.layout[key].default;
      if (ovVal !== undefined) return ovVal;
      const cfg = this.blockConfigs[blockType];
      return cfg && cfg.defaults && cfg.defaults.settings && cfg.defaults.settings.fields
        && cfg.defaults.settings.fields.layout && cfg.defaults.settings.fields.layout[key]
        && cfg.defaults.settings.fields.layout[key].default;
    },
    hasItemFields(blockType) {
      // Show the Items tab only for blocks that define a `blocks` content field
      // (inner-blocks pattern → cardlets, featurelist). Plugins using `column-blocks`
      // (multicolumn) or static layouts (monstercards, monstercall) don't get one.
      const cfg = this.blockConfigs[blockType];
      const content = cfg && cfg.defaults && cfg.defaults.settings && cfg.defaults.settings.fields && cfg.defaults.settings.fields.content || {};
      return content.blocks !== undefined && content.blocks !== false;
    },
    blockTabs(blockType) {
      const tabs = [{ key: 'defaults', icon: 'settings' }];
      if (this.hasItemFields(blockType)) {
        // Items tab now hosts both content fields, defaults and the layout/colors
        // value editors — no separate top-level Layout tab.
        tabs.push({ key: 'items', icon: 'list-bullet' });
      } else {
        tabs.push({ key: 'layout', icon: 'layout-top' });
      }
      return tabs;
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

    // --- Global: Settings ---
    onGlobalOverridesUpdate(overrides) {
      this.globalOverrides = overrides;
      this.$set(this.dirtyTabs, 'global-settings', JSON.stringify(this.globalOverrides) !== this.snapshots['global-settings']);
    },

    // --- Global: Fonts ---
    onFontOverridesUpdate(overrides) {
      this.fontOverrides = overrides;
      this.updateElementsDirty();
    },

    updateElementsDirty() {
      const elemDirty = JSON.stringify(this.elementOverrides) !== this.snapshots['elements'];
      const fontDirty = JSON.stringify(this.fontOverrides) !== this.snapshots['fontsizes'];
      this.$set(this.dirtyTabs, 'elements', elemDirty || fontDirty);
    },

    async saveFonts() {
      try {
        const res = await this.$api.post('projectwizard/fontsizes', this.fontOverrides);
        this.fontOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
        this.originalFontOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
        this.$set(this.snapshots, 'fontsizes', JSON.stringify(this.safeOverrides(res.overrides)));
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
        const ov = this.safeOverrides(res.overrides);
        this.footerOverrides = JSON.parse(JSON.stringify(ov));
        this.originalFooterOverrides = JSON.parse(JSON.stringify(ov));
        this.$set(this.snapshots, 'footer', JSON.stringify(ov));
        this.$set(this.dirtyTabs, 'footer', false);
        this.$panel.notification.success('Footer settings saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save footer settings');
      }
    },

    // --- Global: Elements ---
    onElementOverridesUpdate(overrides) {
      this.elementOverrides = overrides;
      this.updateElementsDirty();
    },

    async saveElements() {
      try {
        const res = await this.$api.post('projectwizard/elements', this.elementOverrides);
        this.elementOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
        this.originalElementOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
        this.$set(this.snapshots, 'elements', JSON.stringify(this.safeOverrides(res.overrides)));
        // Also save font sizes
        await this.saveFonts();
        this.$set(this.dirtyTabs, 'elements', false);
        this.$panel.notification.success('Elements settings saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save elements settings');
      }
    },

    // --- Global: Fonts ---
    async loadFontsData() {
      try {
        this.fontsData = await this.$api.get('projectwizard/fonts');
        this.injectFontFaces();
        this.injectPreviewStyles();
      } catch (e) {
        console.error('Failed to load fonts', e);
      }
    },
    blockPreviewStyle(theme) {
      const bg = ((this.globalOverrides.global || {})[theme] || {})['block-background'] ||
        (this.globalDefaults.colors?.colors?.['block-background']?.[theme]) || '#ffffff';
      const globalOv = this.globalOverrides.global || {};
      const globalDef = this.globalDefaults.layout?.vars || {};
      const getGlobal = (v) => globalOv[v] || globalDef[v]?.value || '';
      const getGlobalQuad = (v) => {
        const ov = globalOv[v];
        if (Array.isArray(ov)) return ov;
        return globalDef[v]?.value || [];
      };
      const radius = getGlobalQuad('global-');
      let borderRadius = '0 0 0 0';
      if (Array.isArray(radius) && radius.length === 4) {
        if (theme === 'default') {
          borderRadius = radius[0] + ' ' + radius[1] + ' 0 0';
        } else if (theme === 'variant2') {
          borderRadius = '0 0 ' + radius[3] + ' ' + radius[2];
        } else {
          borderRadius = '0';
        }
      }
      return {
        backgroundColor: bg,
        paddingTop: getGlobal('global-padding-top') || '1.5rem',
        paddingBottom: getGlobal('global-padding-bottom') || '1.5rem',
        paddingLeft: getGlobal('global-padding-left') || '3rem',
        paddingRight: getGlobal('global-padding-right') || '3rem',
        borderRadius: borderRadius,
      };
    },
    blockPreviewLabelColor(theme) {
      const bg = ((this.globalOverrides.global || {})[theme] || {})['block-background'] ||
        (this.globalDefaults.colors?.colors?.['block-background']?.[theme]) || '#ffffff';
      if (!bg || bg.length < 7) return '';
      const r = parseInt(bg.slice(1, 3), 16);
      const g = parseInt(bg.slice(3, 5), 16);
      const b = parseInt(bg.slice(5, 7), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)';
    },
    blockPreviewElementStyle(element, theme) {
      const elDef = this.elementDefaults[element] || {};
      const elOv = this.elementOverrides.global || {};
      const get = (v) => elOv[v] || '';
      const def = (v) => {
        const d = elDef.vars?.[v];
        if (!d) return '';
        if (d.default !== undefined) return d.default;
        return d.value || '';
      };
      // Font
      let fontFamily = get(element + '-font-family') || def(element + '-font-family');
      if (!fontFamily || fontFamily === 'default') fontFamily = this.bodyDefaultFont;
      const allFonts = { ...(this.fontsData.builtin || {}), ...(this.fontsData.project || {}) };
      let fontCategory = 'sans-serif';
      for (const f of Object.values(allFonts)) {
        if (f.family === fontFamily) { fontCategory = f.category || 'sans-serif'; break; }
      }
      // Color
      const colorVar = 'element-' + element + '-text';
      const colorOv = ((elOv)[theme] || {})[colorVar];
      const colorDef = elDef.colors?.[colorVar]?.[theme] || '';
      return {
        fontFamily: "'" + fontFamily + "', " + fontCategory,
        fontWeight: get(element + '-font-weight') || def(element + '-font-weight'),
        fontStyle: get(element + '-font-style') || def(element + '-font-style'),
        fontSize: def(element + '-font-size'),
        lineHeight: def(element + '-line-height'),
        letterSpacing: def(element + '-letter-spacing'),
        textTransform: get(element + '-text-transform') || def(element + '-text-transform'),
        color: colorOv || colorDef,
        margin: 0,
      };
    },
    blockPreviewLinkStyle(theme, state) {
      const key = 'block-link' + (state || '');
      const colorOv = ((this.globalOverrides.global || {})[theme] || {})[key];
      const colorDef = this.globalDefaults.colors?.colors?.[key]?.[theme] || '#1D548B';
      return {
        color: colorOv || colorDef,
        textDecoration: 'underline',
        cursor: 'default',
      };
    },
    blockPreviewButtonStyle(theme, state) {
      const elDef = this.elementDefaults.button || {};
      const elOv = this.elementOverrides.global || {};
      const get = (v) => elOv[v] || '';
      const def = (v) => {
        const d = elDef.vars?.[v];
        if (!d) return '';
        return d.value || '';
      };
      let fontFamily = get('button-font-family') || def('button-font-family');
      if (!fontFamily || fontFamily === 'default') fontFamily = this.bodyDefaultFont;
      const allFonts = { ...(this.fontsData.builtin || {}), ...(this.fontsData.project || {}) };
      let fontCategory = 'sans-serif';
      for (const f of Object.values(allFonts)) {
        if (f.family === fontFamily) { fontCategory = f.category || 'sans-serif'; break; }
      }
      const colorVal = (name) => {
        return ((elOv)[theme] || {})[name] || elDef.colors?.[name]?.[theme] || '';
      };
      const paddingOv = elOv['button-padding'];
      const padding = Array.isArray(paddingOv) ? paddingOv : (elDef.vars?.['button-padding']?.value || []);
      const radiusOv = elOv['button-border-radius'];
      const radius = Array.isArray(radiusOv) ? radiusOv : (elDef.vars?.['button-border-radius']?.value || []);
      return {
        fontFamily: "'" + fontFamily + "', " + fontCategory,
        fontWeight: get('button-font-weight') || def('button-font-weight'),
        fontStyle: get('button-font-style') || def('button-font-style'),
        fontSize: def('button-font-size'),
        lineHeight: def('button-line-height'),
        letterSpacing: def('button-letter-spacing'),
        textTransform: get('button-text-transform') || def('button-text-transform'),
        color: colorVal('element-button-text' + (state || '')),
        backgroundColor: colorVal('element-button-background' + (state || '')),
        borderColor: colorVal('element-button-border' + (state || '')),
        borderWidth: '1px',
        borderStyle: 'solid',
        padding: Array.isArray(padding) ? padding.join(' ') : padding,
        borderRadius: Array.isArray(radius) ? radius.join(' ') : radius,
        display: 'inline-block',
        marginTop: '0.5rem',
        cursor: 'default',
      };
    },
    injectPreviewStyles() {
      const id = 'pw-panel-preview-states';
      let style = document.getElementById(id);
      if (!style) {
        style = document.createElement('style');
        style.id = id;
        document.head.appendChild(style);
      }
      const rules = [];
      for (const theme of ['default', 'variant', 'variant2']) {
        const linkHover = this.blockPreviewLinkColor(theme, '-hover');
        const linkActive = this.blockPreviewLinkColor(theme, '-active');
        rules.push('.pw-preview-link-' + theme + ':hover { color: ' + linkHover + ' !important; }');
        rules.push('.pw-preview-link-' + theme + ':active { color: ' + linkActive + ' !important; }');

        const btnHover = this.blockPreviewBtnColors(theme, '-hover');
        const btnActive = this.blockPreviewBtnColors(theme, '-active');
        rules.push('.pw-preview-btn-' + theme + ':hover { color: ' + btnHover.color + ' !important; background-color: ' + btnHover.bg + ' !important; border-color: ' + btnHover.border + ' !important; }');
        rules.push('.pw-preview-btn-' + theme + ':active { color: ' + btnActive.color + ' !important; background-color: ' + btnActive.bg + ' !important; border-color: ' + btnActive.border + ' !important; }');
      }

      // Nav preview hover/active
      const navOv = this.navOverrides.global || {};
      const navDef = this.navDefaults.desktop?.vars || {};
      const navColor = (name, fallback) => navOv[name] || navDef[name]?.value || fallback;
      rules.push('.pw-nav-preview-item span:hover { color: ' + navColor('desktop-textcolor-hover', '#101828') + ' !important; }');
      rules.push('.pw-nav-preview-item span:active { color: ' + navColor('desktop-textcolor-active', '#101828') + ' !important; }');

      // Flyout preview hover/active
      rules.push('.pw-nav-preview-flyout-item:hover { color: ' + navColor('flyout-textcolor-hover', '#ffffff') + ' !important; background-color: ' + navColor('flyout-bgcolor-hover', '#1D548B') + ' !important; }');
      rules.push('.pw-nav-preview-flyout-item:active { color: ' + navColor('flyout-textcolor-active', '#ffffff') + ' !important; background-color: ' + navColor('flyout-bgcolor-active', '#164073') + ' !important; }');

      style.textContent = rules.join('\n');
    },
    blockPreviewLinkColor(theme, state) {
      const key = 'block-link' + (state || '');
      const colorOv = ((this.globalOverrides.global || {})[theme] || {})[key];
      return colorOv || this.globalDefaults.colors?.colors?.[key]?.[theme] || '#1D548B';
    },
    blockPreviewBtnColors(theme, state) {
      const elDef = this.elementDefaults.button || {};
      const elOv = this.elementOverrides.global || {};
      const colorVal = (name) => ((elOv)[theme] || {})[name] || elDef.colors?.[name]?.[theme] || '';
      return {
        color: colorVal('element-button-text' + (state || '')),
        bg: colorVal('element-button-background' + (state || '')),
        border: colorVal('element-button-border' + (state || '')),
      };
    },
    injectFontFaces() {
      const id = 'pw-panel-fontfaces';
      let style = document.getElementById(id);
      if (!style) {
        style = document.createElement('style');
        style.id = id;
        document.head.appendChild(style);
      }
      const allFonts = { ...(this.fontsData.builtin || {}), ...(this.fontsData.project || {}) };
      const rules = [];
      for (const font of Object.values(allFonts)) {
        for (const file of (font.files || [])) {
          rules.push(
            '@font-face { ' +
            "font-family: '" + font.family + "'; " +
            "src: url('/assets/fonts/" + file.src + "') format('woff2'); " +
            'font-weight: ' + (file.weight || '400') + '; ' +
            'font-style: ' + (file.style || 'normal') + '; ' +
            'font-display: swap; }'
          );
        }
      }
      style.textContent = rules.join('\n');
    },

    // --- Global: Navigation ---
    onNavOverridesUpdate(overrides) {
      this.navOverrides = overrides;
      this.$set(this.dirtyTabs, 'header', JSON.stringify(this.navOverrides) !== this.snapshots['header']);
    },

    async saveNavigation() {
      try {
        const res = await this.$api.post('projectwizard/navigation', this.navOverrides);
        this.navOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
        this.originalNavOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
        this.$set(this.snapshots, 'header', JSON.stringify(this.safeOverrides(res.overrides)));
        this.$set(this.dirtyTabs, 'header', false);
        this.$panel.notification.success('Header settings saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save header settings');
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
        const tab = this.globalActiveTab;
        if (tab === 'settings') {
          await this.saveGlobal();
        } else if (tab === 'blocks' || tab === 'fonts') {
          await this.saveGlobalSettings();
        } else if (tab === 'elements') {
          await this.saveElements();
        } else if (tab === 'header') {
          await this.saveNavigation();
        } else if (tab === 'footer') {
          await this.saveFooter();
        }
      } else {
        await this.saveBlock(this.activeTab);
      }
      // Trigger projectbuilder hook to regenerate tailwind.css
      try { fetch(window.location.origin, { cache: 'no-store' }); } catch(e) {}
    },

    discardChanges() {
      if (this.activeTab === 'global') {
        const tab = this.globalActiveTab;
        if (tab === 'settings') {
          this.activeBlocks = [...this.originalActiveBlocks];
          for (const block of this.blocks) {
            block.active = this.activeBlocks.includes(block.blockType);
          }
          this.$set(this.dirtyTabs, 'global', false);
        } else if (tab === 'blocks' || tab === 'fonts') {
          this.globalOverrides = JSON.parse(JSON.stringify(this.originalGlobalOverrides));
          this.$set(this.dirtyTabs, 'global-settings', false);
        } else if (tab === 'elements') {
          this.elementOverrides = JSON.parse(JSON.stringify(this.originalElementOverrides));
          this.fontOverrides = JSON.parse(JSON.stringify(this.originalFontOverrides));
          this.$set(this.dirtyTabs, 'elements', false);
        } else if (tab === 'header') {
          this.navOverrides = JSON.parse(JSON.stringify(this.originalNavOverrides));
          this.$set(this.dirtyTabs, 'header', false);
        } else if (tab === 'footer') {
          this.footerOverrides = JSON.parse(JSON.stringify(this.originalFooterOverrides));
          this.$set(this.dirtyTabs, 'footer', false);
        }
      } else {
        const bt = this.activeTab;
        this.$set(this.blockOverrides, bt, JSON.parse(JSON.stringify(this.originalOverrides[bt] || {})));
        this.$set(this.dirtyTabs, this.activeTab, false);
      }
      this.discardKey++;
    },

    async saveGlobal() {
      try {
        await this.$api.post('projectwizard/blocks/active', { blocks: this.activeBlocks });
        this.originalActiveBlocks = [...this.activeBlocks];
        this.$set(this.snapshots, 'global', JSON.stringify(this.activeBlocks));
        this.$set(this.dirtyTabs, 'global', false);
        this.$panel.notification.success('Blocks settings saved');
        setTimeout(() => window.location.reload(), 100);
      } catch (e) {
        this.$panel.notification.error('Failed to save blocks settings');
      }
    },

    async saveGlobalSettings() {
      try {
        const res = await this.$api.post('projectwizard/global', this.globalOverrides);
        this.globalOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
        this.originalGlobalOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
        this.$set(this.snapshots, 'global-settings', JSON.stringify(this.safeOverrides(res.overrides)));
        this.$set(this.dirtyTabs, 'global-settings', false);
        this.$panel.notification.success('Global settings saved');

      } catch (e) {
        this.$panel.notification.error('Failed to save global settings');
      }
    },

    async saveBlock(blockType) {
      try {
        const res = await this.$api.post(
          'projectwizard/block/' + blockType,
          this.blockOverrides[blockType] || {}
        );
        this.$set(this.blockConfigs, blockType, res);
        this.$set(this.blockOverrides, blockType, JSON.parse(JSON.stringify(this.safeOverrides(res.overrides))));
        this.$set(this.originalOverrides, blockType, JSON.parse(JSON.stringify(this.safeOverrides(res.overrides))));
        const block = this.blocks.find(b => b.blockType === blockType);
        if (block) block.customized = Object.keys(this.safeOverrides(res.overrides)).length > 0;
        this.$set(this.snapshots, blockType, JSON.stringify(this.safeOverrides(res.overrides)));
        this.$set(this.dirtyTabs, blockType, false);

        // Items-blocks: also persist the per-block CSS-variable overrides
        // (the rem-inputs in the Layout tab).
        if (this.hasItemFields(blockType)) {
          const valuesRes = await this.$api.post(
            'projectwizard/values/' + blockType,
            this.blockValueOverrides[blockType] || {}
          );
          const ov = (valuesRes.overrides && !Array.isArray(valuesRes.overrides)) ? valuesRes.overrides : {};
          this.$set(this.blockValueOverrides, blockType, JSON.parse(JSON.stringify(ov)));
          this.$set(this.originalBlockValueOverrides, blockType, JSON.parse(JSON.stringify(ov)));
          this.$set(this.snapshots, blockType + ':values', JSON.stringify(ov));
        }

        this.$panel.notification.success(this.blockLabel(blockType) + ' settings saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save ' + this.blockLabel(blockType) + ' settings');
      }
    },

    onBlockValueOverridesUpdate(blockType, overrides) {
      this.$set(this.blockValueOverrides, blockType, overrides);
      const valuesDirty = JSON.stringify(overrides) !== this.snapshots[blockType + ':values'];
      const settingsDirty = JSON.stringify(this.blockOverrides[blockType] || {}) !== this.snapshots[blockType];
      this.$set(this.dirtyTabs, blockType, valuesDirty || settingsDirty);
    },

    safeOverrides(ov) {
      return (ov && !Array.isArray(ov)) ? ov : {};
    },
  },
};
</script>

<style>
/* Global px calculator badge */
.pw-px-calculator {
  font-size: var(--code-inline-font-size);
  font-family: var(--font-mono);
  color: var(--code-inline-color-text);
  background: var(--code-inline-color-back);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: 0 var(--rounded) var(--rounded) 0;
  border: 1px solid var(--code-inline-color-border);
  height: 26px;
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

.pw-block-preview-body {
  margin-bottom: var(--spacing-6);
}

.pw-block-preview-row {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pw-block-preview {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-2);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

[class^="pw-preview-link-"] {
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.15s;
}

[class^="pw-preview-btn-"] {
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s, border-color 0.15s;
}

.pw-block-preview-label {
  font-size: 0.6rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-1);
}

.pw-default-font-preview {
  background: #fff;
  padding: var(--spacing-4) var(--spacing-6);
  font-size: 1rem;
  line-height: 1.6;
  color: #262626;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  margin-bottom: var(--spacing-6);
}

.pw-wizard-content {
}

.pw-wizard-panel { min-width: 0; }
.pw-wizard-hint { font-size: var(--text-sm); color: var(--color-text-dimmed); margin-bottom: var(--spacing-4); }

.pw-wizard-global-content {
  min-height: 200px;
}

.pw-wizard-block-sections { display: flex; flex-direction: column; }

/* Items > Layout: padding/radius/border-width/link-style/button-style stack
   directly on top of each other. Each pw-element-list inside a BlockValues
   adds spacing-10 by default — collapse that here so the rows flow as one list. */
.pw-items-layout-stack .pw-element-list { margin-bottom: 0; }
</style>
