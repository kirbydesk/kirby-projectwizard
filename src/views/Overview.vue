<template>
  <k-panel-inside class="pw-wizard">
    <k-header>
      Project Wizard
    </k-header>

    <div v-if="loading" class="pw-wizard-loading">Loading...</div>

    <div v-else class="pw-wizard-layout">

      <!-- Tab Navigation -->
      <nav class="pw-wizard-tabs">
        <button
          class="pw-wizard-tab"
          :class="{ 'is-active': activeTab === 'global' }"
          @click="activeTab = 'global'"
        >
          Global
        </button>
        <button
          v-for="block in blocks"
          :key="block.blockType"
          class="pw-wizard-tab"
          :class="{
            'is-active': activeTab === block.blockType,
            'is-customized': block.customized,
            'is-inactive': !block.active
          }"
          @click="activeTab = block.blockType"
        >
          {{ blockLabel(block.blockType) }}
        </button>
      </nav>

      <!-- Tab Content -->
      <div class="pw-wizard-content">

        <!-- Global Tab -->
        <div v-if="activeTab === 'global'" class="pw-wizard-panel">
          <h2 class="pw-wizard-panel-title">Global Settings</h2>

          <div class="pw-wizard-fieldgroup">
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
          </div>

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

        <!-- Block Tabs -->
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

            <!-- Tabs (feature toggles) -->
            <fieldset class="pw-wizard-fieldgroup">
              <h3 class="pw-wizard-fieldgroup-title">Tabs</h3>
              <div class="pw-wizard-toggle-row">
                <label
                  v-for="(val, key) in blockConfigs[block.blockType].defaults.settings.tabs || {}"
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

            <!-- Fields: Content -->
            <fieldset
              v-if="getDefault(block.blockType, 'settings.fields.content')"
              class="pw-wizard-fieldgroup"
            >
              <h3 class="pw-wizard-fieldgroup-title">Fields: Content</h3>
              <div class="pw-wizard-fields-list">
                <div
                  v-for="(val, key) in getDefault(block.blockType, 'settings.fields.content')"
                  :key="key"
                  class="pw-wizard-field-item"
                  :class="{ 'is-overridden': hasOverride(block.blockType, 'settings.fields.content.' + key) }"
                >
                  <div class="pw-wizard-field-label">{{ key }}</div>
                  <!-- Object with sub-options -->
                  <div v-if="isObject(val)" class="pw-wizard-field-options">
                    <div v-for="(subVal, subKey) in val" :key="subKey" class="pw-wizard-field-option">
                      <span class="pw-wizard-field-option-label">{{ subKey }}</span>
                      <span class="pw-wizard-field-option-value">{{ formatArray(subVal) }}</span>
                    </div>
                  </div>
                  <!-- Boolean -->
                  <label v-else-if="typeof val === 'boolean'" class="pw-wizard-toggle-inline">
                    <input
                      type="checkbox"
                      :checked="getVal(block.blockType, 'settings.fields.content.' + key, val)"
                      @change="setVal(block.blockType, 'settings.fields.content.' + key, $event.target.checked)"
                    />
                  </label>
                </div>
              </div>
            </fieldset>

            <!-- Fields: Other categories -->
            <fieldset
              v-for="cat in ['layout', 'style', 'effects', 'settings']"
              :key="'fields-' + cat"
              v-if="getDefault(block.blockType, 'settings.fields.' + cat)"
              class="pw-wizard-fieldgroup"
            >
              <h3 class="pw-wizard-fieldgroup-title">Fields: {{ cat }}</h3>
              <div class="pw-wizard-toggle-row">
                <label
                  v-for="(val, key) in getDefault(block.blockType, 'settings.fields.' + cat)"
                  :key="key"
                  class="pw-wizard-toggle"
                  :class="{ 'is-overridden': hasOverride(block.blockType, 'settings.fields.' + cat + '.' + key) }"
                >
                  <input
                    type="checkbox"
                    :checked="getVal(block.blockType, 'settings.fields.' + cat + '.' + key, val === true || (typeof val === 'string' || Array.isArray(val)) )"
                    @change="setVal(block.blockType, 'settings.fields.' + cat + '.' + key, $event.target.checked)"
                  />
                  <span>{{ key }}</span>
                </label>
              </div>
            </fieldset>

            <!-- Defaults: Content -->
            <fieldset
              v-if="getDefault(block.blockType, 'defaults.content')"
              class="pw-wizard-fieldgroup"
            >
              <h3 class="pw-wizard-fieldgroup-title">Defaults: Content</h3>
              <div class="pw-wizard-defaults-grid">
                <template v-for="(val, key) in getDefault(block.blockType, 'defaults.content')">
                  <!-- Nested object like heading: {align, level, size} -->
                  <template v-if="isObject(val)">
                    <div
                      v-for="(subVal, subKey) in val"
                      :key="key + '.' + subKey"
                      class="pw-wizard-default-field"
                      :class="{ 'is-overridden': hasOverride(block.blockType, 'defaults.content.' + key + '.' + subKey) }"
                    >
                      <label class="pw-wizard-default-label">{{ key }} &rsaquo; {{ subKey }}</label>
                      <input
                        type="text"
                        class="pw-wizard-input"
                        :placeholder="String(subVal)"
                        :value="getOverrideOnly(block.blockType, 'defaults.content.' + key + '.' + subKey)"
                        @input="setValOrClear(block.blockType, 'defaults.content.' + key + '.' + subKey, $event.target.value, String(subVal))"
                      />
                    </div>
                  </template>
                  <!-- Simple value -->
                  <div
                    v-else
                    :key="key"
                    class="pw-wizard-default-field"
                    :class="{ 'is-overridden': hasOverride(block.blockType, 'defaults.content.' + key) }"
                  >
                    <label class="pw-wizard-default-label">{{ key }}</label>
                    <input
                      type="text"
                      class="pw-wizard-input"
                      :placeholder="String(val)"
                      :value="getOverrideOnly(block.blockType, 'defaults.content.' + key)"
                      @input="setValOrClear(block.blockType, 'defaults.content.' + key, $event.target.value, String(val))"
                    />
                  </div>
                </template>
              </div>
            </fieldset>

            <!-- Defaults: Other categories -->
            <fieldset
              v-for="cat in ['layout', 'style', 'grid', 'settings', 'effects']"
              :key="'defaults-' + cat"
              v-if="getDefault(block.blockType, 'defaults.' + cat)"
              class="pw-wizard-fieldgroup"
            >
              <h3 class="pw-wizard-fieldgroup-title">Defaults: {{ cat }}</h3>
              <div class="pw-wizard-defaults-grid">
                <div
                  v-for="(val, key) in getDefault(block.blockType, 'defaults.' + cat)"
                  :key="key"
                  class="pw-wizard-default-field"
                  :class="{ 'is-overridden': hasOverride(block.blockType, 'defaults.' + cat + '.' + key) }"
                >
                  <label class="pw-wizard-default-label">{{ key }}</label>
                  <!-- Boolean -->
                  <div v-if="typeof val === 'boolean'" class="pw-wizard-default-check">
                    <input
                      type="checkbox"
                      :checked="getVal(block.blockType, 'defaults.' + cat + '.' + key, val)"
                      @change="setVal(block.blockType, 'defaults.' + cat + '.' + key, $event.target.checked)"
                    />
                  </div>
                  <!-- Number -->
                  <input
                    v-else-if="typeof val === 'number'"
                    type="number"
                    class="pw-wizard-input"
                    :placeholder="String(val)"
                    :value="getOverrideOnly(block.blockType, 'defaults.' + cat + '.' + key)"
                    @input="setValOrClear(block.blockType, 'defaults.' + cat + '.' + key, $event.target.value !== '' ? Number($event.target.value) : '', String(val))"
                  />
                  <!-- String -->
                  <input
                    v-else
                    type="text"
                    class="pw-wizard-input"
                    :placeholder="String(val)"
                    :value="getOverrideOnly(block.blockType, 'defaults.' + cat + '.' + key)"
                    @input="setValOrClear(block.blockType, 'defaults.' + cat + '.' + key, $event.target.value, String(val))"
                  />
                </div>
              </div>
            </fieldset>

            <!-- Editor -->
            <fieldset
              v-if="blockConfigs[block.blockType].defaults.editor && Object.keys(blockConfigs[block.blockType].defaults.editor).length"
              class="pw-wizard-fieldgroup"
            >
              <h3 class="pw-wizard-fieldgroup-title">Editor</h3>
              <div class="pw-wizard-defaults-grid">
                <div
                  v-for="(val, key) in blockConfigs[block.blockType].defaults.editor"
                  :key="key"
                  class="pw-wizard-default-field"
                  :class="{ 'is-overridden': hasOverride(block.blockType, 'editor.' + key) }"
                >
                  <label class="pw-wizard-default-label">{{ key }}</label>
                  <!-- Array -->
                  <input
                    v-if="Array.isArray(val)"
                    type="text"
                    class="pw-wizard-input"
                    :placeholder="val.join(', ')"
                    :value="getOverrideOnly(block.blockType, 'editor.' + key) !== undefined ? getOverrideOnly(block.blockType, 'editor.' + key).join(', ') : ''"
                    @input="setEditorArray(block.blockType, key, $event.target.value, val)"
                  />
                  <!-- Object (toolbar) -->
                  <div v-else-if="isObject(val)" class="pw-wizard-toggle-row">
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
                </div>
              </div>
            </fieldset>

          </div>
        </div>

      </div>
    </div>
  </k-panel-inside>
</template>

<script>
export default {
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
  async created() {
    await this.load();
  },
  methods: {
    async load() {
      try {
        const res = await this.$api.get('projectwizard/blocks');
        this.blocks = res.blocks || [];
        this.activeBlocks = res.activeBlocks || [];

        // Load config for each block
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

    // --- Block overrides ---
    nested(obj, path) {
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
    formatArray(val) {
      return Array.isArray(val) ? val.join(', ') : String(val);
    },

    async saveBlock(blockType) {
      try {
        const res = await this.$api.post(
          'projectwizard/block/' + blockType,
          this.blockOverrides[blockType] || {}
        );
        this.$set(this.blockConfigs, blockType, res);
        this.$set(this.blockOverrides, blockType, JSON.parse(JSON.stringify(res.overrides || {})));
        // Update customized state
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

/* Layout: sidebar tabs + content */
.pw-wizard-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--spacing-6);
  margin-top: var(--spacing-6);
}

/* Tab navigation (vertical sidebar) */
.pw-wizard-tabs {
  display: flex;
  flex-direction: column;
  gap: 1px;
  position: sticky;
  top: var(--spacing-6);
  align-self: start;
}

.pw-wizard-tab {
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  background: var(--color-background);
  text-align: left;
  font-size: var(--text-sm);
  cursor: pointer;
  border-radius: var(--rounded);
  transition: background 0.1s;
  color: var(--color-text);
  position: relative;
}

.pw-wizard-tab:hover {
  background: var(--color-gray-100);
}

.pw-wizard-tab.is-active {
  background: var(--color-black);
  color: var(--color-white);
  font-weight: 500;
}

.pw-wizard-tab.is-inactive {
  opacity: 0.4;
}

.pw-wizard-tab.is-customized::after {
  content: '';
  position: absolute;
  top: 50%;
  right: var(--spacing-2);
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-notice-600);
}

/* Content panel */
.pw-wizard-panel {
  min-width: 0;
}

.pw-wizard-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-6);
}

.pw-wizard-panel-title {
  font-size: var(--text-lg);
  font-weight: 600;
}

.pw-wizard-panel-meta {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  font-weight: 400;
  margin-left: var(--spacing-3);
}

.pw-wizard-hint {
  font-size: var(--text-sm);
  color: var(--color-text-dimmed);
  margin-bottom: var(--spacing-4);
}

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

/* Toggle rows (tabs, boolean fields) */
.pw-wizard-toggle-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.pw-wizard-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--color-gray-100);
  border-radius: var(--rounded);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background 0.1s;
}

.pw-wizard-toggle:hover {
  background: var(--color-gray-200);
}

.pw-wizard-toggle.is-overridden {
  background: var(--color-notice-100);
}

/* Checklist (active blocks) */
.pw-wizard-checklist {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.pw-wizard-check {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--rounded);
  cursor: pointer;
}

.pw-wizard-check:hover {
  background: var(--color-gray-100);
}

.pw-wizard-check-label {
  font-size: var(--text-sm);
  font-weight: 500;
}

.pw-wizard-check-meta {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  margin-left: auto;
}

/* Fields list (content fields with sub-options) */
.pw-wizard-fields-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.pw-wizard-field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-gray-50);
  border-radius: var(--rounded);
  border-left: 3px solid transparent;
}

.pw-wizard-field-item.is-overridden {
  border-left-color: var(--color-notice-600);
}

.pw-wizard-field-label {
  font-size: var(--text-sm);
  font-weight: 500;
  min-width: 100px;
}

.pw-wizard-field-options {
  display: flex;
  gap: var(--spacing-4);
  flex-wrap: wrap;
}

.pw-wizard-field-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.pw-wizard-field-option-label {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
}

.pw-wizard-field-option-value {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-text);
}

/* Defaults grid */
.pw-wizard-defaults-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-3);
}

.pw-wizard-default-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-gray-50);
  border-radius: var(--rounded);
  border-left: 3px solid transparent;
}

.pw-wizard-default-field.is-overridden {
  border-left-color: var(--color-notice-600);
}

.pw-wizard-default-label {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  font-weight: 500;
}

.pw-wizard-default-check {
  padding: var(--spacing-1) 0;
}

.pw-wizard-input {
  width: 100%;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  background: var(--color-white);
}

.pw-wizard-input:focus {
  outline: none;
  border-color: var(--color-focus);
  box-shadow: 0 0 0 2px var(--color-focus-outline);
}

.pw-wizard-input::placeholder {
  color: var(--color-text-dimmed);
  font-style: italic;
}

/* Toolbar */
.pw-wizard-toolbar {
  margin-top: var(--spacing-6);
  display: flex;
  justify-content: flex-end;
}

.pw-wizard-block-sections {
  display: flex;
  flex-direction: column;
}

.pw-wizard-toggle-inline {
  cursor: pointer;
}
</style>
