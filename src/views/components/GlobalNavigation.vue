<template>
  <div>
    <section v-for="(group, groupKey) in groups" :key="groupKey" class="pw-element-section">
      <div v-if="!hideSectionHeaders" class="pw-section-header">
        <button class="pw-section-toggle" @click="toggle(groupKey)">
          <span>{{ groupLabel(groupKey) }}</span>
          <k-icon :type="isOpen(groupKey) ? 'angle-down' : 'angle-right'" />
        </button>
      </div>
      <transition name="pw-slide">
        <div v-show="hideSectionHeaders || isOpen(groupKey)" class="pw-element-list">
          <!-- Desktop navigation preview -->
          <div v-if="groupKey === 'desktop' && !hidePreview" class="pw-element-preview-header"><span class="pw-element-preview-header-label">Desktop</span></div>
          <div v-if="groupKey === 'desktop' && !hidePreview" class="pw-element-preview pw-nav-preview" :style="navPreviewBarStyle()">
            <div v-if="navPreviewLogo()" class="pw-nav-preview-logo" :style="navPreviewLogoStyle()"><div :style="{ height: navPreviewLogoSvgHeight() }" v-html="navPreviewLogo()"></div></div>
            <div class="pw-nav-preview-items" :style="navPreviewItemsWrapStyle()">
              <span class="pw-nav-preview-item" v-for="(item, idx) in [{t:'Home',fly:false,home:true},{t:'About',fly:false},{t:'Services',fly:true,flyout:'services'},{t:'Portfolio',fly:true,flyout:'portfolio'},{t:'Contact',fly:false}]" v-if="!item.home || (navGet('home-desktop') || navDef('desktop', 'home-desktop')) === 'true'" :key="idx" :style="navPreviewItemStyle()">
                <span style="display:flex;align-items:center;gap:var(--spacing-1)">{{ item.t }}<span v-if="item.fly" class="pw-nav-preview-flyout-icon" :style="{ color: navPreviewTextColor() }" v-html="navFlyoutIconPath()"></span></span>
                <div v-if="item.flyout && showFlyout && item.flyout === 'services'" class="pw-nav-preview-flyout" :style="navPreviewFlyoutStyle()">
                  <div class="pw-nav-preview-flyout-item" :style="navPreviewFlyoutItemStyle()">Submenu A</div>
                  <div class="pw-nav-preview-flyout-item" :style="navPreviewFlyoutItemStyle()">Submenu B</div>
                  <div class="pw-nav-preview-flyout-item" :style="navPreviewFlyoutItemStyle()">Submenu C</div>
                </div>
              </span>
            </div>
          </div>
          <!-- Tablet navigation preview -->
          <div v-if="groupKey === 'tablet' && !hidePreview" class="pw-element-preview-header"><span class="pw-element-preview-header-label">Tablet</span></div>
          <div v-if="groupKey === 'tablet' && !hidePreview" class="pw-element-preview pw-nav-preview" :style="navPreviewBarStyle('tablet')">
            <div v-if="navPreviewLogo('tablet')" class="pw-nav-preview-logo" :style="navPreviewLogoStyle('tablet')"><div :style="{ height: navPreviewLogoSvgHeight('tablet') }" v-html="navPreviewLogo('tablet')"></div></div>
            <div class="pw-nav-preview-items" :style="navPreviewItemsWrapStyle('tablet')">
              <span class="pw-nav-preview-item" v-for="(item, idx) in [{t:'Home',fly:false,home:true},{t:'About',fly:false},{t:'Services',fly:true,flyout:'t-services'},{t:'Portfolio',fly:true,flyout:'t-portfolio'},{t:'Contact',fly:false}]" v-if="!item.home || (navGet('home-tablet') || navDef('tablet', 'home-tablet')) === 'true'" :key="idx" :style="navPreviewItemStyle('tablet')">
                <span @click.stop="openFlyout = openFlyout === item.flyout ? null : item.flyout" style="cursor:pointer;display:flex;align-items:center;gap:var(--spacing-1)">{{ item.t }}<span v-if="item.fly" class="pw-nav-preview-flyout-icon" :style="{ color: navPreviewTextColor('tablet') }" v-html="navFlyoutIconPath()"></span></span>
                <div v-if="item.flyout && openFlyout === item.flyout" class="pw-nav-preview-flyout" :style="navPreviewFlyoutStyle()">
                  <div class="pw-nav-preview-flyout-item" :style="navPreviewFlyoutItemStyle()">Submenu A</div>
                  <div class="pw-nav-preview-flyout-item" :style="navPreviewFlyoutItemHoverStyle()">Submenu B</div>
                  <div class="pw-nav-preview-flyout-item" :style="navPreviewFlyoutItemStyle()">Submenu C</div>
                </div>
              </span>
            </div>
          </div>
          <!-- Mobile navigation preview -->
          <div v-if="groupKey === 'mobile' && !hidePreview" class="pw-element-preview-header"><span class="pw-element-preview-header-label">Mobile</span></div>
          <div v-if="groupKey === 'mobile' && !hidePreview" class="pw-nav-preview-mobile">
            <div class="pw-nav-preview-mobile-bar" :style="mobileBarStyle()">
              <div v-if="navPreviewLogo('mobile')" :style="{ height: navPreviewLogoSvgHeight('mobile') }" v-html="navPreviewLogo('mobile')"></div>
              <svg viewBox="0 0 24 24" width="20" height="20" :style="{ fill: mobileColorField('mobile-title-color', 'mobile-title-textcolor') }"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/></svg>
            </div>
            <div class="pw-nav-preview-mobile-menu">
              <div v-for="(item, idx) in [{t:'Home',l2:false,active:false,home:true},{t:'About',l2:false,active:false},{t:'Services',l2:true,active:true},{t:'Portfolio',l2:false,active:false},{t:'Contact',l2:false,active:false}]" v-if="!item.home || (navGet('home-mobile') || navDef('mobile', 'home-mobile')) === 'true'" :key="idx">
                <div class="pw-nav-preview-mobile-l1" :style="mobileL1Style(item.active)" :class="{ 'pw-mobile-border': idx > 0 }">
                  {{ item.t }}
                </div>
                <template v-if="item.l2">
                  <div v-for="(sub, sIdx) in [{t:'Submenu A',active:false},{t:'Submenu B',active:true},{t:'Submenu C',active:false}]" :key="'s'+sIdx" class="pw-nav-preview-mobile-l2" :style="mobileL2Style(sub.active)" :class="{ 'pw-mobile-border-l2': true }">
                    {{ sub.t }}
                  </div>
                </template>
              </div>
            </div>
          </div>
          <!-- Grouped fields -->
          <template v-if="!showPreview" v-for="(fieldGroup, gIdx) in groupedFields(group)">
            <!-- Section label -->
            <div v-if="fieldGroup.isLabel" :key="'gl-' + gIdx" class="pw-nav-label">
              {{ fieldGroup.labelText }}
            </div>
            <template v-else>
              <!-- Group header row -->
              <div v-if="fieldGroup.header" :key="'gh-' + gIdx" class="pw-group-header">
                <div class="pw-field-row-label-col"></div>
                <div class="pw-group-header-labels" :class="'pw-group-type-' + fieldGroup.fieldType">
                  <span v-for="label in fieldGroup.header" :key="label" class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t(label) || label }}</span></span>
                </div>
              </div>
              <!-- Field rows in group -->
              <template v-for="(field, fIdx) in fieldGroup.fields">
              <div
                :key="'gf-' + gIdx + '-' + fIdx"
                class="pw-field-row"
                :class="{ 'pw-dual-first': field.isTight, 'pw-dual-next': field.isTightNext }"
              >
                <div class="k-input" data-type="text">
                  <span class="k-input-element pw-field-row-inner">
                    <div class="pw-field-row-label-col">
                      <label class="pw-field-row-label" v-html="field.label"></label>
                    </div>
                    <div class="pw-field-row-options" :class="fieldGroup.header ? 'pw-group-type-' + fieldGroup.fieldType : ''">
                      <!-- Visibility toggle -->
                      <button
                        v-if="field.def.type === 'visibility'"
                        type="button"
                        class="pw-tab-visibility"
                        @click="setValue(field.varName, (getOverrideValue(field.varName) || field.def.value) === 'true' ? 'false' : 'true', field.def.value)"
                      >
                        <k-icon :type="(getOverrideValue(field.varName) || field.def.value) === 'true' ? 'preview' : 'hidden'" />
                      </button>
                      <!-- Icon selector -->
                      <div v-else-if="field.def.type === 'icon-select'" class="pw-icon-select">
                        <button
                          v-for="icon in field.def.options"
                          :key="icon"
                          type="button"
                          class="pw-icon-option"
                          :class="{ 'is-active': (getOverrideValue(field.varName) || field.def.value) === icon && (getOverrideValue(field.varName) || field.def.value) !== 'none' }"
                          @click="toggleIcon(field.varName, icon, field.def.value)"
                          v-html="inlineIcons[icon]"
                        >
                        </button>
                      </div>
                      <!-- Font family selector -->
                      <select
                        v-else-if="field.def.type === 'font-family'"
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
                      <!-- Color group -->
                      <template v-else-if="field.type === 'color-group'">
                        <pw-color-field-row
                          v-for="(cgField, cgName) in field.def.fields"
                          :key="cgName"
                          :group="'nav'"
                          :var-name="cgName"
                          :default-value="cgField.value"
                          :override-value="getOverrideValue(cgName)"
                          @update:value="setValue(cgName, $event || '', cgField.value)"
                        />
                      </template>
                      <!-- Color picker -->
                      <template v-else-if="field.def.type === 'color'">
                        <pw-color-field-row
                          :group="'nav'"
                          :var-name="field.varName"
                          :default-value="field.def.value"
                          :override-value="getOverrideValue(field.varName)"
                          @update:value="setValue(field.varName, $event || '', field.def.value)"
                        />
                      </template>
                      <!-- Multi-value (padding: 1 row, N inputs) -->
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
                      </template>
                      <!-- SVG + dependent height field -->
                      <template v-else-if="field.def.type === 'svg'">
                        <template v-if="getOverrideValue(field.varName)">
                          <label class="pw-svg-preview"><div class="pw-svg-preview-checker" v-html="getOverrideValue(field.varName)"></div><input type="file" accept=".svg" style="display:none" @change="onSvgFileUpload(field.varName, $event, field.def.value)" /></label>
                          <template v-if="dependentField(field.varName)">
                            <span class="pw-element-field">
                              <span class="pw-group-column-label" style="margin-right: var(--spacing-2)">{{ $t('pw.field.height.label') }}</span>
                              <span class="pw-element-input-wrap">
                                <input
                                  type="number"
                                  :step="dependentField(field.varName).def.step || 0.1"
                                  :min="dependentField(field.varName).def.min"
                                  :max="dependentField(field.varName).def.max"
                                  class="pw-element-input pw-element-input-number pw-px-calculator-input"
                                  :class="{ 'is-default': !getOverrideValue(dependentField(field.varName).varName) }"
                                  :value="stripUnit(getOverrideValue(dependentField(field.varName).varName) || dependentField(field.varName).def.value)"
                                  @input="setUnitValue(dependentField(field.varName).varName, $event.target.value, dependentField(field.varName).def.value, dependentField(field.varName).def.unit)"
                                />
                                <span class="pw-element-unit">{{ dependentField(field.varName).def.unit }}</span>
                              </span>
                              <span class="pw-px-calculator">{{ toPx(getOverrideValue(dependentField(field.varName).varName) || dependentField(field.varName).def.value, dependentField(field.varName).def.unit) }}</span>
                            </span>
                          </template>
                        </template>
                        <label v-else class="pw-svg-upload-btn">
                          <k-icon type="upload" />
                          {{ $t('prw.label.upload-svg') }}
                          <input type="file" accept=".svg" style="display:none" @change="onSvgFileUpload(field.varName, $event, field.def.value)" />
                        </label>
                      </template>
                      <!-- Text input -->
                      <input
                        v-else
                        type="text"
                        class="pw-element-input"
                        :placeholder="field.def.value"
                        :value="getOverrideValue(field.varName)"
                        @input="setValue(field.varName, $event.target.value, field.def.value)"
                      />
                    </div>
                  </span>
                </div>
                <k-button v-if="field.def.type === 'svg' && getOverrideValue(field.varName)" class="pw-field-reset" :text="$t('prw.label.remove')" icon="remove" size="xs" variant="filled" @click="removeSvg(field.varName)" />
                <k-button v-else-if="field.def.type !== 'svg' && hasFieldOverride(field.varName, false)" class="pw-field-reset" :text="$t('prw.label.reset')" icon="undo" size="xs" variant="filled" @click="resetNavField(field.varName, false, field.label)" />
              </div>
              </template>
              <!-- Group end spacing -->
              <div v-if="fieldGroup.header" :key="'ge-' + gIdx" class="pw-group-end"></div>
            </template>
          </template>
          <!-- Multi-theme colors -->
          <template v-if="group.colors && !showPreview">
            <div v-if="hasColors(group)" class="pw-group-header">
              <div class="pw-field-row-label-col"></div>
              <div class="pw-group-header-labels pw-group-type-theme-color">
                <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('pw.option.default') }}</span></span>
                <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('pw.option.variant') }}</span></span>
                <span class="pw-group-column-cell"><span class="pw-group-column-label">{{ $t('pw.option.variant2') }}</span></span>
              </div>
            </div>
            <div
              v-for="(colorVal, varName, index) in group.colors"
              :key="'color-' + varName"
              class="pw-field-row"
              :class="{
                'pw-dual-first': isFollowedByColorState(group.colors, index),
                'pw-dual-next': varName.endsWith('-hover') || varName.endsWith('-active'),
              }"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label" v-html="propLabel(varName)"></label>
                  </div>
                  <div class="pw-field-row-options pw-group-type-theme-color">
                    <pw-color-field-row
                      v-for="theme in ['default', 'variant', 'variant2']"
                      :key="theme"
                      :group="theme"
                      :var-name="varName"
                      :default-value="colorVal[theme] || ''"
                      :override-value="getColorOverrideValue(theme, varName)"
                      @update:value="setColorValue(theme, varName, $event, colorVal[theme] || '')"
                    />
                  </div>
                </span>
              </div>
              <k-button v-if="hasFieldOverride(varName, true)" class="pw-field-reset" :text="$t('prw.label.reset')" icon="undo" size="xs" variant="filled" @click="resetNavField(varName, true, propLabel(varName))" />
            </div>
            <div class="pw-group-end"></div>
          </template>
        </div>
      </transition>
    </section>
  </div>
</template>

<script>
export default {
  props: {
    navDefaults: {
      type: Object,
      default: () => ({}),
    },
    navOverrides: {
      type: Object,
      default: () => ({}),
    },
    fonts: {
      type: Object,
      default: () => ({}),
    },
    bodyDefaultFont: {
      type: String,
      default: 'Inter',
    },
    showOnly: {
      type: Array,
      default: null,
    },
    hideVars: {
      type: Array,
      default: null,
    },
    groupLabels: {
      type: Object,
      default: null,
    },
    hideSectionHeaders: {
      type: Boolean,
      default: false,
    },
    savedOverrides: {
      type: Object,
      default: null,
    },
    discardKey: {
      type: Number,
      default: 0,
    },
    showColors: {
      type: Boolean,
      default: false,
    },
    showGroup: {
      type: String,
      default: null,
    },
    showPreview: {
      type: Boolean,
      default: false,
    },
    hidePreview: {
      type: Boolean,
      default: false,
    },
    showFlyout: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      openSections: {},
      openFlyout: null,
      resetFields: new Set(),
      inlineIcons: {
        'arrow-down': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"/></svg>',
        'chevron-down': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
        'caret-down': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>',
        'plus-minus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>',
      },
    };
  },
  watch: {
    savedOverrides() { this.resetFields = new Set(); },
    discardKey() { this.resetFields = new Set(); },
  },
  computed: {
    groups() {
      const result = {};
      for (const [key, val] of Object.entries(this.navDefaults)) {
        if (this.showGroup && key !== this.showGroup) continue;
        if (val && typeof val === 'object' && (val.vars || val.colors)) {
          if (this.showOnly || this.hideVars) {
            const filtered = { ...val };
            if (val.vars) {
              const vars = {};
              for (const [vk, vv] of Object.entries(val.vars)) {
                if (this.showOnly && !this.showOnly.includes(vk)) continue;
                if (this.hideVars && this.hideVars.includes(vk)) continue;
                vars[vk] = vv;
              }
              if (Object.keys(vars).length === 0 && (!val.colors || !this.showColors)) continue;
              filtered.vars = vars;
            }
            if (val.colors && this.showOnly && !this.showColors) continue;
            result[key] = filtered;
          } else {
            result[key] = val;
          }
        }
      }
      return result;
    },
    fontFamilyOptions() {
      const allFonts = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      const seen = new Set();
      // Show "Default" option only if this section doesn't define the body default itself
      const hasBodyDefault = Object.values(this.navDefaults).some(g => g && g.vars && g.vars['font-family-default']);
      const options = hasBodyDefault ? [] : [{ value: 'default', text: 'Default (' + this.bodyDefaultFont + ')' }];
      for (const font of Object.values(allFonts)) {
        if (!seen.has(font.family) && (hasBodyDefault || font.family !== this.bodyDefaultFont)) {
          seen.add(font.family);
          options.push({ value: font.family, text: font.family });
        }
      }
      return options;
    },
  },
  methods: {
    toggle(key) {
      this.$set(this.openSections, key, !this.isOpen(key));
    },
    isOpen(key) {
      return this.openSections[key] !== false;
    },
    groupLabel(key) {
      if (this.groupLabels && this.groupLabels[key]) return this.groupLabels[key];
      const prwKey = 'prw.prop.' + key;
      const prwT = this.$t(prwKey);
      if (prwT && prwT !== prwKey) return prwT;
      return key;
    },
    hasColors(group) {
      return group.colors && Object.keys(group.colors).length > 0;
    },
    isFollowedByColorState(colors, index) {
      const keys = Object.keys(colors);
      const next = keys[index + 1];
      return next && (next.endsWith('-hover') || next.endsWith('-active'));
    },

    // --- Field signature + grouping ---
    fieldSignature(varName, def) {
      if (def.type === 'color-group' && def.fields && def.labels) {
        return { type: 'color-group', labels: def.labels };
      }
      if (Array.isArray(def.value) && def.labels) {
        return { type: 'multi-value', labels: def.labels };
      }
      if (def.default !== undefined && def.lg !== undefined && def.variant === undefined) {
        return { type: 'responsive', labels: ['Mobile', 'Tablet', 'Desktop'] };
      }
      return { type: 'single', labels: null };
    },
    groupedFields(group) {
      const allFields = [];

      if (group.vars) {
        for (const [varName, def] of Object.entries(group.vars)) {
          // Labels break groups
          if (def.type === 'label') {
            allFields.push({ isLabel: true, labelText: varName.replace('_label_', '') });
            continue;
          }
          // Skip fields with requires if dependency not met, or if rendered inline (dependentField)
          if (def.requires) {
            // "field:value" format — show only when field has specific value
            if (def.requires.includes(':')) {
              const [reqField, reqValue] = def.requires.split(':');
              const currentValue = this.getOverrideValue(reqField) || this.getDefaultValue(group, reqField);
              if (currentValue !== reqValue) continue;
            } else {
              if (!this.getOverrideValue(def.requires)) continue;
            }
          }
          const sig = this.fieldSignature(varName, def);
          const isState = varName.endsWith('-hover') || varName.includes('-hover-') || varName.endsWith('-active') || varName.includes('-active-');
          allFields.push({
            varName,
            def,
            label: def.label || this.propLabel(varName),
            type: sig.type,
            sigLabels: sig.labels,
            sigKey: sig.type === 'single' ? 'single-' + varName : sig.type + ':' + (sig.labels || []).join(','),
            isDependent: !!def.requires,
            isState,
          });
        }
      }

      // Mark tight spacing (dependent or state fields get reduced gap)
      for (let i = 0; i < allFields.length; i++) {
        const f = allFields[i];
        f.isTightNext = f.isDependent || f.isState;
        if (i < allFields.length - 1) {
          const next = allFields[i + 1];
          f.isTight = next.isDependent || next.isState;
        }
      }

      // Group consecutive fields with same signature
      const groups = [];
      let currentGroup = null;

      for (const field of allFields) {
        if (field.isLabel) {
          if (currentGroup) {
            groups.push(currentGroup);
            currentGroup = null;
          }
          groups.push({ isLabel: true, labelText: field.labelText });
          continue;
        }

        if (field.type === 'single') {
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

    getDefaultValue(group, varName) {
      const def = group.vars ? group.vars[varName] : null;
      if (!def) return '';
      return def.value || '';
    },
    dependentField() {
      return null;
    },
    toggleIcon(varName, icon, defaultVal) {
      const current = this.getOverrideValue(varName) || defaultVal;
      if (current === icon) {
        this.setValue(varName, 'none', defaultVal);
      } else {
        this.setValue(varName, icon, defaultVal);
      }
    },
    sanitizeSvg(raw) {
      if (!raw) return '';
      // Remove XML prolog, DOCTYPE, comments
      let svg = raw.replace(/<\?xml[^?]*\?>\s*/gi, '')
                    .replace(/<!DOCTYPE[^>]*>\s*/gi, '')
                    .replace(/<!--[\s\S]*?-->\s*/g, '');
      // Extract just the <svg>...</svg>
      const match = svg.match(/<svg[\s\S]*<\/svg>/i);
      if (!match) return '';
      svg = match[0];
      // Replace percentage or missing width/height with real values from viewBox
      const vbMatch = svg.match(/viewBox=["'][\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)["']/);
      if (vbMatch) {
        const w = Math.round(parseFloat(vbMatch[1]));
        const h = Math.round(parseFloat(vbMatch[2]));
        // Remove existing width/height
        svg = svg.replace(/(<svg[^>]*?)\s+width="[^"]*"/i, '$1');
        svg = svg.replace(/(<svg[^>]*?)\s+height="[^"]*"/i, '$1');
        // Add real dimensions
        svg = svg.replace(/<svg/, '<svg width="' + w + '" height="' + h + '"');
      }
      return svg.trim();
    },
    onSvgFileUpload(varName, event, defaultVal) {
      const file = event.target.files[0];
      event.target.value = '';
      if (!file || !file.name.endsWith('.svg')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const cleaned = this.sanitizeSvg(reader.result);
        if (!cleaned) {
          this.$panel.notification.error('No valid SVG found');
          return;
        }
        const dims = this.parseSvgDimensions(cleaned);
        if (!dims) {
          this.$panel.notification.error('SVG must have a viewBox or width/height attributes');
          return;
        }
        this.onSvgInput(varName, cleaned, defaultVal);
      };
      reader.readAsText(file);
    },
    removeSvg(varName) {
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));
      if (overrides.global) {
        delete overrides.global[varName];
        delete overrides.global[varName + '-width'];
        delete overrides.global[varName + '-height'];
        if (Object.keys(overrides.global).length === 0) {
          delete overrides.global;
        }
      }
      this.$emit('update:overrides', overrides);
    },
    onSvgInput(varName, value, defaultVal) {
      if (!value) {
        this.setValue(varName, '', defaultVal);
        return;
      }
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));
      if (!overrides.global) overrides.global = {};
      overrides.global[varName] = value;

      const dims = this.parseSvgDimensions(value);
      if (dims) {
        overrides.global[varName + '-width'] = String(dims.width);
        overrides.global[varName + '-height'] = String(dims.height);
      }

      this.$emit('update:overrides', overrides);
    },
    parseSvgDimensions(svgCode) {
      if (!svgCode || !svgCode.includes('<svg')) return null;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCode, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) return null;
        const vb = svg.getAttribute('viewBox');
        if (vb) {
          const parts = vb.trim().split(/\s+/);
          if (parts.length === 4) {
            return { width: Math.round(parseFloat(parts[2])), height: Math.round(parseFloat(parts[3])) };
          }
        }
        const w = parseFloat(svg.getAttribute('width'));
        const h = parseFloat(svg.getAttribute('height'));
        if (w && h) return { width: Math.round(w), height: Math.round(h) };
        return null;
      } catch (e) {
        return null;
      }
    },
    filteredOptions(varName, options) {
      if (!varName.endsWith('font-weight')) {
        return options.map(o => ({ value: String(o), text: this.optionLabel(o) }));
      }
      const prefix = varName.replace('font-weight', '');
      const fontFamilyVar = prefix + 'font-family';
      const selectedFamily = this.getOverrideValue(fontFamilyVar);
      const font = this.getFontByFamily(selectedFamily);
      if (!font || !font.files || !font.files.length) {
        return options.map(o => ({ value: String(o), text: this.optionLabel(o) }));
      }
      const weight = font.files[0].weight || '400';
      const parts = weight.split(' ');
      if (parts.length === 2) {
        const min = parseInt(parts[0]);
        const max = parseInt(parts[1]);
        return options.filter(o => {
          const n = parseInt(o);
          return n >= min && n <= max;
        }).map(o => ({ value: String(o), text: this.optionLabel(o) }));
      }
      return [{ value: parts[0], text: this.optionLabel(parts[0]) }];
    },
    getFontByFamily(family) {
      if (!family) {
        for (const group of Object.values(this.navDefaults)) {
          if (group.vars && group.vars['font-family']) {
            family = group.vars['font-family'].value;
            break;
          }
        }
      }
      const allFonts = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      return Object.values(allFonts).find(f => f.family === family) || null;
    },
    optionLabel(val) {
      const pwKey = 'pw.option.' + val;
      const pwT = this.$t(pwKey);
      if (pwT && pwT !== pwKey) return pwT;
      return String(val);
    },
    propLabel(varName) {
      const tKey = 'prw.prop.' + varName;
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
    getQuadValue(varName, index) {
      const override = (this.navOverrides.global || {})[varName];
      if (Array.isArray(override)) return override[index] || '';
      return '';
    },
    setQuadValue(varName, index, value, def) {
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));
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
      if (unit === '' && num > 0) return Math.round(num * 16) + 'px';
      return '';
    },
    getColorOverrideValue(theme, varName) {
      return ((this.navOverrides.global || {})[theme] || {})[varName] || '';
    },
    setColorValue(theme, varName, value, defaultVal) {
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));

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
    getResponsiveOverride(varName, bp) {
      return ((this.navOverrides.global || {})[bp] || {})[varName] || '';
    },
    setResponsiveValue(varName, bp, value, defaultVal, unit) {
      const withUnit = value === '' ? '' : value + (unit || '');
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));

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
    hasFieldOverride(varName, isColor) {
      if (!this.savedOverrides) return false;
      if (this.resetFields.has(varName)) return false;
      const saved = this.savedOverrides.global || {};
      if (isColor) {
        for (const theme of ['default', 'variant', 'variant2']) {
          if ((saved[theme] || {})[varName]) return true;
        }
        return false;
      }
      for (const bp of ['default', 'lg', 'xl']) {
        if ((saved[bp] || {})[varName]) return true;
      }
      return !!saved[varName];
    },
    async resetNavField(varName, isColor, label) {
      const name = label ? label.replace(/<[^>]*>/g, '') : varName;
      try {
        await new Promise((resolve, reject) => {
          this.$panel.dialog.open({
            component: 'k-text-dialog',
            props: {
              text: (this.$t('prw.label.reset-confirm') || 'Reset "{field}" to default?').replace('{field}', name),
              submitBtn: { text: this.$t('prw.label.reset'), icon: 'undo', theme: 'negative' },
            },
            on: {
              submit: () => { this.$panel.dialog.close(); resolve(); },
              cancel: () => reject(),
            },
          });
        });
      } catch (e) { return; }
      this.resetFields.add(varName);
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));
      if (!overrides.global) return;
      if (isColor) {
        for (const theme of ['default', 'variant', 'variant2']) {
          if (overrides.global[theme]) {
            delete overrides.global[theme][varName];
            if (Object.keys(overrides.global[theme]).length === 0) delete overrides.global[theme];
          }
        }
      } else {
        delete overrides.global[varName];
        for (const bp of ['default', 'lg', 'xl']) {
          if (overrides.global[bp]) {
            delete overrides.global[bp][varName];
            if (Object.keys(overrides.global[bp]).length === 0) delete overrides.global[bp];
          }
        }
      }
      if (overrides.global && Object.keys(overrides.global).length === 0) delete overrides.global;
      this.$emit('update:overrides', overrides);
    },
    navGet(v) { return this.getOverrideValue(v); },
    navDef(groupKey, varName) {
      const group = this.navDefaults[groupKey];
      if (!group || !group.vars) return '';
      const d = group.vars[varName];
      if (!d) return '';
      if (d.default !== undefined) return d.default;
      return d.value || '';
    },
    navColorField(groupKey, colorGroupVar, fieldName) {
      return this.navGet(fieldName) ||
        (this.navDefaults[groupKey]?.vars?.[colorGroupVar]?.fields?.[fieldName]?.value) || '';
    },
    navQuadValue(varName) {
      const override = (this.navOverrides.global || {})[varName];
      if (Array.isArray(override)) return override.join(' ');
      const group = this.navDefaults.desktop;
      if (group?.vars?.[varName]?.value) return group.vars[varName].value.join(' ');
      return '0';
    },
    navPreviewBarStyle(device) {
      const d = device || 'desktop';
      const bgColor = this.navGet(d + '-background') || this.navDef(d, d + '-background') ||
        this.navColorField(d, d + '-color', d + '-bgcolor') ||
        (d === 'tablet' ? (this.navGet('desktop-background') || this.navDef('desktop', 'desktop-background')) : '') || '#FFFFFF';
      const height = this.navGet(d + '-height') || this.navDef(d, d + '-height');
      return { backgroundColor: bgColor, height: height };
    },
    navPreviewLogo(device) {
      const d = device || 'desktop';
      return this.navGet(d + '-logo-src') || '';
    },
    navPreviewLogoStyle(device) {
      const d = device || 'desktop';
      const align = this.navGet(d + '-logo-align') || this.navDef(d, d + '-logo-align');
      const padding = this.navQuadValue(d + '-logo-padding');
      return { alignSelf: align, padding: padding };
    },
    navPreviewLogoSvgHeight(device) {
      const d = device || 'desktop';
      return this.navGet(d + '-logo-display-height') ||
        (this.navDefaults[d]?.vars?.[d + '-logo-display-height']?.value) || '2rem';
    },
    navPreviewItemsWrapStyle(device) {
      const d = device || 'desktop';
      const align = this.navGet(d + '-items-align') || this.navDef(d, d + '-items-align');
      const padding = this.navQuadValue(d + '-items-padding');
      return { alignItems: align, padding: padding };
    },
    navPreviewTextColor(device) {
      const d = device || 'desktop';
      return this.navGet(d + '-textcolor') || this.navDef(d, d + '-textcolor') ||
        this.navColorField(d, d + '-color', d + '-textcolor') ||
        (d === 'tablet' ? (this.navGet('desktop-textcolor') || this.navDef('desktop', 'desktop-textcolor')) : '') || '#101828';
    },
    navPreviewItemStyle(device) {
      const bp = device === 'tablet' ? 'lg' : 'xl';
      const getResponsive = (varName) => {
        const override = ((this.navOverrides.global || {})[bp] || {})[varName];
        if (override) return override;
        return this.navDef('general', varName);
      };
      let fontFamily = this.navGet('font-family') || this.navDef('general', 'font-family');
      if (!fontFamily || fontFamily === 'default') fontFamily = this.bodyDefaultFont;
      const allFonts = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      let fontCategory = 'sans-serif';
      for (const f of Object.values(allFonts)) {
        if (f.family === fontFamily) { fontCategory = f.category || 'sans-serif'; break; }
      }
      return {
        fontFamily: "'" + fontFamily + "', " + fontCategory,
        fontWeight: this.navGet('font-weight') || this.navDef('general', 'font-weight'),
        fontSize: getResponsive('font-size'),
        lineHeight: getResponsive('line-height'),
        letterSpacing: getResponsive('letter-spacing'),
        textTransform: this.navGet('text-transform') || this.navDef('general', 'text-transform'),
        color: this.navPreviewTextColor(device),
      };
    },
    mobileColorField(colorGroup, field) {
      return this.navColorField('mobile', colorGroup, field) || '#101828';
    },
    mobileBarStyle() {
      const bg = this.mobileColorField('mobile-title-color', 'mobile-title-bgcolor');
      const height = this.navGet('mobile-height') || this.navDef('mobile', 'mobile-height');
      return { backgroundColor: bg, height: height };
    },
    mobileL1Style(active) {
      const group = active ? 'mobile-l1-active-color' : 'mobile-l1-color';
      const textField = active ? 'mobile-l1-active-textcolor' : 'mobile-l1-textcolor';
      const bgField = active ? 'mobile-l1-active-bgcolor' : 'mobile-l1-bgcolor';
      return {
        color: this.mobileColorField(group, textField),
        backgroundColor: this.mobileColorField(group, bgField),
        borderColor: this.navGet('mobile-l1-bordercolor') ||
          (this.navDefaults.mobile?.vars?.['mobile-l1-bordercolor']?.value) || '#00000025',
      };
    },
    mobileL2Style(active) {
      const group = active ? 'mobile-l2-active-color' : 'mobile-l2-color';
      const textField = active ? 'mobile-l2-active-textcolor' : 'mobile-l2-textcolor';
      const bgField = active ? 'mobile-l2-active-bgcolor' : 'mobile-l2-bgcolor';
      return {
        color: this.mobileColorField(group, textField),
        backgroundColor: this.mobileColorField(group, bgField),
        borderColor: this.navGet('mobile-l2-bordercolor') ||
          (this.navDefaults.mobile?.vars?.['mobile-l2-bordercolor']?.value) || '#00000015',
      };
    },
    navPreviewFlyoutColor(name) {
      return this.navGet(name) || this.navDef('desktop', name) || '';
    },
    navPreviewFlyoutStyle() {
      return {
        backgroundColor: this.navPreviewFlyoutColor('flyout-bgcolor') || '#ffffff',
        borderColor: 'transparent',
        minWidth: this.navGet('desktop-flyout-min-width') || this.navDef('desktop', 'desktop-flyout-min-width') || '10rem',
      };
    },
    navPreviewFlyoutItemStyle() {
      return {
        color: this.navPreviewFlyoutColor('flyout-textcolor') || '#101828',
        backgroundColor: this.navPreviewFlyoutColor('flyout-bgcolor') || '#ffffff',
        borderBottomColor: this.navPreviewFlyoutColor('flyout-bordercolor') || '#00000025',
      };
    },
    navPreviewFlyoutItemHoverStyle() {
      return {
        color: this.navPreviewFlyoutColor('flyout-textcolor-hover') || '#ffffff',
        backgroundColor: this.navPreviewFlyoutColor('flyout-bgcolor-hover') || '#1D548B',
      };
    },
    navFlyoutIconPath() {
      const icon = this.navGet('desktop-flyout-icon') || this.navDef('desktop', 'desktop-flyout-icon') || 'arrow-down';
      const paths = {
        'arrow-down': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 16l-6-6h12z"/></svg>',
        'chevron-down': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
        'caret-down': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 10l4 4 4-4z"/></svg>',
        'plus-minus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>',
      };
      return paths[icon] || paths['arrow-down'];
    },
    getOverrideValue(varName) {
      return (this.navOverrides.global || {})[varName] || '';
    },
    fontSelectValue(varName, defValue) {
      const ov = this.getOverrideValue(varName);
      if (ov && ov === this.bodyDefaultFont && this.fontFamilyOptions.some(o => o.value === 'default')) return 'default';
      return ov || defValue;
    },
    setValue(varName, value, defaultVal) {
      const overrides = JSON.parse(JSON.stringify(this.navOverrides));

      if (value === '' || value === defaultVal || value === String(defaultVal)) {
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
  },
};
</script>

<style>
/* Uses pw-element-* and pw-group-* classes from GlobalElementStyles */

/* pw-field-reset is defined in GlobalElementStyles but we need pw-field-row position:relative here too */

.pw-nav-preview {
  display: flex;
  padding: 0 var(--spacing-6);
  margin-bottom: var(--spacing-2);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.pw-nav-preview-items {
  display: flex;
  flex: 1;
  gap: var(--spacing-6);
}

.pw-nav-preview-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  position: relative;
  transition: color 0.15s;
}

.pw-nav-preview-flyout-icon {
  display: inline-flex;
  align-items: center;
  opacity: 0.6;
  flex-shrink: 0;
}

.pw-nav-preview-flyout-icon svg {
  width: 16px;
  height: 16px;
}

.pw-nav-preview-flyout {
  position: absolute;
  top: 100%;
  left: 0;
  border: none;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  z-index: 1;
}

.pw-nav-preview-flyout-item {
  padding: var(--spacing-2) var(--spacing-3);
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
  border-bottom: 1px solid transparent;
}

.pw-nav-preview-flyout-item:last-child {
  border-bottom: none;
}

.pw-nav-preview-mobile {
  margin-bottom: var(--spacing-2);
  max-width: 320px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.pw-nav-preview-mobile-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-4);
}

.pw-nav-preview-mobile-bar > svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.pw-nav-preview-mobile-menu {
  font-size: 0.875rem;
}

.pw-nav-preview-mobile-l1 {
  padding: var(--spacing-3) var(--spacing-4);
}

.pw-mobile-border {
  border-top: 1px solid;
}

.pw-nav-preview-mobile-l2 {
  padding: var(--spacing-2) var(--spacing-4) var(--spacing-2) var(--spacing-8);
}

.pw-mobile-border-l2 {
  border-top: 1px solid;
}

.pw-nav-preview-logo {
  display: flex;
  align-items: center;
  margin-right: var(--spacing-6);
  flex-shrink: 0;
}

.pw-nav-preview-logo svg {
  height: 100%;
  width: auto;
}

.pw-svg-preview {
  height: 30px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.15s;
  display: flex;
  align-items: center;
}

.pw-svg-preview:hover {
  opacity: 1;
}

.pw-svg-preview-checker {
  display: inline-flex;
  padding: 4px;
  border-radius: var(--rounded);
  background-image:
    linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
  height: 100%;
}

.pw-svg-preview-checker svg {
  height: 100%;
  width: auto;
}


.pw-svg-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-gray-100);
  border: 1px dashed var(--color-border);
  border-radius: var(--rounded);
  font-size: var(--text-sm);
  cursor: pointer;
}

.pw-svg-upload-btn:hover {
  background: var(--color-gray-200);
}

.pw-icon-select {
  display: flex;
  gap: 0;
}

.pw-icon-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 26px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  cursor: pointer;
  margin-left: -1px;
}

.pw-icon-option:first-child {
  border-radius: var(--rounded) 0 0 var(--rounded);
  margin-left: 0;
}

.pw-icon-option:last-child {
  border-radius: 0 var(--rounded) var(--rounded) 0;
}

.pw-icon-option svg {
  width: 14px;
  height: 14px;
}

.pw-icon-option.is-active {
  background: var(--color-blue-600);
  color: var(--color-white);
  border-color: var(--color-blue-600);
  z-index: 1;
  position: relative;
}


.pw-nav-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
  color: var(--color-text-dimmed);
  padding: var(--spacing-4) var(--spacing-3) var(--spacing-1);
}

/* Color-group header labels align over color pickers */
.pw-group-type-color-group {
  gap: var(--spacing-4);
}

.pw-group-type-color-group .pw-group-column-cell {
  width: 160px;
}

.pw-state-pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  padding: 1px var(--spacing-2);
  border-radius: 999px;
  white-space: nowrap;
  vertical-align: middle;
}

.pw-state-hover {
  color: #5b21b6;
  background: #ede9fe;
  border: 1px solid #c4b5fd;
}

.pw-state-active {
  color: #5b21b6;
  background: #ede9fe;
  border: 1px solid #c4b5fd;
}
</style>
