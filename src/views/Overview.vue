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

            <!-- Block tab navigation -->
            <nav class="pw-wizard-global-tabs">
              <button
                v-for="tab in getBlockTabs(block.blockType)"
                :key="tab"
                class="pw-wizard-global-tab"
                :class="{ 'is-active': getBlockActiveTab(block.blockType) === tab }"
                @click="setBlockActiveTab(block.blockType, tab)"
              >
                {{ tab }}
              </button>
            </nav>

            <!-- ===== Content Tab ===== -->
            <div v-if="getBlockActiveTab(block.blockType) === 'content'" class="pw-wizard-tab-content">

              <!-- Content Fields -->
              <div v-if="getContentFields(block.blockType).length" class="pw-field-block">
                <div
                  v-for="field in getContentFields(block.blockType)"
                  :key="field.key"
                  class="k-field k-text-field pw-content-field"
                >
                  <!-- Label with enable checkbox -->
                  <header class="k-field-header" style="display: flex; align-items: center; overflow: visible;">
                    <input
                      type="checkbox"
                      :checked="isFieldEnabled(block.blockType, field)"
                      class="pw-field-enable-check"
                      @change="toggleField(block.blockType, field, $event.target.checked)"
                    />
                    <label class="k-label k-field-label" style="flex: 1 1 0%;">
                      <span class="k-label-text">{{ field.key }}</span>
                    </label>
                  </header>

                  <!-- Input field with field name as placeholder -->
                  <div class="k-input" data-type="text">
                    <span class="k-input-element">
                      <input
                        type="text"
                        class="k-string-input k-text-input"
                        :placeholder="field.key + ' ...'"
                      />
                    </span>
                  </div>

                  <!-- Property rows below the input -->
                  <div v-if="isFieldEnabled(block.blockType, field) && field.properties.length" class="pw-field-rows">
                    <pw-field-row
                      v-for="prop in field.properties"
                      :key="field.key + '-' + prop.key"
                      :label="prop.key"
                      :all-options="prop.allOptions"
                      :active-options="getActiveOptions(block.blockType, field.key, prop.key, prop)"
                      :current-default="getVal(block.blockType, 'defaults.content.' + field.key + '.' + prop.key, prop.pluginDefault)"
                      :plugin-default="prop.pluginDefault"
                      :enabled="isFieldEnabled(block.blockType, field)"
                      :modified="hasOverride(block.blockType, 'settings.fields.content.' + field.key + '.' + prop.key) || hasOverride(block.blockType, 'defaults.content.' + field.key + '.' + prop.key)"
                      @toggle="toggleField(block.blockType, field, $event)"
                      @update:options="setActiveOptions(block.blockType, field.key, prop.key, prop, $event)"
                      @update:default="selectOption(block.blockType, 'defaults.content.' + field.key + '.' + prop.key, $event, prop.pluginDefault)"
                    />
                  </div>
                </div>
              </div>

              <!-- Editor config -->
              <template v-if="getDefault(block.blockType, 'editor') && Object.keys(getDefault(block.blockType, 'editor')).length">
                <k-line-field />
                <template v-for="(val, key) in getDefault(block.blockType, 'editor')">
                  <k-tags-field
                    v-if="Array.isArray(val)"
                    :key="'editor-' + key"
                    :label="'Editor: ' + key"
                    :help="'Plugin default: ' + (val.join(', ') || '(none)')"
                    :value="getOverrideOnly(block.blockType, 'editor.' + key) || val"
                    accept="all"
                    @input="setEditorArrayFromTags(block.blockType, key, $event, val)"
                  />
                  <template v-else-if="isObject(val)">
                    <k-toggle-field
                      v-for="(subVal, subKey) in val"
                      v-if="typeof subVal === 'boolean'"
                      :key="'editor-' + key + '-' + subKey"
                      :label="'Editor: ' + key + ' › ' + subKey"
                      :value="getVal(block.blockType, 'editor.' + key + '.' + subKey, subVal)"
                      :text="['off', 'on']"
                      @input="setVal(block.blockType, 'editor.' + key + '.' + subKey, $event)"
                    />
                  </template>
                </template>
              </template>
            </div>

            <!-- ===== Category Tabs (layout, style, effects, grid, settings) ===== -->
            <div
              v-for="cat in getCategories(block.blockType)"
              :key="cat.key"
              v-show="getBlockActiveTab(block.blockType) === cat.key"
              class="pw-wizard-tab-content"
            >
              <div class="pw-wizard-fields">
                <template v-for="field in cat.fields">

                  <!-- Select from options -->
                  <k-select-field
                    v-if="field.options && field.options.length"
                    :key="field.key"
                    :label="field.key"
                    :help="'Plugin default: ' + field.defaultValue"
                    :value="getVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, field.defaultValue)"
                    :options="field.options.map(o => ({ value: o, text: o }))"
                    @input="selectOption(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event, field.defaultValue)"
                  />

                  <!-- Boolean -->
                  <k-toggle-field
                    v-else-if="field.defaultValue !== null && typeof field.defaultValue === 'boolean'"
                    :key="field.key"
                    :label="field.key"
                    :value="getVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, field.defaultValue)"
                    :text="['off', 'on']"
                    @input="setVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event)"
                  />

                  <!-- Number -->
                  <k-number-field
                    v-else-if="field.defaultValue !== null && typeof field.defaultValue === 'number'"
                    :key="field.key"
                    :label="field.key"
                    :help="'Plugin default: ' + field.defaultValue"
                    :value="getVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, field.defaultValue)"
                    @input="setVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event)"
                  />

                  <!-- String -->
                  <k-text-field
                    v-else-if="field.defaultValue !== null && typeof field.defaultValue === 'string'"
                    :key="field.key"
                    :label="field.key"
                    :help="'Plugin default: ' + field.defaultValue"
                    :placeholder="field.defaultValue"
                    :value="getOverrideOnly(block.blockType, 'defaults.' + cat.key + '.' + field.key) || ''"
                    @input="setValOrClear(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event, field.defaultValue)"
                  />

                </template>
              </div>
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
      dirtyTabs: {},
      snapshots: {},
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
            field.properties.push({
              key: propKey,
              allOptions,        // all possible values from the plugin
              options: allOptions, // currently allowed (may be overridden)
              pluginDefault: String(pluginDefault),
            });
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
      // Check override first
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
      if (enabled) {
        this.deleteNested(this.blockOverrides[blockType], 'settings.fields.content.' + field.key);
        // Clean up empty parent objects
        this.cleanEmpty(this.blockOverrides[blockType], 'settings.fields.content');
        this.cleanEmpty(this.blockOverrides[blockType], 'settings.fields');
        this.cleanEmpty(this.blockOverrides[blockType], 'settings');
      } else {
        this.setVal(blockType, 'settings.fields.content.' + field.key, false);
      }
      this.markDirty(blockType);
    },

    /**
     * Get currently active (allowed) options for a property.
     */
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
        for (const key of allKeys) {
          const settingVal = settingsFields[key];
          const defaultVal = defaultsFields[key];

          const field = {
            key,
            settingKey: settingVal !== undefined ? 'settings.fields.' + catKey + '.' + key : null,
            settingValue: settingVal === true || (typeof settingVal === 'string' || Array.isArray(settingVal)),
            defaultValue: defaultVal !== undefined ? defaultVal : null,
            options: null,
          };

          if (Array.isArray(settingVal) && settingVal.every(v => typeof v === 'string')) {
            field.options = settingVal;
          }

          fields.push(field);
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
  gap: var(--spacing-6);
}

.pw-content-field {
  margin-bottom: var(--spacing-2);
}

.pw-content-field .k-label-text {
  text-transform: capitalize;
}

.pw-field-enable-check {
  accent-color: var(--color-black);
  cursor: pointer;
  margin-right: 6px;
}

.pw-content-field .k-field-header {
  gap: 0;
}

.pw-field-rows {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-1) 0;
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

.pw-wizard-global-content,
.pw-wizard-tab-content {
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
