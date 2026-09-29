<template>
  <div v-if="hasRows()" class="pw-wizard-block-sections">

    <!-- ===== Content + Categories: "defaults" holds the plain default rows,
         "presets" the rows with allowed options + a preset (pills) ===== -->
    <div v-if="view === 'defaults' || view === 'presets' || view === 'layout'" class="pw-wizard-tab-content">

      <!-- a drawer header as in the block's drawer with its tabs; a tab shows
           its cards (tabs without rows in this view are disabled) -->
      <header v-if="view === 'defaults'" class="k-drawer-header pw-drawer-strip">
        <k-drawer-tabs :tab="currentDrawerTab" :tabs="drawerTabs" @open="drawerTab = $event" />
      </header>

      <!-- ===== Content, start values: a row per field with the same
           dropdowns as in the drawer (the block's fields, then its items') ===== -->
      <template v-if="view === 'defaults' && currentDrawerTab === 'content'">
        <section
          v-for="group in contentToolbarGroups()"
          :key="'ct-' + group.key"
          class="pw-card-section"
        >
          <div v-if="group.heading" class="pw-card-heading-row">
            <h3 class="pw-card-heading">{{ group.heading }}</h3>
          </div>
          <div class="pw-card pw-field-table">
            <div v-for="row in group.rows" :key="row.key" class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ fieldLabel(row.key) }}</label>
                  </div>
                  <div class="pw-field-row-options">
                    <pw-field-toolbar :items="row.items" @input="setContentPreset(row, $event)" />
                  </div>
                </span>
              </div>
            </div>
          </div>
          <!-- a help text below the card -->
          <k-text v-if="group.help" size="tiny" class="k-help pw-card-help" :html="group.help" />
        </section>

        <!-- a field's further settings (not dropdowns in the drawer, e.g.
             the media's type, size and corners) as a card of their own -->
        <section
          v-for="field in contentExtraFields()"
          :key="'cx-' + field.key"
          class="pw-card-section"
        >
          <div class="pw-card-heading-row">
            <h3 class="pw-card-heading">{{ fieldLabel(field.key) }}</h3>
          </div>
          <div class="pw-card pw-field-table">
            <!-- the field's type first (the media type) -->
            <pw-field-row
              v-for="prop in field.lead"
              :key="field.key + '-' + prop.key"
              :uid="blockType + '-' + field.key + '-' + prop.key"
              :label="prop.key"
              :plugin="block.plugin || ''"
              :all-options="prop.allOptions"
              :active-options="prop.allOptions"
              :current-default="getVal('settings.fields.content.' + field.key + '.' + prop.key + '.default', prop.pluginDefault)"
              :plugin-default="prop.pluginDefault"
              :modified="hasOverride('settings.fields.content.' + field.key + '.' + prop.key)"
              @update:default="selectOption('settings.fields.content.' + field.key + '.' + prop.key + '.default', $event, prop.pluginDefault)"
            />
            <!-- its dropdowns as in the drawer (the media's alignment) -->
            <div v-for="item in field.toolbar.items" :key="field.key + '-tb-' + item.key" class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ $t('prw.property.' + item.prop.key) }}</label>
                  </div>
                  <div class="pw-field-row-options">
                    <pw-field-toolbar :items="[item]" @input="setContentPreset(field.toolbar, $event)" />
                  </div>
                </span>
              </div>
            </div>
            <pw-field-row
              v-for="prop in field.extras"
              :key="field.key + '-' + prop.key"
              :uid="blockType + '-' + field.key + '-' + prop.key"
              :label="prop.key"
              :plugin="block.plugin || ''"
              :all-options="prop.allOptions"
              :active-options="prop.allOptions"
              :current-default="getVal('settings.fields.content.' + field.key + '.' + prop.key + '.default', prop.pluginDefault)"
              :plugin-default="prop.pluginDefault"
              :modified="hasOverride('settings.fields.content.' + field.key + '.' + prop.key)"
              @update:default="selectOption('settings.fields.content.' + field.key + '.' + prop.key + '.default', $event, prop.pluginDefault)"
            />
            <!-- custom corners: the four switches (as in the drawer) -->
            <div v-if="field.corners && getVal('settings.fields.content.' + field.key + '.radius.default', 'none') === 'custom'" class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ categoryFieldLabel('radius') }}</label>
                  </div>
                  <div class="pw-field-row-options pw-toggle-group pw-corner-grid">
                    <span v-for="corner in ['top-left', 'top-right', 'bottom-left', 'bottom-right']" :key="corner" class="pw-corner-cell">
                      <k-toggle-input
                        :value="getVal('settings.fields.content.' + field.key + '.radius-' + corner + '.default', false)"
                        :text="toggleOptionLabel(corner)"
                        @input="setVal('settings.fields.content.' + field.key + '.radius-' + corner + '.default', $event)"
                      />
                      <!-- the radius set for this corner (fainter while it is off) -->
                      <span
                        class="pw-field-hint"
                        :class="{ 'is-zero': !getVal('settings.fields.content.' + field.key + '.radius-' + corner + '.default', false) }"
                      >{{ cornerHint(corner, true, mediaRadius) }}</span>
                    </span>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ===== Restrictions: the fields of the chosen drawer tab, each with
           an eye – hidden from the editors, the field keeps its start value ===== -->
      <template v-if="view === 'presets'">
        <section
          v-for="group in allRestrictionGroups()"
          :key="'rg-' + group.key"
          class="pw-card-section"
        >
          <!-- the drawer tab as the card's heading (the items' fields: "Items") -->
          <div class="pw-card-heading-row">
            <h3 class="pw-card-heading">{{ group.heading }}</h3>
          </div>
          <!-- table rows: the field on the left, a switch on the right (on:
               the editors see it) -->
          <div class="pw-card pw-field-table">
            <div v-for="row in group.rows" :key="row.id" class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ row.label }}</label>
                    <!-- hidden: the crossed-out eye on the right of the label cell -->
                    <k-icon v-if="isHidden(row.keys)" type="hidden" class="pw-field-state-eye" />
                  </div>
                  <div class="pw-field-row-options">
                    <k-toggle-input
                      :value="!isHidden(row.keys)"
                      :text="$t(isHidden(row.keys) ? 'prw.field.hidden' : 'prw.field.visible')"
                      @input="toggleHidden(row.keys)"
                    />
                  </div>
                </span>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ===== Categories (layout, style, effects, grid, settings): a card
           with the rows of this view, its heading right above ===== -->
      <template v-for="cat in getCategories()">
        <!-- the drawer tab the rows sit in (Layout, Style, Grid, Settings) -->
        <section
          v-for="sec in (view === 'layout' || cat.key === currentDrawerTab ? catSections(cat) : [])"
          :key="'card-' + cat.key + '-' + sec.key"
          class="pw-card-section"
        >
        <div v-if="sec.heading || bpKeyOf(cat, sec)" class="pw-card-heading-row">
          <h3 class="pw-card-heading">{{ sec.heading || drawerLabel(cat.key) }}</h3>
          <!-- values per screen size (grid, columns, logos per row): the size
               shown in the card -->
          <span v-if="bpKeyOf(cat, sec)" class="pw-pill pw-theme-switch" role="group">
            <button
              v-for="b in ['sm', 'md', 'lg', 'xl']"
              :key="'gbp-' + b"
              type="button"
              class="pw-tool"
              :aria-pressed="secBp(bpKeyOf(cat, sec)) === b ? 'true' : 'false'"
              @click="$set(sectionBp, bpKeyOf(cat, sec), b)"
            >{{ b.toUpperCase() }}</button>
          </span>
        </div>
        <div class="pw-card pw-field-table">
          <!-- grid start values of the chosen screen size: full width or adjusted
               (then its width and offset); not stored itself, it follows the values -->
          <div v-if="isGridDefaults(cat)" class="pw-field-row">
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label">{{ $t('prw.label.gridLayout') }}</label>
                </div>
                <div class="pw-field-row-options">
                  <k-toggles-input
                    :value="gridAdjusted(sec.fields, secBp('grid')) ? 'custom' : 'full'"
                    :options="[{ value: 'full', text: $t('prw.option.gridFull') }, { value: 'custom', text: $t('prw.option.gridCustom') }]"
                    :grow="false"
                    :required="true"
                    @input="setGridMode(sec.fields, secBp('grid'), $event)"
                  />
                </div>
              </span>
            </div>
          </div>
          <template v-for="field in (isGridDefaults(cat) ? (gridAdjusted(sec.fields, secBp('grid')) ? sec.fields.filter(f => f.key.endsWith('-' + secBp('grid'))) : [])
            : (bpKeyOf(cat, sec) ? sec.fields.filter(f => f.key.endsWith('-' + secBp(bpKeyOf(cat, sec)))) : sec.fields))">
            <!-- FieldRow (e.g. theme with options + click logic) -->
            <pw-field-row
              v-if="field.type === 'fieldrow'"
              :key="field.key"
              :uid="blockType + '-' + cat.key + '-' + field.key"
              :label="field.key"
              :all-options="fieldOptions(field)"
              :active-options="cat.key === 'grid' ? fieldOptions(field) : getCategoryActiveOptions(cat.key, field.key, field).filter(o => fieldOptions(field).includes(o))"
              :current-default="getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.pluginDefault)"
              :plugin-default="field.pluginDefault"
              :enabled="true"
              :modified="hasOverride('settings.fields.' + cat.key + '.' + field.key)"
              :required="field.required === true"
              :plugin="block.plugin || ''"
              @update:options="setCategoryOptions(cat.key, field.key, field, $event)"
              @update:default="selectOption('settings.fields.' + cat.key + '.' + field.key + '.default', $event, field.pluginDefault)"
            />
            <!-- Toggles field (e.g. padding-top with small/large) -->
            <div v-if="field.type === 'toggles'" :key="field.key" class="pw-field-row" :data-guide="guideType(field.key, getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue))">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ isGridDefaults(cat) ? gridFieldLabel(field.key) : (bpKeyOf(cat, sec) ? bpRowLabel(bpKeyOf(cat, sec), sec) : categoryFieldLabel(field.key)) }}<span v-if="field.required" class="pw-field-required">*</span></label>
                    <!-- guides on: hovering the question mark tints the value's area in the preview -->
                    <k-icon
                      v-if="guideType(field.key, getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue))"
                      type="question"
                      class="pw-area-hint"
                      @mouseenter.native="$emit('hover-var', field.key)"
                      @mouseleave.native="$emit('hover-var', null)"
                    />
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
                    <span
                      v-if="globalHint(field.key, getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue))"
                      class="pw-field-hint"
                      :class="{ 'is-zero': globalHint(field.key, getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue)) === '0rem' }"
                    >{{ globalHint(field.key, getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue)) }}</span>
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
                    <!-- guides on: hovering the question mark tints the value's area in the preview -->
                    <k-icon
                      v-if="guideType(field.key, getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue))"
                      type="question"
                      class="pw-area-hint"
                      @mouseenter.native="$emit('hover-var', field.key)"
                      @mouseleave.native="$emit('hover-var', null)"
                    />
                  </div>
                  <div class="pw-field-row-options pw-toggle-group" :class="{ 'pw-corner-grid': isCornerGroup(field) }">
                    <span v-for="sub in cornerOrder(field.subFields)" :key="sub.key" class="pw-corner-cell">
                      <k-toggle-input
                        :value="getVal('settings.fields.' + (field.catKey || cat.key) + '.' + sub.key + '.default', sub.defaultValue)"
                        :text="toggleOptionLabel(sub.label)"
                        @input="setVal('settings.fields.' + (field.catKey || cat.key) + '.' + sub.key + '.default', $event)"
                      />
                      <span
                        v-if="isCornerGroup(field)"
                        class="pw-field-hint"
                        :class="{ 'is-zero': !getVal('settings.fields.' + (field.catKey || cat.key) + '.' + sub.key + '.default', sub.defaultValue) }"
                      >{{ cornerHint(sub.label, true, globalValues['global-']) }}</span>
                    </span>
                  </div>
                </span>
              </div>
            </div>
            <!-- Single field -->
            <div v-else-if="field.type === 'single'" :key="field.key" class="pw-field-row" :data-guide="guideType(field.key, getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue))">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ categoryFieldLabel(field.key) }}</label>
                    <!-- guides on: hovering the question mark tints the value's area in the preview -->
                    <k-icon
                      v-if="guideType(field.key, getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue))"
                      type="question"
                      class="pw-area-hint"
                      @mouseenter.native="$emit('hover-var', field.key)"
                      @mouseleave.native="$emit('hover-var', null)"
                    />
                  </div>
                  <div class="pw-field-row-options">
                    <!-- Boolean: toggle -->
                    <k-toggle-input
                      v-if="field.defaultValue !== null && typeof field.defaultValue === 'boolean'"
                      :value="getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue)"
                      :text="[$t('pw.option.disabled'), $t('pw.option.enabled')]"
                      @input="setVal('settings.fields.' + cat.key + '.' + field.key + '.default', $event)"
                    />
                    <span
                      v-if="field.defaultValue !== null && typeof field.defaultValue === 'boolean' && globalHint(field.key, true)"
                      class="pw-field-hint"
                      :class="{ 'is-zero': !getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue) }"
                    >{{ globalHint(field.key, getVal('settings.fields.' + cat.key + '.' + field.key + '.default', field.defaultValue)) }}</span>
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
        <!-- a help text below the card (e.g. the hero's content position) -->
        <k-text v-if="cardHelp(cat, sec)" size="tiny" class="k-help pw-card-help" :html="cardHelp(cat, sec)" />
        </section>
      </template>

    </div>

    <!-- ===== Items ===== -->
    <div v-if="view === 'items-defaults' || view === 'items-layout'" class="pw-wizard-tab-content">

      <!-- Defaults: rendered inside the Defaults section in Overview.vue.
           Holds the radius corner toggle group. -->
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
              <div
                class="pw-field-row-options"
                :class="{ 'pw-toggle-group': field.type === 'toggle-group', 'pw-corner-grid': isCornerGroup(field) }"
              >
                <span v-for="sub in cornerOrder(field.subFields)" :key="sub.key" class="pw-corner-cell">
                  <k-toggle-input
                    :value="getVal('settings.fields.layout.' + sub.key + '.default', sub.defaultValue)"
                    :text="toggleOptionLabel(sub.label)"
                    @input="setVal('settings.fields.layout.' + sub.key + '.default', $event)"
                  />
                  <span
                    v-if="isCornerGroup(field)"
                    class="pw-field-hint"
                    :class="{ 'is-zero': !getVal('settings.fields.layout.' + sub.key + '.default', sub.defaultValue) }"
                  >{{ cornerHint(sub.label, true, itemRadius) }}</span>
                </span>
              </div>
            </span>
          </div>
        </div>
      </div>

      <!-- Layout settings: rendered inside the Layout section in Overview.vue,
           above the BlockValues editor. Holds link-style, border, … -->
      <div v-if="view === 'items-layout' && getItemLayoutSettings().length" class="pw-field-block">
        <div
          v-for="field in getItemLayoutSettings()"
          :key="field.key"
          class="pw-field-row"
        >
          <div class="k-input" data-type="text">
            <span class="k-input-element pw-field-row-inner">
              <div class="pw-field-row-label-col">
                <label class="pw-field-row-label">{{ field.label ? $t(field.label) : fieldLabel(field.displayKey) }}</label>
              </div>
              <div class="pw-field-row-options">
                <!-- Icon-select: SVG buttons -->
                <div v-if="field.type === 'icon-select'" class="pw-icon-select">
                  <button
                    v-for="opt in field.options"
                    :key="opt.value"
                    type="button"
                    class="pw-icon-option"
                    :class="{ 'is-active': (getVal('settings.fields.layout.' + field.key + '.default', field.defaultValue)) === opt.value }"
                    @click="setVal('settings.fields.layout.' + field.key + '.default', opt.value)"
                    v-html="'<svg viewBox=&quot;0 0 24 24&quot; aria-hidden=&quot;true&quot;>' + opt.svg + '</svg>'"
                  ></button>
                </div>
                <!-- Select with options -->
                <k-toggles-input
                  v-else-if="field.type === 'select'"
                  :value="getVal('settings.fields.layout.' + field.key + '.default', field.defaultValue)"
                  :options="field.options.map(o => ({ value: o, text: itemOptionLabel(field, o) }))"
                  :grow="false"
                  :required="true"
                  @input="setVal('settings.fields.layout.' + field.key + '.default', $event)"
                />
                <!-- Plain boolean toggle -->
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
    // the project's variants switched on (variant, variant2 …); null: all
    variants: {
      type: Array,
      default: null,
    },
    config: {
      type: Object,
      required: true,
    },
    overrides: {
      type: Object,
      default: () => ({}),
    },
    // global layout values (margins, paddings) shown next to the switches
    // that use them
    globalValues: {
      type: Object,
      default: () => ({}),
    },
    // the items' corner radii (top-left, top-right, bottom-left, bottom-right)
    // shown next to the item radius switches
    itemRadius: {
      type: Array,
      default: () => [],
    },
    // the media's corner radii (Elements › Media › Form), shown next to the
    // media's corner switches
    mediaRadius: {
      type: Array,
      default: () => [],
    },
    // preview guides on: the rows they belong to get a stripe in their colour
    guides: {
      type: Boolean,
      default: false,
    },
    writerActive: {
      type: Boolean,
      default: true,
    },
    view: {
      type: String,
      default: 'defaults',
      validator: v => ['defaults', 'items', 'items-defaults', 'items-layout', 'layout'].includes(v),
    },
    layoutKeys: {
      type: Array,
      default: null,
    },
  },
  data() {
    return {
      // chosen tab of the drawer header (null: the first with rows)
      drawerTab: null,
      // grid start values switched to "adjusted" per screen size (still full width values)
      gridCustom: {},
      // the screen size shown per card with values per size (grid, columns …)
      sectionBp: {},
    };
  },
  computed: {
    // the block's drawer tabs, as in the block's drawer (content always);
    // tabs without rows in this view are disabled
    drawerTabs() {
      const tabs = this.getDefault('settings.tabs') || {};
      return ['content', 'layout', 'style', 'effects', 'grid', 'settings']
        .filter(key => key === 'content' || (tabs[key] !== undefined && tabs[key] !== false))
        .map(key => ({ name: key, label: this.drawerLabel(key), disabled: !this.drawerTabHasRows(key) }));
    },
    // the chosen drawer tab, else the first one with rows
    currentDrawerTab() {
      const usable = this.drawerTabs.filter(t => !t.disabled).map(t => t.name);
      return usable.includes(this.drawerTab) ? this.drawerTab : (usable[0] || 'content');
    },
    // blocks are square: all four global corner radii are 0
    blocksSquare() {
      const radii = (this.globalValues || {})['global-'];
      return Array.isArray(radii) && radii.length > 0 && radii.every(r => parseFloat(r) === 0);
    },
    blockType() {
      return this.block.blockType;
    },
  },
  methods: {
    // --- Content fields ---
    getContentFields() {
      return this.collectContentFields({ items: false });
    },
    getItemDefaultsContentFields() {
      // item-* content fields (item-tagline, item-heading, item-editor) — rendered
      // in the Defaults tab AFTER the editor section so block-level fields and the
      // editor come before per-item field defaults.
      return this.collectContentFields({ items: true });
    },
    collectContentFields({ items }) {
      const settings = this.getDefault('settings.fields.content') || {};
      const fields = [];

      for (const [key, settingVal] of Object.entries(settings)) {
        // Skip structural fields handled elsewhere or with no defaults to edit:
        //  - editor:        rendered in its own section (with marks/nodes/etc.)
        //  - column-blocks: the multicolumn's list of column blocks (all allowed)
        //  - blocks:        the inner-blocks container — has no own defaults
        if (key === 'editor' || key === 'column-blocks' || key === 'blocks') continue;
        // Split block-level vs item-* into two passes
        const isItemKey = key.startsWith('item-');
        if (items && !isItemKey) continue;
        if (!items && isItemKey) continue;

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

    getItemRadiusFields() {
      // Per-corner radius toggles get grouped into one row (toggle-group with
      // four sub-toggles). Mirrors how block-level radius is rendered in
      // the Defaults tab's layout category.
      const settings = this.getDefault('settings.fields.layout') || {};
      const fields = [];
      let radiusGroup = null;

      for (const [key, settingVal] of Object.entries(settings)) {
        if (!key.startsWith('item-radius-')) continue;
        if (settingVal === false || settingVal === 'enabled') continue;

        if (!radiusGroup) {
          radiusGroup = { key: 'item-radius', displayKey: 'radius', type: 'toggle-group', subFields: [] };
          fields.push(radiusGroup);
        }
        const defaultValue = this.isObject(settingVal) && 'default' in settingVal ? settingVal.default : false;
        radiusGroup.subFields.push({
          key,
          label: key.replace(/^item-radius-/, ''),
          defaultValue,
        });
      }
      return fields;
    },
    getItemLayoutSettings() {
      // Item-level layout-tab field defaults that are NOT radius corners
      // (link-style, border, …). Rendered in the Items > Layout section.
      // When `layoutKeys` is set, only those keys are returned (lets the
      // parent interleave individual settings with value editors).
      const settings = this.getDefault('settings.fields.layout') || {};
      const fields = [];
      const filter = Array.isArray(this.layoutKeys) ? this.layoutKeys : null;

      for (const [key, settingVal] of Object.entries(settings)) {
        if (!key.startsWith('item-')) continue;
        if (key === 'item-radius' || key.startsWith('item-radius-')) continue;
        if (settingVal === false || settingVal === 'enabled') continue;
        if (filter && !filter.includes(key)) continue;

        const displayKey = key.replace(/^item-/, '');

        // Icon select: options are [{value, svg}, ...] — rendered as SVG buttons
        if (this.isObject(settingVal) && settingVal.type === 'icon-select' && Array.isArray(settingVal.options)) {
          fields.push({
            key, displayKey,
            type: 'icon-select',
            options: settingVal.options,
            defaultValue: settingVal.default !== undefined ? settingVal.default : (settingVal.options[0] && settingVal.options[0].value),
          });
          continue;
        }

        if (this.isObject(settingVal) && Array.isArray(settingVal.options)) {
          fields.push({
            key, displayKey,
            // Optional own label key (block-specific wording, e.g. featurelist's tile shape)
            label: settingVal.label || null,
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

    // Editor field for the visibility eye (a stand-in when the block has
    // only editor.json rows)
    // items-defaults / items-layout sit in a shared card: without rows of
    // their own they render nothing
    hasRows() {
      if (this.view === 'items-defaults') return this.getItemRadiusFields().length > 0;
      if (this.view === 'items-layout') return this.getItemLayoutSettings().length > 0;
      return true;
    },

    // content fields with preset rows (presets view only)
    // (start values: which option a new block starts with; restrictions:
    // which options are allowed)
    presetFields(fields) {
      return this.view === 'presets' || this.view === 'defaults' ? fields.filter(f => f.properties.length) : [];
    },

    // the editor card sits in the presets: mode/align/size, then (writer)
    // formatting and lists
    hasEditorCard() {
      if (this.view === 'defaults') return !!(this.getEditorField() && this.getEditorField().properties.length);
      if (this.view !== 'presets') return false;
      return !!(this.getEditorField() && this.getEditorField().properties.length)
        || (this.writerActive !== false && this.getEditorConfigRows().length > 0);
    },

    // category rows of this view: pills + preset and the whole grid (sizes
    // and offsets, allowed on every block) in "presets", the rest in "defaults"
    viewFields(cat) {
      if (this.view === 'layout') return cat.fields;
      // restrictions: the option rows (not the grid, it is never limited);
      // start values: everything (option rows as the choice a new block
      // starts with, the grid with all its values)
      // (restrictions have no category rows: only whole fields are switched off)
      let fields = this.view === 'presets' ? [] : cat.fields;
      // steplist starting as "connected": always one column, no column rows
      if (this.view === 'defaults' && cat.key === 'layout' && this.blockType === 'pwsteplist'
        && this.getVal('settings.fields.style.item-style.default', 'default') === 'connected') {
        fields = fields.filter(f => !f.key.startsWith('columns-'));
      }
      // logocloud in the "flexible" format: no logos per row
      if (this.view === 'defaults' && cat.key === 'layout' && this.blockType === 'pwlogocloud'
        && this.getVal('settings.fields.layout.item-format.default', 'square') === 'flexible') {
        fields = fields.filter(f => !f.key.startsWith('logos-'));
      }
      return fields;
    },

    // the cards of a category, as the drawer tab groups them: layout has
    // paddings and corners (the corners only while the blocks are round);
    // a card's heading is left out when it just repeats the drawer tab
    catSections(cat) {
      const fields = this.viewFields(cat);
      // layout as in the drawer: paddings, radii, then the block's own fields
      // (the hero's content position, the columns …) under their drawer headline
      if (this.view === 'defaults' && cat.key === 'layout') {
        const radius = fields.find(f => f.key === 'radius');
        const paddings = fields.filter(f => f.key.startsWith('padding'));
        const others = fields.filter(f => f !== radius && !paddings.includes(f));
        const sections = [];
        if (paddings.length) sections.push({ key: 'paddings', heading: this.$t('prw.headline.spacing'), help: this.$t('prw.hint.blockPaddings'), fields: paddings });
        if (radius && !this.blocksSquare) sections.push({ key: 'radius', heading: this.$t('prw.prop.border-radius'), help: this.$t('prw.hint.blockRadius'), fields: [radius] });
        const headings = { 'position-': 'pw.headline.contentposition', 'columns-': 'pw.headline.columns', 'logos-': 'prw.headline.logos' };
        for (const f of others) {
          const prefix = Object.keys(headings).find(p => f.key.startsWith(p));
          const key = prefix || f.key;
          const section = sections.find(sec => sec.key === key);
          if (section) section.fields.push(f);
          else sections.push({ key, heading: prefix ? this.$t(headings[prefix]) : null, help: prefix === 'position-' ? this.$t('prw.hint.contentPosition') : null, fields: [f] });
        }
        return sections;
      }
      if (!fields.length) return [];
      // start values of the style: a card per choice (variant, the block's
      // own display …), named after it
      // (the variant with a help text below its card)
      const styleHelp = (key) => (this.view === 'defaults' && key === 'theme' ? this.$t('prw.hint.themeDefault') : null);
      // one card "Style" with all its rows (the variant, the hero's
      // background and height …), the variant's help text below
      if (this.view === 'defaults' && cat.key === 'style') {
        return [{ key: 'style', heading: this.drawerLabel('style'), help: fields.some(f => f.key === 'theme') ? styleHelp('theme') : null, fields }];
      }
      const heading = this.categoryHeading(cat.key);
      const repeats = this.view !== 'layout' && heading === this.drawerLabel(cat.key);
      return [{ key: 'main', heading: repeats ? null : heading, fields }];
    },

    // the help text below a card; the grid's follows its switch (full width
    // or adjusted, for the chosen screen size)
    cardHelp(cat, sec) {
      if (this.isGridDefaults(cat)) {
        return this.$t(this.gridAdjusted(sec.fields, this.secBp('grid')) ? 'prw.hint.gridCustom' : 'prw.hint.gridFull');
      }
      if (this.view === 'defaults' && cat.key === 'settings') return this.$t('prw.hint.settingsDefault');
      if (this.bpKeyOf(cat, sec) === 'logos-') return this.$t('prw.hint.logosPerRow');
      return sec.help;
    },
    // a grid row's label without its screen size (chosen above the card)
    gridFieldLabel(key) {
      return this.$t(key.startsWith('grid-size-') ? 'prw.label.gridWidth' : 'prw.label.gridOffset');
    },
    // cards with a value per screen size (sm … xl): the grid, the columns,
    // the logos per row – one size at a time, chosen above the card
    bpKeyOf(cat, sec) {
      if (this.isGridDefaults(cat)) return 'grid';
      if (this.view === 'defaults' && cat.key === 'layout' && ['columns-', 'logos-'].includes(sec.key)) return sec.key;
      return null;
    },
    secBp(key) {
      return this.sectionBp[key] || 'lg';
    },
    // the row's label in such a card (the logos: "Logos per row" under "Logos")
    bpRowLabel(key, sec) {
      if (key === 'logos-') return this.$t('kirbyblock-logocloud.per-row');
      return sec.heading;
    },
    // the grid's start values (Startwerte › Raster)
    isGridDefaults(cat) {
      return this.view === 'defaults' && cat.key === 'grid';
    },
    // a screen size adjusted: switched so, or its width / offset other than
    // full width
    gridAdjusted(fields, bp) {
      if (this.gridCustom[bp]) return true;
      return fields.filter(f => f.key.endsWith('-' + bp)).some(f => {
        const val = Number(this.getVal('settings.fields.grid.' + f.key + '.default', f.defaultValue));
        return f.key.startsWith('grid-size-') ? val !== 12 : val !== 0;
      });
    },
    // full width: its width 12, its offset 0
    setGridMode(fields, bp, mode) {
      this.$set(this.gridCustom, bp, mode === 'custom');
      if (mode !== 'full') return;
      for (const f of fields.filter(fl => fl.key.endsWith('-' + bp))) {
        this.selectOption('settings.fields.grid.' + f.key + '.default', f.key.startsWith('grid-size-') ? 12 : 0, f.defaultValue);
      }
    },

    // name of a drawer tab (as in the block's drawer)
    drawerLabel(key) {
      return this.$t('pw.tab.' + key);
    },

    // options of an option row; the variant only with the project's variants,
    // and "custom" (own colours) never as a start value
    fieldOptions(field) {
      if (field.key !== 'theme') return field.allOptions;
      return field.allOptions.filter(o => {
        if (o === 'custom') return this.view !== 'defaults';
        return o === 'default' || !Array.isArray(this.variants) || this.variants.includes(o);
      });
    },

    // the fields of a drawer tab for the restrictions: content (the block's
    // fields, then its items'), else the tab's settings keys (the four
    // corners together, as in the drawer); each row: its keys and label
    restrictionGroups(tab) {
      const all = this.getDefault('settings.fields.' + tab) || {};
      if (tab === 'content') {
        // (lists of allowed blocks, e.g. multicolumn's column blocks, are no field)
        const isField = (v) => v === 'enabled' || v === true
          || (this.isObject(v) && Object.values(v).some(p => this.isObject(p) && ('options' in p || 'default' in p)));
        const keys = Object.keys(all).filter(k => isField(all[k]));
        // a field the block needs (locked, e.g. the text of the text block)
        // cannot be hidden: no row (its further settings keep theirs)
        const locked = (k) => this.isObject(all[k]) && all[k].locked === true;
        const row = (k) => ({ id: k, keys: [k], label: this.fieldLabel(k) });
        const groups = [];
        // below a field its further settings (the media's size, corner style:
        // media-size → the drawer's mediaSize …); locked ones (the media
        // type) are left out, they always stay
        const extras = {};
        for (const f of this.contentExtraFields()) {
          extras[f.key] = [...f.lead, ...f.extras].filter(p => !(this.isObject(all[f.key][p.key]) && all[f.key][p.key].locked === true)).map(p => {
            const pKey = 'prw.property.' + p.key;
            const pLabel = this.$t(pKey);
            return { id: f.key + '-' + p.key, keys: [f.key + '-' + p.key], label: pLabel && pLabel !== pKey ? pLabel : p.key };
          });
        }
        const own = keys.filter(k => !k.startsWith('item-')).flatMap(k => [...(locked(k) ? [] : [row(k)]), ...(extras[k] || [])]);
        const items = keys.filter(k => k.startsWith('item-') && !locked(k)).map(row);
        if (own.length) groups.push({ key: 'block', heading: null, rows: own });
        if (items.length) groups.push({ key: 'items', heading: this.$t('prw.tab.items'), rows: items });
        return groups;
      }
      // drawer fields only: no "enabled" markers, fields with a start value;
      // item-* in the layout are the items' design (not in the drawer), in
      // other tabs they are block fields (steplist's item style)
      let keys = Object.keys(all).filter(k => !(tab === 'layout' && k.startsWith('item-')) && this.isObject(all[k]) && 'default' in all[k]);
      // layout as in the drawer: paddings, radii, then the block's own fields
      if (tab === 'layout') {
        const rank = (k) => (k.startsWith('padding') ? 0 : k.startsWith('radius') ? 1 : 2);
        keys = keys.map((k, i) => [k, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([k]) => k);
      }
      // fields that belong together (one headline in the drawer) share a row,
      // at the place of their first field
      const together = [
        { prefix: 'padding-', label: this.$t('prw.headline.paddings') },
        { prefix: 'radius-', label: this.categoryFieldLabel('radius') },
        { prefix: 'columns-', label: this.$t('pw.headline.columns') },
        { prefix: 'grid-', label: this.$t('prw.label.gridLayout') },
        { prefix: 'margin-', label: this.$t('prw.headline.margins') },
      ];
      const rows = [];
      for (const k of keys) {
        const group = together.find(g => k.startsWith(g.prefix));
        if (!group) {
          // the name of an option row (Darstellung der Schritte …), else the field's
          const pKey = 'prw.property.' + k;
          const pLabel = this.$t(pKey);
          rows.push({ id: k, keys: [k], label: pLabel && pLabel !== pKey ? pLabel : this.categoryFieldLabel(k) });
        } else if (!rows.some(r => r.id === group.prefix)) {
          rows.push({ id: group.prefix, keys: keys.filter(x => x.startsWith(group.prefix)), label: group.label });
        }
      }
      return rows.length ? [{ key: tab, heading: null, rows }] : [];
    },
    // all drawer tabs one below the other, each a card headed by its name
    allRestrictionGroups() {
      const groups = [];
      for (const tab of this.drawerTabs) {
        for (const group of this.restrictionGroups(tab.name)) {
          groups.push({ ...group, key: tab.name + '-' + group.key, heading: group.heading || tab.label });
        }
      }
      return groups;
    },
    // fields hidden from the editors (setting keys)
    hiddenKeys() {
      const list = this.getOverrideOnly('settings.hidden');
      return Array.isArray(list) ? list : [];
    },
    isHidden(keys) {
      const hidden = this.hiddenKeys();
      return keys.every(k => hidden.includes(k));
    },
    // eye clicked: hide the row's fields from the editors or show them again
    toggleHidden(keys) {
      const hidden = this.hiddenKeys().filter(k => !keys.includes(k));
      if (!this.isHidden(keys)) hidden.push(...keys);
      if (hidden.length) {
        this.setNested(this.overrides, 'settings.hidden', hidden);
      } else {
        this.deleteNested(this.overrides || {}, 'settings.hidden');
        this.cleanEmpty(this.overrides || {}, 'settings');
      }
      this.markDirty();
    },

    // start values of the content: the block's fields and (blocks with items)
    // the items' fields, each a row with the drawer's dropdowns
    contentToolbarGroups() {
      const groups = [];
      // (fields with further settings have a card of their own)
      const extraKeys = this.contentExtraFields().map(f => f.key);
      const own = this.presetFields(this.getContentFields()).filter(f => !extraKeys.includes(f.key));
      // the text (handled apart: textarea or writer) at its place among the
      // fields, as in the drawer (before the hero's buttons)
      const editor = this.getEditorField();
      if (editor && editor.properties.length) {
        const order = Object.keys(this.getDefault('settings.fields.content') || {});
        const at = own.findIndex(f => order.indexOf(f.key) > order.indexOf('editor'));
        if (order.includes('editor') && at >= 0) own.splice(at, 0, editor);
        else own.push(editor);
      }
      const ownRows = own.map(f => this.contentToolbarRow(f)).filter(r => r.items.length);
      if (ownRows.length) groups.push({ key: 'block', heading: this.$t('prw.headline.fields'), help: this.$t('prw.hint.contentDefaults'), rows: ownRows });
      const itemRows = this.presetFields(this.getItemDefaultsContentFields())
        .map(f => this.contentToolbarRow(f)).filter(r => r.items.length);
      if (itemRows.length) groups.push({ key: 'items', heading: this.$t('prw.tab.items'), rows: itemRows });
      return groups;
    },
    // a content field's dropdowns (as in the drawer: flourish … level, then
    // the editor mode), each with the allowed options and the start value
    // content fields with settings beyond the drawer's dropdowns (the media's
    // type, size, corner style), each with its corner switches if it has them
    contentExtraFields() {
      const dropdowns = ['flourish', 'multiline', 'textbackground', 'align', 'sizes', 'level', 'mode'];
      const raw = this.getDefault('settings.fields.content') || {};
      return this.getContentFields()
        .map(f => ({
          key: f.key,
          // the type of a field (the media type) leads, before its dropdowns
          lead: f.properties.filter(p => p.key === 'type'),
          extras: f.properties.filter(p => !dropdowns.includes(p.key) && p.key !== 'type'),
          corners: this.isObject(raw[f.key]) && 'radius-top-left' in raw[f.key],
          // its dropdowns (the media's alignment) go into the same card
          toolbar: this.contentToolbarRow(f),
        }))
        .filter(f => f.lead.length || f.extras.length);
    },
    contentToolbarRow(field) {
      const order = ['flourish', 'multiline', 'textbackground', 'align', 'sizes', 'level', 'mode'];
      const items = field.properties
        .filter(p => order.includes(p.key))
        .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
        .map(p => {
          const options = this.getActiveOptions(field.key, p.key, p);
          const value = this.getVal('settings.fields.content.' + field.key + '.' + p.key + '.default', p.pluginDefault);
          return {
            key: p.key === 'sizes' ? 'size' : p.key,
            prop: p,
            value: options.includes(value) ? value : options[0],
            options,
          };
        });
      return { key: field.key, items };
    },
    setContentPreset(row, { key, value }) {
      const item = row.items.find(i => i.key === key);
      if (!item) return;
      this.selectOption('settings.fields.content.' + row.key + '.' + item.prop.key + '.default', value, item.prop.pluginDefault);
    },

    // a drawer tab has rows in this view
    drawerTabHasRows(key) {
      if (this.view === 'presets') return this.restrictionGroups(key).length > 0;
      if (key === 'content') {
        return this.presetFields(this.getContentFields()).length > 0 || this.hasEditorCard()
          || this.presetFields(this.getItemDefaultsContentFields()).length > 0;
      }
      const cat = this.getCategories().find(c => c.key === key);
      return !!cat && this.catSections(cat).length > 0;
    },

    editorField() {
      return this.getEditorField() || { key: 'editor', enabled: true };
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
        // formatting and lists only: headings are never allowed in the text
        // (the heading field does that), the toolbar stays fixed
        if (key === 'headings') continue;
        if (Array.isArray(val) && val.length > 0) {
          rows.push({ key, type: 'array', values: val });
        }
      }
      return rows;
    },

    // --- Column blocks ---

    // --- Editor options ---
    setEditorContentOptions(propKey, prop, values) {
      this.setActiveOptions('editor', propKey, prop, values);
      if (propKey === 'mode') {
        this.$emit('update:writer-active', values.includes('writer'));
      }
    },

    // --- Active options ---
    // the options of a content field's property: always all of them (only
    // whole fields are switched off)
    getActiveOptions(fieldKey, propKey, prop) {
      return prop.allOptions;
    },

    setActiveOptions(fieldKey, propKey, prop, values) {
      const basePath = 'settings.fields.content.' + fieldKey + '.' + propKey;

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
          if ((this.view === 'defaults' || this.view === 'presets') && catKey === 'layout' && key.startsWith('item-')) continue;

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
                { value: 'small', text: this.$t('pw.option.small') },
                { value: 'large', text: this.$t('pw.option.large') },
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
      return field.enabled !== false;
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
      // names as in the elements (e.g. multicolumn's headline → Heading)
      const own = this.$t('prw.contentfield.' + key);
      if (own && own !== 'prw.contentfield.' + key) return own;
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

    // radius a corner switch applies: its value from the four corner values
    // (top-left, top-right, bottom-left, bottom-right); off → 0rem
    // the radius set for a corner (shown also while the corner is off, then
    // fainter)
    cornerHint(corner, on, values) {
      const idx = ['top-left', 'top-right', 'bottom-left', 'bottom-right'].indexOf(corner);
      return (Array.isArray(values) && values[idx]) || '';
    },

    // the four corner switches (radius): a 2×2 grid like the corner values
    isCornerGroup(field) {
      return (field.subFields || []).length === 4 && field.subFields.some(sub => sub.label === 'top-left');
    },
    cornerOrder(subFields) {
      const order = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
      if (!subFields.every(sub => order.includes(sub.label))) return subFields;
      return [...subFields].sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
    },

    // card heading of a category: the layout card holds the paddings, the
    // settings card the block's layout (size, outer spacing)
    categoryHeading(key) {
      if (key === 'layout') return this.$t('prw.headline.paddings');
      if (key === 'settings') return this.$t('prw.headline.blockLayout');
      return this.$t('pw.headline.' + key);
    },

    // guide colour of a row while the preview guides are on and the row's
    // switch is on: outer spacing (cyan lines) or paddings (magenta line)
    guideType(key, value) {
      if (!this.guides || !value) return null;
      if (key === 'margin-top' || key === 'margin-bottom') return 'margin';
      if (['padding-top', 'padding-bottom', 'padding-left', 'padding-right'].includes(key)) return 'padding';
      return null;
    },

    // the value a switch applies (e.g. padding-left → 4.5rem, padding-top
    // "large" → the large step); switched off → 0rem
    globalHint(key, value) {
      const g = this.globalValues || {};
      const single = { 'padding-left': 'global-padding-left', 'padding-right': 'global-padding-right',
        'margin-top': 'global-margin-top', 'margin-bottom': 'global-margin-bottom' };
      if (single[key]) return value ? (g[single[key]] || '') : '0rem';
      if (key === 'padding-top' || key === 'padding-bottom') {
        if (value !== 'small' && value !== 'large') return '0rem';
        const pair = g['global-' + key];
        return Array.isArray(pair) ? pair[value === 'large' ? 1 : 0] || '' : '';
      }
      return '';
    },

    // an option of an item setting: the block's own wording (its label key
    // + the value, e.g. kirbyblock-logocloud.item-format.flexible), else the general one
    itemOptionLabel(field, val) {
      if (field.label) {
        const own = this.$t(field.label + '.' + val);
        if (own && own !== field.label + '.' + val) return own;
      }
      const pwKey = 'pw.option.' + val;
      const pw = this.$t(pwKey);
      return pw && pw !== pwKey ? pw : val;
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

.pw-icon-select {
  display: flex;
  gap: var(--spacing-1);
}
.pw-icon-select .pw-icon-option {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  background: var(--color-white);
  color: var(--color-text-dimmed);
  cursor: pointer;
  padding: 0;
}
.pw-icon-select .pw-icon-option svg {
  width: 18px;
  height: 18px;
}
.pw-icon-select .pw-icon-option:hover {
  color: var(--color-text);
}
.pw-icon-select .pw-icon-option.is-active {
  background: var(--color-black);
  border-color: var(--color-black);
  color: var(--color-white);
}

.pw-content-field .k-label-text {
  text-transform: capitalize;
}

.pw-field-row-options .k-choice-input.k-toggle-input {
  padding-left: var(--spacing-2);
}
/* the question mark right behind the label: hovered, the value's area is
   tinted in the preview */
.pw-area-hint {
  --icon-size: 16px;
  /* right behind the label: closer than the label column's gap */
  margin-inline-start: -6px;
  color: var(--color-text-dimmed);
  opacity: 0.5;
}
/* (the icon inside a span that carries the tooltip) */
.pw-area-hint {
  display: inline-flex;
}
.pw-area-hint > .k-icon {
  --icon-size: 16px;
}
.pw-area-hint:hover {
  color: var(--color-text);
  opacity: 1;
}
/* restrictions: the eye at the right end of the label cell */
.pw-field-state-eye {
  --icon-size: 14px;
  margin-inline-start: auto;
}


/* a drawer header as in the block's drawer (breadcrumb, tabs) above the
   cards of the chosen tab */
.pw-drawer-strip {
  margin-bottom: var(--spacing-6);
  border-radius: var(--rounded);
  box-shadow: var(--shadow);
}
/* the tabs start on the left (the drawer has its breadcrumb there) */
.pw-drawer-strip .k-drawer-tabs.k-tabs {
  justify-content: start;
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
  background: var(--color-black) !important;
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

/* rows belonging to a preview guide: a 3px stripe in its colour at the
   left edge of the label */
.pw-field-row[data-guide] .pw-field-row-label-col {
  box-shadow: inset 3px 0 0 var(--pw-guide-color);
}
.pw-field-row[data-guide="margin"] {
  --pw-guide-color: rgba(0, 170, 255, 0.8);
}
.pw-field-row[data-guide="padding"] {
  --pw-guide-color: rgba(255, 0, 170, 0.6);
}
/* guide colours: the kind picks the family – gaps between things cyan,
   paddings magenta; a second value of the same kind in one preview gets
   the second colour (gap violet, padding green), a third gap orange, a
   fourth gold */
/* the second gap (e.g. logocloud's vertical gap, the paragraph spacing) */
.pw-field-row[data-guide="row"] {
  --pw-guide-color: rgba(130, 80, 255, 0.9);
}
/* the vertical padding (e.g. logocloud's tiles), told apart from the
   horizontal one (magenta) */
.pw-field-row[data-guide="padding-y"] {
  --pw-guide-color: rgba(0, 180, 90, 0.9);
}
/* the third gap: between the text and the items (e.g. logocloud) */
.pw-field-row[data-guide="text"] {
  --pw-guide-color: rgba(255, 140, 0, 0.9);
}
/* a fourth gap in one preview (e.g. featurelist: between title and text) */
.pw-field-row[data-guide="gap-4"] {
  --pw-guide-color: rgba(215, 160, 0, 0.95);
}

/* the global value a switch applies, grey at the right end of the row */
.pw-field-hint {
  margin-inline-start: auto;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  opacity: 0.6;
}
/* 0rem (switched off) a bit fainter */
.pw-field-hint.is-zero {
  opacity: 0.3;
}

.pw-wizard-block-sections {
  display: flex;
  flex-direction: column;
}
</style>
