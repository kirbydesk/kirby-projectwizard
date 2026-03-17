<template>
  <k-panel-inside class="pw-wizard">
    <k-header>
      Project Wizard
    </k-header>

    <div v-if="loading" class="pw-wizard-loading">Loading...</div>

    <div v-else class="pw-wizard-content">

        <!-- ==================== Global Tab ==================== -->
        <div v-if="activeTab === 'global'" class="pw-wizard-panel">
          <h2 class="pw-wizard-panel-title">Global Settings</h2>

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

          <div class="pw-wizard-toolbar">
            <k-button
              text="Save"
              theme="positive"
              variant="filled"
              size="sm"
              :disabled="!globalDirty"
              @click="saveGlobal"
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
          <div class="pw-wizard-panel-header">
            <h2 class="pw-wizard-panel-title">
              {{ blockLabel(block.blockType) }}
              <span class="pw-wizard-panel-meta">{{ block.plugin }}</span>
            </h2>
            <k-button-group>
              <k-button
                text="Reset"
                size="sm"
                :disabled="!blockConfigs[block.blockType]?.hasOverrides"
                @click="resetBlock(block.blockType)"
              />
              <k-button
                text="Save"
                theme="positive"
                variant="filled"
                size="sm"
                @click="saveBlock(block.blockType)"
              />
            </k-button-group>
          </div>

          <div v-if="blockConfigs[block.blockType]" class="pw-wizard-block-sections">

            <!-- ===== Tabs ===== -->
            <fieldset class="pw-wizard-fieldgroup">
              <h3 class="pw-wizard-fieldgroup-title">Tabs</h3>
              <div class="pw-wizard-toggle-row">
                <label
                  v-for="(val, key) in getDefault(block.blockType, 'settings.tabs') || {}"
                  :key="key"
                  class="pw-wizard-toggle"
                  :class="{ 'is-overridden': hasOverride(block.blockType, 'settings.tabs.' + key) }"
                >
                  <input
                    type="checkbox"
                    :checked="getVal(block.blockType, 'settings.tabs.' + key, val)"
                    @change="setVal(block.blockType, 'settings.tabs.' + key, $event.target.checked)"
                  />
                  <span>{{ key }}</span>
                </label>
              </div>
            </fieldset>

            <!-- ===== Content Fields (unified: settings + defaults) ===== -->
            <fieldset
              v-if="getContentFields(block.blockType).length"
              class="pw-wizard-fieldgroup"
            >
              <h3 class="pw-wizard-fieldgroup-title">Content Fields</h3>

              <div class="pw-wizard-unified-fields">
                <div
                  v-for="field in getContentFields(block.blockType)"
                  :key="field.key"
                  class="pw-wizard-unified-field"
                >
                  <div class="pw-wizard-unified-field-header">
                    <span class="pw-wizard-unified-field-name">{{ field.key }}</span>
                  </div>

                  <!-- Field has properties with options -->
                  <div v-if="field.properties.length" class="pw-wizard-unified-props">
                    <div
                      v-for="prop in field.properties"
                      :key="prop.key"
                      class="k-field pw-wizard-k-field"
                      :class="{ 'is-overridden': hasOverride(block.blockType, 'defaults.content.' + field.key + '.' + prop.key) }"
                    >
                      <header class="k-field-header">
                        <label class="k-label k-field-label">
                          <span class="k-label-text">{{ prop.key }}</span>
                        </label>
                      </header>
                      <div class="k-input" data-type="select">
                        <span class="k-input-element">
                          <select
                            class="k-select-input"
                            :value="getVal(block.blockType, 'defaults.content.' + field.key + '.' + prop.key, prop.pluginDefault)"
                            @change="selectOption(block.blockType, 'defaults.content.' + field.key + '.' + prop.key, $event.target.value, prop.pluginDefault)"
                          >
                            <option
                              v-for="opt in prop.options"
                              :key="opt"
                              :value="opt"
                            >{{ opt }}</option>
                          </select>
                        </span>
                      </div>
                      <footer class="k-field-footer">
                        <div class="k-help k-field-help k-text">
                          Allowed: {{ prop.options.join(', ') }} &mdash; Default: <strong>{{ prop.pluginDefault }}</strong>
                        </div>
                      </footer>
                    </div>
                  </div>

                  <!-- Simple boolean field -->
                  <div v-else class="pw-wizard-unified-simple">
                    <label class="pw-wizard-toggle">
                      <input
                        type="checkbox"
                        :checked="getVal(block.blockType, 'settings.fields.content.' + field.key, field.enabled)"
                        @change="setVal(block.blockType, 'settings.fields.content.' + field.key, $event.target.checked)"
                      />
                      <span>{{ field.enabled ? 'Enabled' : 'Disabled' }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </fieldset>

            <!-- ===== Other categories (layout, style, effects, settings) ===== -->
            <fieldset
              v-for="cat in getCategories(block.blockType)"
              :key="cat.key"
              class="pw-wizard-fieldgroup"
            >
              <h3 class="pw-wizard-fieldgroup-title">{{ cat.key }}</h3>

              <div class="pw-wizard-category-fields">
                <div
                  v-for="field in cat.fields"
                  :key="field.key"
                  class="k-field pw-wizard-k-field pw-wizard-k-field-row"
                  :class="{ 'is-overridden': hasOverride(block.blockType, 'defaults.' + cat.key + '.' + field.key) || (field.settingKey && hasOverride(block.blockType, field.settingKey)) }"
                >
                  <header class="k-field-header">
                    <label class="k-label k-field-label">
                      <span class="k-label-text">
                        <label v-if="field.settingKey" class="pw-wizard-toggle-inline">
                          <input
                            type="checkbox"
                            :checked="getVal(block.blockType, field.settingKey, field.settingValue)"
                            @change="setVal(block.blockType, field.settingKey, $event.target.checked)"
                          />
                        </label>
                        {{ field.key }}
                      </span>
                    </label>
                  </header>

                  <div class="pw-wizard-category-field-value">
                    <!-- Select from options -->
                    <template v-if="field.options && field.options.length">
                      <div class="k-input" data-type="select">
                        <span class="k-input-element">
                          <select
                            class="k-select-input"
                            :value="getVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, field.defaultValue)"
                            @change="selectOption(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event.target.value, field.defaultValue)"
                          >
                            <option
                              v-for="opt in field.options"
                              :key="opt"
                              :value="opt"
                            >{{ opt }}</option>
                          </select>
                        </span>
                      </div>
                      <footer class="k-field-footer">
                        <div class="k-help k-field-help k-text">
                          Default: <strong>{{ field.defaultValue }}</strong>
                        </div>
                      </footer>
                    </template>
                    <!-- Boolean default -->
                    <template v-else-if="field.defaultValue !== null && typeof field.defaultValue === 'boolean'">
                      <label class="pw-wizard-toggle-inline">
                        <input
                          type="checkbox"
                          :checked="getVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, field.defaultValue)"
                          @change="setVal(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event.target.checked)"
                        />
                      </label>
                    </template>
                    <!-- Number default -->
                    <template v-else-if="field.defaultValue !== null && typeof field.defaultValue === 'number'">
                      <div class="k-input" data-type="number">
                        <span class="k-input-element">
                          <input
                            type="number"
                            class="k-text-input"
                            :placeholder="String(field.defaultValue)"
                            :value="getOverrideOnly(block.blockType, 'defaults.' + cat.key + '.' + field.key)"
                            @input="setValOrClear(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event.target.value !== '' ? Number($event.target.value) : '', String(field.defaultValue))"
                          />
                        </span>
                      </div>
                      <footer class="k-field-footer">
                        <div class="k-help k-field-help k-text">
                          Default: <strong>{{ field.defaultValue }}</strong>
                        </div>
                      </footer>
                    </template>
                    <!-- String default -->
                    <template v-else-if="field.defaultValue !== null && typeof field.defaultValue === 'string'">
                      <div class="k-input" data-type="text">
                        <span class="k-input-element">
                          <input
                            type="text"
                            class="k-text-input"
                            :placeholder="field.defaultValue"
                            :value="getOverrideOnly(block.blockType, 'defaults.' + cat.key + '.' + field.key)"
                            @input="setValOrClear(block.blockType, 'defaults.' + cat.key + '.' + field.key, $event.target.value, field.defaultValue)"
                          />
                        </span>
                      </div>
                      <footer class="k-field-footer">
                        <div class="k-help k-field-help k-text">
                          Default: <strong>{{ field.defaultValue }}</strong>
                        </div>
                      </footer>
                    </template>
                  </div>
                </div>
              </div>
            </fieldset>

            <!-- ===== Editor ===== -->
            <fieldset
              v-if="getDefault(block.blockType, 'editor') && Object.keys(getDefault(block.blockType, 'editor')).length"
              class="pw-wizard-fieldgroup"
            >
              <h3 class="pw-wizard-fieldgroup-title">Editor</h3>
              <div class="pw-wizard-category-fields">
                <div
                  v-for="(val, key) in getDefault(block.blockType, 'editor')"
                  :key="key"
                  class="k-field pw-wizard-k-field pw-wizard-k-field-row"
                  :class="{ 'is-overridden': hasOverride(block.blockType, 'editor.' + key) }"
                >
                  <header class="k-field-header">
                    <label class="k-label k-field-label">
                      <span class="k-label-text">{{ key }}</span>
                    </label>
                  </header>
                  <div class="pw-wizard-category-field-value">
                    <!-- Array (marks, nodes, headings) -->
                    <template v-if="Array.isArray(val)">
                      <div class="k-input" data-type="text">
                        <span class="k-input-element">
                          <input
                            type="text"
                            class="k-text-input"
                            :placeholder="val.join(', ')"
                            :value="getOverrideOnly(block.blockType, 'editor.' + key) !== undefined ? getOverrideOnly(block.blockType, 'editor.' + key).join(', ') : ''"
                            @input="setEditorArray(block.blockType, key, $event.target.value, val)"
                          />
                        </span>
                      </div>
                      <footer class="k-field-footer">
                        <div class="k-help k-field-help k-text">
                          Default: <strong>{{ val.join(', ') || '(none)' }}</strong>
                        </div>
                      </footer>
                    </template>
                    <!-- Object (toolbar) -->
                    <template v-else-if="isObject(val)">
                      <div class="pw-wizard-toggle-row">
                        <label
                          v-for="(subVal, subKey) in val"
                          :key="subKey"
                          class="pw-wizard-toggle"
                        >
                          <input
                            v-if="typeof subVal === 'boolean'"
                            type="checkbox"
                            :checked="getVal(block.blockType, 'editor.' + key + '.' + subKey, subVal)"
                            @change="setVal(block.blockType, 'editor.' + key + '.' + subKey, $event.target.checked)"
                          />
                          <span>{{ subKey }}</span>
                        </label>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </fieldset>

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
      globalDirty: false,
      blockConfigs: {},
      blockOverrides: {},
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

        for (const block of this.blocks) {
          const config = await this.$api.get('projectwizard/block/' + block.blockType);
          this.$set(this.blockConfigs, block.blockType, config);
          this.$set(this.blockOverrides, block.blockType, JSON.parse(JSON.stringify(config.overrides || {})));
        }

        this.loading = false;
      } catch (e) {
        console.error('Failed to load', e);
      }
    },

    blockLabel(blockType) {
      return blockType.replace(/^pw/, '').replace(/([A-Z])/g, ' $1').trim() || blockType;
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
            const options = Array.isArray(propOptions) ? propOptions : [];
            let pluginDefault = '';
            if (this.isObject(defaultVal)) {
              // Try exact key, then try without trailing 's' (sizes → size)
              pluginDefault = defaultVal[propKey] !== undefined
                ? defaultVal[propKey]
                : (defaultVal[propKey.replace(/s$/, '')] !== undefined ? defaultVal[propKey.replace(/s$/, '')] : '');
            }
            field.properties.push({ key: propKey, options, pluginDefault: String(pluginDefault) });
          }
        } else if (typeof settingVal === 'boolean') {
          field.enabled = settingVal;
        }

        fields.push(field);
      }

      return fields;
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
      this.globalDirty = true;
    },
    async saveGlobal() {
      try {
        await this.$api.post('projectwizard/blocks/active', { blocks: this.activeBlocks });
        this.globalDirty = false;
        this.$panel.notification.success('Active blocks saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save');
      }
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
      if (!this.blockOverrides[blockType]) this.$set(this.blockOverrides, blockType, {});
      this.setNested(this.blockOverrides[blockType], path, value);
      this.markDirty(blockType);
    },
    setValOrClear(blockType, path, value, placeholder) {
      if (value === '' || value === placeholder) {
        this.deleteNested(this.blockOverrides[blockType] || {}, path);
      } else {
        if (!this.blockOverrides[blockType]) this.$set(this.blockOverrides, blockType, {});
        this.setNested(this.blockOverrides[blockType], path, value);
      }
      this.markDirty(blockType);
    },
    setEditorArray(blockType, key, value, defaultVal) {
      const arr = value.split(',').map(s => s.trim()).filter(Boolean);
      if (arr.length === 0 || JSON.stringify(arr) === JSON.stringify(defaultVal)) {
        this.deleteNested(this.blockOverrides[blockType] || {}, 'editor.' + key);
      } else {
        this.setVal(blockType, 'editor.' + key, arr);
      }
    },
    markDirty(blockType) {
      const config = this.blockConfigs[blockType];
      if (config) config.hasOverrides = Object.keys(this.blockOverrides[blockType] || {}).length > 0;
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
        const block = this.blocks.find(b => b.blockType === blockType);
        if (block) block.customized = Object.keys(res.overrides || {}).length > 0;
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
  padding: var(--spacing-6);
}

.pw-wizard-loading {
  padding: var(--spacing-12);
  text-align: center;
  color: var(--color-text-dimmed);
}

/* Content */
.pw-wizard-content {
  margin-top: var(--spacing-6);
}

.pw-wizard-panel { min-width: 0; }
.pw-wizard-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-6);
}
.pw-wizard-panel-title { font-size: var(--text-lg); font-weight: 600; }
.pw-wizard-panel-meta { font-size: var(--text-xs); color: var(--color-text-dimmed); font-weight: 400; margin-left: var(--spacing-3); }
.pw-wizard-hint { font-size: var(--text-sm); color: var(--color-text-dimmed); margin-bottom: var(--spacing-4); }

/* Fieldgroups */
.pw-wizard-fieldgroup {
  border: 1px solid var(--color-border);
  border-radius: var(--rounded-lg);
  padding: var(--spacing-5);
  margin-bottom: var(--spacing-4);
}

.pw-wizard-fieldgroup-title {
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-dimmed);
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

/* Unified Content Fields */
.pw-wizard-unified-fields { display: flex; flex-direction: column; gap: var(--spacing-4); }
.pw-wizard-unified-field {
  background: var(--color-gray-50); border-radius: var(--rounded-lg); padding: var(--spacing-4);
}
.pw-wizard-unified-field-header { margin-bottom: var(--spacing-3); }
.pw-wizard-unified-field-name { font-weight: 600; font-size: var(--text-sm); text-transform: capitalize; }
.pw-wizard-unified-props {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-4);
  padding-left: var(--spacing-2);
}
.pw-wizard-unified-simple { padding-left: var(--spacing-2); }

/* Kirby-native field overrides */
.pw-wizard-k-field {
  padding: 0;
}

.pw-wizard-k-field .k-field-header { margin-bottom: var(--spacing-1); }
.pw-wizard-k-field .k-label-text { font-size: var(--text-xs); text-transform: capitalize; }
.pw-wizard-k-field .k-field-footer { margin-top: var(--spacing-1); }
.pw-wizard-k-field .k-field-help { font-size: 11px; }

.pw-wizard-k-field .k-select-input {
  width: 100%;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  background: var(--color-white);
  appearance: auto;
}

.pw-wizard-k-field .k-text-input {
  width: 100%;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  background: var(--color-white);
}

.pw-wizard-k-field .k-text-input:focus,
.pw-wizard-k-field .k-select-input:focus {
  outline: none;
  border-color: var(--color-focus);
  box-shadow: 0 0 0 2px var(--color-focus-outline);
}

.pw-wizard-k-field .k-text-input::placeholder {
  color: var(--color-text-dimmed);
  font-style: italic;
}

.pw-wizard-k-field.is-overridden {
  border-left: 2px solid var(--color-notice-600);
  padding-left: var(--spacing-2);
}

/* Category fields (row layout) */
.pw-wizard-k-field-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: var(--spacing-2);
  align-items: start;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-gray-50);
  border-radius: 0;
}

.pw-wizard-k-field-row:first-child { border-radius: var(--rounded) var(--rounded) 0 0; }
.pw-wizard-k-field-row:last-child { border-radius: 0 0 var(--rounded) var(--rounded); }

.pw-wizard-k-field-row .k-field-header { margin-bottom: 0; padding-top: var(--spacing-1); }
.pw-wizard-k-field-row .k-label-text { font-size: var(--text-sm); font-weight: 500; text-transform: none; }

.pw-wizard-category-field-value {
  display: flex;
  flex-direction: column;
}

.pw-wizard-category-fields {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* Toolbar */
.pw-wizard-toolbar { margin-top: var(--spacing-6); display: flex; justify-content: flex-end; }
.pw-wizard-block-sections { display: flex; flex-direction: column; }
</style>
