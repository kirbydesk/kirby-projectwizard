<template>
  <k-panel-inside class="pw-wizard" :data-preview="showPreview ? 'on' : 'off'" :style="{ '--pw-body-background': bodyBackgroundColor }">
    <!-- Header in Kirby's topbar (like kirby-explorer): tabs as a pill, save buttons -->
    <pw-portal to=".pw-wizard .k-topbar">
      <div class="pw-topbar">
        <!-- Main navigation: the same on the global view and on every block view -->
        <!-- Project: project, header, footer, fonts and AI, then the settings -->
        <div v-if="!loading" class="pw-pill pw-tabs" role="group">
          <div class="pw-tab-menu">
            <button
              type="button"
              class="pw-tool pw-tab"
              aria-haspopup="menu"
              :aria-pressed="isGlobalTab(...projectMenuTabs, 'settings') ? 'true' : 'false'"
              @click="$refs.settingsMenu.toggle()"
            >
              <k-icon type="globe" />
              <span class="pw-tab-text">{{ $t('prw.tab.project') }}</span>
              <k-icon type="angle-down" class="pw-tab-menu-chevron" />
            </button>
            <k-dropdown-content ref="settingsMenu" align-x="start">
              <nav class="k-navigate">
                <template v-for="(tab, idx) in projectMenuTabs.map(key => globalTabs.find(t => t.key === key)).filter(Boolean)">
                  <button
                    :key="tab.key"
                    type="button"
                    class="k-dropdown-item k-button pw-menu-item"
                    data-has-text="true"
                    data-has-icon="true"
                    :aria-current="isGlobalTab(tab.key) ? 'true' : undefined"
                    @click="$refs.settingsMenu.close(); openGlobal(tab.key)"
                  >
                    <span class="k-button-icon"><k-icon :type="tab.icon" /></span>
                    <span class="k-button-text">{{ $t('prw.tab.' + tab.key) }}</span>
                  </button>
                  <!-- "Project" first, like "Elements" and "Blocks" in their menus -->
                  <hr v-if="idx === 0" :key="'hr-' + tab.key" />
                </template>
                <hr />
                <button
                  type="button"
                  class="k-dropdown-item k-button pw-menu-item"
                  data-has-text="true"
                  data-has-icon="true"
                  :aria-current="isGlobalTab('settings') ? 'true' : undefined"
                  @click="$refs.settingsMenu.close(); openGlobal('settings')"
                >
                  <span class="k-button-icon"><k-icon type="cog" /></span>
                  <span class="k-button-text">{{ $t('prw.tab.settings') }}</span>
                </button>
              </nav>
            </k-dropdown-content>
          </div>
        </div>
        <div v-if="!loading" class="pw-pill pw-tabs" role="group">
          <!-- Elements: the elements (Kirby's black menu, like kirby-explorer) -->
          <div class="pw-tab-menu">
            <button
              type="button"
              class="pw-tool pw-tab"
              aria-haspopup="menu"
              :aria-pressed="isGlobalTab('elements') ? 'true' : 'false'"
              @click="$refs.elementsMenu.toggle()"
            >
              <k-icon type="layers" />
              <span class="pw-tab-text">{{ $t('prw.tab.elements') }}</span>
              <k-icon type="angle-down" class="pw-tab-menu-chevron" />
            </button>
            <k-dropdown-content ref="elementsMenu" align-x="start">
              <nav class="k-navigate">
                <!-- the elements (the default font is under Project → Fonts) -->
                <button
                  v-for="option in elementOptions"
                  :key="option.value"
                  type="button"
                  class="k-dropdown-item k-button pw-menu-item"
                  data-has-text="true"
                  data-has-icon="true"
                  :aria-current="isGlobalTab('elements') && selectedElement === option.value ? 'true' : undefined"
                  @click="$refs.elementsMenu.close(); selectedElement = option.value; openGlobal('elements', option.value)"
                >
                  <span class="k-button-icon"><k-icon :type="option.icon" /></span>
                  <span class="k-button-text">{{ option.text }}</span>
                </button>
              </nav>
            </k-dropdown-content>
          </div>
        </div>

        <!-- Blocks: its own group -->
        <div v-if="!loading" class="pw-pill" role="group">
            <!-- Blocks: the activated blocks -->
            <div class="pw-tab-menu">
              <button
                type="button"
                class="pw-tool pw-tab"
                aria-haspopup="menu"
                :aria-pressed="activeTab !== 'global' ? 'true' : 'false'"
                @click="$refs.blocksMenu.toggle(); loadBlockUsage()"
              >
                <k-icon type="box" />
                <span class="pw-tab-text">{{ $t('prw.tab.blocks') }}</span>
                <k-icon type="angle-down" class="pw-tab-menu-chevron" />
              </button>
              <k-dropdown-content ref="blocksMenu" align-x="start">
                <nav class="k-navigate">
                  <!-- the activated blocks, each opens its own settings view
                       (the general block settings are under Project) -->
                  <template v-if="activeBlockEntries.length">
                    <button
                      v-for="entry in activeBlockEntries"
                      :key="entry.blockType"
                      type="button"
                      class="k-dropdown-item k-button pw-menu-item"
                      data-has-text="true"
                      data-has-icon="true"
                      :aria-current="activeTab === entry.blockType ? 'true' : undefined"
                      @click="$refs.blocksMenu.close(); $go('projectwizard/block/' + entry.blockType)"
                    >
                      <span class="k-button-icon"><k-icon :type="entry.icon || 'box'" /></span>
                      <span class="k-button-text">
                        {{ blockLabel(entry.blockType) }}
                        <!-- how often the block is used in the project, like the counts in kirby-explorer -->
                        <span v-if="blockUsage[entry.blockType] !== undefined" class="pw-menu-count">{{ blockUsage[entry.blockType] }}</span>
                      </span>
                    </button>
                  </template>
                </nav>
              </k-dropdown-content>
            </div>
        </div>

        <div v-if="isDirty" class="k-form-controls pw-topbar-controls">
          <div data-layout="collapsed" class="k-button-group">
            <k-button
              :text="$t('discard')"
              icon="undo"
              theme="notice"
              variant="filled"
              size="sm"
              responsive="true"
              class="k-form-controls-button"
              @click="discardChanges"
            />
            <k-button
              :text="$t('save')"
              icon="check"
              theme="notice"
              variant="filled"
              size="sm"
              class="k-form-controls-button"
              @click="saveCurrentView"
            />
          </div>
        </div>
      </div>
    </pw-portal>

    <div v-if="loading" class="pw-wizard-loading">{{ $t('loading') }} …</div>

    <!-- Two columns while the preview is on: settings 2/3, preview 1/3.
         The previews are moved into the right column via pw-portal. -->
    <div v-else class="pw-wizard-columns">
    <div class="pw-wizard-content">

        <!-- Global views: the page's name as heading (an element: its name) -->
        <div v-if="!loading && activeTab === 'global'" class="pw-page-title-row">
          <h1 class="pw-page-title">{{ globalPageTitle }}</h1>
        </div>

        <!-- Block view: the block's name as page heading, Kirby's tabs (design,
             start values, visibility) on the right in its line, below what the
             chosen tab does -->
        <template v-if="!loading && activeTab !== 'global'">
          <div class="pw-page-title-row pw-page-title-row-tabs">
            <h1 class="pw-page-title">{{ blockLabel(activeTab) }}</h1>
            <k-tabs class="pw-block-view-tabs" :tab="currentBlockView" :tabs="blockViewTabs" />
          </div>
          <p class="pw-block-view-intro">{{ $t('prw.view.' + currentBlockView + '.intro') }}</p>
        </template>

        <!-- ==================== Global Settings ==================== -->
        <div v-if="activeTab === 'global'" class="pw-wizard-panel">

          <!-- Blocks -->
          <!-- Settings -->
          <div v-show="globalActiveTab === 'settings'" class="pw-wizard-global-content">
            <!-- theme variants that can be chosen in the blocks ("default" always on) -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row"><h3 class="pw-card-heading">{{ $t('prw.label.variants') }}</h3></div>
              <div class="pw-card pw-field-table">
                <div v-for="variant in ['variant', 'variant2', 'variant3']" :key="variant" class="pw-field-row">
                  <div class="k-input" data-type="text">
                    <span class="k-input-element pw-field-row-inner">
                      <div class="pw-field-row-label-col">
                        <label class="pw-field-row-label">{{ $t('pw.option.' + variant) }}</label>
                      </div>
                      <div class="pw-field-row-options">
                        <k-toggles-input
                          :value="activeVariants.includes(variant) ? 'true' : 'false'"
                          :options="[{ value: 'true', text: $t('pw.option.enabled') }, { value: 'false', text: $t('pw.option.disabled') }]"
                          :grow="false"
                          :required="true"
                          @input="toggleVariant(variant, $event === 'true')"
                        />
                      </div>
                    </span>
                  </div>
                </div>
              </div>
            </section>

          </div>

          <!-- Project → General: the page background -->
          <div v-show="globalActiveTab === 'general'" class="pw-wizard-global-content">
            <!-- which blocks can be used -->
            <pw-global-elements
              :blocks="blocks"
              @toggle="toggleBlock($event.blockType, $event.checked)"
            />
            <!-- page colours as a card, like the elements -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.colors') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-global-navigation
                  :nav-defaults="globalDefaults"
                  :nav-overrides="globalOverrides"
                  :saved-overrides="originalGlobalOverrides"
                  :discard-key="discardKey"
                  :fonts="fontsData"
                  :body-default-font="bodyDefaultFont"
                  @update:overrides="onGlobalOverridesUpdate"
                  :show-only="['body-background']"
                  :vars-only="true"
                  :hide-section-headers="true"
                />
              </div>
            </section>
          </div>

          <!-- Blocks -->
          <div v-show="globalActiveTab === 'blocks'" class="pw-wizard-global-content">
            <!-- Block Preview -->
            <pw-portal to=".pw-wizard .pw-preview-column">
              <div v-show="activeTab === 'global' && globalActiveTab === 'blocks'" class="pw-element-preview-side">
                <!-- toolbar: the variant (shared with the colour card) -->
                <div class="pw-preview-switches">
                  <div class="pw-pill pw-preview-bp pw-preview-theme" role="group">
                    <button
                      v-for="t in themes"
                      :key="'bpt-' + t"
                      type="button"
                      class="pw-tool"
                      :aria-pressed="currentBlocksColorTheme === t ? 'true' : 'false'"
                      @click="blocksColorTheme = t"
                    >{{ $t('pw.option.' + t) }}</button>
                  </div>
                  <!-- guides on/off (shared by all previews) -->
                  <div class="pw-pill pw-guides-switch" role="group">
                    <button
                      type="button"
                      class="pw-tool"
                      :title="$t('prw.preview.guides')"
                      :aria-label="$t('prw.preview.guides')"
                      :aria-pressed="previewGuides ? 'true' : 'false'"
                      @click="previewGuides = !previewGuides"
                    >
                      <k-icon type="prw-guides" />
                    </button>
                  </div>
                  <pw-device-select v-model="blocksPreviewBp" />
                </div>
                <div class="pw-block-preview-body" :style="blockPreviewBodyStyle">
                      <!-- the outer spacing (block layout) around the tile; the guides
                           mark the fixed edge to the neighbouring blocks -->
                      <div class="pw-block-preview-row pw-block-preview-spaced" :class="{ 'has-guides': previewGuides }" :style="blockPreviewMarginStyle">
                        <div v-for="theme in [currentBlocksColorTheme]" :key="theme" class="pw-block-preview" :class="{ 'has-guides': previewGuides }" :style="blockPreviewStyle(theme, true)">
                          <!-- just text: two paragraphs (the first with a link), spaced
                               like the editor's paragraphs -->
                          <div class="pw-block-preview-content pw-block-preview-text">
                          <p :style="blockPreviewElementStyle('editor', theme, blocksPreviewBp)">{{ $t('prw.preview.text.before') }} <a :class="'pw-preview-link-' + theme" :style="blockPreviewLinkStyle(theme, '')">{{ $t('prw.preview.text.link') }}</a>{{ $t('prw.preview.text.after') }}</p>
                          <p :style="{ ...blockPreviewElementStyle('editor', theme, blocksPreviewBp), marginTop: blockPreviewParagraphSpacing() }">{{ $t('prw.sample.editor.2') }}</p>
                          </div>
                        </div>
                      </div>
                </div>
              </div>
            </pw-portal>

            <!-- the global block values as cards, like the elements -->
            <!-- paddings: one row per axis; the small/large switch (in the
                 vertical row) applies to top and bottom only -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.paddings') }}</h3>
              </div>
              <!-- left / right, then top / bottom (small or large) -->
              <div class="pw-card pw-field-table">
                <!-- left / right: one size only -->
                <div class="pw-field-row" :data-guide="previewGuides ? 'padding' : null">
                  <div class="k-input" data-type="text">
                    <span class="k-input-element pw-field-row-inner">
                      <div class="pw-field-row-label-col">
                        <label class="pw-field-row-label">{{ $t('prw.label.leftRight') }}</label>
                      </div>
                      <div class="pw-field-row-options pw-corner-grid pw-side-grid pw-axis-grid">
                          <span v-for="side in paddingSides.filter(sd => !sd.pair)" :key="side.key" class="pw-element-field">
                            <span class="pw-element-input-wrap">
                              <input
                                v-pw-autosize
                                type="text"
                                inputmode="decimal"
                                step="0.1"
                                min="0"
                                max="20"
                                class="pw-element-input pw-element-input-number"
                                :value="parseFloat(paddingValue(side)) || 0"
                                @change="setPadding(side, $event.target.value)"
                              />
                              <span class="pw-element-unit">rem</span>
                            </span>
                            <span class="pw-px-calculator">{{ Math.round((parseFloat(paddingValue(side)) || 0) * 16) }}px</span>
                            <k-icon :type="'grid-' + side.key" class="pw-side-icon" />
                          </span>
                      </div>
                    </span>
                  </div>
                </div>
                <!-- top / bottom: small or large -->
                <div class="pw-field-row" :data-guide="previewGuides ? 'padding' : null">
                  <div class="k-input" data-type="text">
                    <span class="k-input-element pw-field-row-inner">
                      <div class="pw-field-row-label-col">
                        <label class="pw-field-row-label">{{ $t('prw.label.topBottom') }}</label>
                        <!-- small/large step of top and bottom, right in its row -->
                        <span class="pw-pill pw-bp-switch pw-label-switch" role="group">
                          <button
                            v-for="step in ['small', 'large']"
                            :key="'ps-' + step"
                            type="button"
                            class="pw-tool"
                            :title="$t('pw.option.' + step)"
                            :aria-label="$t('pw.option.' + step)"
                            :aria-pressed="paddingStep === step ? 'true' : 'false'"
                            @click="paddingStep = step"
                          ><k-icon :type="'prw-step-' + step" /></button>
                        </span>
                      </div>
                      <div class="pw-field-row-options pw-corner-grid pw-side-grid pw-axis-grid">
                          <span v-for="side in paddingSides.filter(sd => sd.pair)" :key="side.key" class="pw-element-field">
                            <span class="pw-element-input-wrap">
                              <input
                                v-pw-autosize
                                type="text"
                                inputmode="decimal"
                                step="0.1"
                                min="0"
                                max="20"
                                class="pw-element-input pw-element-input-number"
                                :value="parseFloat(paddingValue(side)) || 0"
                                @change="setPadding(side, $event.target.value)"
                              />
                              <span class="pw-element-unit">rem</span>
                            </span>
                            <span class="pw-px-calculator">{{ Math.round((parseFloat(paddingValue(side)) || 0) * 16) }}px</span>
                            <k-icon :type="'grid-' + side.key" class="pw-side-icon" />
                          </span>
                      </div>
                    </span>
                  </div>
                </div>
              </div>
            </section>
            <!-- outer spacing of the blocks: top / bottom in one row -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.margins') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <!-- outer spacing top / bottom in one row, with the side icons -->
                <div class="pw-field-row" :data-guide="previewGuides ? 'margin' : null">
                  <div class="k-input" data-type="text">
                    <span class="k-input-element pw-field-row-inner">
                      <div class="pw-field-row-label-col">
                        <label class="pw-field-row-label">{{ $t('prw.label.topBottom') }}</label>
                      </div>
                      <div class="pw-field-row-options pw-corner-grid pw-side-grid pw-axis-grid">
                        <span v-for="side in marginSides" :key="side.key" class="pw-element-field">
                          <span class="pw-element-input-wrap">
                            <input
                              v-pw-autosize
                              type="text"
                              inputmode="decimal"
                              step="0.1"
                              min="0"
                              max="20"
                              class="pw-element-input pw-element-input-number"
                              :value="parseFloat(paddingValue(side)) || 0"
                              @change="setPadding(side, $event.target.value)"
                            />
                            <span class="pw-element-unit">rem</span>
                          </span>
                          <span class="pw-px-calculator">{{ Math.round((parseFloat(paddingValue(side)) || 0) * 16) }}px</span>
                          <k-icon :type="'grid-' + side.key" class="pw-side-icon" />
                        </span>
                      </div>
                    </span>
                  </div>
                </div>
              </div>
            </section>
            <!-- form of the blocks: the corners (square or custom radii) -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.shape') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <!-- corners: square (all radii 0) or custom (the four radii) -->
                <div class="pw-field-row">
                  <div class="k-input" data-type="text">
                    <span class="k-input-element pw-field-row-inner">
                      <div class="pw-field-row-label-col">
                        <label class="pw-field-row-label">{{ $t('prw.element.button-shape') }}</label>
                      </div>
                      <div class="pw-field-row-options">
                        <k-toggles-input
                          :value="radiusShape"
                          :options="[{ value: 'square', text: $t('pw.option.square') }, { value: 'custom', text: $t('pw.option.round') }]"
                          :grow="false"
                          :required="true"
                          @input="setRadiusShape"
                        />
                      </div>
                    </span>
                  </div>
                </div>
                <pw-global-navigation
                  v-if="radiusShape === 'custom'"
                  :nav-defaults="globalDefaults"
                  :nav-overrides="globalOverrides"
                  :saved-overrides="originalGlobalOverrides"
                  :discard-key="discardKey"
                  :fonts="fontsData"
                  :body-default-font="bodyDefaultFont"
                  @update:overrides="onGlobalOverridesUpdate"
                  :hide-section-headers="true"
                  :show-only="['global-']"
                />
              </div>
            </section>
            <section class="pw-card-section">
              <!-- colours: choose the theme, the rows show only its value -->
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.colors') }}</h3>
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="t in themes"
                    :key="'bt-' + t"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentBlocksColorTheme === t ? 'true' : 'false'"
                    @click="blocksColorTheme = t"
                  >{{ $t('pw.option.' + t) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-global-navigation
                  :nav-defaults="globalDefaults"
                  :nav-overrides="globalOverrides"
                  :saved-overrides="originalGlobalOverrides"
                  :discard-key="discardKey"
                  :fonts="fontsData"
                  :body-default-font="bodyDefaultFont"
                  @update:overrides="onGlobalOverridesUpdate"
                  :hide-section-headers="true"
                  :show-only="[]"
                  :show-colors="true"
                  :theme="currentBlocksColorTheme"
                  :hide-color-names="['block-link']"
                />
              </div>
            </section>
            <!-- links in texts: underline, its thickness and offset -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.links') }}</h3>
                <!-- the link colour per variant (shared with the colours card) -->
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="t in themes"
                    :key="'lk-' + t"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentBlocksColorTheme === t ? 'true' : 'false'"
                    @click="blocksColorTheme = t"
                  >{{ $t('pw.option.' + t) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-global-navigation
                  :nav-defaults="globalDefaults"
                  :nav-overrides="globalOverrides"
                  :saved-overrides="originalGlobalOverrides"
                  :discard-key="discardKey"
                  :fonts="fontsData"
                  :body-default-font="bodyDefaultFont"
                  @update:overrides="onGlobalOverridesUpdate"
                  :hide-section-headers="true"
                  :show-only="['block-link-decoration', 'block-link-thickness', 'block-link-offset']"
                />
                <pw-global-navigation
                  :nav-defaults="globalDefaults"
                  :nav-overrides="globalOverrides"
                  :saved-overrides="originalGlobalOverrides"
                  :discard-key="discardKey"
                  :fonts="fontsData"
                  :body-default-font="bodyDefaultFont"
                  @update:overrides="onGlobalOverridesUpdate"
                  :hide-section-headers="true"
                  :show-only="[]"
                  :show-colors="true"
                  :theme="currentBlocksColorTheme"
                  :color-names="['block-link']"
                />
              </div>
            </section>
          </div>

          <!-- Elements → General: the default font (elements set to "Default" use it) -->

          <!-- Fonts -->
          <div v-show="globalActiveTab === 'fonts'" class="pw-wizard-global-content">
            <!-- Font Preview (in the preview sidebar) -->
            <pw-portal to=".pw-wizard .pw-preview-column">
              <div v-show="activeTab === 'global' && globalActiveTab === 'fonts'">
                <!-- toolbar: which font to preview (the default font or any installed one) -->
                <div class="pw-preview-switches">
                  <div class="pw-pill pw-font-preview-select" role="group">
                    <div class="pw-tab-menu">
                      <button
                        type="button"
                        class="pw-tool pw-tab"
                        aria-haspopup="menu"
                        @click="$refs.fontPreviewMenu.toggle()"
                      >
                        <k-icon type="title" />
                        <span class="pw-tab-text">{{ previewFontFamily }}</span>
                        <k-icon type="angle-down" class="pw-tab-menu-chevron" />
                      </button>
                      <k-dropdown-content ref="fontPreviewMenu" align-x="start">
                        <nav class="k-navigate">
                          <button
                            v-for="font in installedFonts"
                            :key="font.family"
                            type="button"
                            class="k-dropdown-item k-button pw-menu-item"
                            data-has-text="true"
                            :aria-current="previewFontFamily === font.family ? 'true' : undefined"
                            @click="previewFont = font.family; $refs.fontPreviewMenu.close()"
                          >
                            <span class="k-button-text">{{ font.family === bodyDefaultFont ? $t('prw.label.defaultFont', { font: font.family }) : font.family }}</span>
                          </button>
                        </nav>
                      </k-dropdown-content>
                    </div>
                  </div>
                </div>
                <div class="pw-default-font-preview" :style="previewFontStyle">
                  <p v-for="size in ['large', 'medium', 'small']" :key="size" :data-size="size">{{ $t('prw.preview.font') }}</p>
                </div>
              </div>
            </pw-portal>

            <!-- the default font of the page (elements use it unless they have their own) -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.defaultFont') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-global-navigation
                  :nav-defaults="globalDefaults"
                  :nav-overrides="globalOverrides"
                  :fonts="fontsData"
                  :body-default-font="bodyDefaultFont"
                  @update:overrides="onGlobalOverridesUpdate"
                  :show-only="['font-family-default']"
                  :hide-section-headers="true"
                />
              </div>
            </section>
            <!-- installed fonts -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.installed-fonts') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-global-font-manager
                  :fonts="fontsData"
                  :mode="'installed'"
                  @update="loadFontsData"
                />
              </div>
            </section>
            <!-- adding a font -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.add-font') }}</h3>
              </div>
              <pw-global-font-manager
                :fonts="fontsData"
                :mode="'add'"
                @update="loadFontsData"
              />
            </section>
          </div>

          <!-- Elements -->
          <div v-show="globalActiveTab === 'elements'" class="pw-wizard-global-content">
            <pw-global-elements-styles
              :guides.sync="previewGuides"
              :preview-active="activeTab === 'global' && globalActiveTab === 'elements'"
              :themes="themes"
              :selected-element.sync="selectedElement"
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

          <!-- AI (kirbydesk AI plugins: contentwizard settings, API keys) -->
          <div
            v-if="hasAiTab"
            v-show="globalActiveTab === 'ai'"
            class="pw-wizard-global-content pw-ai-settings"
            :class="{ 'pw-ai-single': !aiForm || !(aiSecrets && aiSecrets.length) }"
          >
            <!-- 3/4: AI defaults (contentwizard) -->
            <div v-if="aiForm" class="pw-ai-main">
              <k-form
                v-if="aiForm"
                :key="'ai-' + discardKey"
                :fields="aiForm.fields"
                :value="aiValues"
                @input="onAiInput"
              />
            </div>

            <!-- 1/4: API keys -->
            <aside v-if="aiSecrets && aiSecrets.length" class="pw-ai-aside">
              <!-- API keys (admins only) — written to the project's .env -->
              <section v-if="aiSecrets && aiSecrets.length" class="pw-ai-secrets">
                <h2 class="k-label pw-ai-secrets-title">{{ $t('prw.ai.keys') }}</h2>
                <p class="pw-ai-secrets-help">{{ $t('prw.ai.keys.help') }}</p>
                <k-box v-if="!aiSecretsWritable" theme="negative" :text="$t('prw.ai.keys.readonly')" />
                <div v-for="secret in aiSecrets" :key="secret.env" class="pw-ai-secret">
                  <label class="k-label" :for="'pw-secret-' + secret.env">{{ secret.label }}</label>
                  <div class="pw-ai-secret-row">
                    <input
                      :id="'pw-secret-' + secret.env"
                      type="password"
                      autocomplete="new-password"
                      class="pw-ai-secret-input"
                      :disabled="!aiSecretsWritable || secret.source === 'config'"
                      :placeholder="secret.masked ? secret.masked : $t('prw.ai.keys.empty')"
                      :value="aiSecretInputs[secret.env] || ''"
                      @input="onSecretInput(secret.env, $event.target.value)"
                    />
                    <k-button
                      v-if="secret.source === 'env' && aiSecretsWritable"
                      icon="trash"
                      size="sm"
                      variant="filled"
                      :title="$t('prw.ai.keys.remove')"
                      @click="removeSecret(secret)"
                    />
                  </div>
                  <p class="pw-ai-secret-status">
                    <template v-if="secret.source === 'config'">{{ $t('prw.ai.keys.config') }}</template>
                    <template v-else-if="secret.source === 'env'">{{ $t('prw.ai.keys.set') }}</template>
                    <template v-else>{{ $t('prw.ai.keys.notset') }}</template>
                    <template v-if="secret.help"> · {{ secret.help }}</template>
                  </p>
                </div>
              </section>
            </aside>
          </div>

        </div>

        <!-- ==================== Block Tabs ==================== -->
        <div
          v-for="block in blocks"
          :key="block.blockType"
          v-show="activeTab === block.blockType"
          class="pw-wizard-panel"
        >

          <!-- Live preview of the block in the sidebar (Text, Steplist so far) -->
          <pw-portal v-if="['pwtext', 'pwsteplist'].includes(block.blockType) && blockConfigs[block.blockType]" to=".pw-wizard .pw-preview-column">
            <div v-show="activeTab === block.blockType">
              <pw-block-preview
                :block-type="block.blockType"
                :config="blockConfigs[block.blockType]"
                :overrides="blockOverrides[block.blockType] || {}"
                :element-defaults="elementDefaults"
                :element-overrides="elementOverrides"
                :global-defaults="globalDefaults"
                :global-overrides="globalOverrides"
                :font-defaults="fontDefaults"
                :font-overrides="fontOverrides"
                :fonts="fontsData"
                :body-default-font="bodyDefaultFont"
                :body-background="bodyBackgroundColor"
                :themes="themes"
                :guides.sync="previewGuides"
                :bp.sync="itemBp"
                :value-defaults="blockValueDefaults[block.blockType] || {}"
                :value-overrides="blockValueOverrides[block.blockType] || {}"
                :step-style="block.blockType === 'pwsteplist' ? currentStepStyle(block.blockType) : ''"
                :variant="currentItemColorTheme"
                @update:variant="itemColorTheme = $event"
              />
            </div>
          </pw-portal>

          <!-- Start values: the block's field defaults, then (blocks with items)
               the items' ones -->
          <div v-show="currentBlockView === 'defaults'" v-if="blockConfigs[block.blockType]">
            <pw-block-settings
              view="defaults"
              :variants="activeVariants"
              :global-values="globalLayoutValues"
              :guides="previewGuides"
              :block="block"
              :config="blockConfigs[block.blockType]"
              :overrides="blockOverrides[block.blockType] || {}"
              :writer-active="writerActive[block.blockType] !== false"
              @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
              @update:writer-active="$set(writerActive, block.blockType, $event)"
            />
            <!-- the items' start values (corner toggles, link style) -->
            <template v-if="hasItemFields(block.blockType) && hasItemDefaultFields(block.blockType)">
              <h2 class="pw-group-title">{{ $t('prw.tab.items') }}</h2>
              <section class="pw-card-section">
                <div class="pw-card pw-field-table">
                  <pw-block-settings
                    view="items-defaults"
                    :item-radius="itemRadiusValues(block.blockType)"
                    :block="block"
                    :config="blockConfigs[block.blockType]"
                    :overrides="blockOverrides[block.blockType] || {}"
                    :writer-active="writerActive[block.blockType] !== false"
                    @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                    @update:writer-active="$set(writerActive, block.blockType, $event)"
                  />
                </div>
              </section>
            </template>

          </div>

          <!-- Visibility: allowed options + preset per field (pills) -->
          <div v-show="currentBlockView === 'presets'" v-if="blockConfigs[block.blockType]">
            <pw-block-settings
              view="presets"
              :variants="activeVariants"
              :block="block"
              :config="blockConfigs[block.blockType]"
              :overrides="blockOverrides[block.blockType] || {}"
              :writer-active="writerActive[block.blockType] !== false"
              @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
              @update:writer-active="$set(writerActive, block.blockType, $event)"
            />
          </div>

          <!-- Design: the items' values (CSS variables), for all blocks at once -->
          <div v-show="currentBlockView === 'design'" v-if="blockConfigs[block.blockType] && hasDesign(block.blockType)">

            <!-- steplist: the item styles as pills (a view, not saved: the
                 preview shows that style) and the values that matter for it –
                 the number's size (bubble or, minimal, plain text), the
                 bubble's form and background (colour of the variant chosen in
                 the colour cards), its vertical offset, its gap to the text -->
            <section v-if="block.blockType === 'pwsteplist' && blockValueDefaults[block.blockType]" class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.numbering') }}</h3>
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="st in stepStyleOptions(block.blockType)"
                    :key="'st-' + st"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentStepStyle(block.blockType) === st ? 'true' : 'false'"
                    @click="$set(stepPreviewStyle, block.blockType, st)"
                  >{{ $t('kirbyblock-steplist.item-style.' + st) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="[stepValueKey(block.blockType, 'item-number-size')]"
                  :labels="{ [stepValueKey(block.blockType, 'item-number-size')]: $t(currentStepStyle(block.blockType) === 'minimal' ? 'prw.prop.font-size' : 'prw.label.size') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                />
                <!-- styles with a bubble (not minimal): its form -->
                <template v-if="currentStepStyle(block.blockType) !== 'minimal'">
                  <pw-block-settings
                    view="items-layout"
                    :block="block"
                    :config="blockConfigs[block.blockType]"
                    :overrides="blockOverrides[block.blockType] || {}"
                    :writer-active="writerActive[block.blockType] !== false"
                    :layout-keys="['item-shape']"
                    @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                    @update:writer-active="$set(writerActive, block.blockType, $event)"
                  />
                  <pw-block-values
                    v-if="isItemRadiusVisible(block.blockType)"
                    :bp.sync="itemBp"
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="['item-radius']"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                </template>
                <pw-block-values
                  v-if="currentStepStyle(block.blockType) !== 'centered'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="[stepValueKey(block.blockType, 'item-number-offset')]"
                  :labels="{ [stepValueKey(block.blockType, 'item-number-offset')]: $t('prw.label.offset') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="[stepValueKey(block.blockType, 'item-content-gap')]"
                  :labels="{ [stepValueKey(block.blockType, 'item-content-gap')]: $t(currentStepStyle(block.blockType) === 'centered' ? 'prw.label.gapVertical' : 'prw.label.gapHorizontal') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                />
                <!-- "connected": the width of the line (its colour: colours card) -->
                <pw-block-values
                  v-if="currentStepStyle(block.blockType) === 'connected'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-connector-width']"
                  :labels="{ 'item-connector-width': $t('prw.prop.item-connector') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                />
              </div>
            </section>

            <!-- Layout section. Order is fixed:
                 padding → radius → border (toggle) → border-width (only if border on) → link-style.
                 Each row uses its own component so we can interleave field-default toggles
                 with css-variable inputs in the desired sequence. -->
            <template v-if="blockValueDefaults[block.blockType]">
              <section class="pw-card-section">
                <div class="pw-card-heading-row">
                  <!-- steplist: only the gap between the steps is left here -->
                  <h3 class="pw-card-heading">{{ $t(block.blockType === 'pwsteplist' ? 'prw.headline.spacing' : 'prw.subtab.layout') }}</h3>
                </div>
                <div class="pw-card pw-field-table">
                  <pw-block-values
                    :bp.sync="itemBp"
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="['item-padding']"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                  <pw-block-settings
                    v-if="isItemShapeVisible(block.blockType) && block.blockType !== 'pwsteplist'"
                    view="items-layout"
                    :block="block"
                    :config="blockConfigs[block.blockType]"
                    :overrides="blockOverrides[block.blockType] || {}"
                    :writer-active="writerActive[block.blockType] !== false"
                    :layout-keys="['item-shape']"
                    @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                    @update:writer-active="$set(writerActive, block.blockType, $event)"
                  />
                  <pw-block-values
                    :bp.sync="itemBp"
                    v-if="isItemRadiusVisible(block.blockType) && block.blockType !== 'pwsteplist'"
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="['item-radius']"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                  <pw-block-values
                    :bp.sync="itemBp"
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="block.blockType === 'pwsteplist' ? ['item-gap'] : ['item-number-size', 'item-gap', 'item-content-gap', 'item-connector-width']"
                    :labels="block.blockType === 'pwsteplist' ? { 'item-gap': $t('prw.label.betweenSteps') } : {}"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                  <pw-block-values
                    :bp.sync="itemBp"
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="['item-size']"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                  <!-- Item look (featurelist): icon position/style, title style + sizes -->
                  <pw-block-settings
                    view="items-layout"
                    :block="block"
                    :config="blockConfigs[block.blockType]"
                    :overrides="blockOverrides[block.blockType] || {}"
                    :writer-active="writerActive[block.blockType] !== false"
                    :layout-keys="['item-icon-position', 'item-icon-style', 'item-title-style']"
                    @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                    @update:writer-active="$set(writerActive, block.blockType, $event)"
                  />
                  <pw-block-values
                    :bp.sync="itemBp"
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="['item-icon-size', 'item-icon-gap']"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                  <pw-block-values
                    :bp.sync="itemBp"
                    v-if="itemLayoutDefault(block.blockType, 'item-icon-style') === 'tile'"
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="['item-icon-tile-padding', 'item-icon-tile-radius']"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                  <pw-block-values
                    :bp.sync="itemBp"
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="['item-title-size', 'item-title-line-height', 'item-title-gap', 'item-text-size']"
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
                    :bp.sync="itemBp"
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
                  <pw-block-settings
                    v-if="!isItemLinkStyleButton(block.blockType)"
                    view="items-layout"
                    :block="block"
                    :config="blockConfigs[block.blockType]"
                    :overrides="blockOverrides[block.blockType] || {}"
                    :writer-active="writerActive[block.blockType] !== false"
                    :layout-keys="['item-link-decoration', 'item-link-icon']"
                    @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                    @update:writer-active="$set(writerActive, block.blockType, $event)"
                  />
                </div>
              </section>
            </template>

            <!-- Colors section (multi-theme) -->
            <template v-if="blockValueDefaults[block.blockType]">
              <section class="pw-card-section">
                <!-- colours: choose the theme, the rows show only its value -->
                <div class="pw-card-heading-row">
                  <h3 class="pw-card-heading">{{ $t('prw.subtab.colors') }}</h3>
                  <span class="pw-pill pw-theme-switch" role="group">
                    <button
                      v-for="theme in themes"
                      :key="'th-' + theme"
                      type="button"
                      class="pw-tool"
                      :aria-pressed="currentItemColorTheme === theme ? 'true' : 'false'"
                      @click="itemColorTheme = theme"
                    >{{ $t('pw.option.' + theme) }}</button>
                  </span>
                </div>
                <div class="pw-card pw-field-table">
                  <pw-block-values
                    :bp.sync="itemBp"
                    :defaults="blockValueDefaults[block.blockType]"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="itemColorsShowOnly(block.blockType)"
                    :labels="block.blockType === 'pwsteplist' ? stepColorLabels(block.blockType) : {}"
                    :theme="currentItemColorTheme"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  />
                </div>
              </section>
            </template>
          </div>

        </div>

    </div>
    <aside class="pw-preview-column">
      <!-- collapsed: an eye at the height of the menu's search button, opens the preview -->
      <k-button
        v-if="!showPreview"
        class="pw-preview-open"
        icon="preview"
        :title="$t('expand')"
        @click="togglePreview"
      />
    </aside>
    <!-- Collapse/expand the preview sidebar, like the arrow of Kirby's menu -->
    <k-button
      class="pw-preview-toggle"
      :icon="showPreview ? 'angle-right' : 'angle-left'"
      :title="showPreview ? $t('collapse') : $t('expand')"
      size="xs"
      @click="togglePreview"
    />
    </div>
  </k-panel-inside>
</template>

<script>
import autosize from '../directives/autosize.js';

export default {
  directives: { 'pw-autosize': autosize },
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
      // element chosen in the header dropdown (tab "Elements")
      selectedElement: (() => { try { const e = sessionStorage.getItem('pw-wizard-element'); sessionStorage.removeItem('pw-wizard-element'); return e; } catch (e) { return null; } })(),
      // font shown in the fonts preview (null = the default font)
      previewFont: null,
      // block type → number of uses in the project (loaded when the blocks dropdown opens)
      blockUsage: {},
      showPreview: (() => { try { return localStorage.getItem('pw-wizard-preview') !== 'off'; } catch (e) { return true; } })(),
      // theme shown in the blocks' colour card and preview
      blocksColorTheme: 'default',
      // device of the blocks preview
      blocksPreviewBp: 'default',
      // radii kept while the corners are square (for switching back)
      customRadius: null,
      // padding step shown in the blocks' padding card
      paddingStep: 'large',
      discardKey: 0,
      headerPill: 'general',
      headerSubtab: 'layout',
      blocks: [],
      activeBlocks: [],
      // theme variants switched on (besides "default"); variant3 off by default
      activeVariants: ['variant', 'variant2'],
      originalActiveVariants: ['variant', 'variant2'],
      activeTab: 'global',
      globalActiveTab: (() => { try { const t = sessionStorage.getItem('pw-wizard-tab'); sessionStorage.removeItem('pw-wizard-tab'); return t || 'general'; } catch (e) { return 'general'; } })(),
      blockConfigs: {},
      blockOverrides: {},
      originalOverrides: {},
      blockValueDefaults: {},
      blockValueOverrides: {},
      originalBlockValueOverrides: {},
      originalActiveBlocks: [],
      dirtyTabs: {},
      snapshots: {},
      writerActive: {},
      // chosen tab of a block view (design, defaults, presets); null: the first
      blockViewTab: null,
      // steplist: item style shown in the design tab and the preview (per block)
      stepPreviewStyle: {},
      // theme shown in the items' colour card
      itemColorTheme: 'default',
      // guides in the block preview (and the matching stripes in the rows)
      previewGuides: (() => { try { return localStorage.getItem('pw-wizard-guides') === 'on'; } catch (e) { return false; } })(),
      // breakpoint shown in the items' responsive rows
      itemBp: 'default',
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
      aiForm: null,
      aiValues: {},
      originalAiValues: {},
      aiSecrets: null,
      aiSecretsWritable: true,
      aiSecretInputs: {},
    };
  },
  computed: {
    // tabs of the current view (global or block) for the header
    // top-level elements for the header dropdown (child elements like cite/caption
    // are edited together with their parent) — available on every view
    elementOptions() {
      const children = ['cite', 'caption'];
      return Object.entries(this.elementDefaults || {})
        .filter(([key, val]) => val && typeof val === 'object' && (val.vars || val.colors) && !children.includes(key))
        .map(([key]) => {
          const tKey = 'prw.elementgroup.' + key;
          const text = this.$t(tKey);
          const icons = { heading: 'title', tagline: 'tag', editor: 'text', quote: 'quote', button: 'url', breadcrumb: 'angle-right', media: 'images' };
          return { value: key, text: text && text !== tKey ? text : key, icon: icons[key] || 'layers' };
        });
    },
    // themes shown in the wizard: "default" plus the switched-on variants
    themes() {
      return ['default', ...this.activeVariants];
    },
    // outer spacing of the blocks (block layout): top and bottom
    marginSides() {
      return [
        { key: 'top', name: 'global-margin-top' },
        { key: 'bottom', name: 'global-margin-bottom' },
      ];
    },
    // the four paddings, one row each
    paddingSides() {
      return [
        { key: 'top', name: 'global-padding-top', pair: true },
        { key: 'bottom', name: 'global-padding-bottom', pair: true },
        { key: 'left', name: 'global-padding-left' },
        { key: 'right', name: 'global-padding-right' },
      ];
    },
    // global corners: square when all four radii are 0, else custom
    radiusShape() {
      const radii = this.globalLayoutValues['global-'] || [];
      return Array.isArray(radii) && radii.length && radii.every(r => parseFloat(r) === 0) ? 'square' : 'custom';
    },
    // outer spacing of a block (global margins) around the preview tile
    blockPreviewMarginStyle() {
      return {
        paddingTop: this.globalLayoutValues['global-margin-top'] || 0,
        paddingBottom: this.globalLayoutValues['global-margin-bottom'] || 0,
      };
    },
    currentBlocksColorTheme() {
      return this.themes.includes(this.blocksColorTheme) ? this.blocksColorTheme : 'default';
    },
    // the chosen theme, back to "default" when its variant was switched off
    currentItemColorTheme() {
      return this.themes.includes(this.itemColorTheme) ? this.itemColorTheme : 'default';
    },
    // global tabs collected in the cog dropdown (above the block settings), AI only with contentwizard
    // heading of a global view: the tab's name, for an element its name
    globalPageTitle() {
      if (this.globalActiveTab === 'elements') {
        const element = this.elementOptions.find(o => o.value === this.selectedElement);
        if (element) return element.text;
      }
      return this.$t('prw.tab.' + this.globalActiveTab);
    },
    projectMenuTabs() {
      return ['general', 'header', 'footer', 'blocks', 'fonts', ...(this.hasAiTab ? ['ai'] : [])];
    },
    // activated blocks with their own settings view (pw* blocks), for the blocks dropdown
    // tabs of a block view: design (only with values), start values, restrictions
    blockViewTabs() {
      const views = this.hasDesign(this.activeTab) ? ['design', 'defaults', 'presets'] : ['defaults', 'presets'];
      // design: the columns, start values: the pen, restrictions: the crossed-out eye
      const icons = { design: 'layout-columns', defaults: 'edit-line', presets: 'hidden' };
      return views.map(name => ({
        name,
        icon: icons[name],
        label: this.$t('prw.view.' + name),
        click: () => { this.blockViewTab = name; },
      }));
    },
    currentBlockView() {
      const names = this.blockViewTabs.map(t => t.name);
      return names.includes(this.blockViewTab) ? this.blockViewTab : names[0];
    },
    activeBlockEntries() {
      return this.blocks.filter(b => b.active && b.blockType.startsWith('pw'));
    },
    hasAiTab() {
      return !!this.aiForm || !!(this.aiSecrets && this.aiSecrets.length);
    },
    globalTabs() {
      const tabs = [
        { key: 'general', icon: 'globe' },
        { key: 'blocks', icon: 'box' },
        { key: 'elements', icon: 'layers' },
        { key: 'fonts', icon: 'title' },
        { key: 'header', icon: 'prw-header' },
        { key: 'footer', icon: 'prw-footer' },
      ];
      // AI defaults — only when kirby-contentwizard is installed
      if (this.hasAiTab) tabs.push({ key: 'ai', icon: 'ai' });
      tabs.push({ key: 'settings', icon: 'cog' });
      return tabs;
    },
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
    // global layout values (defaults + overrides), e.g. global-padding-left
    globalLayoutValues() {
      const vars = this.globalDefaults.layout?.vars || {};
      const ov = this.globalOverrides.global || {};
      const out = {};
      for (const [name, def] of Object.entries(vars)) {
        out[name] = ov[name] !== undefined && ov[name] !== '' ? ov[name] : def.value;
      }
      return out;
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
    // installed fonts (built-in and uploaded), each family once, sorted
    installedFonts() {
      const all = { ...(this.fontsData.builtin || {}), ...(this.fontsData.project || {}) };
      const seen = new Map();
      for (const f of Object.values(all)) {
        if (f && f.family && !seen.has(f.family)) seen.set(f.family, f);
      }
      return [...seen.values()].sort((a, b) => a.family.localeCompare(b.family));
    },
    previewFontFamily() {
      return this.previewFont || this.bodyDefaultFont;
    },
    previewFontStyle() {
      const font = this.installedFonts.find(f => f.family === this.previewFontFamily);
      return {
        fontFamily: "'" + this.previewFontFamily + "', " + (font?.category || 'sans-serif'),
        // readable on the page background (the preview sits on it)
        color: this.contrastColor(this.bodyBackgroundColor),
      };
    },
    isDirty() {
      if (this.activeTab === 'global') {
        const tab = this.globalActiveTab;
        if (tab === 'settings') return !!this.dirtyTabs['global'];
        // the project page also holds the block activation
        if (tab === 'general') return !!this.dirtyTabs['global-settings'] || !!this.dirtyTabs['global'];
        if (['blocks', 'fonts'].includes(tab)) return !!this.dirtyTabs['global-settings'];
        return !!this.dirtyTabs[tab];
      }
      return !!this.dirtyTabs[this.activeTab];
    },
  },
  watch: {
    // another block: start on its first tab
    activeTab() {
      this.blockViewTab = null;
    },
    blockType: {
      immediate: true,
      handler(val) {
        this.activeTab = val || 'global';
      },
    },
    globalOverrides: { deep: true, handler() { this.injectPreviewStyles(); } },
    previewGuides(on) {
      try { localStorage.setItem('pw-wizard-guides', on ? 'on' : 'off'); } catch (e) { /* no storage */ }
    },
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
        this.activeVariants = res.activeVariants || ['variant', 'variant2'];
        this.originalActiveVariants = [...this.activeVariants];

        this.originalActiveBlocks = [...this.activeBlocks];
        this.$set(this.snapshots, 'global', this.globalSnapshot());

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

        // Load AI defaults (kirby-contentwizard); absent plugin → no tab
        try {
          const ai = await this.$api.get('contentwizard/settings');
          this.setAiForm(ai);
        } catch (e) {
          this.aiForm = null;
        }
        // API keys of installed AI plugins (admins only; others get a 403)
        try {
          this.setAiSecrets(await this.$api.get('pagewizard/secrets'));
        } catch (e) {
          this.aiSecrets = null;
        }

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
    isItemBorderEnabled(blockType) {
      return this.itemLayoutDefault(blockType, 'item-border') === true;
    },
    isItemLinkStyleButton(blockType) {
      return this.itemLayoutDefault(blockType, 'item-link-style') === 'button';
    },
    isItemShapeVisible(blockType) {
      // featurelist: the shape belongs to the icon tile, so only with icon-style "tile"
      const iconStyle = this.itemLayoutDefault(blockType, 'item-icon-style');
      return iconStyle === undefined || iconStyle === null || iconStyle === 'tile';
    },
    isItemRadiusVisible(blockType) {
      // Blocks with an item-shape (logocloud) only use the radii for "custom";
      // blocks without one always show them.
      if (!this.isItemShapeVisible(blockType)) return false;
      const shape = this.itemLayoutDefault(blockType, 'item-shape');
      return shape === undefined || shape === null || shape === 'custom';
    },
    itemColorsShowOnly(blockType) {
      // Link colors only matter when link-style="text" (button mode pulls from
      // global element-button-*). Border color only matters when border is on.
      const list = ['item-background', 'item-tagline-text', 'item-heading-text', 'item-editor-text'];
      if (!this.isItemLinkStyleButton(blockType)) {
        list.push('item-link', 'item-link-hover', 'item-link-active');
      }
      if (this.isItemBorderEnabled(blockType)) {
        list.push('item-border-color');
      }
      // Generic item-icon-fill — blocks that don't define it (e.g. cardlets)
      // are filtered out by BlockValues' own showOnly check.
      list.push('item-icon-fill');
      if (this.itemLayoutDefault(blockType, 'item-icon-style') === 'tile') {
        list.push('item-icon-tile-background');
      }
      // steplist: the number's colour (minimal: the number is text in the
      // "background" colour), with a bubble also its background
      if (blockType === 'pwsteplist') {
        list.push(this.stepNumberColor(blockType));
        if (this.currentStepStyle(blockType) !== 'minimal') list.push('item-number-background');
        // the connector line only with the style "connected"
        if (this.currentStepStyle(blockType) === 'connected') list.push('item-connector');
      } else {
        list.push('item-connector');
      }
      return list;
    },
    // square: all radii 0 (the custom ones kept for switching back);
    // custom: the kept radii, else the defaults
    setRadiusShape(shape) {
      const overrides = JSON.parse(JSON.stringify(this.globalOverrides || {}));
      if (!overrides.global) overrides.global = {};
      if (shape === 'square') {
        if (this.radiusShape === 'custom') this.customRadius = this.globalLayoutValues['global-'];
        overrides.global['global-'] = ['0rem', '0rem', '0rem', '0rem'];
      } else if (this.customRadius) {
        overrides.global['global-'] = [...this.customRadius];
      } else {
        delete overrides.global['global-'];
      }
      if (Object.keys(overrides.global).length === 0) delete overrides.global;
      this.onGlobalOverridesUpdate(overrides);
    },
    paddingStepValue(value) {
      return Array.isArray(value) ? value[this.paddingStep === 'large' ? 1 : 0] : value;
    },
    // global padding of a side; top/bottom at the chosen step (small/large)
    paddingDefault(side) {
      const def = this.globalDefaults.layout?.vars?.[side.name]?.value;
      return side.pair ? (Array.isArray(def) ? def[this.paddingStep === 'large' ? 1 : 0] : '') : (def || '');
    },
    paddingValue(side) {
      const ov = (this.globalOverrides.global || {})[side.name];
      if (side.pair) return (Array.isArray(ov) && ov[this.paddingStep === 'large' ? 1 : 0]) || this.paddingDefault(side);
      return ov || this.paddingDefault(side);
    },
    setPadding(side, input) {
      const num = parseFloat(String(input).replace(',', '.'));
      const value = isNaN(num) ? this.paddingDefault(side) : num + 'rem';
      const overrides = JSON.parse(JSON.stringify(this.globalOverrides || {}));
      if (!overrides.global) overrides.global = {};
      const def = this.globalDefaults.layout?.vars?.[side.name]?.value;
      if (side.pair) {
        const current = Array.isArray(overrides.global[side.name]) ? [...overrides.global[side.name]] : [...(def || [])];
        current[this.paddingStep === 'large' ? 1 : 0] = value;
        if (Array.isArray(def) && current.every((v, i) => v === def[i])) delete overrides.global[side.name];
        else overrides.global[side.name] = current;
      } else if (value === def) {
        delete overrides.global[side.name];
      } else {
        overrides.global[side.name] = value;
      }
      if (Object.keys(overrides.global).length === 0) delete overrides.global;
      this.onGlobalOverridesUpdate(overrides);
    },
    // a size step (heading-size-lg …) at a breakpoint: override, else default
    fontStep(element, step, bp = 'default') {
      const name = element + '-size-' + step;
      const entry = this.fontDefaults[element]?.vars?.[name];
      if (!entry) return '';
      return ((this.fontOverrides.global || {})[bp] || {})[name] || entry[bp] || entry.default || '';
    },
    // near-black on a light colour, near-white on a dark one (#rgb/#rrggbb)
    contrastColor(color) {
      let hex = String(color || '').trim().replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (!/^[0-9a-f]{6}/i.test(hex)) return '';
      const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
      return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#111111' : '#f5f5f5';
    },
    // the items' four corner radii: override, else the plugin's value
    itemRadiusValues(blockType) {
      const ov = (this.blockValueOverrides[blockType] || {})['item-radius'];
      if (Array.isArray(ov)) {
        const def = this.itemRadiusDefaults(blockType);
        return def.map((v, i) => ov[i] || v);
      }
      return this.itemRadiusDefaults(blockType);
    },
    itemRadiusDefaults(blockType) {
      for (const group of Object.values(this.blockValueDefaults[blockType] || {})) {
        const def = group && group.vars && group.vars['item-radius'];
        if (def && Array.isArray(def.value)) return def.value;
      }
      return [];
    },
    // steplist: the item styles to choose from, and the one shown (the pill
    // chosen, else the block's preset)
    stepStyleOptions(blockType) {
      const def = this.blockConfigs[blockType]?.defaults?.settings?.fields?.style?.['item-style'];
      return (def && def.options) || ['default'];
    },
    // a value of the shown style: "default" uses the plain name, the other
    // styles their own (item-number-size-centered …)
    stepValueKey(blockType, name) {
      const style = this.currentStepStyle(blockType);
      return style === 'default' ? name : name + '-' + style;
    },
    // colour of the number: the digit in the bubble, minimal: the text
    // (which the steplist CSS colours with the "background" colour)
    stepNumberColor(blockType) {
      return this.currentStepStyle(blockType) === 'minimal' ? 'item-number-background' : 'item-number-text';
    },
    // steplist colour rows: the number's colour named "Numbering", its
    // bubble background "Background colour"
    stepColorLabels(blockType) {
      const labels = { [this.stepNumberColor(blockType)]: this.$t('prw.headline.numbering') };
      if (this.currentStepStyle(blockType) !== 'minimal') labels['item-number-background'] = this.$t('prw.label.backgroundColor');
      return labels;
    },
    currentStepStyle(blockType) {
      if (this.stepPreviewStyle[blockType]) return this.stepPreviewStyle[blockType];
      const ov = this.blockOverrides[blockType]?.settings?.fields?.style?.['item-style']?.default;
      return ov || this.blockConfigs[blockType]?.defaults?.settings?.fields?.style?.['item-style']?.default || 'default';
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
    // a block with values of its own (the items' CSS variables)
    hasDesign(blockType) {
      return this.hasItemFields(blockType) && !!this.blockValueDefaults[blockType];
    },
    hasItemDefaultFields(blockType) {
      // The Defaults sub-section inside Items only makes sense when the plugin
      // exposes per-corner item-radius toggles or item-link-style. Empty for
      // simple item-blocks (steplist, featurelist).
      const cfg = this.blockConfigs[blockType];
      const layout = cfg && cfg.defaults && cfg.defaults.settings && cfg.defaults.settings.fields && cfg.defaults.settings.fields.layout || {};
      for (const key of Object.keys(layout)) {
        if (key.startsWith('item-radius-') || key === 'item-link-style') return true;
      }
      return false;
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
      this.$set(this.dirtyTabs, 'global', this.globalSnapshot() !== this.snapshots['global']);
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
        this.$panel.notification.error(this.$t('prw.notify.fontsizes.error'));
      }
    },

    // --- Global: AI (kirby-contentwizard) ---
    setAiForm(ai) {
      this.aiForm = { fields: ai.fields || {} };
      this.aiValues = JSON.parse(JSON.stringify(ai.value || {}));
      this.originalAiValues = JSON.parse(JSON.stringify(ai.value || {}));
      this.$set(this.snapshots, 'ai', JSON.stringify(this.aiValues));
      this.$set(this.dirtyTabs, 'ai', false);
    },

    onAiInput(values) {
      this.aiValues = values;
      this.updateAiDirty();
    },

    setAiSecrets(res) {
      this.aiSecrets = res.secrets || [];
      this.aiSecretsWritable = res.writable !== false;
      this.aiSecretInputs = {};
    },

    onSecretInput(env, value) {
      this.$set(this.aiSecretInputs, env, value);
      this.updateAiDirty();
    },

    updateAiDirty() {
      const settingsDirty = !!this.aiForm && JSON.stringify(this.aiValues) !== this.snapshots['ai'];
      const keysDirty = Object.values(this.aiSecretInputs).some(v => v && v.trim() !== '');
      this.$set(this.dirtyTabs, 'ai', settingsDirty || keysDirty);
    },

    async removeSecret(secret) {
      if (!window.confirm(this.$t('prw.ai.keys.confirm', { label: secret.label }))) return;
      try {
        this.setAiSecrets(await this.$api.post('pagewizard/secrets', { remove: [secret.env] }));
        this.updateAiDirty();
        this.$panel.notification.success(this.$t('prw.notify.ai.success'));
      } catch (e) {
        this.$panel.notification.error(this.$t('prw.notify.ai.error'));
      }
    },

    async saveAi() {
      try {
        if (this.aiForm && JSON.stringify(this.aiValues) !== this.snapshots['ai']) {
          this.setAiForm(await this.$api.post('contentwizard/settings', this.aiValues));
        }
        const set = {};
        for (const [env, value] of Object.entries(this.aiSecretInputs)) {
          if (value && value.trim() !== '') set[env] = value.trim();
        }
        if (Object.keys(set).length) {
          this.setAiSecrets(await this.$api.post('pagewizard/secrets', { set }));
        }
        this.updateAiDirty();
        this.$panel.notification.success(this.$t('prw.notify.ai.success'));
      } catch (e) {
        this.$panel.notification.error(this.$t('prw.notify.ai.error'));
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
        this.$panel.notification.success(this.$t('prw.notify.footer.success'));
      } catch (e) {
        this.$panel.notification.error(this.$t('prw.notify.footer.error'));
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
        this.$panel.notification.success(this.$t('prw.notify.elements.success'));
      } catch (e) {
        this.$panel.notification.error(this.$t('prw.notify.elements.error'));
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
    blockPreviewStyle(theme, single = false) {
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
      if (Array.isArray(radius) && radius.length === 4 && single) {
        // one tile: all four corners (top-left, top-right, bottom-left, bottom-right)
        borderRadius = [radius[0], radius[1], radius[3], radius[2]].join(' ');
      } else if (Array.isArray(radius) && radius.length === 4) {
        if (theme === 'default') {
          borderRadius = radius[0] + ' ' + radius[1] + ' 0 0';
        } else if (theme === 'variant3') {
          borderRadius = '0 0 ' + radius[3] + ' ' + radius[2];
        } else {
          borderRadius = '0';
        }
      }
      return {
        backgroundColor: bg,
        // top/bottom are small/large pairs: the step chosen in the padding card
        paddingTop: this.paddingStepValue(getGlobal('global-padding-top')) || '1.5rem',
        paddingBottom: this.paddingStepValue(getGlobal('global-padding-bottom')) || '1.5rem',
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
    blockPreviewElementStyle(element, theme, bp = 'default') {
      const elDef = this.elementDefaults[element] || {};
      const elOv = this.elementOverrides.global || {};
      const get = (v) => elOv[v] || '';
      // responsive values at the chosen device
      const def = (v) => {
        const d = elDef.vars?.[v];
        if (!d) return '';
        if (d.default !== undefined) return (elOv[bp] || {})[v] || d[bp] || d.default;
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
        // headings have no base size: the "lg" step, as in the frontend
        fontSize: def(element + '-font-size') || this.fontStep(element, 'lg', bp),
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
      // underline as set for the links (none / always / on hover)
      const decoration = this.globalLayoutValue('block-link-decoration') || 'none';
      return {
        color: colorOv || colorDef,
        textDecorationLine: decoration === 'always' ? 'underline' : 'none',
        textDecorationThickness: this.globalLayoutValue('block-link-thickness'),
        textUnderlineOffset: this.globalLayoutValue('block-link-offset'),
        cursor: 'pointer',
      };
    },
    // a global value of any group (override, else the plugin's)
    globalLayoutValue(name) {
      const ov = (this.globalOverrides.global || {})[name];
      if (ov !== undefined && ov !== '') return ov;
      for (const group of Object.values(this.globalDefaults || {})) {
        if (group && group.vars && group.vars[name]) return group.vars[name].value;
      }
      return '';
    },
    // gap between the editor's paragraphs (em: at the paragraph's size)
    blockPreviewParagraphSpacing() {
      return (this.elementOverrides.global || {})['editor-paragraph-spacing']
        || this.elementDefaults.editor?.vars?.['editor-paragraph-spacing']?.value || '0';
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
      for (const theme of ['default', 'variant', 'variant2', 'variant3']) {
        const linkHover = this.blockPreviewLinkColor(theme, '-hover');
        const linkActive = this.blockPreviewLinkColor(theme, '-active');
        rules.push('.pw-preview-link-' + theme + ':hover { color: ' + linkHover + ' !important;'
          + (this.globalLayoutValue('block-link-decoration') === 'none' ? '' : ' text-decoration-line: underline !important;') + ' }');
        rules.push('.pw-preview-link-' + theme + ':active { color: ' + linkActive + ' !important; }');
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
        this.$panel.notification.success(this.$t('prw.notify.header.success'));
      } catch (e) {
        this.$panel.notification.error(this.$t('prw.notify.header.error'));
      }
    },

    // --- Block overrides ---
    onBlockOverridesUpdate(blockType, overrides) {
      // BlockSettings changes the object in place: store a fresh copy, so
      // everything reading it (e.g. the live preview) notices the change
      overrides = JSON.parse(JSON.stringify(overrides || {}));
      this.$set(this.blockOverrides, blockType, overrides);
      const current = JSON.stringify(overrides);
      const snapshot = this.snapshots[blockType] || '{}';
      this.$set(this.dirtyTabs, blockType, current !== snapshot);
      const config = this.blockConfigs[blockType];
      if (config) config.hasOverrides = Object.keys(overrides || {}).length > 0;
    },

    // --- Save / Discard ---
    isGlobalTab(...keys) {
      return this.activeTab === 'global' && keys.includes(this.globalActiveTab);
    },
    // Opens a tab of the global view; from a block view it switches views and
    // remembers the tab (and element) for the global view to pick up.
    openGlobal(tab, element = null) {
      this.globalActiveTab = tab;
      if (this.activeTab === 'global') return;
      try {
        sessionStorage.setItem('pw-wizard-tab', tab);
        if (element) sessionStorage.setItem('pw-wizard-element', element);
      } catch (e) {}
      this.$go('projectwizard');
    },

    async loadBlockUsage() {
      try {
        this.blockUsage = await this.$api.get('projectwizard/blocks/usage');
      } catch (e) {}
    },

    globalSnapshot() {
      return JSON.stringify({ blocks: this.activeBlocks, variants: this.activeVariants });
    },
    toggleVariant(variant, on) {
      const set = new Set(this.activeVariants);
      on ? set.add(variant) : set.delete(variant);
      this.activeVariants = ['variant', 'variant2', 'variant3'].filter(v => set.has(v));
      this.$set(this.dirtyTabs, 'global', this.globalSnapshot() !== this.snapshots['global']);
    },

    togglePreview() {
      this.showPreview = !this.showPreview;
      try { localStorage.setItem('pw-wizard-preview', this.showPreview ? 'on' : 'off'); } catch (e) {}
    },

    async saveCurrentView() {
      const cssBefore = await this.frontendCssVersion();
      if (this.activeTab === 'global') {
        const tab = this.globalActiveTab;
        if (tab === 'settings') {
          await this.saveGlobal();
        } else if (tab === 'general') {
          if (this.dirtyTabs['global-settings']) await this.saveGlobalSettings();
          if (this.dirtyTabs['global']) await this.saveGlobal();
        } else if (['blocks', 'fonts'].includes(tab)) {
          await this.saveGlobalSettings();
        } else if (tab === 'elements') {
          await this.saveElements();
        } else if (tab === 'header') {
          await this.saveNavigation();
        } else if (tab === 'footer') {
          await this.saveFooter();
        } else if (tab === 'ai') {
          await this.saveAi();
        }
      } else {
        await this.saveBlock(this.activeTab);
      }
      // Trigger projectbuilder hook to regenerate tailwind.css
      try { await fetch(window.location.origin, { cache: 'no-store' }); } catch(e) {}
      this.reloadFrontend(cssBefore);
    },

    // Last-Modified of the built frontend CSS (Tailwind rebuilds it in the background)
    async frontendCssVersion() {
      try {
        const res = await fetch(window.panel.urls.site + '/assets/css/site.min.css', { method: 'HEAD', cache: 'no-store' });
        return res.headers.get('last-modified');
      } catch (e) {
        return null;
      }
    },

    // Reload open frontend tabs like a module save does (pagewizard's reloadOnSave
    // listens on this channel) — once the new CSS is built, at most after 3 s.
    async reloadFrontend(cssBefore) {
      if (!('BroadcastChannel' in window)) return;
      for (let waited = 0; waited < 3000; waited += 250) {
        if ((await this.frontendCssVersion()) !== cssBefore) break;
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      // Keep the channel open (like pagewizard): closing it right after
      // postMessage can drop the message before the frontend tab gets it
      if (!this._frontendChannel) this._frontendChannel = new BroadcastChannel(window.panel.urls.site);
      this._frontendChannel.postMessage('content/saved');
    },

    discardChanges() {
      if (this.activeTab === 'global') {
        const tab = this.globalActiveTab;
        if (tab === 'settings' || tab === 'general') {
          this.activeBlocks = [...this.originalActiveBlocks];
          this.activeVariants = [...this.originalActiveVariants];
          for (const block of this.blocks) {
            block.active = this.activeBlocks.includes(block.blockType);
          }
          this.$set(this.dirtyTabs, 'global', false);
        }
        if (['general', 'blocks', 'fonts'].includes(tab)) {
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
        } else if (tab === 'ai') {
          this.aiValues = JSON.parse(JSON.stringify(this.originalAiValues));
          this.aiSecretInputs = {};
          this.$set(this.dirtyTabs, 'ai', false);
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
        await this.$api.post('projectwizard/blocks/active', { blocks: this.activeBlocks, variants: this.activeVariants });
        this.originalActiveBlocks = [...this.activeBlocks];
        this.originalActiveVariants = [...this.activeVariants];
        this.$set(this.snapshots, 'global', this.globalSnapshot());
        this.$set(this.dirtyTabs, 'global', false);
        this.$panel.notification.success(this.$t('prw.notify.blocks.success'));
        setTimeout(() => window.location.reload(), 100);
      } catch (e) {
        this.$panel.notification.error(this.$t('prw.notify.blocks.error'));
      }
    },

    async saveGlobalSettings() {
      try {
        const res = await this.$api.post('projectwizard/global', this.globalOverrides);
        this.globalOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
        this.originalGlobalOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
        this.$set(this.snapshots, 'global-settings', JSON.stringify(this.safeOverrides(res.overrides)));
        this.$set(this.dirtyTabs, 'global-settings', false);
        this.$panel.notification.success(this.$t('prw.notify.global.success'));

      } catch (e) {
        this.$panel.notification.error(this.$t('prw.notify.global.error'));
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

        this.$panel.notification.success(this.$t('prw.notify.block.success', { block: this.blockLabel(blockType) }));
      } catch (e) {
        this.$panel.notification.error(this.$t('prw.notify.block.error', { block: this.blockLabel(blockType) }));
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
/*------------------------------------------------------------------------------------------------
	Header in Kirby's topbar (same look as kirby-explorer): no breadcrumb,
	no page heading, the tabs as a pill, save buttons on the right
------------------------------------------------------------------------------------------------*/
.pw-wizard .k-topbar-breadcrumb,
.pw-wizard .k-topbar-spacer {
  display: none;
}
.pw-wizard .k-topbar-signals:empty {
  display: none;
}
.pw-wizard .k-topbar > .pw-portal {
  flex: 1 1 0;
  min-width: 0;
}
.pw-wizard .k-topbar {
  padding-inline: var(--spacing-2);
  margin-inline: calc(var(--spacing-2) * -1);
  align-items: center;
  margin-bottom: var(--spacing-6);
  flex-wrap: nowrap;
  column-gap: var(--spacing-3);
  position: sticky;
  top: 0;
  z-index: 3;
  padding-block: var(--spacing-3) var(--spacing-4);
  margin-top: calc(var(--spacing-3) * -1);
  background: var(--color-background);
}
.pw-wizard .k-topbar::after {
  content: "";
  position: absolute;
  inset-inline: var(--spacing-2);
  bottom: 0;
  height: 1px;
  background: var(--color-border);
}
.pw-wizard .k-panel-menu-proxy {
  margin-inline-end: calc(var(--spacing-2) * -1);
}
.pw-topbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-height: var(--height-md, 2.25rem);
}
/* the groups stay in one line each */
.pw-topbar > .pw-pill {
  flex-wrap: nowrap;
  flex-shrink: 0;
}
/*------------------------------------------------------------------------------------------------
	Sections: a heading above a card with rows in Kirby's table look (as a
	structure field / kirby-explorer's edit view). Shared by all wizard parts:
	<section class="pw-card-section"><h2 class="pw-card-heading">…</h2>
	<div class="pw-card pw-field-table"> rows (.pw-field-row) </div></section>
------------------------------------------------------------------------------------------------*/
.pw-card-section {
  margin-bottom: var(--spacing-8);
}
/* heading line: the heading, optional switches on the right */
.pw-card-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-2);
}
/* like Kirby's field label above a structure field */
.pw-card-heading {
  font-size: var(--text-sm);
  font-weight: var(--font-semi);
  line-height: var(--leading-normal, 1.5);
}
.pw-card {
  --pw-table-border: var(--table-color-border, light-dark(var(--color-gray-200), var(--color-gray-800)));
  --pw-table-th-back: var(--table-color-th-back, light-dark(var(--color-gray-100), var(--color-gray-850)));
  background: var(--item-color-back, var(--color-white));
  border-radius: var(--rounded);
  box-shadow: var(--shadow);
}
/* no clipping (the reset buttons sit outside): first and last row round
   the corners themselves */
.pw-card > :first-child,
.pw-card > :first-child .pw-field-row-label-col {
  border-start-start-radius: var(--rounded);
}
.pw-card > :first-child {
  border-start-end-radius: var(--rounded);
}
.pw-card > :last-child,
.pw-card > :last-child .pw-field-row-label-col {
  border-end-start-radius: var(--rounded);
}
.pw-card > :last-child {
  border-end-end-radius: var(--rounded);
}
/* reset: icon only, absolutely placed just outside the row on the right
   (takes no width from the card) */
.pw-field-table .pw-field-reset {
  right: auto;
  left: calc(100% + var(--spacing-3));
  --button-color-back: transparent;
  background: transparent;
}
.pw-field-table .pw-field-reset .k-button-text {
  display: none;
}

/* rows: label cell on the left (grey, mono), the value flush in the cell */
.pw-field-table .pw-field-row {
  position: relative;
  padding: 0;
  border-bottom: 1px solid var(--pw-table-border);
}
.pw-field-table > .pw-field-row:last-child,
.pw-field-table > :last-child .pw-field-row:last-child {
  border-bottom: 0;
}
.pw-field-table .pw-field-row > .k-input {
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  outline: 0;
}
.pw-field-table .pw-field-row-inner {
  grid-template-columns: 30% 1fr;
  align-items: stretch;
  min-height: var(--table-row-height, 38px);
  padding: 0;
}
.pw-field-table .pw-field-row-label-col {
  padding-inline: var(--table-cell-padding, var(--spacing-3));
  background: var(--pw-table-th-back);
  border-inline-end: 1px solid var(--pw-table-border);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--table-color-th-text, var(--color-text-dimmed));
}
.pw-field-table .pw-field-row-label,
.pw-field-table .pw-sizes-toggle {
  font: inherit;
  color: inherit;
}
.pw-field-table .pw-field-row-options {
  padding: var(--spacing-1) var(--table-cell-padding, var(--spacing-3));
}
/* column headings (Mobile | Tablet | Desktop, themes) as a header row */
.pw-field-table .pw-group-header {
  display: grid;
  grid-template-columns: 30% 1fr;
  margin: 0;
  background: var(--pw-table-th-back);
  border-bottom: 1px solid var(--pw-table-border);
}
.pw-field-table .pw-group-header .pw-field-row-label-col {
  width: auto;
  background: transparent;
}
.pw-field-table .pw-group-header-labels {
  padding: var(--spacing-2) var(--table-cell-padding, var(--spacing-3));
}
/* responsive rows switch the breakpoint in the row, colours the theme in
   the heading line: no column headings */
.pw-field-table .pw-group-header:has(.pw-group-type-theme-color),
.pw-field-table .pw-group-header:has(.pw-group-type-responsive) {
  display: none;
}
.pw-field-table .pw-bp-switch {
  margin-inline-start: auto;
}
/* number fields flat in the cell, like the explorer's inputs: no box, the
   unit right behind the number ("1.5 rem"); the input is only as wide as
   its value (v-pw-autosize), the rest of the field still takes the click */
.pw-field-table .pw-field-row-options > .pw-element-field:has(.pw-element-input-number) {
  flex: 1;
  align-self: stretch;
}
.pw-field-table .pw-element-input-wrap:has(> .pw-element-input-number) {
  flex: 1;
  align-self: stretch;
  cursor: text;
}
.pw-field-table .pw-element-input-number {
  min-width: 1ch;
  height: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.pw-field-table .pw-element-input-number:focus {
  outline: 0;
}
/* numbers always in full colour, also the defaults (only the unit is grey) */
.pw-field-table .pw-element-input-number,
.pw-field-table .pw-element-input-number.is-default {
  color: var(--color-text);
}
.pw-field-table .pw-element-input-wrap > .pw-element-unit {
  color: var(--color-text-dimmed);
}
.pw-field-table .pw-element-input-wrap > .pw-element-unit {
  position: static;
  margin-inline-start: 0.35em;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}
/* several values in one row: a hairline between them */
.pw-field-table .pw-element-field + .pw-element-field:has(.pw-element-input-number) {
  padding-inline-start: var(--spacing-3);
  border-inline-start: 1px solid var(--pw-table-border);
}
/* four corners (values or radius switches): a 2×2 grid filling the cell
   (top-left, top-right / bottom-left, bottom-right), hairlines between */
.pw-field-table .pw-field-row-options.pw-corner-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding: 0;
}
.pw-field-table .pw-corner-grid > *,
.pw-field-table .pw-corner-grid > * + * {
  min-height: var(--table-row-height, 38px);
  display: flex;
  align-items: center;
  margin: 0;
  padding: var(--spacing-1) var(--table-cell-padding, var(--spacing-3));
  border: 0;
}
.pw-field-table .pw-corner-grid .k-toggle-input {
  margin: 0;
  padding: 0;
}
/* radius switches: the switch first, then the corner glyph, the value at
   the right end */
.pw-field-table .pw-corner-grid .pw-field-hint {
  order: 2;
  margin-inline: auto 0;
}
/* radius switches: only switch and corner glyph – the text stays for
   screen readers; a switched-on corner shows its glyph at full opacity */
.pw-field-table .pw-corner-grid .k-toggle-input .k-choice-input-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.pw-field-table .pw-corner-grid > .pw-corner-cell::after {
  order: 1;
  margin-inline: var(--spacing-3) 0;
  opacity: 1;
}
.pw-field-table .pw-corner-grid > *:nth-child(-n + 2) {
  border-bottom: 1px solid var(--pw-table-border);
}
.pw-field-table .pw-corner-grid > *:nth-child(even) {
  border-inline-start: 1px solid var(--pw-table-border);
}
/* a small corner glyph at the right of each part (as in Figma): the
   top-left corner, mirrored for the others */
.pw-field-table .pw-corner-grid > *::after {
  content: "";
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-inline-start: auto;
  /* the grey of the units, at full opacity */
  background: var(--color-text-dimmed);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M4 21V11a7 7 0 0 1 7-7h10'/%3E%3C/svg%3E") center / contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M4 21V11a7 7 0 0 1 7-7h10'/%3E%3C/svg%3E") center / contain no-repeat;
}
.pw-field-table .pw-corner-grid > *:nth-child(2)::after {
  transform: scaleX(-1);
}
.pw-field-table .pw-corner-grid > *:nth-child(3)::after {
  transform: scaleY(-1);
}
.pw-field-table .pw-corner-grid > *:nth-child(4)::after {
  transform: scale(-1);
}
/* a switch in a row's label cell (e.g. small/large of the paddings) */
.pw-field-row-label-col .pw-label-switch {
  margin-inline-start: auto;
}
/* two values of one axis side by side (paddings): one row of the grid,
   without the grid's inner bottom line */
.pw-field-table .pw-field-row-options.pw-axis-grid > .pw-element-field {
  border-bottom: 0;
}
/* components stacked in one card: their own section spacing goes */
.pw-field-table .pw-element-section,
.pw-field-table .pw-element-list,
.pw-field-table .pw-field-block,
.pw-field-table .pw-wizard-section {
  margin: 0;
}
.pw-pill.pw-bp-switch {
  --tool-size: 1.25rem;
}
/* more specific than .pw-pill, which sets its own tool size */
.pw-pill.pw-theme-switch {
  --tool-size: 22px;
}
.pw-theme-switch .pw-tool {
  font-size: 0.65rem;
  line-height: 1;
  padding-inline: var(--spacing-3);
}
.pw-bp-switch .pw-tool {
  padding-inline: var(--spacing-1);
}
.pw-bp-switch .k-icon {
  --icon-size: 16px;
}
/* in the rows only the icons: no pill, no button surface; the chosen one
   in full colour, the others faded */
.pw-pill.pw-bp-switch {
  gap: var(--spacing-1);
  background: transparent;
  box-shadow: none;
}
.pw-bp-switch .pw-tool,
.pw-bp-switch .pw-tool:hover,
.pw-bp-switch .pw-tool[aria-pressed="true"],
.pw-bp-switch .pw-tool[aria-pressed="true"]:hover {
  background: transparent;
  color: var(--color-text);
  font-weight: inherit;
}
.pw-bp-switch .pw-tool:not([aria-pressed="true"]) {
  opacity: 0.3;
}
.pw-bp-switch .pw-tool:not([aria-pressed="true"]):hover {
  opacity: 0.6;
}
/* no hover effect on the breakpoint and theme switches in the rows (the
   variant pills of the previews keep the blue hover of the buttons) */
.pw-theme-switch .pw-tool:not([aria-pressed="true"]):hover,
.pw-bp-switch .pw-tool:not([aria-pressed="true"]):hover {
  background: var(--color-white);
  color: var(--color-text);
}
.pw-field-table .pw-group-end {
  display: none;
}

/* Block view: page heading like Kirby's view header */
.pw-page-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-6);
  /* a line under the heading, as under Kirby's view headers */
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--color-border);
}
.pw-page-title {
  font-size: var(--text-h1, var(--text-2xl));
  font-weight: var(--font-h1, var(--font-semi));
  line-height: var(--leading-h1, 1.25);
}
/* Block view with items: "Block" and "Items" above their sections */
.pw-group-title {
  margin-bottom: var(--spacing-6);
  font-size: var(--text-xl, 1.25rem);
  font-weight: var(--font-semi);
  line-height: 1.25;
}
.pw-wizard-panel > div + div > .pw-group-title {
  margin-top: var(--spacing-12);
}

/* block view: Kirby's tabs on the right of the heading, centred on its
   line; below them what the chosen tab does */
.pw-page-title-row-tabs {
  margin-bottom: var(--spacing-3);
}
/* the tabs take the free width (Kirby moves tabs that don't fit into its
   "…" menu, measured by this width), aligned to the right */
.pw-block-view-tabs.k-tabs {
  flex-grow: 1;
  justify-content: flex-end;
  margin-inline: 0 calc(var(--button-padding) * -1);
  margin-bottom: 0;
}
.pw-block-view-intro {
  margin-bottom: var(--spacing-8);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--color-text-dimmed);
}

/* the save buttons sit on the right, so nothing moves when they appear */
.pw-topbar-controls {
  margin-inline-start: auto;
}

/* Preview column: 1/3 next to the settings while the preview is on,
   sticky below the header; narrow screens stack it above the settings */
.pw-wizard-columns {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}
.pw-preview-column {
  order: -1;
  min-width: 0;
}
/* hidden when the active tab has no preview (every portal child is hidden by v-show) */
.pw-preview-column:not(:has(> .pw-portal > :not([style*="display: none"]))),
.pw-preview-toggle,
.pw-preview-open {
  display: none;
}
/* previews not moved into the column yet: hidden while the sidebar is collapsed */
.pw-wizard[data-preview="off"] .pw-wizard-content .pw-element-preview-header,
.pw-wizard[data-preview="off"] .pw-wizard-content .pw-element-preview,
.pw-wizard[data-preview="off"] .pw-wizard-content .pw-nav-preview-mobile {
  display: none !important;
}

/* Wide screens: the preview is a sidebar over the full height on the right,
   like Kirby's menu on the left; the main area makes room for it.
   Collapsed it keeps the width of Kirby's closed menu. */
@media (min-width: 75rem) {
  .pw-wizard {
    --pw-preview-width: calc((100vw - var(--main-start, 0px)) / 3);
  }
  .pw-wizard[data-preview="off"] {
    --pw-preview-width: var(--menu-width-closed);
  }
  /* the sidebar is there on every view (collapsed or open) */
  .pw-wizard .pw-preview-column:not(:has(> .pw-portal > :not([style*="display: none"]))) {
    display: block;
  }
  .pw-wizard .k-panel-main {
    margin-inline-end: var(--pw-preview-width);
  }
  .pw-preview-column {
    order: 0;
    position: fixed;
    top: 0;
    bottom: 0;
    inset-inline-end: 0;
    width: var(--pw-preview-width);
    padding: var(--spacing-6);
    /* switches at the top: as close to the edge as Kirby's menu items */
    padding-top: var(--menu-padding, var(--spacing-3));
    overflow-y: auto;
    background: var(--menu-color-back);
    border-inline-start: 1px solid var(--menu-color-border);
    z-index: 2;
  }
  /* open: the page background of the site, the previews sit on it */
  .pw-wizard[data-preview="on"] .pw-preview-column {
    background: var(--pw-body-background, var(--menu-color-back));
    /* a soft shadow to the left, onto the settings */
    box-shadow: -6px 0 16px -4px rgba(0, 0, 0, 0.12);
  }
  /* the preview's toolbar (device, variant) stays in Kirby's grey: a band
     across the top of the column, staying in place while scrolling */
  .pw-wizard .pw-preview-column .pw-preview-switches {
    position: sticky;
    top: calc(-1 * var(--menu-padding, var(--spacing-3)));
    z-index: 1;
    margin: calc(-1 * var(--menu-padding, var(--spacing-3))) calc(-1 * var(--spacing-6)) var(--spacing-6);
    padding: var(--menu-padding, var(--spacing-3)) var(--spacing-6);
    background: var(--menu-color-back);
    border-bottom: 1px solid var(--menu-color-border);
  }
  .pw-wizard[data-preview="off"] .pw-preview-column {
    padding: 0;
    overflow: hidden;
  }
  .pw-wizard[data-preview="off"] .pw-preview-column > .pw-portal {
    display: none;
  }
  /* same place and size as the search button in Kirby's menu */
  .pw-preview-open {
    --button-height: var(--menu-button-height);
    --button-width: var(--menu-button-height);
    --button-padding: 7px;
    margin: var(--menu-padding);
  }

  /* the arrow: a strip along the sidebar's edge, its tab at the top,
     shown while hovering the sidebar (same as Kirby's menu toggle) */
  .pw-wizard .pw-preview-toggle,
  .pw-preview-open {
    display: flex;
  }
  .pw-preview-toggle {
    --button-align: flex-start;
    --button-height: 100%;
    --button-width: var(--menu-toggle-width, 1.25rem);
    position: fixed;
    inset-block: 0;
    inset-inline-end: var(--pw-preview-width);
    align-items: flex-start;
    border-radius: 0;
    overflow: visible;
    opacity: 0;
    transition: opacity .2s;
    z-index: 2;
  }
  .pw-preview-toggle .k-button-icon {
    display: grid;
    place-items: center;
    height: var(--menu-toggle-height, var(--height));
    width: var(--menu-toggle-width, 1.25rem);
    margin-top: var(--menu-padding, var(--spacing-3));
    border-block: 1px solid var(--menu-color-border);
    border-inline-start: 1px solid var(--menu-color-border);
    background: var(--menu-color-back);
    border-start-start-radius: var(--button-rounded, var(--rounded));
    border-end-start-radius: var(--button-rounded, var(--rounded));
  }
  .pw-wizard-columns:has(.pw-preview-column:hover) .pw-preview-toggle,
  .pw-preview-toggle:hover,
  .pw-preview-toggle:focus-visible {
    opacity: 1;
  }
}
.pw-preview-column .pw-font-preview-select {
  display: flex;
  width: fit-content;
}
/* every preview toolbar: the variants on the left, the guides on the right */
.pw-preview-switches .pw-preview-theme {
  order: 0;
}
/* the guides button as high as the variant pills */
.pw-pill.pw-guides-switch {
  --tool-size: 24px;
}
.pw-guides-switch .k-icon {
  --icon-size: 14px;
}
.pw-preview-switches .pw-device-select {
  order: 3;
}
.pw-preview-switches .pw-guides-switch {
  order: 2;
  margin-inline-start: auto;
}
/* guides in the blocks preview: fixed cyan lines at the edge to the
   neighbouring blocks (the outer spacing lies between line and tile) */
.pw-block-preview-spaced {
  position: relative;
}
.pw-block-preview-spaced.has-guides::before,
.pw-block-preview-spaced.has-guides::after {
  content: "";
  position: absolute;
  inset-inline: calc(-1 * var(--spacing-6));
  border-top: 1px solid rgba(0, 170, 255, 0.8);
  pointer-events: none;
}
.pw-block-preview-spaced.has-guides::before {
  top: 0;
}
.pw-block-preview-spaced.has-guides::after {
  bottom: 0;
}
/* guides in the blocks preview: where the paddings end */
.pw-block-preview.has-guides .pw-block-preview-content {
  outline: 1px solid rgba(255, 0, 170, 0.6);
}
/* a toolbar without its own layout (e.g. the font choice) */
.pw-preview-column .pw-preview-switches {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}
.pw-preview-column .pw-default-font-preview {
  margin-bottom: 0;
}
/* in the sidebar the theme tiles sit directly on its background
   (no page background and block margins around them) */
.pw-preview-column .pw-block-preview-body {
  margin-bottom: 0;
  padding-block: 0 !important;
  background-color: transparent !important;
}

/* Pill with the tabs (segmented control, like the explorer) */
.pw-pill {
  --tool-size: var(--height-sm, 1.75rem);
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1px;
  border-radius: var(--rounded);
  background: var(--color-border);
  box-shadow: var(--shadow-sm, 0 1px 2px rgb(0 0 0 / 0.08));
}
.pw-tool {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  min-width: var(--tool-size);
  height: var(--tool-size);
  padding-inline: var(--spacing-3);
  font-size: var(--text-sm);
  white-space: nowrap;
  color: var(--color-text);
  background: var(--color-white);
}
.pw-pill > :first-child {
  border-start-start-radius: var(--rounded);
  border-end-start-radius: var(--rounded);
}
.pw-pill > :last-child {
  border-start-end-radius: var(--rounded);
  border-end-end-radius: var(--rounded);
}
.pw-tool:hover {
  background: var(--color-blue-600, #4a8cff);
  color: var(--color-white);
}
.pw-tool[aria-pressed="true"],
.pw-tool[aria-pressed="true"]:hover {
  background: light-dark(var(--color-black), var(--color-gray-950));
  color: var(--color-white);
  font-weight: var(--font-semi);
}
/* Elements tab as a dropdown: the wrapper passes the pill's corners on */
.pw-pill > :first-child > .pw-tool {
  border-start-start-radius: var(--rounded);
  border-end-start-radius: var(--rounded);
}
.pw-pill > :last-child > .pw-tool {
  border-start-end-radius: var(--rounded);
  border-end-end-radius: var(--rounded);
}
.pw-tab-menu {
  display: flex;
}
/* dropdowns like kirby-explorer's: Kirby's padding so the focus outline is
   not clipped, and the focused item above its neighbour – the outline reaches
   2px into the next item, whose hover background would paint over it */
.pw-tab-menu .k-dropdown-content {
  padding: var(--dropdown-padding, var(--spacing-2));
  overflow: visible;
}
.pw-tab-menu .k-dropdown-item:focus,
.pw-tab-menu .k-dropdown-item:focus-visible {
  position: relative;
  z-index: 1;
}
/* dropdown items exactly like kirby-explorer's (Kirby's language dropdown):
   text left, count right, space for the check mark always reserved */
.pw-menu-item {
  --button-height: var(--height-md);
  width: 100%;
}
.pw-menu-item .k-button-text {
  display: flex;
  flex-grow: 1;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-6);
  min-width: 8rem;
}
.pw-menu-item:after {
  content: "✓";
  padding-inline-start: var(--spacing-1);
}
.pw-menu-item:not([aria-current="true"]):after {
  visibility: hidden;
}
.pw-menu-count {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
  font-variant-numeric: tabular-nums;
}
/* the dropdown buttons: small, faded chevron and tighter padding (explorer) */
.pw-tab-menu > .pw-tool {
  gap: 2px;
  padding-inline: var(--spacing-2) var(--spacing-1);
}
.pw-tab-menu > .pw-tool .pw-tab-text {
  margin-inline: var(--spacing-1);
}
.pw-tab-menu-chevron {
  --icon-size: 12px;
  opacity: 0.6;
}
.pw-tool:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}

/* Global px calculator badge: on its own at the start of the row, before
   the value */
.pw-element-field:has(> .pw-px-calculator) {
  flex: 1;
}
.pw-px-calculator {
  order: -1;
  flex-shrink: 0;
  margin-inline-end: var(--spacing-3);
  font-size: var(--code-inline-font-size);
  font-family: var(--font-mono);
  color: var(--code-inline-color-text);
  background: var(--code-inline-color-back);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--rounded);
  border: 1px solid var(--code-inline-color-border);
  height: 26px;
  width: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* rows with one value: the px value is a cell of its own at the start of
   the input column (rows with several values keep it next to each value) */
.pw-field-table .pw-field-row-inner {
  position: relative;
}
.pw-field-table .pw-field-row-options:not(.pw-corner-grid):not(:has(> .pw-element-field ~ .pw-element-field)) .pw-px-calculator {
  /* a cell of its own: full row height, flush against the column line */
  position: absolute;
  /* 1px of air around it */
  top: 1px;
  bottom: 1px;
  /* starts right at the column line, at the start of the input cell */
  left: calc(30% + 1px);
  height: auto;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--color-blue-600);
}
/* 2×2 grid: the same px cell at the start of each part (stronger than the
   rule for several values in a row, which adds its own padding and line) */
.pw-field-table .pw-field-row-options.pw-corner-grid > .pw-element-field {
  position: relative;
  padding-inline-start: calc(45px + var(--table-cell-padding, var(--spacing-3)));
  border-inline-start: 0;
}
.pw-field-table .pw-field-row-options.pw-corner-grid > .pw-element-field:nth-child(even) {
  border-inline-start: 1px solid var(--pw-table-border);
}
.pw-field-table .pw-corner-grid > .pw-element-field > .pw-px-calculator {
  position: absolute;
  top: 1px;
  bottom: 1px;
  left: 1px;
  height: auto;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--color-blue-600);
}
/* the value moves right of the px cell */
.pw-field-table .pw-field-row-options:not(.pw-corner-grid):not(:has(> .pw-element-field ~ .pw-element-field)):has(.pw-px-calculator) {
  padding-inline-start: calc(45px + var(--table-cell-padding, var(--spacing-3)));
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
}
/* the tile's content (inside its paddings) */
.pw-block-preview-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-2);
}

/* blocks preview: the paragraphs spaced by the editor's paragraph spacing */
.pw-block-preview-text {
  gap: 0;
}

[class^="pw-preview-link-"] {
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.15s;
}

.pw-block-preview-label {
  font-size: 0.6rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-1);
}

.pw-default-font-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  color: var(--color-text);
  margin-bottom: var(--spacing-6);
}
/* three sizes of the default font */
.pw-default-font-preview p[data-size="large"]  { font-size: 1.75rem; line-height: 1.2; }
.pw-default-font-preview p[data-size="medium"] { font-size: 1.25rem; line-height: 1.4; }
.pw-default-font-preview p[data-size="small"]  { font-size: 1rem;    line-height: 1.6; }

.pw-wizard-content {
}

.pw-wizard-panel { min-width: 0; }
.pw-wizard-hint { font-size: var(--text-sm); color: var(--color-text-dimmed); margin-bottom: var(--spacing-4); }

.pw-wizard-global-content {
  min-height: 200px;
}

.pw-ai-settings {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: var(--spacing-12);
  align-items: start;
}
.pw-ai-settings.pw-ai-single { grid-template-columns: 1fr; }
@media (max-width: 60rem) {
  .pw-ai-settings { grid-template-columns: 1fr; }
}
.pw-ai-secrets { display: flex; flex-direction: column; gap: var(--spacing-4); }
.pw-ai-secrets-title { font-size: var(--text-lg); }
.pw-ai-secrets-help, .pw-ai-secret-status { color: var(--color-text-dimmed); font-size: var(--text-sm); }
.pw-ai-secret-row { display: flex; gap: var(--spacing-2); align-items: center; margin-block: var(--spacing-2); }
.pw-ai-secret-input {
  flex: 1;
  height: var(--input-height);
  padding: 0 var(--input-padding);
  border-radius: var(--input-rounded);
  background: var(--input-color-back);
  border: 1px solid var(--input-color-border);
  font-family: var(--font-mono);
}
.pw-ai-secret-input:focus { outline: 2px solid var(--color-focus); outline-offset: -1px; }
.pw-ai-secret-input:disabled { opacity: .6; }

.pw-wizard-block-sections { display: flex; flex-direction: column; }

/* Items > Layout: padding/radius/border-width/link-style/button-style stack
   directly on top of each other. Each pw-element-list inside a BlockValues
   adds spacing-10 by default — collapse that here so the rows flow as one list. */
</style>
