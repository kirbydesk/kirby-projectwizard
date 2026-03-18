<template>
  <k-panel-inside class="pw-wizard">
    <k-header>
      {{ blockType ? blockLabel(blockType) : 'Project Wizard' }}
      <template v-if="dirtyTabs[activeTab]" #buttons>
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

    <div v-if="loading" class="pw-wizard-loading">Loading...</div>

    <div v-else class="pw-wizard-content">

        <!-- ==================== Global Settings ==================== -->
        <div v-if="activeTab === 'global'" class="pw-wizard-panel">
          <h2 class="pw-wizard-panel-title">Global Settings</h2>

          <!-- Kirby-style tab navigation -->
          <nav class="pw-wizard-global-tabs">
            <button
              v-for="tab in globalTabs"
              :key="tab.key"
              class="pw-wizard-global-tab"
              :class="{ 'is-active': globalActiveTab === tab.key }"
              @click="globalActiveTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </nav>

          <!-- Colors -->
          <div v-if="globalActiveTab === 'colors'" class="pw-wizard-global-content">
            <p class="pw-wizard-hint">Color themes and scheme configuration.</p>
          </div>

          <!-- Elements -->
          <div v-if="globalActiveTab === 'elements'" class="pw-wizard-global-content">
            <p class="pw-wizard-hint">Global element settings (buttons, links, icons, etc.).</p>

            <fieldset class="pw-wizard-fieldgroup">
              <h3 class="pw-wizard-fieldgroup-title">Active Blocks</h3>
              <p class="pw-wizard-hint">Select which blocks are available in the content editor.</p>
              <div class="pw-wizard-checklist">
                <label
                  v-for="block in blocks"
                  :key="block.blockType"
                  class="pw-wizard-check"
                >
                  <input
                    type="checkbox"
                    :checked="block.active"
                    @change="toggleBlock(block.blockType, $event.target.checked)"
                  />
                  <span class="pw-wizard-check-label">{{ blockLabel(block.blockType) }}</span>
                  <span class="pw-wizard-check-meta">{{ block.plugin }}</span>
                </label>
              </div>
            </fieldset>
          </div>

          <!-- Header -->
          <div v-if="globalActiveTab === 'header'" class="pw-wizard-global-content">
            <p class="pw-wizard-hint">Header and navigation configuration.</p>
          </div>

          <!-- Footer -->
          <div v-if="globalActiveTab === 'footer'" class="pw-wizard-global-content">
            <p class="pw-wizard-hint">Footer configuration.</p>
          </div>

        </div>

        <!-- ==================== Block Tabs ==================== -->
        <div
          v-for="block in blocks"
          :key="block.blockType"
          v-show="activeTab === block.blockType"
          class="pw-wizard-panel"
        >

          <div v-if="blockConfigs[block.blockType]" class="pw-wizard-block-sections">

            <!-- ===== Content ===== -->
            <div class="pw-wizard-tab-content">

              <!-- Content Fields -->
              <section class="pw-wizard-section">
              <button class="pw-section-toggle" @click="toggleSection(block.blockType, 'content')">
                <span>{{ $t('pw.headline.content') }}</span>
                <k-icon :type="isSectionOpen(block.blockType, 'content') ? 'angle-down' : 'angle-right'" />
              </button>
              <transition name="pw-slide">
              <div v-show="isSectionOpen(block.blockType, 'content')" class="pw-section-content">

              <!-- Column blocks (first, controls which fields are visible) -->
              <div v-if="getColumnBlocks(block.blockType)" class="pw-field-block">
                <div class="k-field k-text-field pw-content-field" data-object="content-field">
                  <div class="pw-field-rows">
                    <pw-field-row
                      :uid="block.blockType + '-column-blocks'"
                      :label="$t('prw.headline.columnBlocks')"
                      :all-options="getColumnBlocks(block.blockType)"
                      :active-options="getActiveColumnBlocks(block.blockType)"
                      current-default=""
                      plugin-default=""
                      :enabled="true"
                      :modified="hasOverride(block.blockType, 'settings.fields.content.column-blocks')"
                      :no-default="true"
                      :no-checkbox="true"
                      @update:options="setColumnBlocks(block.blockType, $event, getColumnBlocks(block.blockType))"
                    />
                  </div>
                </div>
              </div>

              <!-- Content fields (filtered by active column-blocks if present) -->
              <div v-if="getContentFields(block.blockType).length" class="pw-field-block">
                <div
                  v-for="field in getContentFields(block.blockType)"
                  v-show="isColumnBlockField(block.blockType, field.key)"
                  :key="field.key"
                  class="k-field k-text-field pw-content-field"
                  data-object="content-field"
                >
                  <!-- Label with enable checkbox (not for column-block fields) -->
                  <k-toggle-field
                    v-if="!getColumnBlocks(block.blockType)"
                    :label="false"
                    :value="isFieldEnabled(block.blockType, field)"
                    :text="fieldLabel(field.key)"
                    @input="toggleField(block.blockType, field, $event)"
                  />
                  <label v-else class="pw-column-field-label">{{ fieldLabel(field.key) }}</label>

                  <!-- Property rows -->
                  <div v-show="!getColumnBlocks(block.blockType) ? isFieldEnabled(block.blockType, field) : true" v-if="field.properties.length" class="pw-field-rows">
                    <pw-field-row
                      v-for="prop in field.properties"
                      :key="field.key + '-' + prop.key"
                      :uid="block.blockType + '-' + field.key + '-' + prop.key"
                      :label="prop.key"
                      :all-options="prop.allOptions"
                      :active-options="getActiveOptions(block.blockType, field.key, prop.key, prop)"
                      :current-default="getVal(block.blockType, 'defaults.content.' + field.key + '.' + prop.key, prop.pluginDefault)"
                      :plugin-default="prop.pluginDefault"
                      :enabled="true"
                      :modified="hasOverride(block.blockType, 'settings.fields.content.' + field.key + '.' + prop.key) || hasOverride(block.blockType, 'defaults.content.' + field.key + '.' + prop.key)"
                      @update:options="setActiveOptions(block.blockType, field.key, prop.key, prop, $event)"
                      @update:default="selectOption(block.blockType, 'defaults.content.' + field.key + '.' + prop.key, $event, prop.pluginDefault)"
                    />
                  </div>
                </div>
              </div>

              <!-- Editor config (content settings + editor.json merged) -->
              <div
                v-if="getEditorField(block.blockType) || getEditorConfigRows(block.blockType).length"
                class="k-field k-text-field pw-content-field"
                data-object="content-field"
              >
                <k-toggle-field
                  :label="false"
                  :value="isFieldEnabled(block.blockType, getEditorField(block.blockType) || { key: 'editor', enabled: true })"
                  :text="fieldLabel('editor')"
                  @input="toggleField(block.blockType, getEditorField(block.blockType) || { key: 'editor', enabled: true }, $event)"
                />

                <div v-show="isFieldEnabled(block.blockType, getEditorField(block.blockType) || { key: 'editor', enabled: true })" class="pw-field-rows">
                  <!-- Editor content settings (mode, align, sizes) as FieldRows -->
                  <template v-if="getEditorField(block.blockType)">
                    <pw-field-row
                      v-for="prop in getEditorField(block.blockType).properties"
                      :key="'editor-content-' + prop.key"
                      :uid="block.blockType + '-editor-' + prop.key"
                      :label="prop.key"
                      :all-options="prop.allOptions"
                      :active-options="getActiveOptions(block.blockType, 'editor', prop.key, prop)"
                      :current-default="getVal(block.blockType, 'defaults.content.editor.' + prop.key, prop.pluginDefault)"
                      :plugin-default="prop.pluginDefault"
                      :enabled="true"
                      :modified="hasOverride(block.blockType, 'settings.fields.content.editor.' + prop.key) || hasOverride(block.blockType, 'defaults.content.editor.' + prop.key)"
                      @update:options="setEditorContentOptions(block.blockType, prop.key, prop, $event)"
                      @update:default="selectOption(block.blockType, 'defaults.content.editor.' + prop.key, $event, prop.pluginDefault)"
                    />
                  </template>

                  <!-- Editor config (marks, nodes, headings, toolbar) — only if writer mode available -->
                  <template v-if="writerActive[block.blockType] !== false" v-for="row in getEditorConfigRows(block.blockType)">
                    <pw-field-row
                      v-if="row.type === 'array'"
                      :key="'editor-' + row.key"
                      :uid="block.blockType + '-editor-' + row.key"
                      :label="row.key"
                      :all-options="row.values"
                      :active-options="getOverrideOnly(block.blockType, 'editor.' + row.key) || row.values"
                      current-default=""
                      plugin-default=""
                      :enabled="true"
                      :modified="hasOverride(block.blockType, 'editor.' + row.key)"
                      :no-default="true"
                      @update:options="setEditorArrayDirect(block.blockType, row.key, $event, row.values)"
                    />
                    <div
                      v-if="row.type === 'toggle'"
                      :key="'editor-' + row.key"
                      class="pw-field-row"
                    >
                      <div class="k-input" data-type="text">
                        <span class="k-input-element pw-field-row-inner">
                          <div class="pw-field-row-label-col">
                            <label class="pw-field-row-label">{{ row.label }}</label>
                          </div>
                          <div class="pw-field-row-options">
                            <k-toggle-input
                              :value="getVal(block.blockType, 'editor.' + row.path, row.value)"
                              @input="setVal(block.blockType, 'editor.' + row.path, $event)"
                            />
                          </div>
                        </span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            <!-- Item fields -->
            <div v-if="getItemFields(block.blockType).length" class="pw-item-section">
              <h3 class="pw-item-headline">Items</h3>
              <div class="pw-field-block">
                <div
                  v-for="field in getItemFields(block.blockType)"
                  :key="field.key"
                  class="k-field k-text-field pw-content-field"
                  data-object="content-field"
                >
                  <k-toggle-field
                    :label="false"
                    :value="isFieldEnabled(block.blockType, field)"
                    :text="fieldLabel(field.displayKey)"
                    @input="toggleField(block.blockType, field, $event)"
                  />

                  <div v-show="isFieldEnabled(block.blockType, field)" v-if="field.properties.length" class="pw-field-rows">
                    <pw-field-row
                      v-for="prop in field.properties"
                      :key="field.key + '-' + prop.key"
                      :uid="block.blockType + '-' + field.key + '-' + prop.key"
                      :label="prop.key"
                      :all-options="prop.allOptions"
                      :active-options="getActiveOptions(block.blockType, field.key, prop.key, prop)"
                      :current-default="getVal(block.blockType, 'defaults.content.' + field.key + '.' + prop.key, prop.pluginDefault)"
                      :plugin-default="prop.pluginDefault"
                      :enabled="true"
                      :modified="hasOverride(block.blockType, 'settings.fields.content.' + field.key + '.' + prop.key) || hasOverride(block.blockType, 'defaults.content.' + field.key + '.' + prop.key)"
                      @update:options="setActiveOptions(block.blockType, field.key, prop.key, prop, $event)"
                      @update:default="selectOption(block.blockType, 'defaults.content.' + field.key + '.' + prop.key, $event, prop.pluginDefault)"
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
            </transition>

            </section>

            <!-- ===== Categories (layout, style, effects, grid, settings) ===== -->
            <section
              v-for="cat in getCategories(block.blockType)"
              :key="cat.key"
              class="pw-wizard-section"
            >
              <button class="pw-section-toggle" @click="toggleSection(block.blockType, cat.key)">
                <span>{{ $t('pw.headline.' + cat.key) }}</span>
                <k-icon :type="isSectionOpen(block.blockType, cat.key) ? 'angle-down' : 'angle-right'" />
              </button>
              <transition name="pw-slide">
              <div v-show="isSectionOpen(block.blockType, cat.key)" class="pw-field-block">
                <template v-for="field in cat.fields">
                  <!-- FieldRow (e.g. theme with options + click logic) -->
                  <pw-field-row
                    v-if="field.type === 'fieldrow'"
                    :key="field.key"
                    :uid="block.blockType + '-' + cat.key + '-' + field.key"
                    :label="field.key"
                    :all-options="field.allOptions"
                    :active-options="getCategoryActiveOptions(block.blockType, cat.key, field.key, field)"
                    :current-default="getVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, field.pluginDefault)"
                    :plugin-default="field.pluginDefault"
                    :enabled="true"
                    :modified="hasOverride(block.blockType, 'settings.fields.' + cat.key + '.' + field.key) || hasOverride(block.blockType, 'defaults.' + cat.key + '.' + field.key)"
                    @update:options="setCategoryOptions(block.blockType, cat.key, field.key, field, $event)"
                    @update:default="selectOption(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event, field.pluginDefault)"
                  />
                  <!-- Toggles field (e.g. padding-top with small/large) -->
                  <div v-if="field.type === 'toggles'" :key="field.key" class="pw-field-row">
                    <div class="k-input" data-type="text">
                      <span class="k-input-element pw-field-row-inner">
                        <div class="pw-field-row-label-col">
                          <label class="pw-field-row-label">{{ $t('prw.field.' + field.key) }}</label>
                        </div>
                        <div class="pw-field-row-options">
                          <k-toggles-input
                            :value="getVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, field.defaultValue)"
                            :options="field.options"
                            :grow="false"
                            :reset="true"
                            :required="false"
                            @input="setVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event)"
                          />
                        </div>
                      </span>
                    </div>
                  </div>
                  <!-- Toggle group (e.g. radius with 4 sub-toggles) -->
                  <div v-else-if="field.type === 'toggle-group'" :key="field.key" class="pw-field-row">
                    <div class="k-input" data-type="text">
                      <span class="k-input-element pw-field-row-inner">
                        <div class="pw-field-row-label-col">
                          <label class="pw-field-row-label">{{ $t('prw.field.' + field.key) || field.key }}</label>
                        </div>
                        <div class="pw-field-row-options pw-toggle-group">
                          <k-toggle-input
                            v-for="sub in field.subFields"
                            :key="sub.key"
                            :value="getVal(block.blockType, 'defaults.' + cat.key + '.' + sub.key, sub.defaultValue)"
                            :text="$t('prw.option.' + sub.label) || sub.label"
                            @input="setVal(block.blockType, 'defaults.' + cat.key + '.' + sub.key, $event)"
                          />
                        </div>
                      </span>
                    </div>
                  </div>
                  <!-- Single field -->
                  <div v-else-if="field.type === 'single'" :key="field.key" class="pw-field-row">
                    <div class="k-input" data-type="text">
                      <span class="k-input-element pw-field-row-inner">
                        <div class="pw-field-row-label-col">
                          <label class="pw-field-row-label">{{ $t('prw.field.' + field.key) }}</label>
                        </div>
                        <div class="pw-field-row-options">
                          <!-- Boolean: toggle -->
                          <k-toggle-input
                            v-if="field.defaultValue !== null && typeof field.defaultValue === 'boolean'"
                            :value="getVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, field.defaultValue)"
                            @input="setVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event)"
                          />
                          <!-- String with options: select -->
                          <select
                            v-else-if="field.options && field.options.length"
                            class="pw-category-select"
                            :value="getVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, field.defaultValue)"
                            @change="selectOption(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event.target.value, field.defaultValue)"
                          >
                            <option
                              v-for="opt in field.options"
                              :key="opt"
                              :value="opt"
                            >{{ opt }}</option>
                          </select>
                          <!-- String: text input -->
                          <input
                            v-else-if="field.defaultValue !== null && typeof field.defaultValue === 'string'"
                            type="text"
                            class="pw-category-input"
                            :placeholder="field.defaultValue"
                            :value="getOverrideOnly(block.blockType, 'defaults.' + cat.key + '.' + field.key) || ''"
                            @input="setValOrClear(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event.target.value, field.defaultValue)"
                          />
                          <!-- Number: number input -->
                          <input
                            v-else-if="field.defaultValue !== null && typeof field.defaultValue === 'number'"
                            type="number"
                            class="pw-category-input"
                            :placeholder="String(field.defaultValue)"
                            :value="getOverrideOnly(block.blockType, 'defaults.' + cat.key + '.' + field.key)"
                            @input="setValOrClear(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event.target.value !== '' ? Number($event.target.value) : '', String(field.defaultValue))"
                          />
                        </div>
                      </span>
                    </div>
                  </div>
                </template>
              </div>
              </transition>
            </section>

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
      globalActiveTab: 'colors',
      globalTabs: [
        { key: 'colors', label: 'Colors' },
        { key: 'elements', label: 'Elements' },
        { key: 'header', label: 'Header' },
        { key: 'footer', label: 'Footer' },
      ],
      globalDirty: false,
      blockConfigs: {},
      blockOverrides: {},
      originalOverrides: {},
      originalActiveBlocks: [],
      blockActiveTabs: {},
      sectionState: {},
      dirtyTabs: {},
      snapshots: {},
      writerActive: {},
    };
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
        if (this.dirtyTabs[this.activeTab]) {
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

        this.loading = false;
      } catch (e) {
        console.error('Failed to load', e);
      }
    },

    fieldLabel(key) {
      const tKey = 'pw.field.' + key;
      const translated = this.$t(tKey);
      return (translated && translated !== tKey) ? translated : key.charAt(0).toUpperCase() + key.slice(1);
    },
    fieldPlaceholder(key) {
      const tKey = 'pw.field.' + key + '.placeholder';
      const translated = this.$t(tKey);
      return (translated && translated !== tKey) ? translated : key.charAt(0).toUpperCase() + key.slice(1) + ' ...';
    },
    fieldHelp(key) {
      const tKey = 'pw.field.' + key + '.help';
      const translated = this.$t(tKey);
      return (translated && translated !== tKey) ? translated : null;
    },
    /**
     * Build item fields: same as content fields but only item-* keys.
     */
    getItemFields(blockType) {
      const rawSettings = this.getDefault(blockType, 'settings.fields.content');
      const rawDefaults = this.getDefault(blockType, 'defaults.content');
      const settings = rawSettings ? JSON.parse(JSON.stringify(rawSettings)) : {};
      const defaults = rawDefaults ? JSON.parse(JSON.stringify(rawDefaults)) : {};
      const fields = [];

      for (const [key, settingVal] of Object.entries(settings)) {
        if (!key.startsWith('item-')) continue;

        const displayKey = key.replace(/^item-/, '');
        const defaultVal = defaults[key] || {};
        const field = { key, displayKey, enabled: true, properties: [] };

        if (settingVal && typeof settingVal === 'object' && !Array.isArray(settingVal)) {
          for (const [propKey, propOptions] of Object.entries(settingVal)) {
            const allOptions = Array.isArray(propOptions) ? propOptions : [];
            if (allOptions.length === 0) continue;
            let pluginDefault = '';
            if (this.isObject(defaultVal)) {
              pluginDefault = defaultVal[propKey] !== undefined
                ? defaultVal[propKey]
                : (defaultVal[propKey.replace(/s$/, '')] !== undefined ? defaultVal[propKey.replace(/s$/, '')] : '');
            }
            if (allOptions.length > 1) {
              field.properties.push({
                key: propKey,
                allOptions,
                options: allOptions,
                pluginDefault: String(pluginDefault),
              });
            }
          }
        } else if (typeof settingVal === 'boolean') {
          field.enabled = settingVal;
        }

        fields.push(field);
      }

      return fields;
    },

    getColumnBlocks(blockType) {
      const settings = this.getDefault(blockType, 'settings.fields.content') || {};
      const val = settings['column-blocks'];
      return Array.isArray(val) && val.length ? val : null;
    },

    getActiveColumnBlocks(blockType) {
      const override = this.getOverrideOnly(blockType, 'settings.fields.content.column-blocks');
      if (Array.isArray(override) && override.length) return override;
      return this.getColumnBlocks(blockType) || [];
    },

    isColumnBlockField(blockType, fieldKey) {
      const columnBlocks = this.getColumnBlocks(blockType);
      if (!columnBlocks) return true; // no column-blocks → show all fields
      const active = this.getActiveColumnBlocks(blockType);
      return active.some(cb => cb.replace('multicolumn', '') === fieldKey);
    },

    setColumnBlocks(blockType, values, allBlocks) {
      const ordered = allBlocks.filter(b => values.includes(b));
      if (JSON.stringify(ordered) === JSON.stringify(allBlocks)) {
        this.deleteNested(this.blockOverrides[blockType] || {}, 'settings.fields.content.column-blocks');
        this.cleanEmpty(this.blockOverrides[blockType] || {}, 'settings.fields.content');
        this.cleanEmpty(this.blockOverrides[blockType] || {}, 'settings.fields');
        this.cleanEmpty(this.blockOverrides[blockType] || {}, 'settings');
      } else {
        this.setVal(blockType, 'settings.fields.content.column-blocks', ordered);
      }
      this.markDirty(blockType);
    },

    setEditorContentOptions(blockType, propKey, prop, values) {
      this.setActiveOptions(blockType, 'editor', propKey, prop, values);
      if (propKey === 'mode') {
        this.$set(this.writerActive, blockType, values.includes('writer'));
      }
    },
    getEditorConfigRows(blockType) {
      const raw = this.getDefault(blockType, 'editor');
      const editorConfig = JSON.parse(JSON.stringify(raw || {}));
      const rows = [];
      for (const [key, val] of Object.entries(editorConfig)) {
        if (Array.isArray(val) && val.length > 0) {
          rows.push({ key, type: 'array', values: val });
        } else if (val && typeof val === 'object') {
          for (const [subKey, subVal] of Object.entries(val)) {
            if (typeof subVal === 'boolean') {
              rows.push({ key: key + '-' + subKey, label: key + ' › ' + subKey, type: 'toggle', path: key + '.' + subKey, value: subVal });
            }
          }
        }
      }
      return rows;
    },
    getEditorField(blockType) {
      const settings = this.getDefault(blockType, 'settings.fields.content') || {};
      const defaults = this.getDefault(blockType, 'defaults.content') || {};
      const settingVal = settings['editor'];
      if (!settingVal) return null;

      const defaultVal = defaults['editor'] || {};
      const field = { key: 'editor', enabled: true, properties: [] };

      if (this.isObject(settingVal)) {
        for (const [propKey, propOptions] of Object.entries(settingVal)) {
          const allOptions = Array.isArray(propOptions) ? propOptions : [];
          let pluginDefault = '';
          if (this.isObject(defaultVal)) {
            pluginDefault = defaultVal[propKey] !== undefined
              ? defaultVal[propKey]
              : (defaultVal[propKey.replace(/s$/, '')] !== undefined ? defaultVal[propKey.replace(/s$/, '')] : '');
          }
          if (allOptions.length > 1) {
            field.properties.push({
              key: propKey,
              allOptions,
              options: allOptions,
              pluginDefault: String(pluginDefault),
            });
          }
        }
      }

      return field.properties.length ? field : null;
    },
    blockLabel(blockType) {
      // Find plugin name for translation key
      const block = this.blocks.find(b => b.blockType === blockType);
      if (block) {
        const translated = this.$t(block.plugin + '.name');
        if (translated && translated !== block.plugin + '.name') return translated;
      }
      const name = blockType.replace(/^pw/, '').replace(/([A-Z])/g, ' $1').trim() || blockType;
      return name.charAt(0).toUpperCase() + name.slice(1);
    },

    /**
     * Get available tabs for a block: always "content" first, then from settings.tabs.
     */
    getBlockTabs(blockType) {
      const tabs = ['content'];
      const settingsTabs = this.getDefault(blockType, 'settings.tabs') || {};
      for (const key of Object.keys(settingsTabs)) {
        if (!tabs.includes(key)) tabs.push(key);
      }
      // Add categories that have defaults but no settings tab entry
      for (const cat of ['layout', 'style', 'effects', 'grid', 'settings']) {
        const defaults = this.getDefault(blockType, 'defaults.' + cat);
        if (defaults && Object.keys(defaults).length && !tabs.includes(cat)) {
          tabs.push(cat);
        }
      }
      return tabs;
    },

    getBlockActiveTab(blockType) {
      return this.blockActiveTabs[blockType] || 'content';
    },

    toggleSection(blockType, sectionKey) {
      const key = blockType + '-' + sectionKey;
      this.$set(this.sectionState, key, !this.isSectionOpen(blockType, sectionKey));
    },
    isSectionOpen(blockType, sectionKey) {
      const key = blockType + '-' + sectionKey;
      return this.sectionState[key] !== false;
    },
    setBlockActiveTab(blockType, tab) {
      this.$set(this.blockActiveTabs, blockType, tab);
    },

    /**
     * Build unified content fields: merge settings.fields.content with defaults.content.
     */
    getContentFields(blockType) {
      const settings = this.getDefault(blockType, 'settings.fields.content') || {};
      const defaults = this.getDefault(blockType, 'defaults.content') || {};
      const fields = [];

      for (const [key, settingVal] of Object.entries(settings)) {
        // Skip editor, item-*, and column-blocks — handled separately
        if (key === 'editor' || key === 'column-blocks' || key.startsWith('item-')) continue;

        const defaultVal = defaults[key] || {};
        const field = { key, enabled: true, properties: [] };

        if (this.isObject(settingVal)) {
          for (const [propKey, propOptions] of Object.entries(settingVal)) {
            const allOptions = Array.isArray(propOptions) ? propOptions : [];
            let pluginDefault = '';
            if (this.isObject(defaultVal)) {
              pluginDefault = defaultVal[propKey] !== undefined
                ? defaultVal[propKey]
                : (defaultVal[propKey.replace(/s$/, '')] !== undefined ? defaultVal[propKey.replace(/s$/, '')] : '');
            }
            if (allOptions.length > 1) {
              field.properties.push({
                key: propKey,
                allOptions,
                options: allOptions,
                pluginDefault: String(pluginDefault),
              });
            }
          }
        } else if (typeof settingVal === 'boolean') {
          field.enabled = settingVal;
        }

        fields.push(field);
      }

      return fields;
    },

    /**
     * Check if a content field is enabled.
     */
    isFieldEnabled(blockType, field) {
      // Check _disabled flag
      const disabled = this.getOverrideOnly(blockType, 'settings.fields.content.' + field.key + '._disabled');
      if (disabled === true) return false;
      // Check override
      const override = this.getOverrideOnly(blockType, 'settings.fields.content.' + field.key);
      if (override === false) return false;
      if (override === true || this.isObject(override)) return true;
      // Fall back to plugin default
      return field.enabled !== false;
    },

    /**
     * Toggle a content field on/off.
     */
    toggleField(blockType, field, enabled) {
      if (!this.blockOverrides[blockType] || Array.isArray(this.blockOverrides[blockType])) {
        this.$set(this.blockOverrides, blockType, {});
      }
      const path = 'settings.fields.content.' + field.key;
      if (enabled) {
        // Remove the _disabled flag, keep other overrides
        this.deleteNested(this.blockOverrides[blockType], path + '._disabled');
        this.cleanEmpty(this.blockOverrides[blockType], path);
        this.cleanEmpty(this.blockOverrides[blockType], 'settings.fields.content');
        this.cleanEmpty(this.blockOverrides[blockType], 'settings.fields');
        this.cleanEmpty(this.blockOverrides[blockType], 'settings');
      } else {
        this.setVal(blockType, path + '._disabled', true);
      }
      this.markDirty(blockType);
    },

    /**
     * Get currently active (allowed) options for a property.
     */
    getCategoryActiveOptions(blockType, catKey, fieldKey, field) {
      const override = this.getOverrideOnly(blockType, 'settings.fields.' + catKey + '.' + fieldKey);
      const arr = JSON.parse(JSON.stringify(override || []));
      if (Array.isArray(arr) && arr.length > 0) return arr;
      return field.allOptions;
    },

    setCategoryOptions(blockType, catKey, fieldKey, field, values) {
      const ordered = field.allOptions.filter(o => values.includes(o));
      if (JSON.stringify(ordered) === JSON.stringify(field.allOptions)) {
        this.deleteNested(this.blockOverrides[blockType] || {}, 'settings.fields.' + catKey + '.' + fieldKey);
        this.cleanEmpty(this.blockOverrides[blockType] || {}, 'settings.fields.' + catKey);
        this.cleanEmpty(this.blockOverrides[blockType] || {}, 'settings.fields');
        this.cleanEmpty(this.blockOverrides[blockType] || {}, 'settings');
      } else {
        this.setVal(blockType, 'settings.fields.' + catKey + '.' + fieldKey, ordered);
      }
      // Reset default if no longer in allowed list
      const currentDefault = this.getVal(blockType, 'defaults.' + catKey + '.' + fieldKey, field.pluginDefault);
      if (!ordered.includes(currentDefault) && ordered.length) {
        this.setVal(blockType, 'defaults.' + catKey + '.' + fieldKey, ordered[0]);
      }
      this.markDirty(blockType);
    },

    getActiveOptions(blockType, fieldKey, propKey, prop) {
      const override = this.getOverrideOnly(blockType, 'settings.fields.content.' + fieldKey + '.' + propKey);
      if (Array.isArray(override)) return override;
      return prop.allOptions;
    },

    /**
     * Set allowed options from checkboxes input (receives full array).
     */
    setActiveOptions(blockType, fieldKey, propKey, prop, values) {
      const updated = Array.isArray(values) ? values : [];
      if (updated.length === 0) return; // Don't allow empty

      // Keep original order
      const ordered = prop.allOptions.filter(o => updated.includes(o));

      // If same as plugin default, remove override
      if (JSON.stringify(ordered) === JSON.stringify(prop.allOptions)) {
        this.deleteNested(this.blockOverrides[blockType] || {}, 'settings.fields.content.' + fieldKey + '.' + propKey);
      } else {
        this.setVal(blockType, 'settings.fields.content.' + fieldKey + '.' + propKey, ordered);
      }

      // If current default is no longer in allowed list, reset it
      const currentDefault = this.getVal(blockType, 'defaults.content.' + fieldKey + '.' + propKey, prop.pluginDefault);
      if (!ordered.includes(currentDefault) && ordered.length) {
        this.setVal(blockType, 'defaults.content.' + fieldKey + '.' + propKey, ordered[0]);
      }

      this.markDirty(blockType);
    },

    /**
     * Build category fields: merge settings + defaults per category.
     */
    getCategories(blockType) {
      const cats = [];
      for (const catKey of ['layout', 'style', 'effects', 'grid', 'settings']) {
        const settingsFields = this.getDefault(blockType, 'settings.fields.' + catKey) || {};
        const defaultsFields = this.getDefault(blockType, 'defaults.' + catKey) || {};

        const allKeys = new Set([...Object.keys(settingsFields), ...Object.keys(defaultsFields)]);
        if (allKeys.size === 0) continue;

        const fields = [];
        const grouped = {};

        for (const key of allKeys) {
          // Skip parent toggle keys (handled by their sub-fields)
          if (key === 'padding' || key === 'radius') continue;

          // Group radius-* fields
          if (key.startsWith('radius-')) {
            if (!grouped['radius']) {
              grouped['radius'] = { key: 'radius', type: 'toggle-group', subFields: [] };
            }
            const subLabel = key.replace('radius-', '');
            grouped['radius'].subFields.push({
              key,
              label: subLabel,
              defaultValue: defaultsFields[key] !== undefined ? defaultsFields[key] : false,
            });
            continue;
          }

          // Padding top/bottom as toggles fields
          if (key === 'padding-top' || key === 'padding-bottom') {
            const defaultVal = defaultsFields[key] !== undefined ? defaultsFields[key] : 'large';
            fields.push({
              key,
              type: 'toggles',
              defaultValue: defaultVal,
              options: [
                { value: 'small', text: 'Small' },
                { value: 'large', text: 'Large' },
              ],
            });
            continue;
          }

          const settingVal = settingsFields[key];
          const defaultVal = defaultsFields[key];

          // Fields with string options → FieldRow with click logic
          const settingArr = settingVal ? JSON.parse(JSON.stringify(settingVal)) : null;
          if (settingArr && Array.isArray(settingArr) && settingArr.length > 0 && settingArr.every(v => typeof v === 'string')) {
            fields.push({
              key,
              type: 'fieldrow',
              allOptions: settingArr,
              pluginDefault: typeof defaultVal === 'string' ? defaultVal : settingArr[0],
              defaultValue: defaultVal,
            });
            continue;
          }

          // Skip if already handled as fieldrow
          if (settingArr && typeof settingArr !== 'boolean') continue;

          const field = {
            key,
            type: 'single',
            defaultValue: defaultVal !== undefined ? defaultVal : null,
          };

          fields.push(field);
        }

        // Add grouped fields
        for (const group of Object.values(grouped)) {
          fields.push(group);
        }

        cats.push({ key: catKey, fields });
      }
      return cats;
    },

    selectOption(blockType, path, value, pluginDefault) {
      if (value === pluginDefault || value === String(pluginDefault)) {
        this.deleteNested(this.blockOverrides[blockType] || {}, path);
      } else {
        this.setVal(blockType, path, value);
      }
      this.markDirty(blockType);
    },

    // --- Global ---
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

    async saveCurrentView() {
      if (this.activeTab === 'global') {
        await this.saveGlobal();
      } else {
        await this.saveBlock(this.activeTab);
      }
    },

    discardChanges() {
      if (this.activeTab === 'global') {
        this.activeBlocks = [...this.originalActiveBlocks];
        for (const block of this.blocks) {
          block.active = this.activeBlocks.includes(block.blockType);
        }
      } else {
        const bt = this.activeTab;
        this.$set(this.blockOverrides, bt, JSON.parse(JSON.stringify(this.originalOverrides[bt] || {})));
      }
      this.$set(this.dirtyTabs, this.activeTab, false);
    },

    setEditorArrayDirect(blockType, key, values, defaultVal) {
      if (JSON.stringify(values) === JSON.stringify(defaultVal)) {
        this.deleteNested(this.blockOverrides[blockType] || {}, 'editor.' + key);
        this.cleanEmpty(this.blockOverrides[blockType] || {}, 'editor');
      } else {
        this.setVal(blockType, 'editor.' + key, values);
      }
      this.markDirty(blockType);
    },

    // --- Nested helpers ---
    nested(obj, path) {
      if (!path) return undefined;
      return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
    },
    setNested(obj, path, value) {
      const keys = path.split('.');
      let cur = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') {
          this.$set(cur, keys[i], {});
        }
        cur = cur[keys[i]];
      }
      this.$set(cur, keys[keys.length - 1], value);
    },
    cleanEmpty(obj, path) {
      const val = this.nested(obj, path);
      if (val && typeof val === 'object' && Object.keys(val).length === 0) {
        this.deleteNested(obj, path);
      }
    },
    deleteNested(obj, path) {
      const keys = path.split('.');
      let cur = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) return;
        cur = cur[keys[i]];
      }
      this.$delete(cur, keys[keys.length - 1]);
    },

    hasOverride(blockType, path) {
      return this.nested(this.blockOverrides[blockType] || {}, path) !== undefined;
    },
    getVal(blockType, path, defaultVal) {
      const ov = this.nested(this.blockOverrides[blockType] || {}, path);
      return ov !== undefined ? ov : defaultVal;
    },
    getOverrideOnly(blockType, path) {
      return this.nested(this.blockOverrides[blockType] || {}, path);
    },
    setVal(blockType, path, value) {
      if (!this.blockOverrides[blockType] || Array.isArray(this.blockOverrides[blockType])) this.$set(this.blockOverrides, blockType, {});
      this.setNested(this.blockOverrides[blockType], path, value);
      this.markDirty(blockType);
    },
    setValOrClear(blockType, path, value, placeholder) {
      if (!this.blockOverrides[blockType] || Array.isArray(this.blockOverrides[blockType])) {
        this.$set(this.blockOverrides, blockType, {});
      }
      if (value === '' || value === placeholder) {
        this.deleteNested(this.blockOverrides[blockType], path);
      } else {
        this.setNested(this.blockOverrides[blockType], path, value);
      }
      this.markDirty(blockType);
    },
    setEditorArrayFromTags(blockType, key, value, defaultVal) {
      const arr = Array.isArray(value) ? value.map(v => v.value || v) : [];
      if (arr.length === 0 || JSON.stringify(arr) === JSON.stringify(defaultVal)) {
        this.deleteNested(this.blockOverrides[blockType] || {}, 'editor.' + key);
      } else {
        this.setVal(blockType, 'editor.' + key, arr);
      }
    },
    markDirty(blockType) {
      const config = this.blockConfigs[blockType];
      if (config) config.hasOverrides = Object.keys(this.blockOverrides[blockType] || {}).length > 0;
      const obj = Array.isArray(this.blockOverrides[blockType]) ? {} : (this.blockOverrides[blockType] || {});
      const current = JSON.stringify(obj);
      const snapshot = this.snapshots[blockType] || '{}';
      this.$set(this.dirtyTabs, blockType, current !== snapshot);
    },

    getDefault(blockType, path) {
      const config = this.blockConfigs[blockType];
      if (!config) return null;
      return this.nested(config.defaults, path);
    },

    isObject(val) {
      return val && typeof val === 'object' && !Array.isArray(val);
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
.pw-wizard {
  /* match native Kirby panel page spacing */
}

.pw-wizard-loading {
  padding: var(--spacing-12);
  text-align: center;
  color: var(--color-text-dimmed);
}

/* Content */
.pw-wizard-content {
}

/* Field block (content fields container) */
.pw-field-block {
  display: flex;
  flex-direction: column;
}

[data-object="content-field"] {
  margin-bottom: var(--spacing-2);
}

.pw-wizard-section {
  margin-bottom: var(--spacing-6);
}

.pw-section-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: var(--spacing-3);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
}

.pw-section-toggle:hover {
  color: var(--color-text-dimmed);
}

.pw-section-toggle .k-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

.pw-slide-enter-active,
.pw-slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.pw-slide-enter,
.pw-slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.pw-slide-enter-to,
.pw-slide-leave {
  opacity: 1;
  max-height: 2000px;
}



.pw-field-row-options .k-choice-input.k-toggle-input {
  padding-left: var(--spacing-2);
}

/* Toggles styling to match badge look */
.pw-field-row-options .k-toggles-input ul {
  border-radius: 999px;
  overflow: hidden;
  background: none !important;
}

.pw-field-row-options .k-toggles-input label {
  border-radius: 999px;
  padding: 0 var(--spacing-2);
  height: 22px;
  min-height: 0;
}

.pw-field-row-options .k-toggles-input input:focus:not(:checked) + label {
  background: none !important;
}

.pw-field-row-options .k-toggles-input ul {
  height: 22px;
}

.pw-field-row-options.pw-toggle-group {
  column-gap: var(--spacing-10);
}

.pw-category-select,
.pw-category-input {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  background: var(--color-white);
}

.pw-category-select:focus,
.pw-category-input:focus {
  outline: none;
  border-color: var(--color-focus);
}

.pw-category-input::placeholder {
  color: var(--color-text-dimmed);
  font-style: italic;
}


.pw-content-field .k-label-text {
  text-transform: capitalize;
}


.pw-field-rows {
  display: flex;
  flex-direction: column;
}

.pw-item-headline {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-dimmed);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: var(--spacing-4);
  margin-bottom: var(--spacing-3);
}

[data-object="content-field"] {
  .pw-field-rows {
     margin-top: 1px;

    .pw-field-row div.k-input {
      background-color: var(--color-gray-150);
    }
  }
}

.pw-column-field-label {
  font-size: var(--text-sm);
  font-weight: 600;
  padding: var(--spacing-2) var(--spacing-3);
  display: block;
}


/* Global tabs (Kirby-style) */
.pw-wizard-global-tabs {
  display: flex;
  gap: var(--spacing-1);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-6);
}

.pw-wizard-global-tab {
  padding: var(--spacing-2) var(--spacing-4);
  border: none;
  background: none;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-dimmed);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.1s, border-color 0.1s;
}

.pw-wizard-global-tab:hover {
  color: var(--color-text);
}

.pw-wizard-global-tab.is-active {
  color: var(--color-text);
  border-bottom-color: var(--color-black);
}

.pw-wizard-global-content {
  min-height: 200px;
}

.pw-wizard-panel { min-width: 0; }
.pw-wizard-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-6);
}
.pw-wizard-panel-meta { font-size: var(--text-xs); color: var(--color-text-dimmed); font-weight: 400; margin-left: var(--spacing-3); }
.pw-wizard-hint { font-size: var(--text-sm); color: var(--color-text-dimmed); margin-bottom: var(--spacing-4); }

/* Fieldgroups */
.pw-wizard-fieldgroup {
  margin-bottom: var(--spacing-4);
}

/* Toggle row */
.pw-wizard-toggle-row { display: flex; flex-wrap: wrap; gap: var(--spacing-2); }
.pw-wizard-toggle {
  display: flex; align-items: center; gap: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--color-gray-100); border-radius: var(--rounded);
  font-size: var(--text-sm); cursor: pointer;
}
.pw-wizard-toggle:hover { background: var(--color-gray-200); }
.pw-wizard-toggle.is-overridden { background: var(--color-notice-100); }
.pw-wizard-toggle-inline { cursor: pointer; display: inline-flex; align-items: center; gap: var(--spacing-2); }

/* Checklist */
.pw-wizard-checklist { display: flex; flex-direction: column; gap: var(--spacing-1); }
.pw-wizard-check { display: flex; align-items: center; gap: var(--spacing-3); padding: var(--spacing-2) var(--spacing-3); border-radius: var(--rounded); cursor: pointer; }
.pw-wizard-check:hover { background: var(--color-gray-100); }
.pw-wizard-check-label { font-size: var(--text-sm); font-weight: 500; }
.pw-wizard-check-meta { font-size: var(--text-xs); color: var(--color-text-dimmed); margin-left: auto; }

/* Native Kirby fields grid layout */
.pw-wizard-fields {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--spacing-3) var(--spacing-6);
}

.pw-wizard-fields > * {
  grid-column: span 12;
}

.pw-wizard-fields > [style*="--width:1/2"] {
  grid-column: span 6;
}

.pw-wizard-fields > [style*="--width:1/3"] {
  grid-column: span 4;
}

.pw-wizard-fields > [style*="--width:1/4"] {
  grid-column: span 3;
}

.pw-wizard-fields > [style*="--width:2/3"] {
  grid-column: span 8;
}

.pw-wizard-block-sections { display: flex; flex-direction: column; }
</style>
