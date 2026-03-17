<template>
  <k-panel-inside class="pw-wizard-block-editor">
    <k-header>
      Block: {{ blockType }}
      <template #left>
        <k-button
          text="Back"
          icon="angle-left"
          size="sm"
          @click="$go('projectwizard')"
        />
      </template>
      <template #right>
        <k-button-group>
          <k-button
            text="Reset to defaults"
            theme="negative"
            variant="filled"
            size="sm"
            @click="resetBlock"
          />
          <k-button
            text="Save"
            theme="positive"
            variant="filled"
            size="sm"
            @click="saveBlock"
          />
        </k-button-group>
      </template>
    </k-header>

    <div v-if="loading" class="pw-wizard-loading">Loading...</div>

    <div v-else class="pw-wizard-editor-sections">

      <!-- Tabs -->
      <section class="pw-wizard-editor-section">
        <h2 class="pw-wizard-editor-section-title">Tabs</h2>
        <div class="pw-wizard-editor-toggles">
          <label
            v-for="(value, key) in merged.settings.tabs || {}"
            :key="key"
            class="pw-wizard-editor-toggle"
          >
            <input
              type="checkbox"
              :checked="getOverrideOrDefault('settings.tabs.' + key, value)"
              @change="setOverride('settings.tabs.' + key, $event.target.checked)"
            />
            <span>{{ key }}</span>
            <span v-if="isOverridden('settings.tabs.' + key)" class="pw-wizard-badge">override</span>
          </label>
        </div>
      </section>

      <!-- Fields per category -->
      <section
        v-for="category in fieldCategories"
        :key="category"
        class="pw-wizard-editor-section"
      >
        <h2 class="pw-wizard-editor-section-title">Fields: {{ category }}</h2>
        <div class="pw-wizard-editor-fields">
          <div
            v-for="(value, key) in getFieldCategory(category)"
            :key="key"
            class="pw-wizard-editor-field"
          >
            <div class="pw-wizard-editor-field-header">
              <strong>{{ key }}</strong>
              <span v-if="isOverridden('settings.fields.' + category + '.' + key)" class="pw-wizard-badge">override</span>
            </div>

            <!-- Boolean toggle -->
            <label v-if="typeof value === 'boolean'" class="pw-wizard-editor-toggle">
              <input
                type="checkbox"
                :checked="getOverrideOrDefault('settings.fields.' + category + '.' + key, value)"
                @change="setOverride('settings.fields.' + category + '.' + key, $event.target.checked)"
              />
              <span>{{ value ? 'Enabled' : 'Disabled' }}</span>
            </label>

            <!-- Object with sub-options (align, sizes, mode, etc.) -->
            <div v-else-if="typeof value === 'object' && !Array.isArray(value)" class="pw-wizard-editor-suboptions">
              <div v-for="(subVal, subKey) in value" :key="subKey" class="pw-wizard-editor-suboption">
                <span class="pw-wizard-editor-sublabel">{{ subKey }}:</span>
                <span class="pw-wizard-editor-subvalue">{{ formatValue(subVal) }}</span>
              </div>
            </div>

            <!-- Array (legacy) -->
            <div v-else-if="Array.isArray(value)">
              <span class="pw-wizard-editor-subvalue">{{ value.join(', ') }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Defaults per category -->
      <section
        v-for="category in defaultCategories"
        :key="'defaults-' + category"
        class="pw-wizard-editor-section"
      >
        <h2 class="pw-wizard-editor-section-title">Defaults: {{ category }}</h2>
        <div class="pw-wizard-editor-defaults">
          <div
            v-for="(value, key) in getDefaultCategory(category)"
            :key="key"
            class="pw-wizard-editor-default"
          >
            <label class="pw-wizard-editor-default-label">
              {{ key }}
              <span v-if="isOverridden('defaults.' + category + '.' + key)" class="pw-wizard-badge">override</span>
            </label>

            <!-- Boolean -->
            <input
              v-if="typeof value === 'boolean'"
              type="checkbox"
              :checked="getOverrideOrDefault('defaults.' + category + '.' + key, value)"
              @change="setOverride('defaults.' + category + '.' + key, $event.target.checked)"
            />

            <!-- Number -->
            <k-input
              v-else-if="typeof value === 'number'"
              type="number"
              :value="getOverrideOrDefault('defaults.' + category + '.' + key, value)"
              @input="setOverride('defaults.' + category + '.' + key, Number($event))"
            />

            <!-- Object (nested content defaults like heading: {align, level, size}) -->
            <div v-else-if="typeof value === 'object' && value !== null" class="pw-wizard-editor-nested-defaults">
              <div v-for="(subVal, subKey) in value" :key="subKey" class="pw-wizard-editor-nested-default">
                <span class="pw-wizard-editor-sublabel">{{ subKey }}:</span>
                <k-input
                  type="text"
                  :value="getOverrideOrDefault('defaults.' + category + '.' + key + '.' + subKey, subVal)"
                  @input="setOverride('defaults.' + category + '.' + key + '.' + subKey, $event)"
                />
              </div>
            </div>

            <!-- String -->
            <k-input
              v-else
              type="text"
              :value="getOverrideOrDefault('defaults.' + category + '.' + key, value)"
              @input="setOverride('defaults.' + category + '.' + key, $event)"
            />
          </div>
        </div>
      </section>

      <!-- Editor -->
      <section v-if="merged.editor && Object.keys(merged.editor).length" class="pw-wizard-editor-section">
        <h2 class="pw-wizard-editor-section-title">Editor</h2>

        <div v-for="(value, key) in merged.editor" :key="key" class="pw-wizard-editor-field">
          <div class="pw-wizard-editor-field-header">
            <strong>{{ key }}</strong>
            <span v-if="isOverridden('editor.' + key)" class="pw-wizard-badge">override</span>
          </div>

          <!-- Array (marks, nodes, headings) -->
          <div v-if="Array.isArray(value)">
            <k-input
              type="text"
              :value="value.join(', ')"
              @input="setOverride('editor.' + key, $event.split(',').map(s => s.trim()).filter(Boolean))"
            />
          </div>

          <!-- Object (toolbar) -->
          <div v-else-if="typeof value === 'object'" class="pw-wizard-editor-suboptions">
            <div v-for="(subVal, subKey) in value" :key="subKey" class="pw-wizard-editor-suboption">
              <label class="pw-wizard-editor-toggle">
                <input
                  v-if="typeof subVal === 'boolean'"
                  type="checkbox"
                  :checked="subVal"
                  @change="setOverride('editor.' + key + '.' + subKey, $event.target.checked)"
                />
                <span>{{ subKey }}</span>
              </label>
            </div>
          </div>
        </div>
      </section>

    </div>
  </k-panel-inside>
</template>

<script>
export default {
  props: {
    blockType: String,
  },
  data() {
    return {
      loading: true,
      defaults: { settings: {}, defaults: {}, editor: {} },
      overrides: {},
      merged: { settings: {}, defaults: {}, editor: {} },
      localOverrides: {},
    };
  },
  computed: {
    fieldCategories() {
      const fields = this.merged.settings?.fields || {};
      return Object.keys(fields);
    },
    defaultCategories() {
      return Object.keys(this.merged.defaults || {});
    },
  },
  async created() {
    await this.load();
  },
  methods: {
    async load() {
      try {
        const res = await this.$api.get('projectwizard/block/' + this.blockType);
        this.defaults = res.defaults || {};
        this.overrides = res.overrides || {};
        this.merged = res.merged || {};
        this.localOverrides = JSON.parse(JSON.stringify(this.overrides));
        this.loading = false;
      } catch (e) {
        console.error('Failed to load block config', e);
      }
    },
    getNestedValue(obj, path) {
      return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
    },
    setNestedValue(obj, path, value) {
      const keys = path.split('.');
      let current = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    },
    isOverridden(path) {
      return this.getNestedValue(this.localOverrides, path) !== undefined;
    },
    getOverrideOrDefault(path, defaultValue) {
      const override = this.getNestedValue(this.localOverrides, path);
      return override !== undefined ? override : defaultValue;
    },
    setOverride(path, value) {
      this.setNestedValue(this.localOverrides, path, value);
    },
    getFieldCategory(category) {
      return this.merged.settings?.fields?.[category] || {};
    },
    getDefaultCategory(category) {
      return this.merged.defaults?.[category] || {};
    },
    formatValue(val) {
      if (Array.isArray(val)) return val.join(', ');
      return String(val);
    },
    async saveBlock() {
      try {
        const res = await this.$api.post(
          'projectwizard/block/' + this.blockType,
          this.localOverrides
        );
        this.overrides = res.overrides || {};
        this.merged = res.merged || {};
        this.$panel.notification.success('Block configuration saved');
      } catch (e) {
        this.$panel.notification.error('Failed to save');
      }
    },
    async resetBlock() {
      try {
        const res = await this.$api.post(
          'projectwizard/block/' + this.blockType + '/reset'
        );
        this.overrides = {};
        this.merged = res.merged || {};
        this.localOverrides = {};
        this.$panel.notification.success('Block reset to defaults');
      } catch (e) {
        this.$panel.notification.error('Failed to reset');
      }
    },
  },
};
</script>

<style>
.pw-wizard-block-editor {
  padding: var(--spacing-6);
}

.pw-wizard-loading {
  padding: var(--spacing-12);
  text-align: center;
  color: var(--color-text-dimmed);
}

.pw-wizard-editor-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-10);
}

.pw-wizard-editor-section {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded-lg);
  padding: var(--spacing-6);
}

.pw-wizard-editor-section-title {
  font-size: var(--text-base);
  font-weight: 600;
  margin-bottom: var(--spacing-4);
  text-transform: capitalize;
}

.pw-wizard-editor-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.pw-wizard-editor-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--color-gray-100);
  border-radius: var(--rounded);
  font-size: var(--text-sm);
  cursor: pointer;
}

.pw-wizard-badge {
  font-size: var(--text-xs);
  color: var(--color-notice-600);
  background: var(--color-notice-100);
  padding: 0 var(--spacing-1);
  border-radius: var(--rounded-sm);
}

.pw-wizard-editor-fields,
.pw-wizard-editor-defaults {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.pw-wizard-editor-field,
.pw-wizard-editor-default {
  padding: var(--spacing-3);
  background: var(--color-gray-50);
  border-radius: var(--rounded);
}

.pw-wizard-editor-field-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.pw-wizard-editor-default-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  font-weight: 500;
  margin-bottom: var(--spacing-2);
}

.pw-wizard-editor-suboptions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.pw-wizard-editor-suboption {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--text-sm);
}

.pw-wizard-editor-sublabel {
  color: var(--color-text-dimmed);
  font-size: var(--text-xs);
}

.pw-wizard-editor-subvalue {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.pw-wizard-editor-nested-defaults {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding-left: var(--spacing-4);
}

.pw-wizard-editor-nested-default {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.pw-wizard-editor-nested-default .pw-wizard-editor-sublabel {
  min-width: 100px;
}
</style>
