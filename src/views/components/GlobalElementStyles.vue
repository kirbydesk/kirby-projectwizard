<template>
  <div>
    <!-- Element pill navigation -->
    <div class="pw-element-pills">
      <button
        v-for="(group, groupKey) in pillGroups"
        :key="'pill-' + groupKey"
        type="button"
        class="pw-element-pill"
        :class="{ 'is-active': activeElement === groupKey }"
        @click="activeElement = groupKey"
      >{{ groupLabel(groupKey) }}</button>
    </div>
    <section v-for="(group, groupKey) in groups" :key="groupKey" v-show="isElementVisible(groupKey) && !isChildElement(groupKey)" class="pw-element-section">
      <div class="pw-element-list">
          <!-- Preview -->
          <template v-if="previewText(groupKey) && !isChildElement(groupKey)">
          <div class="pw-element-preview-header">
            <span v-for="bp in ['default', 'lg', 'xl']" :key="'h-' + bp" class="pw-element-preview-header-label">{{ { default: 'Mobile', lg: 'Tablet', xl: 'Desktop' }[bp] }}</span>
          </div>
          <div class="pw-element-preview" :class="{ 'pw-element-preview-themed': previewThemed(groupKey) }">
            <template v-for="theme in ['default', 'variant', 'variant2']">
              <div v-for="bp in ['default', 'lg', 'xl']" :key="theme + '-' + bp" class="pw-element-preview-col" :style="{ backgroundColor: blockBackground(theme) }">
                <template v-if="groupKey === 'media'">
                  <div class="pw-media-preview-img" :style="mediaPreviewStyle(theme)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                  <div class="pw-media-preview-bullets">
                    <span :style="{ backgroundColor: mediaColor(theme, 'element-slideshow-bullet') }"></span>
                    <span :style="{ backgroundColor: mediaColor(theme, 'element-slideshow-bullet-active') }"></span>
                    <span :style="{ backgroundColor: mediaColor(theme, 'element-slideshow-bullet') }"></span>
                  </div>
                  <template v-if="previewChildText(groupKey)">
                    <span class="pw-element-preview-text" :style="previewStyle(previewChildKey(groupKey), bp, theme)">{{ previewChildText(groupKey) }}</span>
                  </template>
                </template>
                <template v-else-if="previewThemed(groupKey)">
                  <span class="pw-element-preview-button" :style="previewButtonStyle(groupKey, theme, bp)">{{ previewText(groupKey) }}</span>
                </template>
                <template v-else-if="previewParagraphs(groupKey)">
                  <div class="pw-element-preview-text" :style="previewStyle(groupKey, bp, theme)">
                    <p v-for="(para, pIdx) in previewParagraphs(groupKey)" :key="pIdx" :style="pIdx > 0 ? { marginTop: previewParagraphGap(groupKey) } : {}">{{ para }}</p>
                  </div>
                </template>
                <template v-else>
                  <span class="pw-element-preview-text" :style="previewStyle(groupKey, bp, theme)" v-html="previewHtml(groupKey, theme)"></span>
                </template>
                <template v-if="previewChildText(groupKey) && groupKey !== 'media'">
                  <span class="pw-element-preview-text" :style="previewStyle(previewChildKey(groupKey), bp, theme)">{{ previewChildText(groupKey) }}</span>
                </template>
              </div>
            </template>
          </div>
          </template>
          <!-- Subtabs -->
          <div class="pw-element-subtabs">
            <button
              v-for="st in combinedSubtabs(groupKey)"
              :key="'st-' + st.key"
              type="button"
              class="pw-element-subtab"
              :class="{ 'is-active': (openSections[groupKey + '-subtab'] || combinedSubtabs(groupKey)[0].key) === st.key }"
              @click="$set(openSections, groupKey + '-subtab', st.key)"
              v-html="st.label"
            ></button>
          </div>

          <!-- Text / Sizes fields -->
          <template v-if="activeSubtabInfo(groupKey).category !== 'colors'">
          <template v-for="(fieldGroup, gIdx) in groupedVarFields(activeSubtabInfo(groupKey).group, activeSubtabInfo(groupKey).category)">
            <!-- Group header row -->
            <div v-if="fieldGroup.header" :key="'vgh-' + gIdx" class="pw-group-header">
              <div class="pw-field-row-label-col"></div>
              <div class="pw-group-header-labels" :class="'pw-group-type-' + fieldGroup.fieldType">
                <span v-for="label in fieldGroup.header" :key="label" class="pw-group-column-cell"><span class="pw-group-column-label">{{ translateLabel(label) }}</span></span>
              </div>
            </div>
            <!-- Field rows in group -->
            <template v-for="(field, fIdx) in fieldGroup.fields">
            <div
              :key="'vf-' + gIdx + '-' + fIdx"
              class="pw-field-row"
              :class="{
                'pw-dual-first': field.isFollowedByState || (field.varName.endsWith('-font-size') && fontSizesForGroup(activeSubtabInfo(groupKey).elementKey) && openSections[groupKey + '-sizes']),
                'pw-dual-next': field.isState,
              }"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <template v-if="field.varName.endsWith('-font-size') && fontSizesForGroup(activeSubtabInfo(groupKey).elementKey)">
                      <button
                        type="button"
                        class="pw-sizes-toggle"
                        @click.prevent="$set(openSections, groupKey + '-sizes', !openSections[groupKey + '-sizes'])"
                      >
                        <k-icon class="pw-sizes-chevron" :type="openSections[groupKey + '-sizes'] ? 'angle-down' : 'angle-right'" />
                        <span>{{ field.label }}</span>
                      </button>
                    </template>
                    <label v-else class="pw-field-row-label" v-html="field.label"></label>
                  </div>
                  <div class="pw-field-row-options" :class="fieldGroup.header ? 'pw-group-type-' + fieldGroup.fieldType : ''">
                    <!-- Font family selector -->
                    <select
                      v-if="field.def.type === 'font-family'"
                      class="pw-element-input pw-font-select"
                      :value="fontSelectValue(field.varName, field.def.value)"
                      @change="setValue(field.varName, $event.target.value, field.def.value)"
                    >
                      <option v-for="opt in fontFamilyOptions" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                    </select>
                    <!-- Toggles for options -->
                    <k-toggles-input
                      v-else-if="field.def.options"
                      :value="getOverrideValue(field.varName) || field.def.value"
                      :options="filteredOptions(field.varName, field.def.options)"
                      :grow="false"
                      :required="true"
                      @input="setValue(field.varName, $event, field.def.value)"
                    />
                    <!-- Multi-value -->
                    <template v-else-if="field.type === 'multi-value'">
                      <span v-for="(val, idx) in field.def.value" :key="idx" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :value="stripUnit(getQuadValue(field.varName, idx) || val)"
                            @input="setQuadValue(field.varName, idx, $event.target.value, field.def)"
                          />
                          <span class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getQuadValue(field.varName, idx) || val, field.def.unit) }}</span>
                      </span>
                    </template>
                    <!-- Responsive -->
                    <template v-else-if="field.type === 'responsive'">
                      <span v-for="(bp, bpIdx) in ['default', 'lg', 'xl']" :key="bp" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :value="stripUnit(getResponsiveOverride(field.varName, bp) || field.def[bp])"
                            @input="setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit)"
                          />
                          <span class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit) }}</span>
                      </span>
                    </template>
                    <!-- Single value with unit -->
                    <template v-else-if="field.def.unit !== undefined">
                      <span class="pw-element-input-wrap">
                        <input
                          type="number"
                          :step="field.def.step || 0.1"
                          :min="field.def.min"
                          :max="field.def.max"
                          class="pw-element-input pw-element-input-number pw-px-calculator-input"
                          :value="stripUnit(getOverrideValue(field.varName) || field.def.value)"
                          @input="setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit)"
                        />
                        <span class="pw-element-unit">{{ field.def.unit }}</span>
                      </span>
                      <span class="pw-px-calculator">{{ toPx(getOverrideValue(field.varName) || field.def.value, field.def.unit) }}</span>
                    </template>
                  </div>
                </span>
              </div>
              <k-button v-if="hasFieldOverride(field)" class="pw-field-reset" :text="$t('prw.label.reset')" icon="undo" size="xs" variant="filled" @click="resetField(field)" />
            </div>
            <!-- Sizes sub-rows -->
            <template v-if="field.varName.endsWith('-font-size') && fontSizesForGroup(activeSubtabInfo(groupKey).elementKey) && openSections[groupKey + '-sizes']">
              <div
                v-for="(sizeEntry, sizeName) in (fontSizesForGroup(activeSubtabInfo(groupKey).elementKey).vars || fontSizesForGroup(activeSubtabInfo(groupKey).elementKey))"
                :key="'sz-' + sizeName"
                class="pw-field-row pw-dual-next"
              >
                <div class="k-input" data-type="text">
                  <span class="k-input-element pw-field-row-inner">
                    <div class="pw-field-row-label-col">
                      <label class="pw-field-row-label pw-sizes-label">{{ $t('pw.option.' + sizeName.split('-').pop()) }}</label>
                    </div>
                    <div class="pw-field-row-options" :class="fieldGroup.header ? 'pw-group-type-' + fieldGroup.fieldType : ''">
                      <span v-for="bp in ['default', 'lg', 'xl']" :key="bp" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="sizeEntry.step || 0.1"
                            :min="sizeEntry.min"
                            :max="sizeEntry.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :value="stripUnit(getFontSizeOverride(bp, sizeName) || sizeEntry[bp])"
                            @input="setFontSizeValue(bp, sizeName, $event.target.value, sizeEntry[bp], sizeEntry.unit)"
                          />
                          <span class="pw-element-unit">{{ sizeEntry.unit }}</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getFontSizeOverride(bp, sizeName) || sizeEntry[bp], sizeEntry.unit || 'rem') }}</span>
                      </span>
                    </div>
                  </span>
                </div>
              </div>
            </template>
            </template>
            <!-- Group end spacing -->
            <div v-if="fieldGroup.header" :key="'vge-' + gIdx" class="pw-group-end"></div>
          </template>

          </template>

          <!-- Colors -->
          <template v-if="activeSubtabInfo(groupKey).category === 'colors'">
          <template v-for="(fieldGroup, gIdx) in groupedColorFields(activeSubtabInfo(groupKey).group)">
            <!-- Group header row -->
            <div v-if="fieldGroup.header" :key="'gh-' + gIdx" class="pw-group-header">
              <div class="pw-field-row-label-col"></div>
              <div class="pw-group-header-labels" :class="'pw-group-type-' + fieldGroup.fieldType">
                <span v-for="label in fieldGroup.header" :key="label" class="pw-group-column-cell"><span class="pw-group-column-label">{{ translateLabel(label) }}</span></span>
              </div>
            </div>
            <!-- Field rows in group -->
            <template v-for="(field, fIdx) in fieldGroup.fields">
            <div
              :key="'gf-' + gIdx + '-' + fIdx"
              class="pw-field-row"
              :class="{
                'pw-dual-first': field.isFollowedByState || (field.varName.endsWith('-font-size') && fontSizesForGroup(activeSubtabInfo(groupKey).elementKey) && openSections[groupKey + '-sizes']),
                'pw-dual-next': field.isState,
              }"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <template v-if="field.varName.endsWith('-font-size') && fontSizesForGroup(activeSubtabInfo(groupKey).elementKey)">
                      <button
                        type="button"
                        class="pw-sizes-toggle"
                        @click.prevent="$set(openSections, groupKey + '-sizes', !openSections[groupKey + '-sizes'])"
                      >
                        <k-icon class="pw-sizes-chevron" :type="openSections[groupKey + '-sizes'] ? 'angle-down' : 'angle-right'" />
                        <span>{{ field.label }}</span>
                      </button>
                    </template>
                    <label v-else class="pw-field-row-label" v-html="field.label"></label>
                  </div>
                  <div class="pw-field-row-options" :class="fieldGroup.header ? 'pw-group-type-' + fieldGroup.fieldType : ''">
                    <!-- Font family selector -->
                    <select
                      v-if="field.def.type === 'font-family'"
                      class="pw-element-input pw-font-select"
                      :value="fontSelectValue(field.varName, field.def.value)"
                      @change="setValue(field.varName, $event.target.value, field.def.value)"
                    >
                      <option v-for="opt in fontFamilyOptions" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                    </select>
                    <!-- Toggles for options -->
                    <k-toggles-input
                      v-else-if="field.def.options"
                      :value="getOverrideValue(field.varName) || field.def.value"
                      :options="filteredOptions(field.varName, field.def.options)"
                      :grow="false"
                      :required="true"
                      @input="setValue(field.varName, $event, field.def.value)"
                    />
                    <!-- Multi-value (padding, border-radius: 1 row, N inputs) -->
                    <template v-else-if="field.type === 'multi-value'">
                      <span v-for="(val, idx) in field.def.value" :key="idx" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getQuadValue(field.varName, idx) }"
                            :value="stripUnit(getQuadValue(field.varName, idx) || val)"
                            @input="setQuadValue(field.varName, idx, $event.target.value, field.def)"
                          />
                          <span v-if="field.def.unit" class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getQuadValue(field.varName, idx) || val, field.def.unit) }}</span>
                      </span>
                    </template>
                    <!-- Responsive (default/lg/xl) -->
                    <template v-else-if="field.type === 'responsive'">
                      <span v-for="bp in ['default', 'lg', 'xl']" :key="bp" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getResponsiveOverride(field.varName, bp) }"
                            :value="stripUnit(getResponsiveOverride(field.varName, bp) || field.def[bp])"
                            @input="setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit)"
                          />
                          <span v-if="field.def.unit" class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit) }}</span>
                      </span>
                    </template>
                    <!-- Theme colors (default/variant/variant2) -->
                    <template v-else-if="field.type === 'theme-color'">
                      <pw-color-field-row
                        v-for="theme in ['default', 'variant', 'variant2']"
                        :key="theme"
                        :group="theme"
                        :var-name="field.varName"
                        :default-value="field.colorVal[theme] || ''"
                        :override-value="getColorOverrideValue(theme, field.varName)"
                        @update:value="setColorValue(theme, field.varName, $event, field.colorVal[theme] || '')"
                      />
                    </template>
                    <!-- Number input with unit -->
                    <template v-else-if="field.def.unit !== undefined">
                      <span class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getOverrideValue(field.varName) }"
                            :value="stripUnit(getOverrideValue(field.varName) || field.def.value)"
                            @input="setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit)"
                          />
                          <span v-if="field.def.unit" class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getOverrideValue(field.varName) || field.def.value, field.def.unit) }}</span>
                      </span>
                      <span v-if="field.def.help" class="pw-element-help">{{ helpText(field.def.help) }}</span>
                    </template>
                    <!-- Text input -->
                    <template v-else>
                      <input
                        type="text"
                        class="pw-element-input"
                        :placeholder="field.def.value"
                        :value="getOverrideValue(field.varName)"
                        @input="setValue(field.varName, $event.target.value, field.def.value)"
                      />
                      <span v-if="field.def.help" class="pw-element-help">{{ helpText(field.def.help) }}</span>
                    </template>
                  </div>
                </span>
              </div>
              <k-button v-if="hasFieldOverride(field)" class="pw-field-reset" :text="$t('prw.label.reset')" icon="undo" size="xs" variant="filled" @click="resetField(field)" />
            </div>
            <!-- Sizes rows (appear after font-size row when toggled) -->
            <template v-if="field.varName.endsWith('-font-size') && fontSizesForGroup(activeSubtabInfo(groupKey).elementKey) && openSections[groupKey + '-sizes']">
              <div
                v-for="(sizeVal, sizeName) in fontSizesForGroup(activeSubtabInfo(groupKey).elementKey).vars"
                :key="'size-' + sizeName"
                class="pw-field-row pw-dual-first pw-dual-next"
              >
                <div class="k-input" data-type="text">
                  <span class="k-input-element pw-field-row-inner">
                    <div class="pw-field-row-label-col">
                      <label class="pw-field-row-label pw-sizes-label">{{ $t('pw.option.' + sizeName.split('-').pop()) }}</label>
                    </div>
                    <div class="pw-field-row-options pw-group-type-responsive">
                      <span v-for="bp in ['default', 'lg', 'xl']" :key="bp" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            type="number"
                            :step="fontSizesForGroup(activeSubtabInfo(groupKey).elementKey).step || 0.1"
                            min="0.1"
                            max="20"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getFontSizeOverride(bp, sizeName) }"
                            :value="stripUnit(getFontSizeOverride(bp, sizeName) || sizeVal[bp])"
                            @input="setFontSizeValue(bp, sizeName, $event.target.value, sizeVal[bp], 'rem')"
                          />
                          <span class="pw-element-unit">rem</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getFontSizeOverride(bp, sizeName) || sizeVal[bp], 'rem') }}</span>
                      </span>
                    </div>
                  </span>
                </div>
              </div>
            </template>
            </template>
            <!-- Group end spacing -->
            <div v-if="fieldGroup.header" :key="'ge-' + gIdx" class="pw-group-end"></div>
          </template>
          </template>
        </div>
    </section>
  </div>
</template>

<script>
export default {
  props: {
    elementDefaults: {
      type: Object,
      default: () => ({}),
    },
    elementOverrides: {
      type: Object,
      default: () => ({}),
    },
    globalDefaults: {
      type: Object,
      default: () => ({}),
    },
    globalOverrides: {
      type: Object,
      default: () => ({}),
    },
    fonts: {
      type: Object,
      default: () => ({}),
    },
    fontDefaults: {
      type: Object,
      default: () => ({}),
    },
    fontOverrides: {
      type: Object,
      default: () => ({}),
    },
    bodyDefaultFont: {
      type: String,
      default: 'Inter',
    },
    savedOverrides: {
      type: Object,
      default: () => ({}),
    },
    discardKey: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      activeElement: null,
      openSections: {},
      resetFields: new Set(),
    };
  },
  watch: {
    savedOverrides: {
      handler() { this.resetFields = new Set(); },
    },
    discardKey() { this.resetFields = new Set(); },
    pillGroups: {
      immediate: true,
      handler(g) {
        if (!this.activeElement && g) {
          const keys = Object.keys(g);
          if (keys.length) this.activeElement = keys[0];
        }
      },
    },
  },
  computed: {
    groups() {
      const result = {};
      for (const [key, val] of Object.entries(this.elementDefaults)) {
        if (val && typeof val === 'object' && (val.vars || val.colors)) {
          result[key] = val;
        }
      }
      return result;
    },
    elementGrouping() {
      return { cite: 'quote', caption: 'media' };
    },
    pillGroups() {
      const result = {};
      for (const [key, val] of Object.entries(this.groups)) {
        if (!this.elementGrouping[key]) {
          result[key] = val;
        }
      }
      return result;
    },
    fontFamilyOptions() {
      const allFonts = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      const seen = new Set();
      const options = [{ value: 'default', text: 'Default (' + this.bodyDefaultFont + ')' }];
      for (const font of Object.values(allFonts)) {
        if (!seen.has(font.family) && font.family !== this.bodyDefaultFont) {
          seen.add(font.family);
          options.push({ value: font.family, text: font.family });
        }
      }
      return options;
    },
  },
  methods: {
    isElementVisible(groupKey) {
      if (this.activeElement === groupKey) return true;
      const parent = this.elementGrouping[groupKey];
      return parent && this.activeElement === parent;
    },
    isChildElement(groupKey) {
      return !!this.elementGrouping[groupKey];
    },
    toggle(key) {
      this.$set(this.openSections, key, !this.isOpen(key));
    },
    isOpen(key) {
      return this.openSections[key] !== false;
    },
    groupLabel(key) {
      const tKey = 'prw.elementgroup.' + key;
      const t = this.$t(tKey);
      return (t && t !== tKey) ? t : key;
    },
    propLabel(varName) {
      const tKey = 'prw.element.' + varName;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      const firstDash = varName.indexOf('-');
      if (firstDash > 0) {
        const propKey = 'prw.prop.' + varName.substring(firstDash + 1);
        const propT = this.$t(propKey);
        if (propT && propT !== propKey) return propT;
      }
      return varName;
    },
    // --- Field signature + grouping ---
    fieldSignature(varName, def, isColor) {
      if (isColor) {
        return { type: 'theme-color', labels: ['Default', 'Variant', 'Variant2'] };
      }
      if (Array.isArray(def.value) && def.labels) {
        return { type: 'multi-value', labels: def.labels };
      }
      if (def.default !== undefined && def.lg !== undefined && def.variant === undefined) {
        return { type: 'responsive', labels: ['Mobile', 'Tablet', 'Desktop'] };
      }
      return { type: 'single', labels: null };
    },
    groupedVarFields(group, category) {
      return this.groupedFields(group, 'vars', category);
    },
    groupedColorFields(group) {
      return this.groupedFields(group, 'colors');
    },
    groupedFields(group, only, category) {
      const allFields = [];

      // Build color fields
      const colorFields = [];
      if (group.colors && only !== 'vars') {
        const colorKeys = Object.keys(group.colors);
        for (let i = 0; i < colorKeys.length; i++) {
          const varName = colorKeys[i];
          const colorVal = group.colors[varName];
          const sig = this.fieldSignature(varName, {}, true);
          const nextKey = colorKeys[i + 1] || '';
          const isState = varName.endsWith('-hover') || varName.endsWith('-active');
          const isFollowedByState = nextKey.endsWith('-hover') || nextKey.endsWith('-active');
          colorFields.push({
            varName,
            def: {},
            colorVal,
            label: this.colorLabel(varName),
            isState,
            isFollowedByState,
            type: 'theme-color',
            sigLabels: sig.labels,
            sigKey: sig.type + ':' + sig.labels.join(','),
          });
        }
      }

      // Collect vars
      if (group.vars && only !== 'colors') {
        for (const [varName, def] of Object.entries(group.vars)) {
          if (category && this.varCategory(varName) !== category) continue;
          const sig = this.fieldSignature(varName, def, false);
          allFields.push({
            varName,
            def,
            label: this.propLabel(varName),
            type: sig.type,
            sigLabels: sig.labels,
            sigKey: sig.type === 'single' ? 'single-' + varName : sig.type + ':' + (sig.labels || []).join(','),
          });
        }
      }
      if (colorFields.length > 0) {
        allFields.push(...colorFields);
      }

      // Group consecutive fields with same signature
      const groups = [];
      let currentGroup = null;

      for (const field of allFields) {
        if (field.type === 'single') {
          // Singles don't group
          if (currentGroup) {
            groups.push(currentGroup);
            currentGroup = null;
          }
          groups.push({ header: null, fields: [field] });
        } else if (currentGroup && currentGroup.sigKey === field.sigKey) {
          currentGroup.fields.push(field);
        } else {
          if (currentGroup) groups.push(currentGroup);
          currentGroup = {
            sigKey: field.sigKey,
            header: field.sigLabels,
            fieldType: field.type,
            fields: [field],
          };
        }
      }
      if (currentGroup) groups.push(currentGroup);

      return groups;
    },

    filteredOptions(varName, options) {
      if (!varName.endsWith('-font-weight')) {
        return options.map(o => ({ value: o, text: o }));
      }
      const prefix = varName.replace('-font-weight', '');
      const fontFamilyVar = prefix + '-font-family';
      let selectedFamily = this.getOverrideValue(fontFamilyVar);
      if (!selectedFamily) {
        // Read default from element config
        for (const group of Object.values(this.elementDefaults)) {
          if (group && group.vars && group.vars[fontFamilyVar]) {
            selectedFamily = group.vars[fontFamilyVar].value;
            break;
          }
        }
      }
      if (!selectedFamily || selectedFamily === 'default') selectedFamily = this.bodyDefaultFont;
      const font = this.getFontByFamily(selectedFamily);
      if (!font || !font.files || !font.files.length) {
        return options.map(o => ({ value: o, text: o }));
      }
      const weights = new Set();
      for (const file of font.files) {
        const parts = (file.weight || '400').split(' ');
        if (parts.length === 2) {
          const min = parseInt(parts[0]);
          const max = parseInt(parts[1]);
          return options.filter(o => {
            const n = parseInt(o);
            return n >= min && n <= max;
          }).map(o => ({ value: o, text: o }));
        }
        weights.add(parts[0]);
      }
      return options.filter(o => weights.has(o)).map(o => ({ value: o, text: o }));
    },
    getFontByFamily(family) {
      const allFonts = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      return Object.values(allFonts).find(f => f.family === family) || null;
    },

    translateLabel(label) {
      // If label is already an i18n key, try direct lookup first
      const direct = this.$t(label);
      if (direct && direct !== label) return direct;
      const slug = label.toLowerCase().replace(/\s+/g, '-');
      const pwKey = 'pw.option.' + slug;
      const pwT = this.$t(pwKey);
      if (pwT && pwT !== pwKey) return pwT;
      const prwKey = 'prw.label.' + slug;
      const prwT = this.$t(prwKey);
      return (prwT && prwT !== prwKey) ? prwT : label;
    },

    // --- Color methods ---
    colorLabel(varName) {
      const tKey = 'prw.color.' + varName;
      const t = this.$t(tKey);
      if (t && t !== tKey) return t;
      return varName;
    },
    getColorOverrideValue(theme, varName) {
      return ((this.elementOverrides.global || {})[theme] || {})[varName] || '';
    },
    setColorValue(theme, varName, value, defaultVal) {
      const overrides = JSON.parse(JSON.stringify(this.elementOverrides));

      if (value === '' || value === defaultVal) {
        if (overrides.global && overrides.global[theme]) {
          delete overrides.global[theme][varName];
          if (Object.keys(overrides.global[theme]).length === 0) {
            delete overrides.global[theme];
          }
          if (overrides.global && Object.keys(overrides.global).length === 0) {
            delete overrides.global;
          }
        }
      } else {
        if (!overrides.global) overrides.global = {};
        if (!overrides.global[theme]) overrides.global[theme] = {};
        overrides.global[theme][varName] = value;
      }

      this.$emit('update:overrides', overrides);
    },

    // --- Quad methods ---
    getQuadValue(varName, index) {
      const override = (this.elementOverrides.global || {})[varName];
      if (Array.isArray(override)) return override[index] || '';
      return '';
    },
    setQuadValue(varName, index, value, def) {
      const overrides = JSON.parse(JSON.stringify(this.elementOverrides));
      if (!overrides.global) overrides.global = {};

      const current = Array.isArray(overrides.global[varName])
        ? [...overrides.global[varName]]
        : [...def.value];

      current[index] = value === '' ? def.value[index] : value + (def.unit || '');

      const allDefault = current.every((v, i) => v === def.value[i]);
      if (allDefault) {
        delete overrides.global[varName];
        if (Object.keys(overrides.global).length === 0) {
          delete overrides.global;
        }
      } else {
        overrides.global[varName] = current;
      }

      this.$emit('update:overrides', overrides);
    },

    // --- Style methods ---
    stripUnit(val) {
      if (!val) return '';
      return val.replace(/(rem|em|px)$/, '');
    },
    setUnitValue(varName, value, defaultVal, unit) {
      const num = parseFloat(String(value).replace(',', '.'));
      const withUnit = (value === '' || isNaN(num)) ? '' : num + (unit || '');
      this.setValue(varName, withUnit, defaultVal);
    },
    toPx(val, unit) {
      if (!val) return '';
      const num = parseFloat(val);
      if (isNaN(num)) return '';
      if (unit === 'rem' || val.endsWith('rem')) return Math.round(num * 16) + 'px';
      if (unit === 'em' || val.endsWith('em')) return Math.round(num * 16) + 'px';
      if (unit === '' && num > 0) return Math.round(num * 16) + 'px'; // unitless line-height
      return '';
    },
    helpText(key) {
      const tKey = 'prw.help.' + key;
      const t = this.$t(tKey);
      return (t && t !== tKey) ? t : key;
    },
    hasFieldOverride(field) {
      const varName = field.varName;
      if (this.resetFields.has(varName)) return false;
      const saved = this.savedOverrides.global || {};
      if (field.type === 'theme-color') {
        for (const theme of ['default', 'variant', 'variant2']) {
          if ((saved[theme] || {})[varName]) return true;
        }
        return false;
      }
      if (field.type === 'responsive') {
        for (const bp of ['default', 'lg', 'xl']) {
          if ((saved[bp] || {})[varName]) return true;
        }
        return false;
      }
      if (field.type === 'multi-value') {
        return Array.isArray(saved[varName]);
      }
      return !!saved[varName];
    },
    async resetField(field) {
      const label = field.label.replace(/<[^>]*>/g, '');
      try {
        await new Promise((resolve, reject) => {
          this.$panel.dialog.open({
            component: 'k-text-dialog',
            props: {
              text: (this.$t('prw.label.reset-confirm') || 'Reset "{field}" to default?').replace('{field}', label),
              submitBtn: {
                text: this.$t('prw.label.reset'),
                icon: 'undo',
                theme: 'negative',
              },
            },
            on: {
              submit: () => { this.$panel.dialog.close(); resolve(); },
              cancel: () => reject(),
            },
          });
        });
      } catch (e) { return; }
      this.resetFields.add(field.varName);
      const varName = field.varName;
      const overrides = JSON.parse(JSON.stringify(this.elementOverrides));
      if (!overrides.global) return;

      if (field.type === 'theme-color') {
        for (const theme of ['default', 'variant', 'variant2']) {
          if (overrides.global[theme]) {
            delete overrides.global[theme][varName];
            if (Object.keys(overrides.global[theme]).length === 0) delete overrides.global[theme];
          }
        }
      } else if (field.type === 'responsive') {
        for (const bp of ['default', 'lg', 'xl']) {
          if (overrides.global[bp]) {
            delete overrides.global[bp][varName];
            if (Object.keys(overrides.global[bp]).length === 0) delete overrides.global[bp];
          }
        }
      } else {
        delete overrides.global[varName];
      }

      if (overrides.global && Object.keys(overrides.global).length === 0) delete overrides.global;
      this.$emit('update:overrides', overrides);
    },
    fontSizesForGroup(groupKey) {
      return this.fontDefaults[groupKey] || null;
    },
    getFontSizeOverride(bp, varName) {
      return ((this.fontOverrides.global || {})[bp] || {})[varName] || '';
    },
    setFontSizeValue(bp, varName, value, defaultVal, unit) {
      const withUnit = value === '' ? '' : value + (unit || '');
      const overrides = JSON.parse(JSON.stringify(this.fontOverrides));

      if (withUnit === '' || withUnit === defaultVal) {
        if (overrides.global && overrides.global[bp]) {
          delete overrides.global[bp][varName];
          if (Object.keys(overrides.global[bp]).length === 0) delete overrides.global[bp];
          if (overrides.global && Object.keys(overrides.global).length === 0) delete overrides.global;
        }
      } else {
        if (!overrides.global) overrides.global = {};
        if (!overrides.global[bp]) overrides.global[bp] = {};
        overrides.global[bp][varName] = withUnit;
      }

      this.$emit('update:font-overrides', overrides);
    },
    getResponsiveOverride(varName, bp) {
      return ((this.elementOverrides.global || {})[bp] || {})[varName] || '';
    },
    setResponsiveValue(varName, bp, value, defaultVal, unit) {
      const withUnit = value === '' ? '' : value + (unit || '');
      const overrides = JSON.parse(JSON.stringify(this.elementOverrides));

      if (withUnit === '' || withUnit === defaultVal) {
        if (overrides.global && overrides.global[bp]) {
          delete overrides.global[bp][varName];
          if (Object.keys(overrides.global[bp]).length === 0) {
            delete overrides.global[bp];
          }
          if (overrides.global && Object.keys(overrides.global).length === 0) {
            delete overrides.global;
          }
        }
      } else {
        if (!overrides.global) overrides.global = {};
        if (!overrides.global[bp]) overrides.global[bp] = {};
        overrides.global[bp][varName] = withUnit;
      }

      this.$emit('update:overrides', overrides);
    },
    getOverrideValue(varName) {
      return (this.elementOverrides.global || {})[varName] || '';
    },
    fontSelectValue(varName, defValue) {
      const ov = this.getOverrideValue(varName);
      if (ov && ov === this.bodyDefaultFont) return 'default';
      return ov || defValue;
    },
    setValue(varName, value, defaultVal) {
      const overrides = JSON.parse(JSON.stringify(this.elementOverrides));

      if (value === '' || value === defaultVal) {
        if (overrides.global) {
          delete overrides.global[varName];
          if (Object.keys(overrides.global).length === 0) {
            delete overrides.global;
          }
        }
      } else {
        if (!overrides.global) overrides.global = {};
        overrides.global[varName] = value;
      }

      this.$emit('update:overrides', overrides);
    },

    // --- Preview ---
    previewText(groupKey) {
      const texts = {
        heading: 'The quick __marked__brown fox__/marked__ jumps over the lazy dog and keeps on running',
        tagline: 'The quick brown fox jumps over the lazy dog and keeps on running through the field',
        editor: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.',
        quote: '\u201EThe quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.\u201C',
        button: 'Click here',
        caption: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
        breadcrumb: 'Home / Products / Category / Subcategory / Detail',
        cite: '— The quick brown fox jumps over the lazy dog',
      };
      return texts[groupKey] || (groupKey === 'media' ? '__media__' : null);
    },
    elementSubtabs(groupKey) {
      const tabs = {
        heading:    ['text', 'sizes', 'colors'],
        tagline:    ['text', 'sizes', 'colors'],
        editor:     ['text', 'sizes', 'colors'],
        quote:      ['text', 'sizes', 'colors'],
        button:     ['text', 'sizes', 'colors'],
        caption:    ['text', 'sizes', 'colors'],
        breadcrumb: ['text', 'sizes', 'colors'],
        media:      ['colors'],
        cite:       ['text', 'sizes', 'colors'],
      };
      return tabs[groupKey] || ['text', 'sizes', 'colors'];
    },
    varCategory(varName) {
      if (varName.endsWith('-font-family') || varName.endsWith('-font-weight') ||
          varName.endsWith('-text-transform') || varName.endsWith('-font-style') ||
          varName.endsWith('-paragraph-spacing') || varName.endsWith('-marks') ||
          varName.endsWith('-gap')) return 'text';
      if (varName.endsWith('-font-size') || varName.endsWith('-line-height') ||
          varName.endsWith('-letter-spacing') || varName.endsWith('-padding') ||
          varName.endsWith('-border-radius') || varName.endsWith('-radius')) return 'sizes';
      return 'text';
    },
    combinedSubtabs(groupKey) {
      const tabLabels = { text: this.$t('prw.subtab.text'), sizes: this.$t('prw.subtab.sizes'), colors: this.$t('prw.subtab.colors') };
      const result = [];
      const childKey = this.previewChildKey(groupKey);
      const hasChild = childKey && this.groups[childKey];
      // Parent tabs
      for (const st of this.elementSubtabs(groupKey)) {
        const prefix = hasChild ? '<strong>' + this.groupLabel(groupKey) + ':</strong> ' : '';
        result.push({ key: groupKey + ':' + st, label: prefix + tabLabels[st], elementKey: groupKey, category: st });
      }
      // Child tabs
      if (hasChild) {
        for (const st of this.elementSubtabs(childKey)) {
          result.push({ key: childKey + ':' + st, label: '<strong>' + this.groupLabel(childKey) + ':</strong> ' + tabLabels[st], elementKey: childKey, category: st });
        }
      }
      return result;
    },
    activeSubtabInfo(groupKey) {
      const tabs = this.combinedSubtabs(groupKey);
      const activeKey = this.openSections[groupKey + '-subtab'] || tabs[0].key;
      const tab = tabs.find(t => t.key === activeKey) || tabs[0];
      return { group: this.groups[tab.elementKey], category: tab.category, elementKey: tab.elementKey };
    },
    previewChildKey(groupKey) {
      const children = {};
      for (const [child, parent] of Object.entries(this.elementGrouping)) {
        children[parent] = child;
      }
      return children[groupKey] || null;
    },
    previewChildText(groupKey) {
      const childKey = this.previewChildKey(groupKey);
      return childKey ? this.previewText(childKey) : null;
    },
    previewHtml(groupKey, theme) {
      let text = this.previewText(groupKey);
      if (!text) return '';
      const elDef = this.elementDefaults[groupKey] || {};
      const elOv = this.elementOverrides.global || {};
      // Replace __marked__...__/marked__ with styled span
      text = text.replace(/__marked__(.+?)__\/marked__/g, (match, content) => {
        const markedTextColor = ((elOv)[theme] || {})['element-' + groupKey + '-marked-text'] || elDef.colors?.['element-' + groupKey + '-marked-text']?.[theme] || '';
        const markedBgColor = ((elOv)[theme] || {})['element-' + groupKey + '-marked-background'] || elDef.colors?.['element-' + groupKey + '-marked-background']?.[theme] || '';
        let style = '';
        if (markedTextColor) style += 'color:' + markedTextColor + ';';
        if (markedBgColor) style += 'background:' + markedBgColor + ';';
        return style ? '<mark style="' + style + '">' + content + '</mark>' : content;
      });
      return text;
    },
    previewThemed(groupKey) {
      return groupKey === 'button';
    },
    blockBackground(theme) {
      const override = ((this.globalOverrides.global || {})[theme] || {})['block-background'];
      if (override) return override;
      const blocks = this.globalDefaults.colors || this.globalDefaults.layout || this.globalDefaults.blocks || {};
      return blocks.colors?.['block-background']?.[theme] || '#ffffff';
    },
    previewButtonStyle(groupKey, theme, bp) {
      const prefix = groupKey;
      const get = (prop) => this.getOverrideValue(prefix + '-' + prop);
      const defVal = (prop, breakpoint) => {
        const group = this.elementDefaults[groupKey];
        if (!group || !group.vars) return '';
        const d = group.vars[prefix + '-' + prop];
        if (!d) return '';
        if (breakpoint && d[breakpoint] !== undefined) return d[breakpoint];
        if (d.default !== undefined) return d.default;
        return d.value || '';
      };
      const responsiveVal = (prop) => {
        const override = this.getResponsiveOverride(prefix + '-' + prop, bp);
        if (override) return override;
        return defVal(prop, bp);
      };

      // Font properties
      let fontFamily = get('font-family') || defVal('font-family');
      if (!fontFamily || fontFamily === 'default') fontFamily = this.bodyDefaultFont;
      const allFonts = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      let fontCategory = 'sans-serif';
      for (const f of Object.values(allFonts)) {
        if (f.family === fontFamily) { fontCategory = f.category || 'sans-serif'; break; }
      }

      // Colors from theme
      const colorVal = (colorName) => {
        const override = ((this.elementOverrides.global || {})[theme] || {})[colorName];
        if (override) return override;
        return this.elementDefaults[groupKey]?.colors?.[colorName]?.[theme] || '';
      };

      // Padding
      const paddingDef = this.elementDefaults[groupKey]?.vars?.[prefix + '-padding'];
      const paddingOverride = (this.elementOverrides.global || {})[prefix + '-padding'];
      const padding = Array.isArray(paddingOverride) ? paddingOverride : (paddingDef?.value || []);

      // Border radius
      const radiusDef = this.elementDefaults[groupKey]?.vars?.[prefix + '-border-radius'];
      const radiusOverride = (this.elementOverrides.global || {})[prefix + '-border-radius'];
      const radius = Array.isArray(radiusOverride) ? radiusOverride : (radiusDef?.value || []);

      return {
        fontFamily: "'" + fontFamily + "', " + fontCategory,
        fontWeight: get('font-weight') || defVal('font-weight', 'value'),
        fontStyle: get('font-style') || defVal('font-style', 'value'),
        fontSize: responsiveVal('font-size'),
        lineHeight: responsiveVal('line-height'),
        letterSpacing: responsiveVal('letter-spacing'),
        textTransform: get('text-transform') || defVal('text-transform', 'value'),
        color: colorVal('element-button-text'),
        backgroundColor: colorVal('element-button-background'),
        borderColor: colorVal('element-button-border'),
        borderWidth: '1px',
        borderStyle: 'solid',
        padding: Array.isArray(padding) ? padding.join(' ') : padding,
        borderRadius: Array.isArray(radius) ? radius.join(' ') : radius,
      };
    },
    mediaPreviewStyle(theme) {
      const elDef = this.elementDefaults.media || {};
      const elOv = this.elementOverrides.global || {};
      const bg = ((elOv)[theme] || {})['element-media-background'] || elDef.colors?.['element-media-background']?.[theme] || '#262626';
      const radiusOv = elOv['media-radius'];
      const radiusDef = elDef.vars?.['media-radius']?.value || [];
      const r = Array.isArray(radiusOv) ? radiusOv : radiusDef;
      return {
        backgroundColor: bg,
        borderRadius: r.length === 4 ? r[0] + ' ' + r[1] + ' ' + r[3] + ' ' + r[2] : '0',
      };
    },
    mediaColor(theme, colorName) {
      const elDef = this.elementDefaults.media || {};
      const elOv = this.elementOverrides.global || {};
      return ((elOv)[theme] || {})[colorName] || elDef.colors?.[colorName]?.[theme] || '#262626';
    },
    isLightColor(hex) {
      if (!hex || hex.length < 7) return true;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 > 160;
    },
    previewParagraphs(groupKey) {
      if (groupKey !== 'editor') return null;
      return [
        'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
        'How vexingly quick daft zebras jump. The five boxing wizards jump quickly at dawn.',
      ];
    },
    previewParagraphGap(groupKey) {
      const override = this.getOverrideValue(groupKey + '-paragraph-spacing');
      if (override) return override;
      const group = this.elementDefaults[groupKey];
      if (group && group.vars && group.vars[groupKey + '-paragraph-spacing']) {
        return group.vars[groupKey + '-paragraph-spacing'].value || '';
      }
      return '';
    },
    previewStyle(groupKey, bp, theme) {
      const prefix = groupKey;
      const get = (prop) => {
        return this.getOverrideValue(prefix + '-' + prop);
      };
      const defVal = (prop, breakpoint) => {
        const group = this.elementDefaults[groupKey];
        if (!group || !group.vars) return '';
        const d = group.vars[prefix + '-' + prop];
        if (!d) return '';
        if (d[breakpoint] !== undefined) return d[breakpoint];
        if (d.default !== undefined) return d.default;
        return d.value || '';
      };
      const responsiveVal = (prop) => {
        const override = this.getResponsiveOverride(prefix + '-' + prop, bp);
        if (override) return override;
        return defVal(prop, bp);
      };

      // Font family (not responsive)
      let fontFamily = get('font-family') || defVal('font-family', 'value');
      if (!fontFamily || fontFamily === 'default') fontFamily = this.bodyDefaultFont;
      const allFonts = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      let fontCategory = 'sans-serif';
      for (const f of Object.values(allFonts)) {
        if (f.family === fontFamily) { fontCategory = f.category || 'sans-serif'; break; }
      }

      // Color from theme
      const t = theme || 'default';
      const colorVar = 'element-' + prefix + '-text';
      const colorOverride = ((this.elementOverrides.global || {})[t] || {})[colorVar];
      const colorDefault = this.elementDefaults[groupKey]?.colors?.[colorVar]?.[t] || '';

      return {
        fontFamily: "'" + fontFamily + "', " + fontCategory,
        fontWeight: get('font-weight') || defVal('font-weight', 'value'),
        fontStyle: get('font-style') || defVal('font-style', 'value'),
        fontSize: responsiveVal('font-size'),
        lineHeight: responsiveVal('line-height'),
        letterSpacing: responsiveVal('letter-spacing'),
        textTransform: get('text-transform') || defVal('text-transform', 'value'),
        color: colorOverride || colorDefault,
      };
    },
  },
};
</script>

<style>
.pw-element-pills {
  display: flex;
  gap: var(--spacing-1);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-10);
}

.pw-element-pill {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--text-xs);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  background: var(--color-white);
  cursor: pointer;
  color: var(--color-text-dimmed);
}

.pw-element-pill:hover {
  border-color: var(--color-gray-400);
}

.pw-element-pill.is-active {
  background: var(--color-black);
  color: var(--color-white);
  border-color: var(--color-black);
}

.pw-element-subtabs {
  display: flex;
  gap: 0;
  margin-bottom: var(--spacing-4);
}

.pw-element-subtab {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--text-xs);
  font-weight: 500;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-dimmed);
  position: relative;
}

.pw-element-subtab:hover {
  color: var(--color-text);
}

.pw-element-subtab.is-active {
  color: var(--color-text);
  font-weight: 600;
}

.pw-element-subtab.is-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-black);
}

.pw-field-row {
  position: relative;
}

.pw-field-reset {
  position: absolute;
  right: var(--spacing-2);
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  opacity: 0.6;
}

.pw-field-reset:hover {
  opacity: 1;
}

.pw-element-section {
  margin-bottom: 0;
}

.pw-element-list {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--spacing-10);
}

.pw-element-preview-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  margin-bottom: var(--spacing-2);
}

.pw-element-preview-header-label {
  font-size: 0.6rem;
  font-family: var(--font-mono);
  color: var(--color-text-dimmed);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--spacing-1) var(--spacing-4);
}

.pw-element-preview {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  margin-bottom: var(--spacing-6);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.pw-element-preview-col {
  display: flex;
  flex-direction: column;
  background: #fff;
  padding: var(--spacing-4) var(--spacing-4);
  overflow: hidden;
}


.pw-element-preview-text {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pw-media-preview-img {
  width: 100%;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.pw-media-preview-img svg {
  width: 32px;
  height: 32px;
}

.pw-media-preview-bullets {
  display: flex;
  gap: 6px;
  justify-content: center;
  padding: var(--spacing-2) 0;
}

.pw-media-preview-bullets span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pw-element-preview-button {
  display: inline-block;
  width: fit-content;
  cursor: default;
}



.pw-group-header {
  display: flex;
  gap: 0;
  padding: var(--spacing-1) var(--spacing-3) var(--spacing-1);
  margin-top: var(--spacing-4);
}

.pw-group-end + .pw-group-header {
  margin-top: 0;
}

.pw-group-header .pw-field-row-label-col {
  width: 200px;
  flex-shrink: 0;
}

.pw-group-header-labels {
  display: flex;
  gap: var(--spacing-6);
}

.pw-group-column-label {
  font-size: 0.6rem;
  font-family: var(--font-mono);
  color: var(--color-text-dimmed);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: none;
  border: none;
  padding: 0;
  white-space: nowrap;
  width: fit-content;
}

.pw-group-end {
  margin-bottom: var(--spacing-4);
}

/* Column cell — fixed width wrapper, pill centered inside */
.pw-group-column-cell {
  display: flex;
}

.pw-group-type-multi-value,
.pw-group-type-responsive {
  gap: var(--spacing-4);
}

.pw-group-type-multi-value .pw-group-column-cell,
.pw-group-type-responsive .pw-group-column-cell {
  width: 145px; /* 100px input + 45px px-calculator */
}

.pw-group-type-theme-color {
  gap: var(--spacing-4);
}

.pw-group-type-theme-color .pw-group-column-cell {
  width: 160px; /* color picker width */
}

.pw-element-input {
  width: 100px;
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  background: light-dark(#f9f9f9, #1a1a1a);
}

.pw-element-input:focus {
  outline: none;
  border-color: var(--color-focus);
}

.pw-element-input-number {
  padding-right: 2.5rem;
  -moz-appearance: textfield;
}

.pw-element-input-number::-webkit-inner-spin-button,
.pw-element-input-number::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.pw-element-input::placeholder {
  color: var(--color-text-dimmed);
}

.pw-element-input.is-default {
  color: var(--color-text-dimmed);
}

.pw-element-field {
  display: flex;
  align-items: center;
  gap: 0;
}

.pw-element-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.pw-element-unit {
  position: absolute;
  right: var(--spacing-2);
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  pointer-events: none;
}

.pw-font-select {
  width: 200px;
  cursor: pointer;
  padding-right: var(--spacing-8);
  appearance: auto;
  font-family: var(--font-family);
}

.pw-sizes-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--color-text);
  padding: 0;
}

.pw-sizes-chevron {
  color: var(--color-text-dimmed);
  width: 18px;
  height: 18px;
}

.pw-sizes-chevron svg {
  width: 18px;
  height: 18px;
}

.pw-sizes-label {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
}

.pw-element-help {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  white-space: nowrap;
  align-self: center;
}
</style>
