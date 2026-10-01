<template>
  <k-panel-inside class="pw-wizard" :data-preview="showPreview ? 'on' : 'off'" :data-full="fullWidthPage ? 'true' : null" :style="{ '--pw-body-background': bodyBackgroundColor}">
    <!-- Header in Kirby's topbar (like kirby-explorer): tabs as a pill, save buttons -->
    <pw-portal to=".pw-wizard .k-topbar">
      <div ref="topbar" class="pw-topbar">
        <!-- Main navigation: the same on the global view and on every block view -->
        <!-- Project: site, header, footer, blocks, fonts -->
        <div v-if="!loading" class="pw-pill pw-tabs" role="group">
          <div class="pw-tab-menu">
            <button
              type="button"
              class="pw-tool pw-tab"
              :title="$t('prw.tab.project')"
              aria-haspopup="menu"
              :aria-pressed="isGlobalTab(...projectMenuTabs) ? 'true' : 'false'"
              @click="$refs.settingsMenu.toggle()"
            >
              <k-icon type="sitemap" />
              <span class="pw-tab-text">{{ $t('prw.tab.project') }}</span>
              <k-icon type="angle-down" class="pw-tab-menu-chevron" />
              <span v-if="groupPending('project')" class="pw-change-badge">{{ groupPending('project') }}</span>
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
                    <span class="k-button-text">{{ $t('prw.tab.' + tab.key) }}<span v-if="pendingCounts[tab.key]" class="pw-change-count">{{ pendingCounts[tab.key] }}</span></span>
                  </button>
                </template>
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
              :title="$t('prw.tab.elements')"
              aria-haspopup="menu"
              :aria-pressed="isGlobalTab('elements') ? 'true' : 'false'"
              @click="$refs.elementsMenu.toggle()"
            >
              <k-icon type="layers" />
              <span class="pw-tab-text">{{ $t('prw.tab.elements') }}</span>
              <k-icon type="angle-down" class="pw-tab-menu-chevron" />
              <span v-if="groupPending('elements')" class="pw-change-badge">{{ groupPending('elements') }}</span>
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
                  <span class="k-button-text">{{ option.text }}<span v-if="pendingCounts['element:' + option.value]" class="pw-change-count">{{ pendingCounts['element:' + option.value] }}</span></span>
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
                :title="$t('prw.tab.blocks')"
                aria-haspopup="menu"
                :aria-pressed="activeTab !== 'global' ? 'true' : 'false'"
                @click="$refs.blocksMenu.toggle(); loadBlockUsage()"
              >
                <k-icon type="box" />
                <span class="pw-tab-text">{{ $t('prw.tab.blocks') }}</span>
                <k-icon type="angle-down" class="pw-tab-menu-chevron" />
                <span v-if="groupPending('blocks')" class="pw-change-badge">{{ groupPending('blocks') }}</span>
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
                        {{ blockLabel(entry.blockType) }}<span v-if="pendingCounts['block:' + entry.blockType]" class="pw-change-count">{{ pendingCounts['block:' + entry.blockType] }}</span>
                        <!-- how often the block is used in the project, like the counts in kirby-explorer -->
                        <span v-if="blockUsage[entry.blockType] !== undefined" class="pw-menu-count">{{ blockUsage[entry.blockType] }}</span>
                      </span>
                    </button>
                  </template>
                </nav>
              </k-dropdown-content>
            </div>
        </div>

        <!-- Settings: the project, the settings, AI and the exceptions -->
        <div v-if="!loading" class="pw-pill pw-tabs" role="group">
          <div class="pw-tab-menu">
            <button
              type="button"
              class="pw-tool pw-tab"
              :title="$t('prw.tab.config')"
              aria-haspopup="menu"
              :aria-pressed="isGlobalTab(...configMenuTabs) ? 'true' : 'false'"
              @click="$refs.configMenu.toggle()"
            >
              <k-icon type="cog" />
              <span class="pw-tab-text">{{ $t('prw.tab.config') }}</span>
              <k-icon type="angle-down" class="pw-tab-menu-chevron" />
              <span v-if="groupPending('config')" class="pw-change-badge">{{ groupPending('config') }}</span>
            </button>
            <k-dropdown-content ref="configMenu" align-x="start">
              <nav class="k-navigate">
                <button
                  v-for="tab in configMenuTabs.map(key => globalTabs.find(t => t.key === key)).filter(Boolean)"
                  :key="tab.key"
                  type="button"
                  class="k-dropdown-item k-button pw-menu-item"
                  data-has-text="true"
                  data-has-icon="true"
                  :aria-current="isGlobalTab(tab.key) ? 'true' : undefined"
                  @click="$refs.configMenu.close(); openGlobal(tab.key)"
                >
                  <span class="k-button-icon"><k-icon :type="tab.icon" /></span>
                  <span class="k-button-text">{{ $t('prw.tab.' + tab.key) }}<span v-if="pendingCounts[tab.key]" class="pw-change-count">{{ pendingCounts[tab.key] }}</span></span>
                </button>
              </nav>
            </k-dropdown-content>
          </div>
        </div>

        <!-- all changes of every page at once: discard (asked first) or save -->
        <div v-if="pendingPageCount" class="k-form-controls pw-topbar-controls">
          <div data-layout="collapsed" class="k-button-group">
            <k-button
              :text="$t('discard')"
              :title="$t('discard')"
              icon="undo"
              theme="notice"
              variant="filled"
              size="sm"
              class="k-form-controls-button"
              @click="confirmDiscardAll"
            />
            <k-button
              :text="$t('save')"
              :title="$t('save')"
              icon="check"
              theme="notice"
              variant="filled"
              size="sm"
              class="k-form-controls-button"
              :disabled="savingAll"
              @click="saveAll"
            />
          </div>
        </div>
      </div>
    </pw-portal>

    <!-- loading: the start page with a spinner in place of the wand -->
    <div v-if="loading" class="pw-welcome pw-wizard-loading">
      <k-icon type="loader" class="pw-welcome-icon" />
      <div class="pw-welcome-text">
        <h1 class="pw-welcome-title">{{ $t('prw.area.title') }}</h1>
        <!-- typed letter by letter; the rest already takes its room (hidden),
             so nothing moves – and loading view and start page share the count,
             so the typing goes on across the switch -->
        <p class="pw-welcome-slogan" :aria-label="$t('prw.welcome.slogan')"><span aria-hidden="true">{{ $t('prw.welcome.slogan').slice(0, sloganTyped) }}</span><span class="pw-typewriter-caret" :class="{ 'is-done': !sloganCaret }" aria-hidden="true"></span><span class="pw-typewriter-rest" aria-hidden="true">{{ $t('prw.welcome.slogan').slice(sloganTyped) }}</span></p>
        <!-- (the figures' line reserved: nothing jumps when the page appears) -->
        <p class="pw-welcome-stats" style="visibility: hidden" aria-hidden="true">·</p>
      </div>
    </div>

    <!-- Two columns while the preview is on: settings 2/3, preview 1/3.
         The previews are moved into the right column via pw-portal. -->
    <div v-else class="pw-wizard-columns">
    <div class="pw-wizard-content">

        <!-- Global views: the page's name as heading (an element: its name) -->
        <div v-if="!loading && activeTab === 'global' && globalActiveTab !== 'welcome'" class="pw-page-title-row" :class="{ 'has-intro': globalPageIntro }">
          <!-- the page's icon (an element's as in the elements menu) before the name -->
          <k-icon v-if="globalPageIcon" :type="globalPageIcon" class="pw-page-title-icon" />
          <h1 class="pw-page-title">{{ globalPageTitle }}</h1>
          <!-- translation: several pages at once, per language the missing
               ones or all (run in a dialog, the characters shown first) -->
          <div v-if="globalActiveTab === 'translate' && batch.languages.length" class="pw-tab-menu pw-ai-batch-menu">
            <k-button
              icon="translatewizard-translate"
              :text="$t('prw.translate.batch')"
              :dropdown="true"
              variant="filled"
              size="sm"
              :disabled="!!dirtyTabs['ai'] || batch.running"
              :title="dirtyTabs['ai'] ? $t('prw.translate.batch.unsaved') : null"
              @click="$refs.batchMenu.toggle()"
            />
            <k-dropdown-content ref="batchMenu" align-x="end">
              <nav class="k-navigate">
                <template v-for="(lang, i) in batch.languages">
                  <hr v-if="i" :key="'sep-' + lang.code" />
                  <p :key="'head-' + lang.code" class="pw-menu-heading">{{ lang.name }}</p>
                  <button
                    v-for="mode in ['missing', 'all']"
                    :key="lang.code + '-' + mode"
                    type="button"
                    class="k-dropdown-item k-button pw-menu-item"
                    data-has-text="true"
                    :disabled="!batchPagesOf(mode, lang.code).length"
                    @click="$refs.batchMenu.close(); openBatch(lang, mode)"
                  >
                    <span class="k-button-text">
                      {{ $t('prw.translate.batch.' + mode) }}
                      <span class="pw-menu-count">{{ batchPagesOf(mode, lang.code).length }}</span>
                    </span>
                  </button>
                </template>
              </nav>
            </k-dropdown-content>
          </div>
        </div>
        <!-- a page's intro below its heading, as on the block pages (the items:
             which blocks use them) -->
        <p v-if="!loading && activeTab === 'global' && globalPageIntro" class="pw-block-view-intro" v-html="globalPageIntro"></p>

        <!-- Block view: the block's name as page heading, Kirby's tabs (design,
             start values, visibility) on the right in its line, below what the
             chosen tab does -->
        <template v-if="!loading && activeTab !== 'global'">
          <div class="pw-page-title-row pw-page-title-row-tabs">
            <!-- the block's icon (as in the blocks menu) before its name -->
            <k-icon :type="(activeBlockEntries.find(e => e.blockType === activeTab) || {}).icon || 'box'" class="pw-page-title-icon" />
            <h1 class="pw-page-title">{{ blockLabel(activeTab) }}</h1>
            <k-tabs class="pw-block-view-tabs" :tab="currentBlockView" :tabs="blockViewTabs" />
          </div>
          <p class="pw-block-view-intro">{{ $t('prw.view.' + currentBlockView + '.intro') }}</p>
        </template>

        <!-- ==================== Global Settings ==================== -->
        <div v-if="activeTab === 'global'" class="pw-wizard-panel">

          <!-- Blocks -->

          <!-- the start page: empty, the wizard's wand and a slogan -->
          <div v-if="globalActiveTab === 'welcome'" class="pw-welcome">
            <!-- the wand with a few twinkling stars around it -->
            <span class="pw-welcome-wand">
              <k-icon type="wand" class="pw-welcome-icon" />
              <svg v-for="n in 5" :key="'star-' + n" class="pw-welcome-star" :class="'is-' + n" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg>
            </span>
            <div class="pw-welcome-text">
              <h1 class="pw-welcome-title">{{ $t('prw.area.title') }}</h1>
              <!-- typed letter by letter; the rest already takes its room (hidden),
                   so nothing moves – and loading view and start page share the count,
                   so the typing goes on across the switch -->
              <p class="pw-welcome-slogan" :aria-label="$t('prw.welcome.slogan')"><span aria-hidden="true">{{ $t('prw.welcome.slogan').slice(0, sloganTyped) }}</span><span class="pw-typewriter-caret" :class="{ 'is-done': !sloganCaret }" aria-hidden="true"></span><span class="pw-typewriter-rest" aria-hidden="true">{{ $t('prw.welcome.slogan').slice(sloganTyped) }}</span></p>
              <!-- the project in figures -->
              <!-- (faded in once the slogan is typed) -->
              <p class="pw-welcome-stats" :class="{ 'is-shown': statsShown }">{{ $t('prw.welcome.stats', { blocks: blockUsageTotal === null ? '…' : blockUsageTotal, pages: sitePageCount === null ? '…' : sitePageCount, variants: activeVariants.length + 1 }) }}</p>
            </div>
          </div>

          <!-- Project → Site: the page background -->
          <div v-show="globalActiveTab === 'site'" class="pw-wizard-global-content">
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
                  <pw-theme-select :value="currentBlocksColorTheme" :themes="themes" :colors="variantColors" class="pw-preview-theme" @input="blocksColorTheme = $event" />
                  <!-- guides on/off (shared by all previews) -->
                  <div class="pw-pill pw-guides-switch" role="group">
                    <button
                      type="button"
                      class="pw-tool"
                      :title="$t('prw.preview.guides')"
                      :aria-label="$t('prw.preview.guides')"
                      :aria-pressed="previewGuides ? 'true' : 'false'"
                      :data-theme="previewGuides ? 'pink' : null"
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

            <!-- which blocks and which variants can be used: side by side
                 (half and half), below each other when narrow -->
            <div class="pw-blocks-active">
            <!-- which blocks can be used -->
            <pw-global-elements
              :blocks="blocks"
              :usage="blockUsage"
              @toggle="toggleBlock($event.blockType, $event.checked)"
            />
            <!-- theme variants that can be chosen in the blocks ("default" always on) -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row"><h3 class="pw-card-heading">{{ $t('prw.label.variants') }}</h3></div>
              <div class="pw-card pw-field-table">
                <div v-for="variant in ['variant', 'variant2', 'variant3']" :key="variant" class="pw-field-row pw-active-row" :class="{ 'is-inactive': !activeVariants.includes(variant) }">
                  <div class="k-input" data-type="text">
                    <span class="k-input-element pw-field-row-inner">
                      <div class="pw-field-row-label-col">
                        <!-- a dot in the variant's block background before its name -->
                        <label class="pw-field-row-label pw-active-label">
                          <span class="pw-variant-dot" :style="{ backgroundColor: variantBackground(variant) }"></span>
                          <span>{{ $t('pw.option.' + variant) }}</span>
                        </label>
                      </div>
                      <div class="pw-field-row-options">
                        <k-toggle-input
                          :value="activeVariants.includes(variant)"
                          @input="toggleVariant(variant, $event)"
                        />
                      </div>
                    </span>
                  </div>
                </div>
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.variants')" />
            </section>
            </div>
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
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.blocksPaddings')" />
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
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.blocksMargins')" />
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
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.blocksShape')" />
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
                  >
<span class="pw-variant-dot is-small" :style="{ backgroundColor: variantBackground(t) }"></span>{{ $t('pw.option.' + t) }}</button>
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
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.blocksColors')" />
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
                  >
<span class="pw-variant-dot is-small" :style="{ backgroundColor: variantBackground(t) }"></span>{{ $t('pw.option.' + t) }}</button>
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
                  :show-only="['block-link-decoration', 'block-link-weight', 'block-link-thickness', 'block-link-offset']"
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
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.blocksLinks')" />
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

          <!-- Exceptions: a JSON by block laid over the plugins' settings.json
               and editor.json (for special cases) -->
          <div v-show="globalActiveTab === 'patches'" class="pw-wizard-global-content">
            <!-- right: every block's settings (with the exceptions) as a tree
                 to open and close; the plus takes an entry into the JSON -->
            <pw-portal to=".pw-wizard .pw-preview-column">
              <div v-show="activeTab === 'global' && globalActiveTab === 'patches'" class="pw-patches-tree">
                <k-text class="k-help pw-patches-intro" :html="$t('prw.patches.tree', { plus: '<span class=&quot;pw-json-add pw-json-add-inline&quot; aria-hidden=&quot;true&quot;><svg class=&quot;k-icon&quot; viewBox=&quot;0 0 24 24&quot;><use href=&quot;#icon-add&quot;></use></svg></span>' })" />
                <ul class="pw-json-children pw-json-root">
                  <pw-json-node
                    v-for="block in blocks"
                    :key="'pt-' + block.blockType"
                    :node-key="block.blockType"
                    :label="blockLabel(block.blockType)"
                    :icon="block.icon || 'box'"
                    :value="patchesTree[block.blockType] || { ...(block.settings || {}), editor: block.editor || {} }"
                    :path="[block.blockType]"
                    :focus-path="patchesFocus"
                    @take="takePatch"
                  />
                </ul>
              </div>
            </pw-portal>
            <section class="pw-card-section">
              <!-- a code editor: the JSON coloured below, the field above it
                   transparent but for the cursor (both scroll together) -->
              <div ref="patchesCode" class="pw-code">
                <pre ref="patchesHl" class="pw-code-hl" aria-hidden="true" v-html="patchesHighlighted"></pre>
                <textarea
                  ref="patchesInput"
                  :key="'patches-' + discardKey"
                  v-model="patchesText"
                  class="pw-patches-input"
                  spellcheck="false"
                  :placeholder="'{\n  &quot;pwhero&quot;: { … }\n}'"
                  @input="onPatchesInput"
                  @click="focusPatchesTree"
                  @keyup="/^(Arrow|Home|End|Page)/.test($event.key) && focusPatchesTree()"
                  @scroll="$refs.patchesHl.scrollTop = $event.target.scrollTop; $refs.patchesHl.scrollLeft = $event.target.scrollLeft"
                ></textarea>
              </div>
              <k-box v-if="patchesError" theme="negative" class="pw-patches-note" :text="patchesError" />
              <k-box v-else-if="patchesUnknown.length" theme="notice" class="pw-patches-note" :text="$t('prw.patches.unknown') + ' ' + patchesUnknown.join(', ')" />
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.patches')" />
            </section>
          </div>

          <!-- AI: translation (translatewizard: its keys) and page generator
               (contentwizard: its settings and keys), each a page of its own -->
          <div
            v-if="hasAiTab"
            v-show="['translate', 'generator'].includes(globalActiveTab)"
            class="pw-wizard-global-content pw-ai-settings"
            :class="{ 'pw-ai-single': !((globalActiveTab === 'generator' && aiForm) || (globalActiveTab === 'translate' && translateTree)) || !aiPageSecrets.length }"
          >
            <!-- 2/3: the translated fields (translatewizard), a tree as the
                 configuration's: each block with its text fields -->
            <div v-if="translateTree && globalActiveTab === 'translate'" class="pw-ai-main">
              <section class="pw-card-section">
                <div class="pw-card-heading-row">
                  <h2 class="pw-card-heading">{{ $t('prw.translate.fields') }}</h2>
                  <!-- every entry of the tree open, or all shut again -->
                  <k-button
                    :icon="translateExpanded ? 'prw-collapse' : 'prw-expand'"
                    :text="$t(translateExpanded ? 'prw.translate.collapse' : 'prw.translate.expand')"
                    size="xs"
                    variant="filled"
                    @click="translateExpanded = !translateExpanded"
                  />
                </div>
                <div class="pw-card pw-translate-tree">
                  <ul class="pw-json-children pw-json-root">
                    <pw-translate-node
                      v-for="node in translateTree"
                      :key="'tr-' + node.key"
                      :node="node"
                      :values="translateValues"
                      :expanded="translateExpanded"
                      @toggle="onTranslateToggle"
                    />
                  </ul>
                </div>
                <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.translate.fields.help')" />
              </section>
            </div>

            <!-- 3/4: AI defaults (contentwizard) -->
            <div v-if="aiForm && globalActiveTab === 'generator'" class="pw-ai-main">
              <k-form
                v-if="aiForm"
                :key="'ai-' + discardKey"
                :fields="aiForm.fields"
                :value="aiValues"
                @input="onAiInput"
              />
            </div>

            <!-- 1/4: API keys -->
            <aside v-if="aiPageSecrets.length" class="pw-ai-aside">
              <!-- API keys (admins only) — written to the project's .env -->
              <section class="pw-ai-secrets">
                <h2 class="k-label pw-ai-secrets-title">{{ $t('prw.ai.keys') }}</h2>
                <!-- what the keys are for, the services linked -->
                <k-text class="pw-ai-secrets-help pw-ai-secrets-intro" :html="$t('prw.ai.keys.intro.' + globalActiveTab)" />
                <k-box v-if="!aiSecretsWritable" theme="negative" :text="$t('prw.ai.keys.readonly')" />
                <div v-for="secret in aiPageSecrets" :key="secret.env" class="pw-ai-secret">
                  <!-- a valid key's kind with it (DeepL: Free / Pro) -->
                  <label class="k-label" :for="'pw-secret-' + secret.env">{{ secret.label }}<template v-if="aiSecretValid[secret.env] && aiSecretTypes[secret.env]"> · {{ aiSecretTypes[secret.env] }}</template></label>
                  <div class="pw-ai-secret-row">
                    <span class="pw-ai-secret-field">
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
                      <!-- the stored key checked with its service: valid (green
                           check) or not (red); nothing while unknown or typing -->
                      <k-icon
                        v-if="secret.source && aiSecretValid[secret.env] !== undefined && aiSecretValid[secret.env] !== null && !aiSecretInputs[secret.env]"
                        :type="aiSecretValid[secret.env] ? 'check' : 'alert'"
                        class="pw-ai-secret-state"
                        :class="aiSecretValid[secret.env] ? 'is-valid' : 'is-invalid'"
                        :title="$t(aiSecretValid[secret.env] ? 'prw.ai.keys.valid' : 'prw.ai.keys.invalid')"
                      />
                    </span>
                    <k-button
                      v-if="secret.source === 'env' && aiSecretsWritable"
                      icon="trash"
                      size="sm"
                      variant="filled"
                      :title="$t('prw.ai.keys.remove')"
                      @click="removeSecret(secret)"
                    />
                  </div>
                  <!-- (a key in the .env: said in the intro, no line here) -->
                  <p v-if="secret.source !== 'env'" class="pw-ai-secret-status">
                    <template v-if="secret.source === 'config'">{{ $t('prw.ai.keys.config') }}</template>
                    <template v-else>{{ $t('prw.ai.keys.notset') }}</template>
                    <!-- (the plugin's hint only while there is no key yet) -->
                    <template v-if="secret.help && !secret.source"> · {{ secret.help }}</template>
                  </p>
                </div>
              </section>
              <!-- DeepL: the characters used this period and the limit -->
              <section v-if="globalActiveTab === 'translate' && deeplUsage" class="pw-ai-secrets pw-ai-usage">
                <!-- (as small as the keys' labels) -->
                <h3 class="k-label">{{ $t('prw.translate.usage') }}</h3>
                <div class="pw-usage-bar" :class="{ 'is-high': deeplUsage.count / deeplUsage.limit > 0.9 }">
                  <span :style="{ width: Math.min(100, deeplUsage.count / deeplUsage.limit * 100) + '%' }"></span>
                </div>
                <p class="pw-ai-secrets-help pw-ai-usage-figures">{{ $t('prw.translate.usage.text', { count: deeplUsage.count.toLocaleString(), limit: deeplUsage.limit.toLocaleString() }) }}</p>
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

          <!-- Live preview of the block in the sidebar (Text, Heading, Steplist, Quote, Media, Logocloud, Featurelist, Hero, Cardlets so far) -->
          <pw-portal v-if="['pwtext', 'pwheading', 'pwsteplist', 'pwquote', 'pwmedia', 'pwlogocloud', 'pwfeaturelist', 'pwhero', 'pwcardlets', 'pwmulticolumn', 'pwfaq'].includes(block.blockType) && blockConfigs[block.blockType]" to=".pw-wizard .pw-preview-column">
            <div v-show="activeTab === block.blockType">
              <pw-block-preview
                :block-type="block.blockType"
                :config="blockConfigs[block.blockType]"
                :overrides="shownOverrides(block.blockType)"
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
                :with-block-guides="currentBlockView === 'defaults'"
                :guide-colors="activeTab === block.blockType ? previewGuideColors : null"
                :theme-colors="variantColors"
                :bp.sync="itemBp"
                :value-defaults="blockValueDefaults[block.blockType] || {}"
                :value-overrides="shownValueOverrides(block.blockType)"
                :step-style="block.blockType === 'pwsteplist' && ['design', 'elements'].includes(currentBlockView) ? currentStepStyle(block.blockType) : ''"
                :feature-layout="['pwfeaturelist', 'pwfaq'].includes(block.blockType) && ['design', 'elements'].includes(currentBlockView) ? currentFeatureLayout(block.blockType) : ''"
                :view-switches="['design', 'elements'].includes(currentBlockView) ? viewSwitches(block.blockType) : null"
                @view-switch="onViewSwitch(block.blockType, $event)"
                :faq-style="block.blockType === 'pwfaq' && ['design', 'elements'].includes(currentBlockView) ? currentFaqStyle(block.blockType) : ''"
                :hero-height="block.blockType === 'pwhero' && ['design', 'elements'].includes(currentBlockView) ? currentHeroHeight(block.blockType) : ''"
                :card-display="block.blockType === 'pwcardlets' && ['design', 'elements'].includes(currentBlockView) ? currentCardDisplay(block.blockType) : ''"
                :design-view="currentBlockView === 'design'"
                :elements-view="currentBlockView === 'elements'"
                :highlight="hoveredVar"
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
              @hover-var="hoveredVar = $event"
              :global-values="globalLayoutValues"
              :media-radius="mediaRadiusValues"
              :guides="previewGuides"
              :block="block"
              :config="blockConfigs[block.blockType]"
              :overrides="blockOverrides[block.blockType] || {}"
              :writer-active="writerActive[block.blockType] !== false"
              @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
              @update:writer-active="$set(writerActive, block.blockType, $event)"
              @drawer-tab="$set(startDrawerTab, block.blockType, $event)"
            />
            <!-- the items' corners (cardlets): a card in the layout tab -->
            <template v-if="hasItemFields(block.blockType) && hasItemDefaultFields(block.blockType) && startDrawerTab[block.blockType] === 'layout'">
              <section class="pw-card-section">
                <div class="pw-card-heading-row">
                  <h3 class="pw-card-heading">{{ $t('prw.tab.items') }}</h3>
                </div>
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
                <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.itemCorners')" />
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

          <!-- Elements: the values taken from Elements (the entries' type,
               the space below) – the block's own only by exception -->
          <div v-show="currentBlockView === 'elements'" v-if="blockConfigs[block.blockType] && hasElementsView(block.blockType)" :data-guide-scope="block.blockType + ':elements'">

            <!-- elements: the space below tagline, heading and text – the global
                 elements' or the block's own (blocks that bring the values:
                 every block with an intro but the quote); always
                 the last card -->
            <template v-if="hasOwnSpacing(block.blockType)">
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <!-- (named after the block's part: the intro, the multicolumn's columns) -->
                <h3 class="pw-card-heading">{{ $t(block.blockType === 'pwmulticolumn' ? 'prw.headline.elementsColumns' : 'prw.headline.elementsIntro') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <!-- the space below the block's elements (tagline, heading,
                     text, list, quote, media, button): the elements' (global)
                     or the block's own values -->
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-spacing']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <!-- standard: the global elements' values, grey (not editable here;
                     no guides – they show only for the block's own values) -->
                <template v-if="itemLayoutDefault(block.blockType, 'item-spacing') !== 'own'">
                  <div
                    v-for="el in ownSpacingElements(block.blockType)"
                    :key="'gs-' + el"
                    class="pw-field-row is-readonly"
                  >
                    <div class="k-input" data-type="text">
                      <span class="k-input-element pw-field-row-inner">
                        <div class="pw-field-row-label-col">
                          <label class="pw-field-row-label">{{ $t('prw.prop.' + el + '-spacing') }}</label>
                        </div>
                        <!-- as the editable rows: the px cell first, then the value -->
                        <div class="pw-field-row-options">
                          <span class="pw-element-field">
                            <span class="pw-readonly-value">{{ globalElementSpacing(el).replace(/r?em$/, '') }}<span class="pw-element-unit">{{ (globalElementSpacing(el).match(/r?em$/) || ['rem'])[0] }}</span></span>
                            <span class="pw-px-calculator">{{ remToPx(globalElementSpacing(el)) }}</span>
                          </span>
                        </div>
                      </span>
                    </div>
                  </div>
                </template>
                <!-- custom: the block's own values, the global ones grey at the end -->
                <template v-else>
                  <pw-block-values
                    v-for="el in ownSpacingElements(block.blockType)"
                    :key="'os-' + el"
                    :bp.sync="itemBp"
                    :defaults="blockValueDefaults[block.blockType]"
                    :patch="valuesPatch(block.blockType)"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="[el + '-spacing']"
                    :labels="{ [el + '-spacing']: $t('prw.prop.' + el + '-spacing') }"
                    :guides="rowGuides([el + '-spacing'])"
                    :hints="{ [el + '-spacing']: globalElementSpacing(el) }"
                    :hint-title="$t('prw.hint.globalValue')"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                    @hover-var="hoveredVar = $event"
                  />
                </template>
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.elementSpacing')" />
            </section>
            </template>

            <!-- entries (featurelist, steplist): their title and description –
                 the global items' values (Elements › Items) or the block's own;
                 the first card -->
            <!-- (two cards: the title and the description; the values switch –
                 standard or own – in both, it is one setting) -->
            <template v-if="hasEntry(block.blockType)">
            <section v-for="part in entryParts(block.blockType)" :key="'entry-' + part.key" class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t(part.heading) }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <!-- the entries' values: the global items' (Elements › Items) or
                     the block's own -->
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-entry-' + part.key]"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <!-- standard: the global values, grey (not editable here) -->
                <template v-if="itemLayoutDefault(block.blockType, 'item-entry-' + part.key) !== 'own'">
                  <div v-for="name in part.rows" :key="'ge-' + name" class="pw-field-row is-readonly">
                    <div class="k-input" data-type="text">
                      <span class="k-input-element pw-field-row-inner">
                        <div class="pw-field-row-label-col">
                          <label class="pw-field-row-label">{{ entryLabel(block.blockType, name) }}</label>
                        </div>
                        <div class="pw-field-row-options">
                          <span class="pw-element-field">
                            <span class="pw-readonly-value">{{ String(globalItemValue(name)).replace(/(rem|em)$/, '') }}<span class="pw-element-unit">{{ (String(globalItemValue(name)).match(/(rem|em)$/) || [''])[0] }}</span></span>
                            <span v-if="/rem$/.test(globalItemValue(name))" class="pw-px-calculator">{{ remToPx(globalItemValue(name)) }}</span>
                          </span>
                        </div>
                      </span>
                    </div>
                  </div>
                </template>
                <!-- custom: the block's own values, the global ones grey at the end -->
                <template v-else>
                  <pw-block-values
                    v-for="name in part.rows"
                    :key="'oe-' + name"
                    :bp.sync="itemBp"
                    :defaults="blockValueDefaults[block.blockType]"
                    :patch="valuesPatch(block.blockType)"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="[name]"
                    :labels="{ [name]: entryLabel(block.blockType, name) }"
                    :guides="rowGuides(name === 'item-title-spacing' ? [name] : [])"
                    :hints="{ [name]: globalItemValue(name) }"
                    :hint-title="$t('prw.hint.globalValue')"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                    @hover-var="hoveredVar = $event"
                  />
                </template>
              </div>
              <k-text v-if="part.key === 'text'" size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.featureText')" />
            </section>
            </template>
          </div>

          <!-- Design: the items' values (CSS variables), for all blocks at once -->
          <div v-show="currentBlockView === 'design'" v-if="blockConfigs[block.blockType] && hasDesign(block.blockType)" :data-guide-scope="block.blockType + ':design'">


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
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="[stepValueKey(block.blockType, 'item-number-size')]"
                  :labels="{ [stepValueKey(block.blockType, 'item-number-size')]: $t(currentStepStyle(block.blockType) === 'minimal' ? 'prw.prop.font-size' : 'prw.label.size') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
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
                    :patch="valuesPatch(block.blockType)"
                    :overrides="blockValueOverrides[block.blockType] || {}"
                    :show-only="['item-radius']"
                    :hide-section-headers="true"
                    @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                    @hover-var="hoveredVar = $event"
                  />
                </template>
                <!-- beside the text (not centered): the number's alignment
                     (top / centre) and its fine vertical offset -->
                <pw-block-settings
                  v-if="currentStepStyle(block.blockType) !== 'centered'"
                  :key="'align-' + currentStepStyle(block.blockType)"
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="[stepValueKey(block.blockType, 'item-number-align')]"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <pw-block-values
                  v-if="currentStepStyle(block.blockType) !== 'centered' && stepAlign(block.blockType) === 'top'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="[stepValueKey(block.blockType, 'item-number-offset')]"
                  :labels="{ [stepValueKey(block.blockType, 'item-number-offset')]: $t('prw.label.offset') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="[stepValueKey(block.blockType, 'item-content-gap')]"
                  :guides="rowGuides([stepValueKey(block.blockType, 'item-content-gap')])"
                  :labels="{ [stepValueKey(block.blockType, 'item-content-gap')]: $t(currentStepStyle(block.blockType) === 'centered' ? 'prw.label.gapVertical' : 'prw.label.gapHorizontal') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <!-- "connected": the width of the line (its colour: colours card) -->
                <pw-block-values
                  v-if="currentStepStyle(block.blockType) === 'connected'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-connector-width']"
                  :labels="{ 'item-connector-width': $t('prw.prop.item-connector') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.steplistNumbering')" />
            </section>

            <!-- steplist: colours and gaps (its text and numbering above) -->
            <template v-if="block.blockType === 'pwsteplist' && blockValueDefaults[block.blockType]">
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.colors') }}</h3>
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="theme in themes"
                    :key="'sth-' + theme"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentItemColorTheme === theme ? 'true' : 'false'"
                    @click="itemColorTheme = theme"
                  >
<span class="pw-variant-dot is-small" :style="{ backgroundColor: variantBackground(theme) }"></span>{{ $t('pw.option.' + theme) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :labels="stepColorLabels(block.blockType)"
                  :theme="currentItemColorTheme"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="itemColorsShowOnly(block.blockType)"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.steplistColors')" />
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.spacing') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :labels="{ 'item-gap': $t('prw.label.betweenSteps') }"
                  :guides="rowGuides(['item-gap', 'item-text-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-gap', 'item-text-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.steplistSpacing')" />
            </section>
            </template>

            <!-- logocloud: layout, form, padding, colours, gaps -->
            <template v-if="block.blockType === 'pwlogocloud' && blockValueDefaults[block.blockType]">
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.layout') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-format']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :labels="itemLayoutDefault(block.blockType, 'item-format') === 'flexible' ? { 'item-size': $t('prw.label.height') } : {}"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-size']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.logocloudLayout')" />
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.shape') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
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
                  :bp.sync="itemBp"
                  v-if="isItemRadiusVisible(block.blockType)"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-radius']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.logocloudShape')" />
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.padding') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :labels="{ 'item-padding': $t('prw.label.leftRight'), 'item-padding-y': $t('prw.label.topBottom') }"
                  :guides="rowGuides(['item-padding', 'item-padding-y'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-padding', 'item-padding-y']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.logocloudPadding')" />
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.colors') }}</h3>
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="theme in themes"
                    :key="'lth-' + theme"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentItemColorTheme === theme ? 'true' : 'false'"
                    @click="itemColorTheme = theme"
                  >
<span class="pw-variant-dot is-small" :style="{ backgroundColor: variantBackground(theme) }"></span>{{ $t('pw.option.' + theme) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :labels="{ 'item-background': $t('prw.label.backgroundColor') }"
                  :theme="currentItemColorTheme"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-background']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.logocloudColors')" />
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.spacing') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-row-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-row-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-text-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-text-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.logocloudSpacing')" />
            </section>
            </template>



            <!-- featurelist: the title's arrangement, icon, tile, colours, gaps
                 (the entries' type: the elements tab) -->
            <template v-if="block.blockType === 'pwfeaturelist' && blockValueDefaults[block.blockType]">
            <!-- the title above the description or as a run-in in it -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.entryTitle') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-title-style']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
              </div>
            </section>
            <!-- featurelist icon: its position, alignment, size, gap and whether
                 it sits on a tile -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.icon') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-icon-position']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <template v-if="itemLayoutDefault(block.blockType, 'item-icon-position') !== 'none'">
                <pw-block-settings
                  v-if="itemLayoutDefault(block.blockType, 'item-icon-position') === 'left'"
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-icon-align']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <pw-block-values
                  v-if="itemLayoutDefault(block.blockType, 'item-icon-position') === 'left' && itemLayoutDefault(block.blockType, 'item-icon-align') !== 'center'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-icon-offset']"
                  :labels="{ 'item-icon-offset': $t('prw.label.offset') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-icon-size']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-icon-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-icon-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-icon-style']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                </template>
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.featureIcons')" />
            </section>
            <!-- its tile: form, radii, padding -->
            <section v-if="itemLayoutDefault(block.blockType, 'item-icon-position') !== 'none' && itemLayoutDefault(block.blockType, 'item-icon-style') === 'tile'" class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.tile') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
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
                  :bp.sync="itemBp"
                  v-if="isItemRadiusVisible(block.blockType)"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-radius']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-icon-tile-padding'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-icon-tile-padding']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.featureTile')" />
            </section>
            <!-- the colours of the chosen variant: the icon, its tile -->
            <section v-if="itemLayoutDefault(block.blockType, 'item-icon-position') !== 'none'" class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.colors') }}</h3>
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="theme in themes"
                    :key="'fth-' + theme"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentItemColorTheme === theme ? 'true' : 'false'"
                    @click="itemColorTheme = theme"
                  >
<span class="pw-variant-dot is-small" :style="{ backgroundColor: variantBackground(theme) }"></span>{{ $t('pw.option.' + theme) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :theme="currentItemColorTheme"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-icon-fill']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  v-if="itemLayoutDefault(block.blockType, 'item-icon-style') === 'tile'"
                  :bp.sync="itemBp"
                  :theme="currentItemColorTheme"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-icon-tile-background']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.featureColors')" />
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.spacing') }}</h3>
                <!-- the layout the preview shows (a view, not saved; at first
                     the start value; the same choice as the preview's) -->
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="lay in ['stacked', 'split']"
                    :key="'fl-' + lay"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentFeatureLayout(block.blockType) === lay ? 'true' : 'false'"
                    @click="$set(featurePreviewLayout, block.blockType, lay)"
                  >{{ $t('pw.option.' + lay) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-gap']"
                  :labels="{ 'item-gap': $t('prw.label.betweenItems') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <!-- offset: its gap and the intro's alignment only where it is
                     offset (from tablet on); on mobile the intro stays on top -->
                <pw-block-values
                  v-if="currentFeatureLayout(block.blockType) === 'split' && itemBp !== 'default'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-offset-gap']"
                  :guides="rowGuides(['item-offset-gap'])"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <!-- offset: the intro at the top or centred to the features -->
                <pw-block-settings
                  v-if="currentFeatureLayout(block.blockType) === 'split' && itemBp !== 'default'"
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-offset-align']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <!-- the gap to the intro above: offset, only on mobile (there the
                     intro is above the features) -->
                <pw-block-values
                  v-if="currentFeatureLayout(block.blockType) !== 'split' || itemBp === 'default'"
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-text-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-text-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.featureSpacing')" />
            </section>
            </template>

            <!-- faq: its icon, the questions (lines or cards), colours, gaps
                 (question and answer: the entries' card above) -->
            <template v-if="block.blockType === 'pwfaq' && blockValueDefaults[block.blockType]">
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.icon') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-icon']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <template v-if="itemLayoutDefault(block.blockType, 'item-icon') !== 'none'">
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-icon-position']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-icon-size']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-icon-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                </template>
              </div>
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('kirbyblock-faq.items') }}</h3>
                <!-- the style the preview shows (a view, not saved) -->
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="st in ['lines', 'cards']"
                    :key="'fs-' + st"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentFaqStyle(block.blockType) === st ? 'true' : 'false'"
                    @click="$set(faqPreviewStyle, block.blockType, st)"
                  >{{ $t('kirbyblock-faq.faq-style.' + st) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-padding-y']"
                  :guides="rowGuides(['item-padding-y'])"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  v-if="currentFaqStyle(block.blockType) === 'cards'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-padding-x']"
                  :guides="rowGuides(['item-padding-x'])"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  v-if="currentFaqStyle(block.blockType) === 'cards'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-settings
                  v-if="currentFaqStyle(block.blockType) === 'cards'"
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
                  v-if="currentFaqStyle(block.blockType) === 'cards' && itemLayoutDefault(block.blockType, 'item-shape') !== 'square'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-radius']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-settings
                  v-if="currentFaqStyle(block.blockType) !== 'cards'"
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-divider']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <pw-block-values
                  v-if="currentFaqStyle(block.blockType) !== 'cards' && itemLayoutDefault(block.blockType, 'item-divider') !== 'disabled'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-divider-width']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-answer-gap']"
                  :guides="rowGuides(['item-answer-gap'])"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-settings
                  v-if="itemLayoutDefault(block.blockType, 'item-icon') !== 'none'"
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-answer-width']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
              </div>
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.colors') }}</h3>
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="theme in themes"
                    :key="'fqth-' + theme"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentItemColorTheme === theme ? 'true' : 'false'"
                    @click="itemColorTheme = theme"
                  >
<span class="pw-variant-dot is-small" :style="{ backgroundColor: variantBackground(theme) }"></span>{{ $t('pw.option.' + theme) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :theme="currentItemColorTheme"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-question', 'item-answer']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  v-if="itemLayoutDefault(block.blockType, 'item-icon') !== 'none'"
                  :bp.sync="itemBp"
                  :theme="currentItemColorTheme"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-icon']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  v-if="currentFaqStyle(block.blockType) !== 'cards' && itemLayoutDefault(block.blockType, 'item-divider') !== 'disabled'"
                  :bp.sync="itemBp"
                  :theme="currentItemColorTheme"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-divider']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  v-if="currentFaqStyle(block.blockType) === 'cards'"
                  :bp.sync="itemBp"
                  :theme="currentItemColorTheme"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-background']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.spacing') }}</h3>
                <!-- the layout the preview shows (a view, not saved; at first
                     the start value; the same choice as the preview's) -->
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="lay in ['stacked', 'split']"
                    :key="'fql-' + lay"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentFeatureLayout(block.blockType) === lay ? 'true' : 'false'"
                    @click="$set(featurePreviewLayout, block.blockType, lay)"
                  >{{ $t('kirbyblock-faq.section-layout.' + lay) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  v-if="currentFeatureLayout(block.blockType) === 'split' && itemBp !== 'default'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-offset-gap']"
                  :guides="rowGuides(['item-offset-gap'])"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-settings
                  v-if="currentFeatureLayout(block.blockType) === 'split' && itemBp !== 'default'"
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-offset-align']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <pw-block-values
                  v-if="currentFeatureLayout(block.blockType) !== 'split' || itemBp === 'default'"
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-text-gap']"
                  :guides="rowGuides(['item-text-gap'])"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
            </section>
            </template>

            <!-- hero: its heights (the one chosen in the pills, a view; full
                 screen is always 100vh) -->
            <template v-if="block.blockType === 'pwhero' && blockValueDefaults[block.blockType]">
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.label.height') }}</h3>
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="h in ['small', 'medium', 'large', 'fullscreen']"
                    :key="'hh-' + h"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentHeroHeight(block.blockType) === h ? 'true' : 'false'"
                    @click="$set(heroPreviewHeight, block.blockType, h)"
                  >{{ $t('pw.option.' + h) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <!-- full screen: always 100vh, shown but not editable -->
                <div v-if="currentHeroHeight(block.blockType) === 'fullscreen'" class="pw-field-row">
                  <div class="k-input" data-type="text">
                    <span class="k-input-element pw-field-row-inner">
                      <div class="pw-field-row-label-col">
                        <label class="pw-field-row-label">{{ $t('prw.label.height') }}</label>
                      </div>
                      <div class="pw-field-row-options">
                        <span class="pw-element-field">
                          <span class="pw-readonly-value">100<span class="pw-element-unit">vh</span></span>
                          <span class="pw-px-calculator">{{ screenHeight(itemBp) }}px</span>
                        </span>
                        <!-- switch the device (shared by all rows): the px value follows -->
                        <span class="pw-pill pw-bp-switch" role="group">
                          <button
                            v-for="b in ['default', 'lg', 'xl']"
                            :key="'fs-' + b"
                            type="button"
                            class="pw-tool"
                            :title="$t({ default: 'prw.label.mobile', lg: 'prw.label.tablet', xl: 'prw.label.desktop' }[b])"
                            :aria-label="$t({ default: 'prw.label.mobile', lg: 'prw.label.tablet', xl: 'prw.label.desktop' }[b])"
                            :aria-pressed="itemBp === b ? 'true' : 'false'"
                            @click="itemBp = b"
                          ><k-icon :type="{ default: 'mobile', lg: 'tablet', xl: 'display' }[b]" /></button>
                        </span>
                      </div>
                    </span>
                  </div>
                </div>
                <pw-block-values
                  v-else
                  :bp.sync="itemBp"
                  :labels="{ ['height-' + currentHeroHeight(block.blockType)]: $t('prw.label.height') }"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['height-' + currentHeroHeight(block.blockType)]"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text v-if="currentHeroHeight(block.blockType) !== 'fullscreen'" size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.heroHeight')" />
              <k-text v-else size="tiny" class="k-help pw-card-help">{{ $t('prw.hint.heroFullscreen') }}</k-text>
            </section>
            <!-- hero: the overlay colour of each variant (its kind and strength
                 are set in the block) -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.colors') }}</h3>
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="theme in themes"
                    :key="'hth-' + theme"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentItemColorTheme === theme ? 'true' : 'false'"
                    @click="itemColorTheme = theme"
                  >
<span class="pw-variant-dot is-small" :style="{ backgroundColor: variantBackground(theme) }"></span>{{ $t('pw.option.' + theme) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['overlay']"
                  :theme="currentItemColorTheme"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help">{{ $t('prw.hint.heroOverlay') }}</k-text>
            </section>
            </template>

            <!-- cardlets: the card, its link, colours, gaps -->
            <template v-if="block.blockType === 'pwcardlets' && blockValueDefaults[block.blockType]">
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.padding') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-padding-x', 'item-padding-y'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-padding-x', 'item-padding-y']"
                  :labels="{ 'item-padding-x': $t('prw.label.leftRight'), 'item-padding-y': $t('prw.label.topBottom') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.cardletsCard')" />
            </section>
            <!-- the cards' form: square or round with the radii -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.shape') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
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
                  :bp.sync="itemBp"
                  v-if="isItemRadiusVisible(block.blockType)"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-radius']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.cardletsShape')" />
            </section>
            <!-- the card's style: its border (on / off, width, colour of the chosen variant) and shadow -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('pw.headline.style') }}</h3>
                <span v-if="isItemBorderEnabled(block.blockType)" class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="theme in themes"
                    :key="'cbt-' + theme"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentItemColorTheme === theme ? 'true' : 'false'"
                    @click="itemColorTheme = theme"
                  >
<span class="pw-variant-dot is-small" :style="{ backgroundColor: variantBackground(theme) }"></span>{{ $t('pw.option.' + theme) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
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
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-border-width']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  v-if="isItemBorderEnabled(block.blockType)"
                  :bp.sync="itemBp"
                  :theme="currentItemColorTheme"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-border-color']"
                  :labels="{ 'item-border-color': $t('prw.label.color') }"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <!-- the cards' shadow: none, small, medium, large -->
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-shadow']"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.cardletsBorder')" />
            </section>
            <!-- the cards' display: the one the preview shows (a view, not
                 saved; at first the start value) with its values -->
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('kirbyblock-cardlets.card-display') }}</h3>
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="d in ['stacked', 'overlay', 'overhang']"
                    :key="'cd-' + d"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentCardDisplay(block.blockType) === d ? 'true' : 'false'"
                    @click="$set(cardPreviewDisplay, block.blockType, d)"
                  >{{ $t('kirbyblock-cardlets.card-display.' + d) }}</button>
                </span>
              </div>
              <!-- image above: the images' ratio per device (Original: the file's own) -->
              <div v-if="currentCardDisplay(block.blockType) === 'stacked'" class="pw-card pw-field-table">
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="[{ default: 'item-image-ratio', lg: 'item-image-ratio-lg', xl: 'item-image-ratio-xl' }[itemBp] || 'item-image-ratio']"
                  :row-bp="itemBp"
                  @update:row-bp="itemBp = $event"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
              </div>
              <!-- on the image: the ratio per device, the overlay's strength (the
                   blocks' start value; the texts' position: a start value of
                   the block) -->
              <div v-else-if="currentCardDisplay(block.blockType) === 'overlay'" class="pw-card pw-field-table">
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="[{ default: 'item-ratio', lg: 'item-ratio-lg', xl: 'item-ratio-xl' }[itemBp] || 'item-ratio']"
                  :row-bp="itemBp"
                  @update:row-bp="itemBp = $event"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <pw-block-values
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-overlay-strength']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <!-- standing out: the images' ratio (not cropped) and how far, per
                   device (px or % of the image's height) -->
              <div v-else-if="currentCardDisplay(block.blockType) === 'overhang'" class="pw-card pw-field-table">
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="[{ default: 'item-cutout-ratio', lg: 'item-cutout-ratio-lg', xl: 'item-cutout-ratio-xl' }[itemBp] || 'item-cutout-ratio']"
                  :row-bp="itemBp"
                  @update:row-bp="itemBp = $event"
                  @update:overrides="onBlockOverridesUpdate(block.blockType, $event)"
                  @update:writer-active="$set(writerActive, block.blockType, $event)"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-overhang'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-overhang']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t({ stacked: 'prw.hint.cardletsDisplayStacked', overlay: 'prw.hint.cardletsDisplayOverlay', overhang: 'prw.hint.cardletsOverhang' }[currentCardDisplay(block.blockType)])" />
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.link') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
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
                <!-- at the card's bottom or right after the text -->
                <pw-block-settings
                  view="items-layout"
                  :block="block"
                  :config="blockConfigs[block.blockType]"
                  :overrides="blockOverrides[block.blockType] || {}"
                  :writer-active="writerActive[block.blockType] !== false"
                  :layout-keys="['item-link-position']"
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
                  :variants="activeVariants"
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
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.cardletsLink')" />
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.subtab.colors') }}</h3>
                <span class="pw-pill pw-theme-switch" role="group">
                  <button
                    v-for="theme in themes"
                    :key="'cth-' + theme"
                    type="button"
                    class="pw-tool"
                    :aria-pressed="currentItemColorTheme === theme ? 'true' : 'false'"
                    @click="itemColorTheme = theme"
                  >
<span class="pw-variant-dot is-small" :style="{ backgroundColor: variantBackground(theme) }"></span>{{ $t('pw.option.' + theme) }}</button>
                </span>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :theme="currentItemColorTheme"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="isItemLinkStyleButton(block.blockType) ? ['item-tagline-text', 'item-heading-text', 'item-editor-text', ...(currentCardDisplay(block.blockType) === 'overlay' ? ['item-overlay'] : []), 'item-background'] : ['item-tagline-text', 'item-heading-text', 'item-editor-text', 'item-link', 'item-link-hover', 'item-link-active', ...(currentCardDisplay(block.blockType) === 'overlay' ? ['item-overlay'] : []), 'item-background']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.cardletsColors')" />
            </section>
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.spacing') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :labels="{ 'item-gap': $t('prw.label.betweenCards') }"
                  :guides="rowGuides(['item-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-tagline-spacing'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-tagline-spacing']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-heading-spacing'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-heading-spacing']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-cta-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-cta-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-text-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-text-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.cardletsSpacing')" />
            </section>
            </template>

            <!-- media: the gap to the intro above the image, slideshow or video -->
            <template v-if="block.blockType === 'pwmedia' && blockValueDefaults[block.blockType]">
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.spacing') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['item-text-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="['item-text-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.mediaSpacing')" />
            </section>
            </template>

            <!-- multicolumn: the gaps between the columns (side by side, below
                 each other); the elements' space below in the card Elements -->
            <template v-if="block.blockType === 'pwmulticolumn' && blockValueDefaults[block.blockType]">
            <section class="pw-card-section">
              <div class="pw-card-heading-row">
                <h3 class="pw-card-heading">{{ $t('prw.headline.spacing') }}</h3>
              </div>
              <div class="pw-card pw-field-table">
                <pw-block-values
                  :bp.sync="itemBp"
                  :guides="rowGuides(['column-gap', 'row-gap'])"
                  :defaults="blockValueDefaults[block.blockType]"
                  :patch="valuesPatch(block.blockType)"
                  :overrides="blockValueOverrides[block.blockType] || {}"
                  :show-only="[mcColumnsSide(block.blockType) ? 'column-gap' : 'row-gap']"
                  :hide-section-headers="true"
                  @update:overrides="onBlockValueOverridesUpdate(block.blockType, $event)"
                  @hover-var="hoveredVar = $event"
                />
              </div>
              <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.multicolumnSpacing')" />
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
import { withoutPatched, withoutPatchedValues } from '../helpers/patches.js';
import { injectFontFaces } from '../preview/fonts.js';
import { announcePreviewSaved } from '../preview/store.js';
import autosize from '../directives/autosize.js';
import { readPreviewBp, savePreviewBp, SCREEN_HEIGHTS } from '../helpers/preview-bp.js';

// the guides' colours, given in this order to the rows of the open tab:
// magenta, blue, violet, green, orange, petrol, gold
const GUIDE_PALETTE = ['255, 0, 170', '0, 170, 255', '130, 80, 255', '0, 180, 90', '255, 140, 0', '0, 150, 136', '215, 160, 0'];

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
      globalActiveTab: (() => { try { const t = sessionStorage.getItem('pw-wizard-tab'); sessionStorage.removeItem('pw-wizard-tab'); return t || 'welcome'; } catch (e) { return 'welcome'; } })(),
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
      // featurelist: the layout its preview shows (stacked / split), a view
      featurePreviewLayout: {},
      // faq: the style its preview shows (lines / cards), a view
      faqPreviewStyle: {},
      // hero: the height its preview shows (small … fullscreen), a view
      heroPreviewHeight: {},
      startHeroHeights: {},
      // cardlets: the display shown in the design tab, the start value last seen
      cardPreviewDisplay: {},
      startCardDisplays: {},
      // the drawer tab shown in each block's start values
      startDrawerTab: {},
      startSectionLayouts: {},
      // the value whose row the pointer is over: its area tinted in the preview
      hoveredVar: null,
      // theme shown in the items' colour card
      itemColorTheme: 'default',
      // each block's theme start value (to notice a change)
      startThemes: {},
      // steplist: each block's item style start value (to notice a change)
      startItemStyles: {},
      // guides in the block preview (and the matching stripes in the rows)
      previewGuides: (() => { try { return localStorage.getItem('pw-wizard-guides') === 'on'; } catch (e) { return false; } })(),
      // the open tab's values with a guide, in the order of their rows
      guideOrder: [],
      // breakpoint shown in the items' responsive rows
      // device of the preview: the last one chosen (see helpers/preview-bp.js)
      itemBp: readPreviewBp(),
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
      // exceptions (Project › Exceptions): the JSON as text, its check
      patchesText: '',
      patchesTree: {},
      // the path at the editor's cursor: the tree opens and marks it
      patchesFocus: null,
      // the start page's figures: the site's pages (loaded with the wizard)
      sitePageCount: null,
      // saving everything at once: the single saves stay quiet
      savingAll: false,
      originalPatchesText: '',
      patchesError: '',
      patchesUnknown: [],
      aiForm: null,
      aiValues: {},
      originalAiValues: {},
      // Settings › Translation (translatewizard): the tree of the text
      // fields, which are translated ("owner.field" → on), DeepL's usage
      // the start page's slogan, typed: letters shown so far, the caret
      sloganTyped: 0,
      sloganCaret: false,
      // the figures below it: faded in after the typing
      statsShown: false,
      translateTree: null,
      // the tree: all entries opened (true) or shut (false) at once
      translateExpanded: false,
      // the stored keys checked with their services (env → true / false / null)
      aiSecretValid: {},
      aiSecretTypes: {},
      translateValues: {},
      originalTranslateValues: {},
      deeplUsage: null,
      // translating several pages (Settings › Translation)
      batch: { languages: [], pages: [], lang: null, mode: 'missing', running: false, stop: false, done: 0, total: 0, current: '', result: null },
      // its dialog: { step: ask | run | done, lang, mode, pages, chars }
      batchDialog: null,
      aiSecrets: null,
      aiSecretsWritable: true,
      aiSecretInputs: {},
    };
  },
  // the saved exceptions for the block settings (their locked rows) and the
  // way to them (the lock's click)
  provide() {
    return {
      pwPatches: () => this.savedPatches,
      pwOpenPatches: () => this.openGlobal('patches'),
    };
  },
  computed: {
    // the variants' block background (variant → colour), for their dots
    variantColors() {
      return Object.fromEntries((this.themes || []).map(t => [t, this.variantBackground(t)]));
    },
    // the open tab's guide colours for the preview (value → "r, g, b"; the
    // steplist's gap of a style also under its plain name)
    previewGuideColors() {
      if (!this.previewGuides) return null;
      const colors = {};
      this.guideOrder.forEach((name) => {
        const rgb = this.guideColor(name);
        colors[name] = rgb;
        if (name.startsWith('item-content-gap')) colors['item-content-gap'] = rgb;
      });
      return colors;
    },
    // the exceptions as saved (what applies; not the text being edited)
    savedPatches() {
      try {
        const data = JSON.parse(this.originalPatchesText || '{}');
        return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
      } catch (e) {
        return {};
      }
    },
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
          const icons = { heading: 'title', tagline: 'tag', editor: 'text', quote: 'quote', button: 'url', breadcrumb: 'angle-right', media: 'images', item: 'prw-entries', list: 'prw-list' };
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
    globalPageIntro() {
      if (this.globalActiveTab === 'blocks') return this.$t('prw.intro.global.blocks');
      // an element: what it is and where it is used
      if (this.globalActiveTab === 'elements' && this.selectedElement) {
        const key = this.selectedElement === 'item' ? 'prw.hint.itemElement' : 'prw.intro.element.' + this.selectedElement;
        const text = this.$t(key);
        return text && text !== key ? text : '';
      }
      return '';
    },
    // the icon before a global page's title: an element's (as in the
    // elements menu), else the page's (as in its menu)
    globalPageIcon() {
      if (this.globalActiveTab === 'elements') {
        const element = this.elementOptions.find(o => o.value === this.selectedElement);
        return element ? element.icon : null;
      }
      const tab = this.globalTabs.find(t => t.key === this.globalActiveTab);
      return tab ? tab.icon : null;
    },
    globalPageTitle() {
      if (this.globalActiveTab === 'elements') {
        const element = this.elementOptions.find(o => o.value === this.selectedElement);
        if (element) return element.text;
      }
      // (the configuration: a longer title than in the menu)
      if (this.globalActiveTab === 'patches') return this.$t('prw.page.patches');
      return this.$t('prw.tab.' + this.globalActiveTab);
    },
    projectMenuTabs() {
      return ['site', 'header', 'footer', 'blocks', 'fonts'];
    },
    // the settings menu: the project, the settings (variants), AI (with
    // kirby-contentwizard) and the exceptions
    configMenuTabs() {
      return [...(this.hasTranslateTab ? ['translate'] : []), ...(this.hasGeneratorTab ? ['generator'] : []), 'patches'];
    },
    // the AI pages: translation with the translatewizard's keys, the page
    // generator with the contentwizard's settings and keys
    // unsaved changes per page (how many values differ from the saved
    // ones): block:<type>, element:<group>, site, header, footer, blocks,
    // fonts, translate, generator, patches
    pendingCounts() {
      const out = {};
      const add = (key, n = 1) => { if (n) out[key] = (out[key] || 0) + n; };
      for (const block of this.blocks) {
        const bt = block.blockType;
        add('block:' + bt, this.diffPaths(this.blockOverrides[bt] || {}, this.originalOverrides[bt] || {}).length
          + this.diffPaths(this.blockValueOverrides[bt] || {}, this.originalBlockValueOverrides[bt] || {}).length);
      }
      // the project values: the page background (Site), the fonts, else the blocks page
      for (const path of this.diffPaths(this.globalOverrides, this.originalGlobalOverrides)) {
        const name = String(path[path.length - 1]);
        add(name === 'body-background' ? 'site' : name.startsWith('font-') ? 'fonts' : 'blocks');
      }
      // the active blocks and colour variants (blocks page)
      const changed = (a, b) => a.filter(x => !b.includes(x)).length + b.filter(x => !a.includes(x)).length;
      add('blocks', changed(this.activeBlocks, this.originalActiveBlocks) + changed(this.activeVariants, this.originalActiveVariants));
      // the elements and their size steps: by element
      for (const path of [...this.diffPaths(this.elementOverrides, this.originalElementOverrides), ...this.diffPaths(this.fontOverrides, this.originalFontOverrides)]) {
        add('element:' + this.elementGroupOf(String(path[path.length - 1])));
      }
      add('header', this.diffPaths(this.navOverrides, this.originalNavOverrides).length);
      add('footer', this.diffPaths(this.footerOverrides, this.originalFooterOverrides).length);
      // AI: the generator's settings, the keys typed in (by plugin)
      add('generator', this.diffPaths(this.aiValues, this.originalAiValues).length);
      add('translate', this.diffPaths(this.translateValues, this.originalTranslateValues).length);
      for (const [env, value] of Object.entries(this.aiSecretInputs || {})) {
        if (!value || !value.trim()) continue;
        const secret = (this.aiSecrets || []).find(sc => sc.env === env);
        add(secret && secret.plugin === 'kirbydesk.kirby-translatewizard' ? 'translate' : 'generator');
      }
      if (this.patchesText !== this.originalPatchesText) add('patches');
      return out;
    },
    // the batch dialog's buttons per step
    batchDialogCancel() {
      const step = this.batchDialog?.step;
      if (step === 'ask') return this.$t('cancel');
      // stopped: close, or go on (the submit button)
      if (step === 'done' && this.batch.result?.stopped) return this.$t('cancel');
      // (stopping: the button says so, no extra line in the dialog)
      if (step === 'run') {
        return this.batch.stop
          ? { text: this.$t('prw.translate.batch.stopping'), icon: 'loader', disabled: true }
          : { text: this.$t('prw.translate.batch.stop'), icon: 'cancel' };
      }
      return false;
    },
    // more characters than the usage has left (a dry run sends none)
    batchOverQuota() {
      const d = this.batchDialog;
      return !!(d && this.deeplUsage && d.chars > this.deeplUsage.limit - this.deeplUsage.count);
    },
    batchDialogSubmit() {
      const step = this.batchDialog?.step;
      if (step === 'ask') {
        // (not enough usage: only "Cancel")
        if (this.batchOverQuota) return false;
        return { text: this.$t('prw.translate.batch.start', { count: this.batchDialog.pages.length }), icon: 'translatewizard-translate', theme: 'positive' };
      }
      if (step === 'done' && this.batch.result?.stopped) {
        return { text: this.$t('prw.translate.batch.resume'), icon: 'play', theme: 'positive' };
      }
      if (step === 'done') return { text: this.$t('prw.translate.batch.close'), icon: 'check' };
      return false;
    },
    // the start page's figures: the blocks used on all pages together
    blockUsageTotal() {
      const counts = Object.values(this.blockUsage || {});
      return counts.length ? counts.reduce((sum, n) => sum + (Number(n) || 0), 0) : null;
    },
    pendingPageCount() {
      return Object.keys(this.pendingCounts).length;
    },
    // pages without the preview column: the AI pages over the full width
    fullWidthPage() {
      return this.activeTab === 'global' && ['welcome', 'translate', 'generator'].includes(this.globalActiveTab);
    },
    patchesHighlighted() {
      return this.patchesHighlightedFor(this.patchesText);
    },
    hasTranslateTab() {
      return (this.aiSecrets || []).some(s => s.plugin === 'kirbydesk.kirby-translatewizard');
    },
    hasGeneratorTab() {
      return !!this.aiForm || (this.aiSecrets || []).some(s => s.plugin === 'kirbydesk.kirby-contentwizard');
    },
    aiPageSecrets() {
      const plugin = { translate: 'kirbydesk.kirby-translatewizard', generator: 'kirbydesk.kirby-contentwizard' }[this.globalActiveTab];
      return (this.aiSecrets || []).filter(s => s.plugin === plugin);
    },
    // activated blocks with their own settings view (pw* blocks), for the blocks dropdown
    // tabs of a block view: design (only with values), start values, restrictions
    blockViewTabs() {
      const views = [
        ...(this.hasDesignView(this.activeTab) ? ['design'] : []),
        ...(this.hasElementsView(this.activeTab) ? ['elements'] : []),
        'defaults',
        'presets',
      ];
      // design: pencil and ruler, elements: the layers (as the Elements page), start values: the pen,
      // restrictions: the crossed-out eye
      const icons = { design: 'prw-design', elements: 'layers', defaults: 'edit-line', presets: 'hidden' };
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
        { key: 'site', icon: 'template' },
        { key: 'blocks', icon: 'box' },
        { key: 'elements', icon: 'layers' },
        { key: 'fonts', icon: 'title' },
        { key: 'header', icon: 'prw-header' },
        { key: 'footer', icon: 'prw-footer' },
      ];
      // AI defaults — only when kirby-contentwizard is installed
      // (the translatewizard's own icon, as its button on the pages; the tab
      // exists only with that plugin, which registers it)
      if (this.hasTranslateTab) tabs.push({ key: 'translate', icon: 'translatewizard-translate' });
      if (this.hasGeneratorTab) tabs.push({ key: 'generator', icon: 'ai' });
      tabs.push({ key: 'patches', icon: 'code' });
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
    // the media's corner radii (Elements › Media › Form): override, else the plugin's
    mediaRadiusValues() {
      const ov = (this.elementOverrides.global || {})['media-radius'];
      return Array.isArray(ov) ? ov : (this.elementDefaults.media?.vars?.['media-radius']?.value || []);
    },
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
        // (the blocks page also holds the block activation and the variants)
        if (tab === 'blocks') return !!this.dirtyTabs['global-settings'] || !!this.dirtyTabs['global'];
        if (['site', 'fonts'].includes(tab)) return !!this.dirtyTabs['global-settings'];
        // (both AI pages save the AI settings and keys together)
        if (tab === 'translate' || tab === 'generator') return !!this.dirtyTabs['ai'];
        return !!this.dirtyTabs[tab];
      }
      return !!this.dirtyTabs[this.activeTab];
    },
  },
  watch: {
    // remembered for the next visit
    itemBp(bp) {
      savePreviewBp(bp);
    },
    // the configuration's field grows with its content (also on inserting
    // from the tree, loading, discarding, opening the page)
    patchesText() {
      this.$nextTick(this.fitPatchesInput);
    },
    // (the text arrives while the loading view still stands, e.g. coming
    // from a block: measured once the page is there)
    loading(now) {
      if (!now) this.$nextTick(this.fitPatchesInput);
      if (!now) this.$nextTick(this.fitTopbar);
      // (the slogan typed once the page is there, not while loading)
      if (!now && !this.sloganTyped) this.typeSlogan();
    },
    // (the save buttons come and go)
    pendingPageCount() {
      this.$nextTick(this.fitTopbar);
    },
    // the unsaved changes written along (a draft in the browser, see saveDraft)
    pendingCounts() {
      clearTimeout(this._draftTimer);
      this._draftTimer = setTimeout(() => this.saveDraft(), 400);
    },
    // the blocks page: how often each block is used (for its row)
    globalActiveTab: {
      immediate: true,
      handler(tab) {
        if (tab === 'blocks') this.loadBlockUsage();
        // (DeepL asked only when the page is opened)
        if (tab === 'translate' && this.hasTranslateTab) {
          this.loadDeeplUsage();
          this.loadBatch();
        }
        if (tab === 'patches') {
          this.$nextTick(this.fitPatchesInput);
          this.loadPatchesTree();
        }
      },
    },
    // another block: start on its first tab
    activeTab(tab) {
      this.blockViewTab = null;
      this.showStartTheme();
      // (the global view is built anew when coming back from a block: its
      // configuration field measured, its width watched again)
      if (tab === 'global') this.$nextTick(this.fitPatchesInput);
    },
    // each load of the global view (Kirby sets a new timestamp, also for the
    // same address, e.g. its menu entry): the page chosen in a wizard menu
    // (openGlobal), else the start page – as Kirby's own entries lead to
    // their overview
    '$panel.view.timestamp'() {
      if (this.blockType) return;
      const tab = this._pendingTab;
      this._pendingTab = null;
      // (the view stayed: the storage for a fresh start is not needed)
      try { sessionStorage.removeItem('pw-wizard-tab'); } catch (e) { /* no storage */ }
      this.globalActiveTab = tab || 'welcome';
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
    // unsaved changes of an earlier visit (reload, closed tab) back
    this.restoreDraft();
    this.showStartTheme();
    this._onKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (this.pendingPageCount) this.saveAll();
      }
    };
    window.addEventListener('keydown', this._onKeydown);
  },
  updated() {
    this.scanGuideOrder();
  },
  mounted() {
    this.scanGuideOrder();
    // the topbar: save buttons with their icon only while the room is short
    if (typeof ResizeObserver !== 'undefined' && this.$refs.topbar) {
      this._topbarObserver = new ResizeObserver(() => this.fitTopbar());
      this._topbarObserver.observe(this.$refs.topbar);
    }
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this._onKeydown);
    if (this._topbarObserver) this._topbarObserver.disconnect();
    if (this._patchesObserver) this._patchesObserver.disconnect();
  },
  methods: {
    async load() {
      try {
        const res = await this.$api.get('projectwizard/blocks');
        this.blocks = res.blocks || [];
        // (alphabetical by the name in the panel's language – the names read
        // from the blocks just set)
        this.blocks = this.blocks.slice().sort((a, b) => this.blockLabel(a.blockType).localeCompare(this.blockLabel(b.blockType), this.$panel.translation.code));
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

          // Load per-block CSS-variable defaults + overrides (the items' values,
          // the hero's heights …); blocks without values of their own get none
          {
            try {
              const valuesRes = await this.$api.get('projectwizard/values/' + block.blockType);
              const defaults = valuesRes.defaults && !Array.isArray(valuesRes.defaults) ? valuesRes.defaults : {};
              if (!Object.keys(defaults).length) throw new Error('no values');
              this.$set(this.blockValueDefaults, block.blockType, defaults);
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

        // the start page's figures
        try { this.sitePageCount = (await this.$api.get('projectwizard/stats')).pages; } catch (e) { /* none */ }
        // (the blocks used on all pages, as counted in the blocks menu)
        this.loadBlockUsage();

        // Load the exceptions (Project › Exceptions)
        const patches = await this.$api.get('projectwizard/patches');
        this.patchesText = patches.text || '';
        this.originalPatchesText = this.patchesText;
        this.patchesUnknown = patches.unknown || [];

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
        // the translated fields (translatewizard)
        if (this.hasTranslateTab) await this.loadTranslateFields();

        this.loading = false;
      } catch (e) {
        console.error('Failed to load', e);
      }
    },

    blockLabel(blockType) {
      const block = this.blocks.find(b => b.blockType === blockType);
      // (the translated name first, the plugin's own description after)
      if (block) {
        const translated = this.$t(block.plugin + '.name');
        if (translated && translated !== block.plugin + '.name') return translated;
      }
      if (block && block.name) return block.name;
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
    // alignment of the number in the shown style (centered: always centre)
    stepAlign(blockType) {
      if (this.currentStepStyle(blockType) === 'centered') return 'center';
      return this.itemLayoutDefault(blockType, this.stepValueKey(blockType, 'item-number-align')) || 'center';
    },
    // featurelist: the layout shown (chosen in the gaps card, else the start value)
    currentFeatureLayout(blockType) {
      if (this.featurePreviewLayout[blockType]) return this.featurePreviewLayout[blockType];
      const ov = this.blockOverrides[blockType]?.settings?.fields?.style?.['section-layout']?.default;
      return ov || this.blockConfigs[blockType]?.defaults?.settings?.fields?.style?.['section-layout']?.default || 'stacked';
    },
    // the screen height of a device (px), as the preview assumes it
    screenHeight(bp) {
      return SCREEN_HEIGHTS[bp] || SCREEN_HEIGHTS.default;
    },
    // a rem value in px (16px root), as the px cells
    remToPx(val) {
      const n = parseFloat(val);
      return isNaN(n) ? '' : Math.round(n * 16) + 'px';
    },
    // the block's text allows lists: its editor (with the exceptions) has a
    // list among some "nodes" – no "nodes" at all is Kirby's writer, lists
    // included
    allowsLists(blockType) {
      const editor = this.blocks.find(b => b.blockType === blockType)?.editor;
      const lists = [];
      const walk = (o) => {
        if (!o || typeof o !== 'object' || Array.isArray(o)) return;
        if (Array.isArray(o.nodes)) lists.push(o.nodes);
        Object.values(o).forEach(walk);
      };
      walk(editor);
      return !lists.length || lists.some(n => n.includes('bulletList') || n.includes('orderedList'));
    },
    // a block that brings values for its own space below (tagline, heading, text)
    hasOwnSpacing(blockType) {
      return this.ownSpacingElements(blockType).length > 0;
    },
    // its elements with such a value (the heading block: only the tagline),
    // without those hidden under Visibility (they are not in the block)
    // the elements whose space below the block has values for: always all,
    // in a fixed order – used or not, hidden or not (each applies, also
    // below the intro's last one; a block may enlarge that one)
    ownSpacingElements(blockType) {
      const groups = Object.values(this.blockValueDefaults[blockType] || {});
      return ['tagline', 'heading', 'editor', 'list', 'quote', 'media', 'button']
        .filter(el => groups.some(g => g && g.vars && g.vars[el + '-spacing']));
    },
    // multicolumn: the columns side by side at the device shown (then the
    // gap between them counts, else the one below each other); mobile always
    // stacked, as in the preview
    mcColumnsSide(blockType) {
      const key = { lg: 'columns-lg', xl: 'columns-xl' }[this.itemBp];
      if (!key) return false;
      const path = ['settings', 'fields', 'layout', key, 'default'];
      const get = (o) => path.reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), o);
      const dist = get(this.blockOverrides[blockType]) ?? get(this.blockConfigs[blockType]?.defaults);
      return /^dist-\d-\d$/.test(dist || '');
    },
    // the guides' colours: the open tab's rows with a guide, in their order
    // (top to bottom), each the next colour of the palette – the first always
    // magenta; read from the tab after each render
    scanGuideOrder() {
      const scope = this.previewGuides && this.$el && this.$el.querySelector
        ? this.$el.querySelector('[data-guide-scope="' + this.activeTab + ':' + this.currentBlockView + '"]')
        : null;
      const order = [];
      if (scope) {
        scope.querySelectorAll('[data-guide-var]').forEach((row) => {
          const name = row.getAttribute('data-guide-var');
          if (name && !order.includes(name)) order.push(name);
        });
      }
      if (order.join('|') !== this.guideOrder.join('|')) this.guideOrder = order;
    },
    // a value's guide colour ("r, g, b"), none outside the open tab's rows
    guideColor(name) {
      const idx = this.guideOrder.indexOf(name);
      return idx < 0 ? null : GUIDE_PALETTE[idx % GUIDE_PALETTE.length];
    },
    // the guides of some rows (value → colour) while the guides are on
    rowGuides(names) {
      if (!this.previewGuides || !names.length) return null;
      return Object.fromEntries(names.map(name => [name, this.guideColor(name)]));
    },
    // the global elements' space below (Elements page: override, else default)
    globalElementSpacing(el) {
      const name = el + '-spacing';
      return (this.elementOverrides.global || {})[name] || this.elementDefaults[el]?.vars?.[name]?.value || '';
    },
    // a block whose entries take Elements › Items (with own values to switch on)
    hasEntry(blockType) {
      return Object.values(this.blockValueDefaults[blockType] || {}).some(g => g && g.vars && g.vars['item-title-font-size']);
    },
    // featurelist entries: the rows of their values (title in the text:
    // only the description's size, which then is the size of both)
    entryRows(blockType) {
      const inline = this.itemLayoutDefault(blockType, 'item-title-style') === 'inline';
      if (inline) return ['item-text-font-size'];
      // (faq: the gap between question and answer is its own value)
      if (blockType === 'pwfaq') return ['item-title-font-size', 'item-title-line-height', 'item-text-font-size'];
      return ['item-title-font-size', 'item-title-line-height', 'item-text-font-size', 'item-title-spacing'];
    },
    // the entries' two cards: the title (its size, line height, gap to the
    // description) and the description (its size)
    entryParts(blockType) {
      const rows = this.entryRows(blockType);
      // (a part without values – the title as a run-in – left out)
      return [
        { key: 'title', heading: 'prw.headline.entryTitle', rows: rows.filter(n => n.startsWith('item-title-')) },
        { key: 'text', heading: 'prw.headline.entryText', rows: rows.filter(n => n.startsWith('item-text-')) },
      ].filter(p => p.rows.length > 0);
    },
    entryLabel(blockType, name) {
      // (in its card: short – the card says title or description)
      const short = { 'item-title-font-size': 'prw.prop.font-size', 'item-title-line-height': 'prw.prop.line-height', 'item-text-font-size': 'prw.prop.font-size', 'item-title-spacing': 'prw.element.item-title-spacing' }[name];
      if (short) return this.$t(short);
      if (name === 'item-text-font-size' && this.itemLayoutDefault(blockType, 'item-title-style') === 'inline') return this.$t('prw.prop.font-size');
      return this.$t('prw.prop.' + name);
    },
    // a value of the global items (Elements › Items) at the shown device
    globalItemValue(name) {
      const def = this.elementDefaults.item?.vars?.[name];
      if (!def) return '';
      const ov = this.elementOverrides.global || {};
      if (def.default !== undefined) return (ov[this.itemBp] || {})[name] || def[this.itemBp] || def.default;
      return ov[name] || def.value;
    },
    // own values of the entries switched on: values not set yet take the
    // global items' (responsive ones per device)
    seedOwnEntry(blockType, part) {
      const ov = JSON.parse(JSON.stringify(this.blockValueOverrides[blockType] || {}));
      const ownVars = {};
      for (const g of Object.values(this.blockValueDefaults[blockType] || {})) Object.assign(ownVars, (g && g.vars) || {});
      const eo = this.elementOverrides.global || {};
      let changed = false;
      for (const name of ['item-title-font-size', 'item-title-line-height', 'item-text-font-size', 'item-title-spacing']) {
        if (part && (name.startsWith('item-text-') ? 'text' : 'title') !== part) continue;
        const def = this.elementDefaults.item?.vars?.[name];
        if (!ownVars[name] || !def || ov[name] !== undefined) continue;
        if (def.default !== undefined) {
          ov[name] = Object.fromEntries(['default', 'lg', 'xl'].map(bp => [bp, (eo[bp] || {})[name] || def[bp] || def.default]));
        } else {
          ov[name] = eo[name] || def.value;
        }
        changed = true;
      }
      if (changed) this.onBlockValueOverridesUpdate(blockType, ov);
    },
    // own space below (tagline, heading, text): values not set yet take the
    // elements' current (global) ones, so the block starts where it was
    seedOwnSpacing(blockType) {
      const ov = JSON.parse(JSON.stringify(this.blockValueOverrides[blockType] || {}));
      let changed = false;
      for (const el of ['tagline', 'heading', 'editor', 'list', 'quote', 'media', 'button']) {
        const name = el + '-spacing';
        const own = Object.values(this.blockValueDefaults[blockType] || {}).some(g => g && g.vars && g.vars[name]);
        if (!own || ov[name] !== undefined) continue;
        const global = (this.elementOverrides.global || {})[name] || this.elementDefaults[el]?.vars?.[name]?.value;
        if (global) { ov[name] = global; changed = true; }
      }
      if (changed) this.onBlockValueOverridesUpdate(blockType, ov);
    },
    // hero: the height shown (chosen in the height card, else the start value)
    currentHeroHeight(blockType) {
      if (this.heroPreviewHeight[blockType]) return this.heroPreviewHeight[blockType];
      const ov = this.blockOverrides[blockType]?.settings?.fields?.style?.height?.default;
      const h = ov || this.blockConfigs[blockType]?.defaults?.settings?.fields?.style?.height?.default;
      return ['small', 'medium', 'large', 'fullscreen'].includes(h) ? h : 'small';
    },
    // cardlets: the display shown (chosen in the padding card, else the start value)
    currentCardDisplay(blockType) {
      if (this.cardPreviewDisplay[blockType]) return this.cardPreviewDisplay[blockType];
      const ov = this.blockOverrides[blockType]?.settings?.fields?.style?.['card-display']?.default;
      return ov || this.blockConfigs[blockType]?.defaults?.settings?.fields?.style?.['card-display']?.default || 'stacked';
    },
    // faq: the style shown (chosen in the questions card, else the start value)
    currentFaqStyle(blockType) {
      if (this.faqPreviewStyle[blockType]) return this.faqPreviewStyle[blockType];
      const ov = this.blockOverrides[blockType]?.settings?.fields?.style?.['faq-style']?.default;
      return ov || this.blockConfigs[blockType]?.defaults?.settings?.fields?.style?.['faq-style']?.default || 'lines';
    },
    // the views of a block the preview's toolbar switches between (the same
    // choice as the cards' pills; a view, not saved)
    viewSwitches(blockType) {
      const list = [];
      if (['pwfeaturelist', 'pwfaq'].includes(blockType)) {
        list.push({ key: 'layout', value: this.currentFeatureLayout(blockType), options: ['stacked', 'split'], prefix: blockType === 'pwfaq' ? 'kirbyblock-faq.section-layout.' : 'pw.option.' });
      }
      if (blockType === 'pwfaq') {
        list.push({ key: 'faq-style', value: this.currentFaqStyle(blockType), options: ['lines', 'cards'], prefix: 'kirbyblock-faq.faq-style.' });
      }
      if (blockType === 'pwsteplist') {
        list.push({ key: 'step-style', value: this.currentStepStyle(blockType), options: this.stepStyleOptions(blockType), prefix: 'kirbyblock-steplist.item-style.' });
      }
      if (blockType === 'pwhero') {
        list.push({ key: 'hero-height', value: this.currentHeroHeight(blockType), options: ['small', 'medium', 'large', 'fullscreen'], prefix: 'pw.option.' });
      }
      if (blockType === 'pwcardlets') {
        list.push({ key: 'card-display', value: this.currentCardDisplay(blockType), options: ['stacked', 'overlay', 'overhang'], prefix: 'kirbyblock-cardlets.card-display.' });
      }
      return list;
    },
    onViewSwitch(blockType, { key, value }) {
      const store = { layout: 'featurePreviewLayout', 'faq-style': 'faqPreviewStyle', 'step-style': 'stepPreviewStyle', 'hero-height': 'heroPreviewHeight', 'card-display': 'cardPreviewDisplay' }[key];
      if (store) this.$set(this[store], blockType, value);
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
    // a block with values of its own (the items' CSS variables, the hero's
    // heights and gaps)
    hasDesign(blockType) {
      return !!this.blockValueDefaults[blockType];
    },
    // the design tab: values of its own beyond those of the elements tab
    // (the entries' type, the space below)
    hasDesignView(blockType) {
      if (!this.hasDesign(blockType)) return false;
      const elementValues = ['tagline-spacing', 'heading-spacing', 'editor-spacing', 'list-spacing', 'quote-spacing', 'media-spacing', 'button-spacing',
        'item-title-font-size', 'item-title-line-height', 'item-text-font-size', 'item-title-spacing'];
      return Object.values(this.blockValueDefaults[blockType] || {}).some(g => g && (
        Object.keys(g.colors || {}).length > 0
        || Object.keys(g.vars || {}).some(name => !elementValues.includes(name))
      ));
    },
    // the elements tab: the entries' type or the space below, the global
    // elements' or the block's own
    hasElementsView(blockType) {
      return this.hasEntry(blockType) || this.hasOwnSpacing(blockType);
    },
    hasItemDefaultFields(blockType) {
      // the items' card in the start values: only for per-corner item-radius
      // toggles (the link style is a design value, not a start value)
      const cfg = this.blockConfigs[blockType];
      const layout = cfg && cfg.defaults && cfg.defaults.settings && cfg.defaults.settings.fields && cfg.defaults.settings.fields.layout || {};
      for (const key of Object.keys(layout)) {
        if (key.startsWith('item-radius-')) return true;
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

    // the slogan letter by letter (at once where motion is reduced); the
    // caret blinks a moment longer, then goes
    typeSlogan() {
      const length = this.$t('prw.welcome.slogan').length;
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        this.sloganTyped = length;
        this.sloganCaret = false;
        this.statsShown = true;
        return;
      }
      this.sloganCaret = true;
      const step = () => {
        if (this.sloganTyped >= length) {
          setTimeout(() => { this.statsShown = true; }, 400);
          setTimeout(() => { this.sloganCaret = false; }, 5000);
          return;
        }
        this.sloganTyped++;
        setTimeout(step, 55 + Math.random() * 60);
      };
      setTimeout(step, 250);
    },
    // the translated fields: the tree and its values (a flat map)
    setTranslateTree(tree) {
      const values = {};
      const walk = (node) => {
        for (const f of node.fields || []) values[f.key] = !!f.value;
        (node.children || []).forEach(walk);
      };
      (tree || []).forEach(walk);
      this.translateTree = tree || null;
      this.translateValues = values;
      this.originalTranslateValues = JSON.parse(JSON.stringify(values));
    },
    onTranslateToggle({ key, value }) {
      this.$set(this.translateValues, key, value);
      this.updateAiDirty();
    },
    async loadTranslateFields() {
      try {
        this.setTranslateTree((await this.$api.get('translatewizard/fields')).tree);
      } catch (e) {
        this.translateTree = null;
      }
    },
    // the pages of a mode: without translation in the chosen language, or all
    batchPagesOf(mode, lang = this.batch.lang) {
      return this.batch.pages.filter(p => mode === 'all' || !(p.translated || {})[lang]);
    },
    async loadBatch() {
      try {
        const res = await this.$api.get('translatewizard/batch');
        this.batch.languages = res.languages || [];
        this.batch.pages = res.pages || [];
        if (!this.batch.languages.some(l => l.code === this.batch.lang)) {
          this.batch.lang = this.batch.languages[0] ? this.batch.languages[0].code : null;
        }
      } catch (e) {
        this.batch.languages = [];
      }
    },
    // the dialog: asked first
    openBatch(lang, mode) {
      const pages = this.batchPagesOf(mode, lang.code);
      if (!pages.length) return;
      const chars = pages.reduce((sum, p) => sum + (p.chars || 0), 0);
      this.batch.result = null;
      this.batchDialog = { step: 'ask', lang, mode, pages, chars };
      // (Kirby shows dialogs only when opened through the panel; the
      // dialog reads its state from here)
      this.$panel.dialog.open({
        component: 'pw-batch-dialog',
        props: { host: this },
        on: { close: () => this.onBatchClosed() },
      });
    },
    onBatchSubmit() {
      const step = this.batchDialog?.step;
      if (step === 'ask') this.runBatch();
      // stopped: on with the pages left
      else if (step === 'done' && this.batch.result?.stopped) this.runBatch(true);
      else this.$panel.dialog.close();
    },
    // cancel: before the start closes, while running stops after the
    // current page (the dialog stays until then)
    onBatchCancel() {
      if (this.batchDialog?.step === 'run') this.batch.stop = true;
      else this.$panel.dialog.close();
    },
    // closed another way (Esc, outside): a run stops after its page
    onBatchClosed() {
      if (this.batch.running) this.batch.stop = true;
      this.batchDialog = null;
    },
    // one page after the other (each its own request: no time limit hit);
    // stoppable between two pages – and to be continued from there
    async runBatch(resume = false) {
      const { lang, mode, pages } = this.batchDialog;
      // (continuing: the pages not done yet, the count goes on)
      const from = resume ? this.batch.done : 0;
      const errors = resume && this.batch.result ? [...this.batch.result.errors] : [];
      Object.assign(this.batch, { lang: lang.code, mode, running: true, stop: false, done: from, total: pages.length, current: '', result: null });
      this.batchDialog = { ...this.batchDialog, step: 'run' };
      for (const page of pages.slice(from)) {
        if (this.batch.stop) break;
        this.batch.current = page.title;
        try {
          await this.$api.post(page.path + '/translatewizard/translate', { to: lang.code });
        } catch (e) {
          errors.push({ path: page.path, title: page.title, message: e.message || String(e) });
        }
        this.batch.done++;
      }
      // (the characters: of the pages done without error, of those left)
      const chars = (list) => list.reduce((sum, p) => sum + (p.chars || 0), 0);
      const failed = errors.map(e => e.path);
      this.batch.result = {
        done: this.batch.done - errors.length,
        doneChars: chars(pages.slice(0, this.batch.done).filter(p => !failed.includes(p.path))),
        errors,
        stopped: this.batch.done < pages.length,
        left: pages.length - this.batch.done,
        leftChars: chars(pages.slice(this.batch.done)),
      };
      this.batch.running = false;
      if (this.batchDialog) this.batchDialog = { ...this.batchDialog, step: 'done' };
      this.loadDeeplUsage();
      this.loadBatch();
    },
    async loadDeeplUsage() {
      try {
        this.deeplUsage = (await this.$api.get('translatewizard/usage')).usage || null;
      } catch (e) {
        this.deeplUsage = null;
      }
    },

    onAiInput(values) {
      this.aiValues = values;
      this.updateAiDirty();
    },

    setAiSecrets(res) {
      this.aiSecrets = res.secrets || [];
      this.aiSecretsWritable = res.writable !== false;
      this.aiSecretInputs = {};
      this.checkAiSecrets();
    },
    // (not awaited: the services may take a moment)
    async checkAiSecrets() {
      try {
        const res = await this.$api.get('pagewizard/secrets/check');
        this.aiSecretValid = res.valid || {};
        this.aiSecretTypes = res.types || {};
      } catch (e) {
        this.aiSecretValid = {};
        this.aiSecretTypes = {};
      }
    },

    onSecretInput(env, value) {
      this.$set(this.aiSecretInputs, env, value);
      this.updateAiDirty();
    },

    updateAiDirty() {
      const settingsDirty = !!this.aiForm && JSON.stringify(this.aiValues) !== this.snapshots['ai'];
      const keysDirty = Object.values(this.aiSecretInputs).some(v => v && v.trim() !== '');
      const fieldsDirty = JSON.stringify(this.translateValues) !== JSON.stringify(this.originalTranslateValues);
      this.$set(this.dirtyTabs, 'ai', settingsDirty || keysDirty || fieldsDirty);
    },

    async removeSecret(secret) {
      if (!window.confirm(this.$t('prw.ai.keys.confirm', { label: secret.label }))) return;
      try {
        this.setAiSecrets(await this.$api.post('pagewizard/secrets', { remove: [secret.env] }));
        this.updateAiDirty();
        this.notifySaved(this.$t('prw.notify.ai.success'));
      } catch (e) {
        this.$panel.notification.error(this.$t('prw.notify.ai.error'));
      }
    },

    // --- Global: Exceptions ---
    // the tree follows the editor: the entry at the cursor opened and marked
    focusPatchesTree() {
      const input = this.$refs.patchesInput;
      if (!input) return;
      const path = this.patchesPathAt(this.patchesText, input.selectionStart);
      this.patchesFocus = path.length ? path : null;
    },
    // the JSON path at a position of the text (keys, list positions), read
    // as far as it goes – the text need not be complete or valid
    patchesPathAt(text, pos) {
      const stack = [];
      let lastString = null;
      let i = 0;
      const stringEnd = (start) => {
        let j = start + 1;
        while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
        return j;
      };
      while (i < text.length) {
        const ch = text[i];
        if (ch === '"') {
          const end = stringEnd(i);
          let str;
          try { str = JSON.parse(text.slice(i, end + 1)); } catch (e) { str = text.slice(i + 1, end); }
          // the cursor in this string: a key (a colon follows) counts too
          if (pos > i && pos <= end) {
            let k = end + 1;
            while (/\s/.test(text[k] || '')) k++;
            const top = stack[stack.length - 1];
            if (text[k] === ':' && top && !top.list) top.key = str;
            break;
          }
          if (i >= pos) break;
          lastString = str;
          i = end + 1;
          continue;
        }
        if (i >= pos) break;
        const top = stack[stack.length - 1];
        if (ch === ':' && top && !top.list) top.key = lastString;
        else if (ch === '{') stack.push({ list: false, key: null, index: 0 });
        else if (ch === '[') stack.push({ list: true, key: null, index: 0 });
        else if (ch === '}' || ch === ']') stack.pop();
        else if (ch === ',' && top) {
          if (top.list) top.index++;
          else top.key = null;
        }
        i++;
      }
      const path = [];
      for (const entry of stack) {
        if (entry.list) path.push(String(entry.index));
        else if (entry.key !== null) path.push(entry.key);
        else break;
      }
      return path;
    },
    onPatchesInput() {
      this.patchesError = this.patchesCheck(this.patchesText);
      this.$set(this.dirtyTabs, 'patches', this.patchesText !== this.originalPatchesText);
    },
    // the JSON's error with its line ('' when valid or empty)
    patchesCheck(text) {
      if (!text.trim()) return '';
      try {
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object' || Array.isArray(data)) return this.$t('prw.patches.object');
        return '';
      } catch (e) {
        const pos = Number((String(e.message).match(/position (\d+)/) || [])[1]);
        const line = isNaN(pos) ? null : text.slice(0, pos).split('\n').length;
        return this.$t('prw.patches.invalid') + (line ? ' ' + this.$t('prw.patches.line') + ' ' + line : '') + ': ' + e.message;
      }
    },
    // the JSON coloured as in a code editor: keys, strings, numbers,
    // true/false/null, punctuation (escaped; a trailing line break so the
    // last line keeps its height)
    patchesHighlightedFor(text) {
      const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\],:])/g;
      let out = '';
      let last = 0;
      let m;
      while ((m = re.exec(text))) {
        out += esc(text.slice(last, m.index));
        if (m[1]) out += m[2] ? '<span class="is-key">' + esc(m[1]) + '</span><span class="is-punct">' + esc(m[2]) + '</span>' : '<span class="is-string">' + esc(m[1]) + '</span>';
        else if (m[3]) out += '<span class="is-' + (m[3] === 'null' ? 'null' : 'boolean') + '">' + m[3] + '</span>';
        else if (m[4]) out += '<span class="is-number">' + m[4] + '</span>';
        else out += '<span class="is-punct">' + esc(m[5]) + '</span>';
        last = re.lastIndex;
      }
      return out + esc(text.slice(last)) + '\n';
    },
    fitPatchesInput() {
      this.observePatchesWidth();
      const el = this.$refs.patchesInput;
      if (!el || !el.offsetParent) return;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    },
    // the topbar too narrow for the menus and the save buttons with their
    // texts: the buttons show their icon only (texts as tooltips)
    fitTopbar() {
      const bar = this.$refs.topbar;
      if (!bar) return;
      // its height: the block page's title row sticks right below it
      const header = bar.closest('.k-topbar');
      if (header && this.$el && this.$el.style) this.$el.style.setProperty('--pw-topbar-height', header.offsetHeight + 'px');
      // step by step, as long as it does not fit: 1 the save buttons with
      // their icons only, 2 the menus without icons, 3 the menus with their
      // icons only
      const fits = () => bar.scrollWidth <= bar.clientWidth + 1;
      bar.removeAttribute('data-compact');
      for (let step = 1; step <= 3 && !fits(); step++) {
        bar.setAttribute('data-compact', String(step));
      }
    },
    // the lines wrap anew with every other width (window, preview column,
    // panel menu) and the field is measured only while visible: measured
    // again whenever its width changes, also from hidden to shown
    observePatchesWidth() {
      const box = this.$refs.patchesCode;
      if (!box || this._patchesObserved === box || typeof ResizeObserver === 'undefined') return;
      if (this._patchesObserver) this._patchesObserver.disconnect();
      let width = -1;
      this._patchesObserver = new ResizeObserver(([entry]) => {
        const w = Math.round(entry.contentRect.width);
        if (w === width) return;
        width = w;
        this.fitPatchesInput();
      });
      this._patchesObserver.observe(box);
      this._patchesObserved = box;
    },
    // the paths of the values that differ between two stored states
    // (objects compared key by key, lists and plain values as a whole)
    diffPaths(a, b, path = []) {
      const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
      if (isObj(a) || isObj(b)) {
        const x = isObj(a) ? a : {};
        const y = isObj(b) ? b : {};
        const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
        return [...keys].flatMap(k => this.diffPaths(x[k], y[k], [...path, k]));
      }
      const empty = (v) => v === undefined || v === null || v === '';
      if (empty(a) && empty(b)) return [];
      return JSON.stringify(a) === JSON.stringify(b) ? [] : [path];
    },
    // the element a value belongs to (element-heading-text → heading,
    // cite-spacing → quote, element-image-zoom → media …)
    elementGroupOf(name) {
      const key = name.replace(/^element-/, '').split('-')[0];
      return { cite: 'quote', caption: 'media', image: 'media', slideshow: 'media', video: 'media', editor: 'editor' }[key] || key;
    },
    // a menu's badge: how many of its pages have changes
    groupPending(group) {
      const keys = Object.keys(this.pendingCounts);
      if (group === 'project') return keys.filter(k => ['site', 'header', 'footer', 'blocks', 'fonts'].includes(k)).length;
      if (group === 'elements') return keys.filter(k => k.startsWith('element:')).length;
      if (group === 'blocks') return keys.filter(k => k.startsWith('block:')).length;
      return keys.filter(k => ['translate', 'generator', 'patches'].includes(k)).length;
    },
    // the editable state (what a draft keeps; not the typed API keys)
    draftState() {
      return {
        blockOverrides: this.blockOverrides,
        blockValueOverrides: this.blockValueOverrides,
        globalOverrides: this.globalOverrides,
        elementOverrides: this.elementOverrides,
        fontOverrides: this.fontOverrides,
        navOverrides: this.navOverrides,
        footerOverrides: this.footerOverrides,
        aiValues: this.aiValues,
        translateValues: this.translateValues,
        activeBlocks: this.activeBlocks,
        activeVariants: this.activeVariants,
        patchesText: this.patchesText,
      };
    },
    // the saved state the changes build on (a draft only fits it)
    draftBase() {
      return JSON.stringify({
        blockOverrides: this.originalOverrides,
        blockValueOverrides: this.originalBlockValueOverrides,
        globalOverrides: this.originalGlobalOverrides,
        elementOverrides: this.originalElementOverrides,
        fontOverrides: this.originalFontOverrides,
        navOverrides: this.originalNavOverrides,
        footerOverrides: this.originalFooterOverrides,
        aiValues: this.originalAiValues,
        translateValues: this.originalTranslateValues,
        activeBlocks: this.originalActiveBlocks,
        activeVariants: this.originalActiveVariants,
        patchesText: this.originalPatchesText,
      });
    },
    // unsaved changes into the browser (removed once all is saved or discarded)
    saveDraft() {
      if (this.loading) return;
      try {
        // (keys typed in never go into the draft)
        const hasAny = Object.keys(this.pendingCounts).some(k => !(k === 'translate' || k === 'generator'))
          || this.diffPaths(this.aiValues, this.originalAiValues).length
          || this.diffPaths(this.translateValues, this.originalTranslateValues).length;
        if (!hasAny) {
          localStorage.removeItem('pw-wizard-draft');
          return;
        }
        localStorage.setItem('pw-wizard-draft', JSON.stringify({ base: this.draftBase(), state: this.draftState() }));
      } catch (e) { /* no storage */ }
    },
    // a draft of an earlier visit: back in place when it builds on the same
    // saved state (else saved in the meantime: the draft is dropped)
    restoreDraft() {
      let draft = null;
      try { draft = JSON.parse(localStorage.getItem('pw-wizard-draft') || 'null'); } catch (e) { /* no storage */ }
      if (!draft || !draft.state) return;
      if (draft.base !== this.draftBase()) {
        try { localStorage.removeItem('pw-wizard-draft'); } catch (e) { /* no storage */ }
        return;
      }
      const st = draft.state;
      const copy = (v) => JSON.parse(JSON.stringify(v));
      for (const [bt, ov] of Object.entries(st.blockOverrides || {})) this.$set(this.blockOverrides, bt, copy(ov));
      for (const [bt, ov] of Object.entries(st.blockValueOverrides || {})) this.$set(this.blockValueOverrides, bt, copy(ov));
      for (const key of ['globalOverrides', 'elementOverrides', 'fontOverrides', 'navOverrides', 'footerOverrides', 'aiValues', 'translateValues']) {
        if (st[key]) this[key] = copy(st[key]);
      }
      if (Array.isArray(st.activeBlocks)) {
        this.activeBlocks = [...st.activeBlocks];
        for (const block of this.blocks) block.active = this.activeBlocks.includes(block.blockType);
      }
      if (Array.isArray(st.activeVariants)) this.activeVariants = [...st.activeVariants];
      if (typeof st.patchesText === 'string') this.patchesText = st.patchesText;
      this.discardKey++;
    },
    // a single save's success message: none while everything is saved at once
    notifySaved(message) {
      if (!this.savingAll) this.$panel.notification.success(message);
    },
    // save the changes of every page, one summary message
    async saveAll() {
      const pending = { ...this.pendingCounts };
      const pages = Object.keys(pending).length;
      if (!pages || this.savingAll) return;
      const cssBefore = await this.frontendCssVersion();
      const activation = this.globalSnapshot() !== this.snapshots['global'];
      this.savingAll = true;
      try {
        for (const key of Object.keys(pending).filter(k => k.startsWith('block:'))) await this.saveBlock(key.slice(6));
        if (Object.keys(pending).some(k => k.startsWith('element:'))) await this.saveElements();
        if (pending.header) await this.saveNavigation();
        if (pending.footer) await this.saveFooter();
        if (this.diffPaths(this.globalOverrides, this.originalGlobalOverrides).length) await this.saveGlobalSettings();
        if (pending.translate || pending.generator) await this.saveAi();
        if (pending.patches) await this.savePatches();
      } finally {
        this.savingAll = false;
      }
      // (a failed save kept its changes and reported its error)
      const left = Object.keys(this.pendingCounts).length - (activation ? 1 : 0);
      if (left <= 0) this.$panel.notification.success(this.$t('prw.notify.saveAll', { count: pages }));
      // the active blocks and variants last: saving them reloads the panel
      if (activation) {
        await this.saveGlobal();
        return;
      }
      try { await fetch(window.location.origin, { cache: 'no-store' }); } catch (e) {}
      this.reloadFrontend(cssBefore);
    },
    confirmDiscardAll() {
      this.$panel.dialog.open({
        component: 'k-text-dialog',
        props: {
          text: this.$t('prw.discardAll.confirm', { count: this.pendingPageCount }),
          submitButton: { text: this.$t('prw.discardAll'), icon: 'undo', theme: 'negative' },
        },
        on: {
          submit: () => {
            this.$panel.dialog.close();
            this.discardAll();
          },
        },
      });
    },
    // every page back to its saved state
    discardAll() {
      const copy = (v) => JSON.parse(JSON.stringify(v || {}));
      this.activeBlocks = [...this.originalActiveBlocks];
      this.activeVariants = [...this.originalActiveVariants];
      for (const block of this.blocks) {
        block.active = this.activeBlocks.includes(block.blockType);
        this.$set(this.blockOverrides, block.blockType, copy(this.originalOverrides[block.blockType]));
        if (this.blockValueOverrides[block.blockType] !== undefined) {
          this.$set(this.blockValueOverrides, block.blockType, copy(this.originalBlockValueOverrides[block.blockType]));
        }
      }
      this.globalOverrides = copy(this.originalGlobalOverrides);
      this.elementOverrides = copy(this.originalElementOverrides);
      this.fontOverrides = copy(this.originalFontOverrides);
      this.navOverrides = copy(this.originalNavOverrides);
      this.footerOverrides = copy(this.originalFooterOverrides);
      this.aiValues = copy(this.originalAiValues);
      this.translateValues = copy(this.originalTranslateValues);
      this.aiSecretInputs = {};
      this.patchesText = this.originalPatchesText;
      this.patchesError = '';
      for (const key of Object.keys(this.dirtyTabs)) this.$set(this.dirtyTabs, key, false);
      this.discardKey++;
    },
    // an entry of the tree into the JSON: its path with its current value
    // (nested objects; what the JSON holds there already is replaced)
    // the blocks' plugin settings with the exceptions anew (after saving
    // them): options, start values and values in the block pages follow at
    // once; the unsaved changes (blockOverrides) stay untouched
    async reloadBlockDefaults() {
      try {
        const res = await this.$api.get('projectwizard/blocks');
        const byType = Object.fromEntries((res.blocks || []).map(b => [b.blockType, b]));
        this.blocks = this.blocks.map(b => byType[b.blockType]
          ? { ...b, settings: byType[b.blockType].settings, editor: byType[b.blockType].editor }
          : b);
      } catch (e) { /* keep them */ }
      await Promise.all(this.blocks.map(async (block) => {
        const type = block.blockType;
        try {
          this.$set(this.blockConfigs, type, await this.$api.get('projectwizard/block/' + type));
        } catch (e) { /* keep it */ }
        if (!this.blockValueDefaults[type]) return;
        try {
          const values = await this.$api.get('projectwizard/values/' + type);
          if (values.defaults && !Array.isArray(values.defaults)) this.$set(this.blockValueDefaults, type, values.defaults);
        } catch (e) { /* keep them */ }
      }));
    },
    // the preview: the own settings and values without those the exceptions
    // set (these apply, as in the pagewizard)
    shownOverrides(blockType) {
      const own = this.blockOverrides[blockType] || {};
      const patch = { ...(this.savedPatches[blockType] || {}) };
      delete patch.editor;
      delete patch.values;
      if (!own.settings) return own;
      return { ...own, settings: withoutPatched(own.settings, patch) || {} };
    },
    shownValueOverrides(blockType) {
      return withoutPatchedValues(this.blockValueOverrides[blockType] || {}, this.valuesPatch(blockType));
    },
    // a block's values the exceptions set (values › group › vars / colors)
    valuesPatch(blockType) {
      const values = this.savedPatches[blockType]?.values;
      return values && typeof values === 'object' ? values : null;
    },
    // what currently applies per block (plugin, exceptions, wizard settings),
    // fresh on each visit of the page and after saving the exceptions
    async loadPatchesTree() {
      try {
        this.patchesTree = await this.$api.get('projectwizard/patches/tree');
      } catch (e) { /* keep the last one */ }
    },
    takePatch({ path, value }) {
      let data = {};
      if (this.patchesText.trim()) {
        try {
          data = JSON.parse(this.patchesText);
        } catch (e) {
          this.$panel.notification.error(this.patchesCheck(this.patchesText));
          return;
        }
      }
      let node = data;
      path.slice(0, -1).forEach(key => {
        if (!node[key] || typeof node[key] !== 'object' || Array.isArray(node[key])) node[key] = {};
        node = node[key];
      });
      node[path[path.length - 1]] = JSON.parse(JSON.stringify(value));
      this.patchesText = JSON.stringify(data, null, 2) + '\n';
      this.onPatchesInput();
      this.$nextTick(() => this.jumpToPatch(path));
    },
    // to the entry just taken: its key selected in the field, scrolled into
    // view (its place measured in the coloured copy, so wrapped lines count)
    jumpToPatch(path) {
      const text = this.patchesText;
      let pos = 0;
      for (const key of path) {
        if (typeof key === 'number' || /^\d+$/.test(String(key))) continue;
        const at = text.indexOf('"' + key + '":', pos);
        if (at < 0) break;
        pos = at;
      }
      const lastKey = String(path[path.length - 1]);
      const input = this.$refs.patchesInput;
      const hl = this.$refs.patchesHl;
      if (!input || !hl) return;
      this.fitPatchesInput();
      input.focus({ preventScroll: true });
      input.setSelectionRange(pos, pos + lastKey.length + 2);
      // the place: a range at that character in the copy
      let rest = pos;
      const walker = document.createTreeWalker(hl, NodeFilter.SHOW_TEXT);
      let nodeAt = null;
      while (walker.nextNode()) {
        const len = walker.currentNode.nodeValue.length;
        if (rest <= len) { nodeAt = walker.currentNode; break; }
        rest -= len;
      }
      if (!nodeAt) return;
      const range = document.createRange();
      range.setStart(nodeAt, rest);
      range.setEnd(nodeAt, rest);
      const rect = range.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 3, behavior: 'smooth' });
    },
    async savePatches() {
      this.patchesError = this.patchesCheck(this.patchesText);
      if (this.patchesError) {
        this.$panel.notification.error(this.patchesError);
        return;
      }
      try {
        const res = await this.$api.post('projectwizard/patches', { text: this.patchesText });
        this.originalPatchesText = this.patchesText;
        this.patchesUnknown = res.unknown || [];
        this.$set(this.dirtyTabs, 'patches', false);
        this.loadPatchesTree();
        this.reloadBlockDefaults();
        this.notifySaved(this.$t('prw.notify.patches.success'));
      } catch (e) {
        this.patchesError = e.message || String(e);
        this.$panel.notification.error(this.$t('prw.notify.patches.error'));
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
          if (set.DEEPL_API_KEY) this.loadDeeplUsage();
        }
        if (this.translateTree && JSON.stringify(this.translateValues) !== JSON.stringify(this.originalTranslateValues)) {
          this.setTranslateTree((await this.$api.post('translatewizard/fields', { fields: this.translateValues })).tree);
        }
        this.updateAiDirty();
        this.notifySaved(this.$t('prw.notify.ai.success'));
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
        this.notifySaved(this.$t('prw.notify.footer.success'));
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
        this.notifySaved(this.$t('prw.notify.elements.success'));
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
    // a variant's block background (override, else the plugin's)
    variantBackground(theme) {
      return ((this.globalOverrides.global || {})[theme] || {})['block-background'] ||
        (this.globalDefaults.colors?.colors?.['block-background']?.[theme]) || '#ffffff';
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
        fontWeight: this.globalLayoutValue('block-link-weight') === 'bold' ? 700 : null,
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
    // (shared with the panel's block previews)
    injectFontFaces() {
      injectFontFaces(this.fontsData);
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
        this.notifySaved(this.$t('prw.notify.header.success'));
      } catch (e) {
        this.$panel.notification.error(this.$t('prw.notify.header.error'));
      }
    },

    // --- Block overrides ---
    // a block opened: the preview (and the colour cards) start with the
    // variant a new block of it starts with
    showStartTheme() {
      const blockType = this.activeTab;
      if (!blockType || blockType === 'global' || !this.blockConfigs[blockType]) return;
      this.itemColorTheme = this.blockOverrides[blockType]?.settings?.fields?.style?.theme?.default
        || this.blockConfigs[blockType]?.defaults?.settings?.fields?.style?.theme?.default || 'default';
      // steplist: the item style a new block starts with (no pill chosen)
      this.$delete(this.stepPreviewStyle, blockType);
    },
    onBlockOverridesUpdate(blockType, overrides) {
      // BlockSettings changes the object in place: store a fresh copy, so
      // everything reading it (e.g. the live preview) notices the change
      overrides = JSON.parse(JSON.stringify(overrides || {}));
      this.$set(this.blockOverrides, blockType, overrides);
      // the start value of the theme changed: the preview (and the colour
      // cards) show that variant
      const theme = overrides?.settings?.fields?.style?.theme?.default
        || this.blockConfigs[blockType]?.defaults?.settings?.fields?.style?.theme?.default || 'default';
      if (this.startThemes[blockType] !== undefined && this.startThemes[blockType] !== theme) {
        this.itemColorTheme = theme;
      }
      this.$set(this.startThemes, blockType, theme);
      // steplist: the start value of the item style changed – show it
      const itemStyle = overrides?.settings?.fields?.style?.['item-style']?.default;
      if (blockType in this.startItemStyles && this.startItemStyles[blockType] !== itemStyle) {
        this.$delete(this.stepPreviewStyle, blockType);
      }
      this.$set(this.startItemStyles, blockType, itemStyle);
      // featurelist: the start value of the layout changed – show it
      const sectionLayout = overrides?.settings?.fields?.style?.['section-layout']?.default;
      if (blockType in this.startSectionLayouts && this.startSectionLayouts[blockType] !== sectionLayout) {
        this.$delete(this.featurePreviewLayout, blockType);
      }
      this.$set(this.startSectionLayouts, blockType, sectionLayout);
      // hero: the start value of the height changed – show it in the design tab
      const heroHeight = overrides?.settings?.fields?.style?.height?.default;
      if (blockType in this.startHeroHeights && this.startHeroHeights[blockType] !== heroHeight) {
        this.$delete(this.heroPreviewHeight, blockType);
      }
      this.$set(this.startHeroHeights, blockType, heroHeight);
      // cardlets: the start value of the display changed – show it
      const cardDisplay = overrides?.settings?.fields?.style?.['card-display']?.default;
      if (blockType in this.startCardDisplays && this.startCardDisplays[blockType] !== cardDisplay) {
        this.$delete(this.cardPreviewDisplay, blockType);
      }
      this.$set(this.startCardDisplays, blockType, cardDisplay);
      // own space below switched on: start from the elements' current values
      const spacing = overrides?.settings?.fields?.layout?.['item-spacing']?.default;
      if (spacing === 'own' && this.blockValueDefaults[blockType]) this.seedOwnSpacing(blockType);
      // (the title's and the description's own values each on their own)
      for (const part of ['title', 'text']) {
        const entry = overrides?.settings?.fields?.layout?.['item-entry-' + part]?.default;
        if (entry === 'own' && this.blockValueDefaults[blockType]) this.seedOwnEntry(blockType, part);
      }
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
      // (for the load that follows; the storage for a fresh start of the view)
      this._pendingTab = tab;
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
        if (tab === 'blocks') {
          if (this.dirtyTabs['global-settings']) await this.saveGlobalSettings();
          if (this.dirtyTabs['global']) await this.saveGlobal();
        } else if (['site', 'fonts'].includes(tab)) {
          await this.saveGlobalSettings();
        } else if (tab === 'elements') {
          await this.saveElements();
        } else if (tab === 'header') {
          await this.saveNavigation();
        } else if (tab === 'footer') {
          await this.saveFooter();
        } else if (tab === 'translate' || tab === 'generator') {
          await this.saveAi();
        } else if (tab === 'patches') {
          await this.savePatches();
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
      // the panel's block previews (this tab and others) load the saved values again
      announcePreviewSaved();
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
        if (tab === 'blocks') {
          this.activeBlocks = [...this.originalActiveBlocks];
          this.activeVariants = [...this.originalActiveVariants];
          for (const block of this.blocks) {
            block.active = this.activeBlocks.includes(block.blockType);
          }
          this.$set(this.dirtyTabs, 'global', false);
        }
        if (['site', 'blocks', 'fonts'].includes(tab)) {
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
        } else if (tab === 'patches') {
          this.patchesText = this.originalPatchesText;
          this.patchesError = '';
          this.$set(this.dirtyTabs, 'patches', false);
        } else if (tab === 'translate' || tab === 'generator') {
          this.aiValues = JSON.parse(JSON.stringify(this.originalAiValues));
          this.translateValues = JSON.parse(JSON.stringify(this.originalTranslateValues));
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
        this.notifySaved(this.$t('prw.notify.blocks.success'));
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
        this.notifySaved(this.$t('prw.notify.global.success'));

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

        // Blocks with values of their own (items, the hero): also persist
        // the per-block CSS-variable overrides (the design tab's inputs)
        if (this.hasDesign(blockType)) {
          const valuesRes = await this.$api.post(
            'projectwizard/values/' + blockType,
            this.blockValueOverrides[blockType] || {}
          );
          const ov = (valuesRes.overrides && !Array.isArray(valuesRes.overrides)) ? valuesRes.overrides : {};
          this.$set(this.blockValueOverrides, blockType, JSON.parse(JSON.stringify(ov)));
          this.$set(this.originalBlockValueOverrides, blockType, JSON.parse(JSON.stringify(ov)));
          this.$set(this.snapshots, blockType + ':values', JSON.stringify(ov));
        }

        this.notifySaved(this.$t('prw.notify.block.success', { block: this.blockLabel(blockType) }));
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
  /* the room of Kirby's topbar, not more: too little shows as an overflow
     (fitTopbar), the save buttons then keep their icons only */
  flex: 1 1 auto;
  min-width: 0;
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
/* several rows in one element of the card (e.g. two values of a block):
   only its first row takes the top corner, only its last the bottom one */
.pw-card .pw-field-row + .pw-field-row .pw-field-row-label-col {
  border-start-start-radius: 0;
}
.pw-card .pw-field-row:has(+ .pw-field-row) .pw-field-row-label-col {
  border-end-start-radius: 0;
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
  background: var(--item-color-back, light-dark(var(--color-white), var(--color-gray-850)));
  color: var(--color-text);
}
.pw-field-table .pw-group-end {
  display: none;
}

/* a value shown, not editable (e.g. the global elements' spacing): as an
   input's value, dimmed */
.pw-field-table .pw-readonly-value {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-dimmed);
}
/* rows with the global values (Standard): the value fainter (not its px),
   so it does not look clickable (hovered: the "not allowed" cursor) */
.pw-field-row.is-readonly .pw-readonly-value {
  cursor: not-allowed;
  opacity: 0.5;
}
.pw-field-table .pw-readonly-value .pw-element-unit {
  position: static;
  margin-inline-start: 0.35em;
}
/* a note below a card: Kirby's field help (k-text.k-help), with the gap
   of its field footer */
.pw-card-help {
  margin-top: var(--spacing-2);
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
/* the code editor: dark, the coloured JSON below the transparent field
   (same font, size, padding and wrapping, so both lie exactly on top) */
.pw-code {
  position: relative;
  background: #1e1e1e;
  border-radius: var(--rounded);
}
.pw-code-hl,
.pw-patches-input {
  margin: 0;
  padding: var(--spacing-3);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.5;
  tab-size: 2;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  box-sizing: border-box;
}
.pw-code-hl {
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: #d4d4d4;
  pointer-events: none;
}
.pw-patches-input {
  position: relative;
  display: block;
  width: 100%;
  /* as high as its content (patchesText watcher), at least a few lines */
  min-height: 12rem;
  overflow: hidden;
  color: transparent;
  caret-color: #ffffff;
  background: transparent;
  border: 0;
  border-radius: var(--rounded);
  resize: none;
}
.pw-patches-input::placeholder {
  color: #6a6a6a;
}
.pw-patches-input::selection {
  color: transparent;
  /* clearly visible on the dark ground (the text below shines through) */
  background: rgba(255, 214, 0, 0.45);
}
.pw-patches-input:focus {
  outline: var(--outline);
}
/* the colours of a dark code editor */
.pw-code-hl .is-key { color: #9cdcfe; }
.pw-code-hl .is-string { color: #ce9178; }
.pw-code-hl .is-number { color: #b5cea8; }
.pw-code-hl .is-boolean { color: #569cd6; }
.pw-code-hl .is-null { color: #569cd6; font-style: italic; }
.pw-code-hl .is-punct { color: #808080; }
/* the column behind the tree white as well (no other colour at its
   edges, e.g. while scrolling) */
.pw-wizard .pw-preview-column:has(> .pw-portal > .pw-patches-tree:not([style*="display: none"])) {
  background: light-dark(var(--color-white), var(--color-gray-900));
}
/* white and edge to edge in the preview column: its paddings taken back
   (top the menu's, else spacing-6), as high as the column */
/* unsaved changes (as in kirby-explorer): an orange badge at the menu
   button's top end corner, a count behind a dropdown item's name */
.pw-change-badge,
.pw-change-count {
  display: inline-grid;
  place-items: center;
  box-sizing: border-box;
  min-width: 1.5em;
  min-height: 1.5em;
  padding: 0 var(--spacing-1);
  border-radius: 1em;
  font-size: 0.6rem;
  font-weight: var(--font-normal);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--color-black);
  background: light-dark(var(--color-orange-400), var(--color-orange-500));
  border: 1px solid light-dark(var(--color-orange-500), var(--color-black));
}
.pw-change-badge {
  position: absolute;
  top: 0;
  inset-inline-end: var(--spacing-1);
  transform: translate(50%, -40%);
  pointer-events: none;
  z-index: 1;
}
.pw-change-count {
  margin-inline-start: var(--spacing-2);
  vertical-align: 0.1em;
}
/* in the menus: right after the text (not spread by the item's
   space-between – the gap taken back), the usage count stays right */
.pw-menu-item .pw-change-count {
  margin-inline-start: calc(var(--spacing-2) - var(--spacing-6));
  margin-inline-end: auto;
}
.pw-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-6);
  min-height: 60vh;
  color: var(--color-gray-400);
}
.pw-welcome-icon {
  --icon-size: 6rem;
}
.pw-welcome-wand {
  position: relative;
  display: inline-flex;
}
/* the stars: around the wand's head (its star, top left), each twinkling
   in its own time, brightest at their peak */
.pw-welcome-star {
  position: absolute;
  width: 1.4rem;
  height: 1.4rem;
  fill: var(--color-yellow-500, #eab308);
  /* invisible until its turn: one after the other they appear, then keep
     twinkling (never quite gone) */
  opacity: 0;
  animation: pw-twinkle 6s ease-in-out infinite;
}
.pw-welcome-star.is-1 { top: -0.9rem; left: -0.9rem; animation-delay: 0s; }
.pw-welcome-star.is-2 { top: 1.6rem; left: -1.9rem; width: 1rem; height: 1rem; animation-delay: 1.2s; }
.pw-welcome-star.is-3 { top: -1.7rem; left: 2.4rem; width: 1.1rem; height: 1.1rem; animation-delay: 2.4s; }
.pw-welcome-star.is-4 { top: -0.4rem; left: 4.4rem; width: 0.8rem; height: 0.8rem; animation-delay: 3.6s; }
.pw-welcome-star.is-5 { top: 1.6rem; left: 5.6rem; width: 1.2rem; height: 1.2rem; animation-delay: 4.8s; }
/* a flash as quick as before (the first half), then a pause while the
   others take their turn */
@keyframes pw-twinkle {
  0%, 40%, 100% { opacity: 0.15; transform: scale(0.5) rotate(0deg); }
  16% { opacity: 1; transform: scale(1.1) rotate(25deg); }
  28% { opacity: 0.3; transform: scale(0.7) rotate(45deg); }
}
@media (prefers-reduced-motion: reduce) {
  .pw-welcome-star { animation: none; opacity: 0.8; }
}
.pw-welcome-stats {
  margin-top: var(--spacing-6);
  font-size: var(--text-sm);
  color: var(--color-gray-500);
  font-variant-numeric: tabular-nums;
  /* faded in after the slogan (its room always kept) */
  opacity: 0;
  transition: opacity 0.8s ease;
}
.pw-welcome-stats.is-shown {
  opacity: 1;
}
.pw-welcome-text {
  text-align: center;
}
.pw-welcome-title {
  font-size: var(--text-4xl, 2.25rem);
  font-weight: var(--font-bold, 700);
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--color-text);
}
.pw-welcome-slogan {
  margin-top: var(--spacing-2);
  font-size: var(--text-xl, 1.25rem);
  color: var(--color-text-dimmed);
}
/* the slogan's rest: already there, invisible (its room kept) */
.pw-typewriter-rest {
  visibility: hidden;
}
/* the caret: no width of its own, so the text does not move */
.pw-typewriter-caret {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  margin-inline-end: -2px;
  vertical-align: -0.15em;
  background: currentColor;
  animation: pw-caret-blink 1s steps(1) infinite;
}
/* done: invisible, but still there (the line keeps its height) */
.pw-typewriter-caret.is-done {
  visibility: hidden;
  animation: none;
}
@keyframes pw-caret-blink {
  50% { opacity: 0; }
}
.pw-variant-dot {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  /* a ring, so a white variant shows as well */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
}
/* in the variant pills: small, before the name; a grey line inside, so a
   light variant shows on the light pill, a white ring outside, so a dark
   one shows on the dark (selected) pill */
.pw-variant-dot.is-small {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.25), 0 0 0 1px #ffffff;
  display: inline-block;
  width: 8px;
  height: 8px;
  /* 4px to the name: the pill's own gap (spacing-2) taken back */
  margin-inline-end: calc(4px - var(--spacing-2));
  vertical-align: 0.05em;
}
.pw-blocks-active {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  column-gap: var(--spacing-6);
  align-items: start;
}
@media (min-width: 60rem) {
  .pw-blocks-active {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
.pw-patches-tree {
  margin: calc(-1 * var(--menu-padding, var(--spacing-3))) calc(-1 * var(--spacing-6)) calc(-1 * var(--spacing-6));
  padding: var(--menu-padding, var(--spacing-3)) var(--spacing-6) var(--spacing-6);
  min-height: 100dvh;
  box-sizing: border-box;
  background: light-dark(var(--color-white), var(--color-gray-900));
}
/* the top level: below the intro, without indent and guide line (more
   specific than the children's rule, which sets their margin) */
.pw-json-children.pw-json-root {
  margin: var(--spacing-6) 0 0;
  padding-left: 0;
  border-left: 0;
}
/* the tree's intro: in the panel's regular text size */
.pw-patches-intro {
  font-size: var(--text-sm);
  line-height: 1.5;
}
/* the plus in the tree's intro: as the one at a row's end */
.pw-json-add.pw-json-add-inline {
  display: inline-flex;
  width: 1.1rem;
  height: 1.1rem;
  margin: 0 0.15rem;
  vertical-align: middle;
  position: relative;
  top: -0.1em;
  opacity: 1;
  cursor: default;
}
.pw-json-add-inline svg {
  --icon-size: 12px;
  width: 12px;
  height: 12px;
  fill: currentColor;
}
.pw-patches-note {
  margin-top: var(--spacing-2);
}
.pw-page-title-icon {
  --icon-size: 24px;
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
.pw-page-title-row.has-intro,
.pw-page-title-row-tabs {
  margin-bottom: var(--spacing-3);
}
/* a page's title (a block page's with its tabs): sticky below the topbar,
   on the page's background (across the gutter, as the topbar) */
.pw-page-title-row {
  position: sticky;
  top: var(--pw-topbar-height, 0px);
  z-index: 2;
  /* (reaching up to the topbar, over its space below: stuck from the start) */
  padding-top: var(--spacing-3);
  margin-top: calc(var(--spacing-6) * -1);
  padding-inline: var(--spacing-2);
  margin-inline: calc(var(--spacing-2) * -1);
  background: var(--color-background);
  /* (its line as wide as before: inside the gutter) */
  border-bottom: 0;
  /* as high on every page as with the block tabs (their buttons' height
     with Kirby's 2px above and below, the padding above and below) */
  box-sizing: border-box;
  min-height: calc(var(--height-md) + 4px + var(--spacing-6));
}
.pw-page-title-row::after {
  content: "";
  position: absolute;
  inset-inline: var(--spacing-2);
  bottom: 0;
  height: 1px;
  background: var(--color-border);
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
  flex-shrink: 0;
  margin-inline-start: auto;
}
/* short of room (fitTopbar), step by step; the hidden texts stay for
   screen readers, the buttons carry them as tooltips too */
.pw-topbar[data-compact] .pw-topbar-controls .k-button-text,
.pw-topbar[data-compact="3"] .pw-tab .pw-tab-text {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.pw-topbar[data-compact="2"] .pw-tab > .k-icon:not(.pw-tab-menu-chevron) {
  display: none;
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
/* narrower than 75rem: the preview (and the configuration's tree) below
   the settings, not beside them; nothing to fold away */
@media (max-width: 74.99rem) {
  .pw-wizard .pw-preview-toggle,
  .pw-wizard .pw-preview-open {
    display: none !important;
  }
  .pw-wizard .pw-preview-column {
    order: 1;
  }
  /* (as a card, not edge to edge as in the sidebar) */
  .pw-wizard .pw-patches-tree {
    margin: 0;
    min-height: 0;
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--rounded);
    box-shadow: var(--shadow);
  }
}
@media (min-width: 75rem) {
  .pw-wizard {
    /* (fixed: the preview's switches always on one line) */
    --pw-preview-width: 450px;
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
  /* pages without a preview (the AI pages): no column, the full width */
  .pw-wizard[data-full="true"] .k-panel-main {
    margin-inline-end: 0;
  }
  .pw-wizard[data-full="true"] :is(.pw-preview-column, .pw-preview-toggle, .pw-preview-open) {
    display: none !important;
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
/* every preview toolbar: the device first, the variants (and views) after it, the guides on the right */
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
/* on: pink, as the panel's grid lines button (Kirby's pink theme) */
.pw-guides-switch .pw-tool[data-theme="pink"],
.pw-guides-switch .pw-tool[data-theme="pink"]:hover {
  background: var(--theme-color-back);
  color: var(--theme-color-icon-highlight);
}
.pw-preview-switches .pw-device-select {
  order: -1;
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
/* the layout shown (featurelist, faq): after the variant */
.pw-preview-switches .pw-preview-layout {
  order: 1;
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
  background: var(--item-color-back, light-dark(var(--color-white), var(--color-gray-850)));
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


/* (the loading view is the start page: .pw-welcome) */

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
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-12);
  align-items: start;
}
.pw-ai-settings.pw-ai-single { grid-template-columns: 1fr; }
/* the translated fields' tree: in a card, the blocks as in the
   configuration's tree */
.pw-translate-tree {
  padding: var(--spacing-2);
}
.pw-translate-tree .pw-json-root {
  margin: 0;
  padding: 0;
  border: 0;
}
/* DeepL's usage: a bar (orange above 90 %) on a white track of its full
   length (the panel's grey would hide it) */
.pw-usage-bar {
  height: 0.5rem;
  overflow: hidden;
  border-radius: 999px;
  background: light-dark(var(--color-white), var(--color-gray-800));
}
.pw-usage-bar > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-blue-600);
}
.pw-usage-bar.is-high > span {
  background: var(--color-orange-500);
}
.pw-ai-usage {
  margin-top: var(--spacing-8);
}
.pw-ai-batch-menu {
  margin-inline-start: auto;
}
/* a group's heading in a menu (the language) */
.pw-menu-heading {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
}
.pw-ai-batch-menu hr {
  margin: var(--spacing-1) 0;
  border: 0;
  border-top: 1px solid var(--dropdown-color-hr, rgba(255, 255, 255, 0.25));
}
.pw-ai-batch-over {
  color: var(--color-negative);
}
.pw-ai-usage-figures {
  font-variant-numeric: tabular-nums;
}
@media (max-width: 60rem) {
  .pw-ai-settings { grid-template-columns: 1fr; }
}
.pw-ai-secrets { display: flex; flex-direction: column; gap: var(--spacing-4); }
.pw-ai-secrets-title { font-size: var(--text-lg); }
.pw-ai-secrets-help, .pw-ai-secret-status { color: var(--color-text-dimmed); font-size: var(--text-sm); line-height: 1.5; }
/* more room below the intro, before the keys */
.pw-ai-secrets-intro { margin-bottom: var(--spacing-4); }
.pw-ai-secret-row { display: flex; gap: var(--spacing-2); align-items: center; margin-block: var(--spacing-2); }
/* the field with the key's state inside, at its right end */
.pw-ai-secret-field { position: relative; display: flex; flex: 1 1 auto; min-width: 0; }
.pw-ai-secret-field .pw-ai-secret-input { padding-inline-end: 2rem; }
.pw-ai-secret-state {
  position: absolute;
  inset-inline-end: var(--spacing-2);
  top: 50%;
  transform: translateY(-50%);
  --icon-size: 16px;
  pointer-events: auto;
}
.pw-ai-secret-state.is-valid { color: var(--color-green-600, #16a34a); }
.pw-ai-secret-state.is-invalid { color: var(--color-red-600, #dc2626); }
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
