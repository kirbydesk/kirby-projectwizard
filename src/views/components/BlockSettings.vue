<template>
  <div class="pw-wizard-block-sections">

    <!-- ===== Content + Categories (defaults) / Layout (layout) ===== -->
    <div v-if="view === 'defaults' || view === 'layout'" class="pw-wizard-tab-content">

      <!-- Content Fields (defaults view only) -->
      <section v-if="view === 'defaults'" class="pw-wizard-section">
      <div class="pw-section-header">
        <span class="pw-tab-visibility pw-tab-visibility-static">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M1.18164 12C2.12215 6.87976 6.60812 3 12.0003 3C17.3924 3 21.8784 6.87976 22.8189 12C21.8784 17.1202 17.3924 21 12.0003 21C6.60812 21 2.12215 17.1202 1.18164 12ZM12.0003 17C14.7617 17 17.0003 14.7614 17.0003 12C17.0003 9.23858 14.7617 7 12.0003 7C9.23884 7 7.00026 9.23858 7.00026 12C7.00026 14.7614 9.23884 17 12.0003 17ZM12.0003 15C10.3434 15 9.00026 13.6569 9.00026 12C9.00026 10.3431 10.3434 9 12.0003 9C13.6571 9 15.0003 10.3431 15.0003 12C15.0003 13.6569 13.6571 15 12.0003 15Z"/></svg>
        </span>
        <button class="pw-section-toggle" @click="toggleSection('content')">
          <span>{{ $t('pw.headline.content') }}</span>
          <k-icon :type="isSectionOpen('content') ? 'angle-down' : 'angle-right'" />
        </button>
      </div>
      <transition name="pw-slide">
      <div v-show="isSectionOpen('content')" class="pw-field-block" data-collapsible="true">

      <!-- Column blocks (first, controls which fields are visible) -->
      <div v-if="getColumnBlocks()" class="pw-field-block">
        <div class="k-field k-text-field pw-content-field" data-object="content-field">
          <div class="pw-field-rows">
            <pw-field-row
              :uid="blockType + '-column-blocks'"
              :label="$t('prw.headline.columnBlocks')"
              :all-options="getColumnBlocks()"
              :active-options="getActiveColumnBlocks()"
              current-default=""
              plugin-default=""
              :enabled="true"
              :modified="hasOverride('settings.fields.content.column-blocks')"
              :no-default="true"
              :no-checkbox="true"
              @update:options="setColumnBlocks($event, getColumnBlocks())"
            />
          </div>
        </div>
      </div>

      <!-- Content fields (filtered by active column-blocks if present) -->
      <div v-if="getContentFields().length" class="pw-field-block">
        <div
          v-for="field in getContentFields()"
          v-show="isColumnBlockField(field.key)"
          :key="field.key"
          class="k-field k-text-field pw-content-field"
          data-object="content-field"
        >
          <div v-if="!getColumnBlocks()" class="pw-column-field-label pw-clickable" @click="toggleField(field, !isFieldEnabled(field))">
            <span class="pw-tab-visibility">
              <k-icon :type="isFieldEnabled(field) ? 'preview' : 'hidden'" />
            </span>
            <span>{{ fieldLabel(field.key) }}</span>
          </div>
          <div v-else class="pw-column-field-label"><span>{{ fieldLabel(field.key) }}</span></div>

          <!-- Property rows -->
          <div v-show="!getColumnBlocks() ? isFieldEnabled(field) : true" v-if="field.properties.length" class="pw-field-rows">
            <pw-field-row
              v-for="prop in field.properties"
              :key="field.key + '-' + prop.key"
              :uid="blockType + '-' + field.key + '-' + prop.key"
              :label="prop.key"
              :all-options="prop.allOptions"
              :active-options="getActiveOptions(field.key, prop.key, prop)"
              :current-default="getVal('settings.fields.content.' + field.key + '.' + prop.key + '.default', prop.pluginDefault)"
              :plugin-default="prop.pluginDefault"
              :enabled="true"
              :required="prop.required === true"
              :modified="hasOverride('settings.fields.content.' + field.key + '.' + prop.key)"
              @update:options="setActiveOptions(field.key, prop.key, prop, $event)"
              @update:default="selectOption('settings.fields.content.' + field.key + '.' + prop.key + '.default', $event, prop.pluginDefault)"
            />
          </div>
        </div>
      </div>

      <!-- Editor config (content settings + editor.json merged) -->
      <div
        v-if="getEditorField() || getEditorConfigRows().length"
        class="k-field k-text-field pw-content-field"
        data-object="content-field"
      >
        <div class="pw-column-field-label pw-clickable" @click="toggleField(getEditorField() || { key: 'editor', enabled: true }, !isFieldEnabled(getEditorField() || { key: 'editor', enabled: true }))">
          <span class="pw-tab-visibility">
            <k-icon :type="isFieldEnabled(getEditorField() || { key: 'editor', enabled: true }) ? 'preview' : 'hidden'" />
          </span>
          <span>{{ fieldLabel('editor') }}</span>
        </div>

        <div v-show="isFieldEnabled(getEditorField() || { key: 'editor', enabled: true })" class="pw-field-rows">
          <!-- Editor content settings (mode, align, sizes) as FieldRows -->
          <template v-if="getEditorField()">
            <pw-field-row
              v-for="prop in getEditorField().properties"
              :key="'editor-content-' + prop.key"
              :uid="blockType + '-editor-' + prop.key"
              :label="prop.key"
              :all-options="prop.allOptions"
              :active-options="getActiveOptions('editor', prop.key, prop)"
              :current-default="getVal('settings.fields.content.editor.' + prop.key + '.default', prop.pluginDefault)"
              :plugin-default="prop.pluginDefault"
              :enabled="true"
              :modified="hasOverride('settings.fields.content.editor.' + prop.key)"
              @update:options="setEditorContentOptions(prop.key, prop, $event)"
              @update:default="selectOption('settings.fields.content.editor.' + prop.key + '.default', $event, prop.pluginDefault)"
            />
          </template>

          <!-- Editor config (marks, nodes, headings, toolbar) — only if writer mode available -->
          <template v-if="writerActive !== false" v-for="row in getEditorConfigRows()">
            <pw-field-row
              v-if="row.type === 'array'"
              :key="'editor-' + row.key"
              :uid="blockType + '-editor-' + row.key"
              :label="row.key"
              :all-options="row.values"
              :active-options="getOverrideOnly('editor.' + row.key) || row.values"
              current-default=""
              plugin-default=""
              :enabled="true"
              :modified="hasOverride('editor.' + row.key)"
              :no-default="true"
              @update:options="setEditorArrayDirect(row.key, $event, row.values)"
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
                      :value="getVal('editor.' + row.path, row.value)"
                      :text="[$t('pw.option.disabled'), $t('pw.option.enabled')]"
                      @input="setVal('editor.' + row.path, $event)"
                    />
                  </div>
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>
      </div>
      </transition>

      </section>

      <!-- ===== Categories (layout, style, effects, grid, settings) ===== -->
      <section
        v-for="cat in getCategories()"
        :key="cat.key"
        class="pw-wizard-section"
      >
        <div class="pw-section-header">
          <button
            type="button"
            class="pw-tab-visibility"
            @click.stop="toggleVisibility('settings.tabs.' + cat.key)"
          >
            <k-icon :type="getVal('settings.tabs.' + cat.key, true) === false ? 'hidden' : 'preview'" />
          </button>
          <button v-if="cat.fields.length" class="pw-section-toggle" @click="toggleSection(cat.key)">
            <span>{{ $t('pw.headline.' + cat.key) }}</span>
            <k-icon :type="isSectionOpen(cat.key) ? 'angle-down' : 'angle-right'" />
          </button>
          <span v-else class="pw-section-title">{{ $t('pw.headline.' + cat.key) }}</span>
        </div>
        <transition v-if="cat.fields.length" name="pw-slide">
        <div v-show="isSectionOpen(cat.key)" class="pw-field-block" data-collapsible="true">
          <template v-for="field in cat.fields">
            <!-- FieldRow (e.g. theme with options + click logic) -->
            <pw-field-row
              v-if="field.type === 'fieldrow'"
              :key="field.key"
              :uid="blockType + '-' + cat.key + '-' + field.key"
              :label="field.key"
              :all-options="field.allOptions"
              :active-options="getCategoryActiveOptions(cat.key, field.key, field)"
              :current-default="getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.pluginDefault)"
              :plugin-default="field.pluginDefault"
              :enabled="true"
              :modified="hasOverride('settings.fields.' + cat.key + '.' + field.key)"
              :no-checkbox="true"
              :required="field.required === true"
              @update:options="setCategoryOptions(cat.key, field.key, field, $event)"
              @update:default="selectOption('settings.fields.' + cat.key + '.' + field.key + '.default', $event, field.pluginDefault)"
            />
            <!-- Toggles field (e.g. padding-top with small/large) -->
            <div v-if="field.type === 'toggles'" :key="field.key" class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ categoryFieldLabel(field.key) }}<span v-if="field.required" class="pw-field-required">*</span></label>
                  </div>
                  <div class="pw-field-row-options">
                    <k-toggles-input
                      :value="getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue)"
                      :options="field.options"
                      :grow="false"
                      :reset="field.reset !== false"
                      :required="field.required === true"
                      @input="selectOption('settings.fields.' + cat.key + '.' + field.key + '.default', $event, field.defaultValue)"
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
                    <label class="pw-field-row-label">{{ categoryFieldLabel(field.key) }}</label>
                  </div>
                  <div class="pw-field-row-options pw-toggle-group">
                    <k-toggle-input
                      v-for="sub in field.subFields"
                      :key="sub.key"
                      :value="getVal('settings.fields.' + cat.key + '.' + sub.key + '.default', sub.defaultValue)"
                      :text="toggleOptionLabel(sub.label)"
                      @input="setVal('settings.fields.' + cat.key + '.' + sub.key + '.default', $event)"
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
                    <label class="pw-field-row-label">{{ categoryFieldLabel(field.key) }}</label>
                  </div>
                  <div class="pw-field-row-options">
                    <!-- Boolean: toggle -->
                    <k-toggle-input
                      v-if="field.defaultValue !== null && typeof field.defaultValue === 'boolean'"
                      :value="getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue)"
                      :text="[$t('pw.option.disabled'), $t('pw.option.enabled')]"
                      @input="setVal('settings.fields.' + cat.key + '.' + field.key + '.default', $event)"
                    />
                    <!-- String with options: select -->
                    <select
                      v-else-if="field.options && field.options.length"
                      class="pw-category-select"
                      :value="getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue)"
                      @change="selectOption('settings.fields.' + cat.key + '.' + field.key + '.default', $event.target.value, field.defaultValue)"
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
                      :value="getOverrideOnly('settings.fields.' + cat.key + '.' + field.key + '.default') || ''"
                      @input="setValOrClear('settings.fields.' + cat.key + '.' + field.key + '.default', $event.target.value, field.defaultValue)"
                    />
                    <!-- Number: number input -->
                    <input
                      v-else-if="field.defaultValue !== null && typeof field.defaultValue === 'number'"
                      type="text"
                      inputmode="decimal"
                      class="pw-category-input"
                      :placeholder="String(field.defaultValue)"
                      :value="getOverrideOnly('settings.fields.' + cat.key + '.' + field.key + '.default')"
                      @input="setValOrClear('settings.fields.' + cat.key + '.' + field.key + '.default', $event.target.value !== '' ? Number($event.target.value) : '', String(field.defaultValue))"
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

    <!-- ===== Items ===== -->
    <div v-if="view === 'items' || view === 'items-defaults'" class="pw-wizard-tab-content">

      <!-- Content sub-section (legacy — kept for backwards compat with custom plugins
           that still split items.content out, otherwise unused now that item-*
           fields are rendered alongside block-level fields in the Defaults tab) -->
      <section v-if="view === 'items' && getItemContentFields().length" class="pw-wizard-section">
        <div class="pw-section-header">
          <span class="pw-tab-visibility pw-tab-visibility-static">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M1.18164 12C2.12215 6.87976 6.60812 3 12.0003 3C17.3924 3 21.8784 6.87976 22.8189 12C21.8784 17.1202 17.3924 21 12.0003 21C6.60812 21 2.12215 17.1202 1.18164 12ZM12.0003 17C14.7617 17 17.0003 14.7614 17.0003 12C17.0003 9.23858 14.7617 7 12.0003 7C9.23884 7 7.00026 9.23858 7.00026 12C7.00026 14.7614 9.23884 17 12.0003 17ZM12.0003 15C10.3434 15 9.00026 13.6569 9.00026 12C9.00026 10.3431 10.3434 9 12.0003 9C13.6571 9 15.0003 10.3431 15.0003 12C15.0003 13.6569 13.6571 15 12.0003 15Z"/></svg>
          </span>
          <button class="pw-section-toggle" @click="toggleSection('items-content')">
            <span>{{ $t('pw.headline.content') }}</span>
            <k-icon :type="isSectionOpen('items-content') ? 'angle-down' : 'angle-right'" />
          </button>
        </div>
        <transition name="pw-slide">
          <div v-show="isSectionOpen('items-content')" class="pw-field-block" data-collapsible="true">
            <div v-if="getItemContentFields().length" class="pw-item-section">
              <div class="pw-field-block">
                <div
                  v-for="field in getItemContentFields()"
                  :key="field.key"
                  class="k-field k-text-field pw-content-field"
                  data-object="content-field"
                >
                  <div class="pw-column-field-label pw-clickable" @click="toggleField(field, !isFieldEnabled(field))">
                    <span class="pw-tab-visibility">
                      <k-icon :type="isFieldEnabled(field) ? 'preview' : 'hidden'" />
                    </span>
                    <span>{{ $t('prw.label.item') }}: {{ fieldLabel(field.displayKey) }}</span>
                  </div>

                  <div v-show="isFieldEnabled(field)" v-if="field.properties.length" class="pw-field-rows">
                    <pw-field-row
                      v-for="prop in field.properties"
                      :key="field.key + '-' + prop.key"
                      :uid="blockType + '-' + field.key + '-' + prop.key"
                      :label="prop.key"
                      :all-options="prop.allOptions"
                      :active-options="getActiveOptions(field.key, prop.key, prop)"
                      :current-default="getVal('settings.fields.content.' + field.key + '.' + prop.key + '.default', prop.pluginDefault)"
                      :plugin-default="prop.pluginDefault"
                      :enabled="true"
                      :required="prop.required === true"
                      :modified="hasOverride('settings.fields.content.' + field.key + '.' + prop.key)"
                      @update:options="setActiveOptions(field.key, prop.key, prop, $event)"
                      @update:default="selectOption('settings.fields.content.' + field.key + '.' + prop.key + '.default', $event, prop.pluginDefault)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </section>

      <!-- Layout sub-section (radius defaults for individual items) -->
      <section v-if="getItemLayoutFields().length" class="pw-wizard-section">
        <div class="pw-section-header">
          <span class="pw-tab-visibility pw-tab-visibility-static">
            <k-icon type="layout-top" />
          </span>
          <button class="pw-section-toggle" @click="toggleSection('items-layout')">
            <span>{{ $t('prw.tab.layout') || 'Layout' }}</span>
            <k-icon :type="isSectionOpen('items-layout') ? 'angle-down' : 'angle-right'" />
          </button>
        </div>
        <transition name="pw-slide">
          <div v-show="isSectionOpen('items-layout')" class="pw-field-block" data-collapsible="true">
            <div
              v-for="field in getItemLayoutFields()"
              :key="field.key"
              class="pw-field-row"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ fieldLabel(field.displayKey) }}</label>
                  </div>
                  <div class="pw-field-row-options">
                    <k-toggle-input
                      v-if="typeof field.defaultValue === 'boolean'"
                      :value="getVal('settings.fields.content.' + field.key + '.default', field.defaultValue)"
                      :text="[$t('pw.option.disabled'), $t('pw.option.enabled')]"
                      @input="setVal('settings.fields.content.' + field.key + '.default', $event)"
                    />
                    <input
                      v-else
                      type="text"
                      class="pw-category-input"
                      :placeholder="String(field.defaultValue)"
                      :value="getOverrideOnly('settings.fields.content.' + field.key + '.default') || ''"
                      @input="setValOrClear('settings.fields.content.' + field.key + '.default', $event.target.value, field.defaultValue)"
                    />
                  </div>
                </span>
              </div>
            </div>
          </div>
        </transition>
      </section>

      <!-- Defaults: rendered as the first sub-tab inside the Values section
           in Overview.vue. No outer section wrapper here — the sub-tab
           strip already provides the framing. -->
      <div v-if="view === 'items-defaults' && getItemRadiusFields().length" class="pw-field-block">
        <div
          v-for="field in getItemRadiusFields()"
          :key="field.key"
          class="pw-field-row"
        >
          <div class="k-input" data-type="text">
            <span class="k-input-element pw-field-row-inner">
              <div class="pw-field-row-label-col">
                <label class="pw-field-row-label">{{ fieldLabel(field.displayKey) }}</label>
              </div>
              <div class="pw-field-row-options">
                <k-toggles-input
                  v-if="field.type === 'select'"
                  :value="getVal('settings.fields.layout.' + field.key + '.default', field.defaultValue)"
                  :options="field.options.map(o => ({ value: o, text: $t('pw.option.' + o) || o }))"
                  :grow="false"
                  :required="true"
                  @input="setVal('settings.fields.layout.' + field.key + '.default', $event)"
                />
                <k-toggle-input
                  v-else
                  :value="getVal('settings.fields.layout.' + field.key + '.default', field.defaultValue)"
                  :text="[$t('pw.option.disabled'), $t('pw.option.enabled')]"
                  @input="setVal('settings.fields.layout.' + field.key + '.default', $event)"
                />
              </div>
            </span>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script>
export default {
  props: {
    block: {
      type: Object,
      required: true,
    },
    config: {
      type: Object,
      required: true,
    },
    overrides: {
      type: Object,
      default: () => ({}),
    },
    writerActive: {
      type: Boolean,
      default: true,
    },
    view: {
      type: String,
      default: 'defaults',
      validator: v => ['defaults', 'items', 'items-defaults', 'layout'].includes(v),
    },
  },
  data() {
    return {
      sectionState: {},
    };
  },
  computed: {
    blockType() {
      return this.block.blockType;
    },
  },
  methods: {
    // --- Content fields ---
    getContentFields() {
      const settings = this.getDefault('settings.fields.content') || {};
      const fields = [];

      for (const [key, settingVal] of Object.entries(settings)) {
        // Skip structural fields handled elsewhere or with no defaults to edit:
        //  - editor:        rendered in its own section (with marks/nodes/etc.)
        //  - column-blocks: handled by the column-blocks selector above
        //  - blocks:        the inner-blocks container — has no own defaults
        // item-* fields (item-tagline, item-heading, item-editor) ARE rendered here —
        // they are content defaults like the block-level ones, just for inner items.
        if (key === 'editor' || key === 'column-blocks' || key === 'blocks') continue;

        if (settingVal === 'enabled') {
          fields.push({ key, enabled: true, properties: [] });
          continue;
        }

        if (this.isObject(settingVal) && 'default' in settingVal && !this.hasNestedProps(settingVal)) {
          continue;
        }

        const field = { key, enabled: true, properties: [] };

        if (this.isObject(settingVal)) {
          for (const [propKey, propValue] of Object.entries(settingVal)) {
            if (propValue === false) continue;
            const propObj = this.isObject(propValue) ? propValue : {};
            const allOptions = propObj.options || (Array.isArray(propValue) ? propValue : []);
            if (allOptions.length === 0) continue;
            const pluginDefault = propObj.default !== undefined ? String(propObj.default) : '';
            if (allOptions.length > 1) {
              field.properties.push({
                key: propKey,
                allOptions,
                options: allOptions,
                pluginDefault,
                required: propObj.required === true,
              });
            }
          }
        }

        if (field.properties.length === 0 && settingVal !== 'enabled') continue;

        fields.push(field);
      }

      return fields;
    },

    isItemLayoutKey(key) {
      // Layout area inside the Items tab: master radius toggle + per-corner radius toggles.
      return key === 'item-radius' || key.startsWith('item-radius-');
    },
    getItemRadiusFields() {
      // Per-corner radius toggles + other item-level field defaults (link-style,
      // border, …) defined in fields.layout. Differentiates between booleans
      // (toggle), selects with options and the radius quad.
      const settings = this.getDefault('settings.fields.layout') || {};
      const fields = [];
      for (const [key, settingVal] of Object.entries(settings)) {
        if (!key.startsWith('item-')) continue;
        if (settingVal === false || settingVal === 'enabled') continue;

        const displayKey = key.replace(/^item-/, '');

        if (this.isObject(settingVal) && Array.isArray(settingVal.options)) {
          fields.push({
            key, displayKey,
            type: 'select',
            options: settingVal.options,
            defaultValue: settingVal.default !== undefined ? settingVal.default : settingVal.options[0],
          });
          continue;
        }

        let defaultValue = false;
        if (this.isObject(settingVal) && 'default' in settingVal) {
          defaultValue = settingVal.default;
        }
        fields.push({ key, displayKey, type: 'toggle', defaultValue });
      }
      return fields;
    },
    getItemContentFields() {
      // After v1.0.51 item-* content fields are rendered in the Defaults tab
      // (alongside block-level fields). This getter stays empty unless a plugin
      // intentionally exposes item-* keys NOT also handled by getContentFields,
      // for backwards compat.
      return [];
    },
    getItemLayoutFields() {
      // Layout fields are simple {default: bool|...} entries that getItemFieldsRaw()
      // filters out (no nested props). Iterate the raw content settings so we can
      // render them as standalone toggles / selects, similar to category fields.
      const settings = this.getDefault('settings.fields.content') || {};
      const fields = [];
      for (const [key, settingVal] of Object.entries(settings)) {
        if (!this.isItemLayoutKey(key)) continue;
        if (settingVal === false || settingVal === 'enabled') continue;

        const displayKey = key.replace(/^item-/, '');
        let defaultValue = false;
        if (this.isObject(settingVal) && 'default' in settingVal) {
          defaultValue = settingVal.default;
        } else if (typeof settingVal === 'boolean' || typeof settingVal === 'string' || typeof settingVal === 'number') {
          defaultValue = settingVal;
        }
        fields.push({ key, displayKey, defaultValue });
      }
      return fields;
    },
    getItemFields() {
      // Kept for backwards compatibility (e.g. Overview.vue's hasItemFields detection
      // historically counted any item-*). The template now uses the split helpers.
      return this.getItemFieldsRaw();
    },
    getItemFieldsRaw() {
      const settings = this.getDefault('settings.fields.content') || {};
      const fields = [];

      for (const [key, settingVal] of Object.entries(settings)) {
        if (!key.startsWith('item-')) continue;

        if (settingVal === 'enabled') continue;
        if (this.isObject(settingVal) && 'default' in settingVal && !this.hasNestedProps(settingVal)) continue;

        const displayKey = key.replace(/^item-/, '');
        const field = { key, displayKey, enabled: true, properties: [] };

        if (this.isObject(settingVal)) {
          for (const [propKey, propValue] of Object.entries(settingVal)) {
            if (propValue === false) continue;
            const propObj = this.isObject(propValue) ? propValue : {};
            const allOptions = propObj.options || (Array.isArray(propValue) ? propValue : []);
            if (allOptions.length === 0) continue;
            const pluginDefault = propObj.default !== undefined ? String(propObj.default) : '';
            if (allOptions.length > 1) {
              field.properties.push({
                key: propKey,
                allOptions,
                options: allOptions,
                pluginDefault,
                required: propObj.required === true,
              });
            }
          }
        }

        fields.push(field);
      }

      return fields;
    },

    getEditorField() {
      const settings = this.getDefault('settings.fields.content') || {};
      const settingVal = settings['editor'];
      if (!settingVal || !this.isObject(settingVal)) return null;

      const field = { key: 'editor', enabled: true, properties: [] };

      for (const [propKey, propValue] of Object.entries(settingVal)) {
        if (propValue === false) continue;
        const propObj = this.isObject(propValue) ? propValue : {};
        const allOptions = propObj.options || (Array.isArray(propValue) ? propValue : []);
        if (allOptions.length === 0) continue;
        const pluginDefault = propObj.default !== undefined ? String(propObj.default) : '';
        if (allOptions.length > 1) {
          field.properties.push({
            key: propKey,
            allOptions,
            options: allOptions,
            pluginDefault,
            required: propObj.required === true,
          });
        }
      }

      return field.properties.length ? field : null;
    },

    getEditorConfigRows() {
      const raw = this.getDefault('editor');
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

    // --- Column blocks ---
    getColumnBlocks() {
      const settings = this.getDefault('settings.fields.content') || {};
      const val = settings['column-blocks'];
      return Array.isArray(val) && val.length ? val : null;
    },

    getActiveColumnBlocks() {
      const override = this.getOverrideOnly('settings.fields.content.column-blocks');
      if (Array.isArray(override) && override.length) return override;
      return this.getColumnBlocks() || [];
    },

    isColumnBlockField(fieldKey) {
      const columnBlocks = this.getColumnBlocks();
      if (!columnBlocks) return true;
      const active = this.getActiveColumnBlocks();
      return active.some(cb => cb.replace('multicolumn', '') === fieldKey);
    },

    setColumnBlocks(values, allBlocks) {
      const ordered = allBlocks.filter(b => values.includes(b));
      if (JSON.stringify(ordered) === JSON.stringify(allBlocks)) {
        this.deleteNested(this.overrides || {}, 'settings.fields.content.column-blocks');
        this.cleanEmpty(this.overrides || {}, 'settings.fields.content');
        this.cleanEmpty(this.overrides || {}, 'settings.fields');
        this.cleanEmpty(this.overrides || {}, 'settings');
      } else {
        this.setVal('settings.fields.content.column-blocks', ordered);
      }
      this.markDirty();
    },

    // --- Editor options ---
    setEditorContentOptions(propKey, prop, values) {
      this.setActiveOptions('editor', propKey, prop, values);
      if (propKey === 'mode') {
        this.$emit('update:writer-active', values.includes('writer'));
      }
    },

    // --- Active options ---
    getActiveOptions(fieldKey, propKey, prop) {
      const fullOverride = this.getOverrideOnly('settings.fields.content.' + fieldKey + '.' + propKey);
      if (fullOverride === false) return [];
      const override = this.isObject(fullOverride) ? fullOverride.options : undefined;
      if (Array.isArray(override)) return override;
      return prop.allOptions;
    },

    setActiveOptions(fieldKey, propKey, prop, values) {
      const basePath = 'settings.fields.content.' + fieldKey + '.' + propKey;

      if (values === null) {
        this.setVal(basePath, false);
        this.markDirty();
        return;
      }

      const updated = Array.isArray(values) ? values : [];

      if (updated.length === 0) {
        this.deleteNested(this.overrides || {}, basePath);
        this.cleanEmpty(this.overrides || {}, 'settings.fields.content.' + fieldKey);
        this.cleanEmpty(this.overrides || {}, 'settings.fields.content');
        this.cleanEmpty(this.overrides || {}, 'settings.fields');
        this.cleanEmpty(this.overrides || {}, 'settings');
        this.markDirty();
        return;
      }

      const ordered = prop.allOptions.filter(o => updated.includes(o));

      if (JSON.stringify(ordered) === JSON.stringify(prop.allOptions)) {
        const currentDefault = this.getVal(basePath + '.default', prop.pluginDefault);
        if (currentDefault === prop.pluginDefault || currentDefault === String(prop.pluginDefault)) {
          this.deleteNested(this.overrides || {}, basePath);
          this.cleanEmpty(this.overrides || {}, 'settings.fields.content.' + fieldKey);
          this.cleanEmpty(this.overrides || {}, 'settings.fields.content');
          this.cleanEmpty(this.overrides || {}, 'settings.fields');
          this.cleanEmpty(this.overrides || {}, 'settings');
          this.markDirty();
          return;
        }
        this.deleteNested(this.overrides || {}, basePath + '.options');
        this.markDirty();
        return;
      }

      this.setVal(basePath + '.options', ordered);

      const currentDefault = this.getVal(basePath + '.default', prop.pluginDefault);
      if (currentDefault && !ordered.includes(currentDefault) && ordered.length) {
        this.setVal(basePath + '.default', ordered[0]);
      }

      this.markDirty();
    },

    // --- Categories ---
    getCategories() {
      const cats = [];
      for (const catKey of ['layout', 'style', 'effects', 'grid', 'settings']) {
        // In Layout view, only the layout category with item-* keys is shown.
        if (this.view === 'layout' && catKey !== 'layout') continue;

        const settingsFields = this.getDefault('settings.fields.' + catKey) || {};

        if (Object.keys(settingsFields).length === 0) continue;

        const fields = [];
        const grouped = {};

        for (const [key, val] of Object.entries(settingsFields)) {
          // Layout-tab filter: only item-* keys, but radius toggles move to the Items tab
          if (this.view === 'layout' && catKey === 'layout' && !key.startsWith('item-')) continue;
          if (this.view === 'layout' && catKey === 'layout' && (key === 'item-radius' || key.startsWith('item-radius-'))) continue;
          // Defaults-tab filter: hide item-* layout keys (they live on the Layout tab)
          if (this.view === 'defaults' && catKey === 'layout' && key.startsWith('item-')) continue;

          // Strip item- prefix for grouping (item-radius → radius, item-padding-top → padding-top)
          // so the existing radius/padding-* group rules below catch them.
          const lookupKey = this.view === 'layout' && key.startsWith('item-') ? key.slice(5) : key;

          if (lookupKey === 'padding' || lookupKey === 'radius') continue;
          if (val === 'enabled') continue;

          if (lookupKey.startsWith('radius-')) {
            if (!grouped['radius']) {
              grouped['radius'] = { key: 'radius', type: 'toggle-group', subFields: [] };
            }
            const subLabel = lookupKey.replace('radius-', '');
            const defaultValue = this.isObject(val) && 'default' in val ? val.default : false;
            grouped['radius'].subFields.push({ key, label: subLabel, defaultValue });
            continue;
          }

          if (lookupKey === 'padding-top' || lookupKey === 'padding-bottom') {
            const defaultValue = this.isObject(val) && 'default' in val ? val.default : 'large';
            fields.push({
              key,
              type: 'toggles',
              defaultValue,
              options: [
                { value: 'small', text: 'Small' },
                { value: 'large', text: 'Large' },
              ],
            });
            continue;
          }

          if (this.isObject(val) && 'options' in val) {
            const opts = val.options;
            const defaultValue = val.default !== undefined ? val.default : opts[0];
            const required = val.required === true;

            if (val.fixed) {
              fields.push({
                key,
                type: 'toggles',
                defaultValue,
                required,
                reset: !required,
                options: opts.map(v => ({ value: v, text: this.toggleOptionLabel(v) })),
              });
              continue;
            }

            if (opts.length > 5 || required) {
              fields.push({
                key,
                type: 'fieldrow',
                allOptions: opts,
                pluginDefault: String(defaultValue),
                defaultValue,
                required,
              });
            } else {
              fields.push({
                key,
                type: 'toggles',
                defaultValue,
                required,
                reset: !required,
                options: opts.map(v => ({ value: v, text: this.toggleOptionLabel(v) })),
              });
            }
            continue;
          }

          if (key.startsWith('grid-size-') && this.isObject(val) && 'default' in val) {
            const opts = Array.from({ length: 12 }, (_, i) => i + 1);
            fields.push({
              key,
              type: 'toggles',
              defaultValue: val.default,
              required: true,
              reset: false,
              options: opts.map(v => ({ value: v, text: String(v) })),
            });
            continue;
          }

          if (key.startsWith('grid-offset-') && this.isObject(val) && 'default' in val) {
            const opts = Array.from({ length: 12 }, (_, i) => i);
            fields.push({
              key,
              type: 'toggles',
              defaultValue: val.default,
              required: true,
              reset: false,
              options: opts.map(v => ({ value: v, text: String(v) })),
            });
            continue;
          }

          if (this.isObject(val) && 'default' in val) {
            fields.push({
              key,
              type: 'single',
              defaultValue: val.default,
            });
            continue;
          }

          if (Array.isArray(val) && val.length > 0) {
            fields.push({
              key,
              type: 'toggles',
              defaultValue: val[0],
              required: false,
              reset: true,
              options: val.map(v => ({ value: v, text: this.toggleOptionLabel(v) })),
            });
            continue;
          }
        }

        for (const group of Object.values(grouped)) {
          fields.push(group);
        }

        cats.push({ key: catKey, fields });
      }
      return cats;
    },

    getCategoryActiveOptions(catKey, fieldKey, field) {
      const override = this.getOverrideOnly('settings.fields.' + catKey + '.' + fieldKey + '.options');
      if (Array.isArray(override) && override.length > 0) return override;
      return field.allOptions;
    },

    setCategoryOptions(catKey, fieldKey, field, values) {
      const basePath = 'settings.fields.' + catKey + '.' + fieldKey;
      const ordered = Array.isArray(values) ? field.allOptions.filter(o => values.includes(o)) : [];

      if (ordered.length === 0) {
        this.deleteNested(this.overrides || {}, basePath);
        this.cleanEmpty(this.overrides || {}, 'settings.fields.' + catKey);
        this.cleanEmpty(this.overrides || {}, 'settings.fields');
        this.cleanEmpty(this.overrides || {}, 'settings');
        this.markDirty();
        return;
      }

      if (JSON.stringify(ordered) === JSON.stringify(field.allOptions)) {
        const currentDefault = this.getVal(basePath + '.default', field.pluginDefault);
        if (currentDefault === field.pluginDefault || currentDefault === String(field.pluginDefault)) {
          this.deleteNested(this.overrides || {}, basePath);
          this.cleanEmpty(this.overrides || {}, 'settings.fields.' + catKey);
          this.cleanEmpty(this.overrides || {}, 'settings.fields');
          this.cleanEmpty(this.overrides || {}, 'settings');
          this.markDirty();
          return;
        }
        this.deleteNested(this.overrides || {}, basePath + '.options');
        this.markDirty();
        return;
      }

      this.setVal(basePath + '.options', ordered);

      const currentDefault = this.getVal(basePath + '.default', field.pluginDefault);
      if (!ordered.includes(currentDefault) && ordered.length) {
        this.setVal(basePath + '.default', ordered[0]);
      }
      this.markDirty();
    },

    // --- Field enabled/toggle ---
    isFieldEnabled(field) {
      const disabled = this.getOverrideOnly('settings.fields.content.' + field.key + '._disabled');
      if (disabled === true) return false;
      const override = this.getOverrideOnly('settings.fields.content.' + field.key);
      if (override === false) return false;
      if (override === true || this.isObject(override)) return true;
      return field.enabled !== false;
    },

    toggleField(field, enabled) {
      if (!this.overrides || Array.isArray(this.overrides)) {
        this.$emit('update:overrides', {});
      }
      const path = 'settings.fields.content.' + field.key;
      if (enabled) {
        this.deleteNested(this.overrides, path + '._disabled');
        this.cleanEmpty(this.overrides, path);
        this.cleanEmpty(this.overrides, 'settings.fields.content');
        this.cleanEmpty(this.overrides, 'settings.fields');
        this.cleanEmpty(this.overrides, 'settings');
      } else {
        this.setVal(path + '._disabled', true);
      }
      this.markDirty();
    },

    toggleVisibility(path) {
      const current = this.getVal(path, 'enabled');
      if (current === false) {
        this.deleteNested(this.overrides || {}, path);
        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
          this.cleanEmpty(this.overrides || {}, parts.slice(0, i).join('.'));
        }
      } else {
        this.setVal(path, false);
      }
      this.markDirty();
    },

    toggleSection(sectionKey) {
      const key = this.blockType + '-' + sectionKey;
      this.$set(this.sectionState, key, !this.isSectionOpen(sectionKey));
    },

    isSectionOpen(sectionKey) {
      const key = this.blockType + '-' + sectionKey;
      return this.sectionState[key] !== false;
    },

    selectOption(path, value, pluginDefault) {
      if (value === pluginDefault || value === String(pluginDefault)) {
        this.deleteNested(this.overrides || {}, path);
        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
          this.cleanEmpty(this.overrides || {}, parts.slice(0, i).join('.'));
        }
      } else {
        this.setVal(path, value);
      }
      this.markDirty();
    },

    setEditorArrayDirect(key, values, defaultVal) {
      if (JSON.stringify(values) === JSON.stringify(defaultVal)) {
        this.deleteNested(this.overrides || {}, 'editor.' + key);
        this.cleanEmpty(this.overrides || {}, 'editor');
      } else {
        this.setVal('editor.' + key, values);
      }
      this.markDirty();
    },

    // --- Value getters/setters ---
    getVal(path, defaultVal) {
      const ov = this.nested(this.overrides || {}, path);
      return ov !== undefined ? ov : defaultVal;
    },

    getOverrideOnly(path) {
      return this.nested(this.overrides || {}, path);
    },

    hasOverride(path) {
      return this.nested(this.overrides || {}, path) !== undefined;
    },

    setVal(path, value) {
      if (!this.overrides || Array.isArray(this.overrides)) {
        this.$emit('update:overrides', {});
      }
      this.setNested(this.overrides, path, value);
      this.markDirty();
    },

    setValOrClear(path, value, placeholder) {
      if (!this.overrides || Array.isArray(this.overrides)) {
        this.$emit('update:overrides', {});
      }
      if (value === '' || value === placeholder) {
        this.deleteNested(this.overrides, path);
      } else {
        this.setNested(this.overrides, path, value);
      }
      this.markDirty();
    },

    getDefault(path) {
      if (!this.config) return null;
      return this.nested(this.config.defaults, path);
    },

    markDirty() {
      this.$emit('update:overrides', this.overrides);
    },

    // --- Label helpers ---
    fieldLabel(key) {
      const tKey = 'pw.field.' + key;
      const translated = this.$t(tKey);
      return (translated && translated !== tKey) ? translated : key.charAt(0).toUpperCase() + key.slice(1);
    },

    categoryFieldLabel(key) {
      const prwKey = 'prw.field.' + key;
      const prwT = this.$t(prwKey);
      if (prwT && prwT !== prwKey) return prwT;
      const pwLabelKey = 'pw.field.' + key + '.label';
      const pwLabelT = this.$t(pwLabelKey);
      if (pwLabelT && pwLabelT !== pwLabelKey) return pwLabelT;
      const pwKey = 'pw.field.' + key;
      const pwT = this.$t(pwKey);
      if (pwT && pwT !== pwKey) return pwT;
      const lastDash = key.lastIndexOf('-');
      if (lastDash > 0) {
        const dotKey = 'pw.field.' + key.substring(0, lastDash) + '.' + key.substring(lastDash + 1);
        const dotT = this.$t(dotKey);
        if (dotT && dotT !== dotKey) return dotT;
        const headlineKey = 'pw.headline.' + key.substring(0, lastDash) + '.' + key.substring(lastDash + 1);
        const headlineT = this.$t(headlineKey);
        if (headlineT && headlineT !== headlineKey) return headlineT;
      }
      return key;
    },

    toggleOptionLabel(val) {
      const pwKey = 'pw.option.' + val;
      const pwT = this.$t(pwKey);
      if (pwT && pwT !== pwKey) return pwT;
      return val;
    },

    // --- Nested object helpers ---
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

    isObject(val) {
      return val && typeof val === 'object' && !Array.isArray(val);
    },

    hasNestedProps(obj) {
      for (const v of Object.values(obj)) {
        if (this.isObject(v) && ('options' in v || 'default' in v)) return true;
      }
      return false;
    },
  },
};
</script>

<style>
.pw-field-required {
  color: var(--color-red-600, #dc2626);
  margin-left: 2px;
}

.pw-section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-3);
}

.pw-section-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
}

.pw-tab-visibility {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-1);
  color: var(--color-text-dimmed);
  border-radius: var(--rounded);
}

.pw-tab-visibility .k-icon {
  width: 16px;
  height: 16px;
}

.pw-tab-visibility-static {
  cursor: default;
}

.pw-tab-visibility-static svg {
  width: 16px;
  height: 16px;
}

.pw-section-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
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

.pw-wizard-section {
  margin-bottom: 0;
}

.pw-field-block {
  display: flex;
  flex-direction: column;
}

.pw-field-block[data-collapsible] {
  margin-bottom: var(--spacing-10);
}

[data-object="content-field"] {
  margin-bottom: var(--spacing-2);
}

[data-object="content-field"] .pw-field-rows .pw-field-row:last-child {
  margin-bottom: var(--spacing-3);
}

.pw-field-rows {
  display: flex;
  flex-direction: column;
}

[data-object="content-field"] {
  .pw-field-rows {
    .pw-field-row div.k-input {
      /***background-color: var(--color-gray-150);***/
    }
  }
}

.pw-clickable {
  cursor: pointer;
}

.pw-column-field-label {
  font-size: var(--text-sm);
  font-weight: 600;
  padding: var(--spacing-2) var(--spacing-3) var(--spacing-2) 0;
  display: inline-flex;
  align-items: center;
  gap: 0;
}

.pw-field-enable-check {
  accent-color: var(--color-black);
  cursor: pointer;
}

.pw-content-field .k-label-text {
  text-transform: capitalize;
}

.pw-field-row-options .k-choice-input.k-toggle-input {
  padding-left: var(--spacing-2);
}

.pw-field-row-options .k-toggles-input ul {
  display: flex !important;
  grid-template-columns: none !important;
  gap: 2px;
  border-radius: 5px;
  overflow: hidden;
  background: none !important;
}

.pw-field-row-options .k-toggles-input li {
  width: auto !important;
}

.pw-field-row-options .k-toggles-input label {
  border-radius: 5px;
  padding: 0 var(--spacing-2);
  height: 22px;
  min-height: 0;
}

.pw-field-row-options .k-toggles-input input:checked + label {
  background: var(--color-blue-600) !important;
  color: var(--color-white) !important;
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

.pw-item-headline {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-dimmed);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: var(--spacing-4);
  margin-bottom: var(--spacing-3);
}

.pw-wizard-block-sections {
  display: flex;
  flex-direction: column;
}
</style>
