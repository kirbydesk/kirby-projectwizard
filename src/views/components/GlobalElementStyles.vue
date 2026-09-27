<template>
  <div>
    <section v-for="(group, groupKey) in groups" :key="groupKey" v-show="isElementVisible(groupKey) && !isChildElement(groupKey)" class="pw-element-section">
      <div class="pw-element-list">
          <!-- Preview -->
          <pw-portal v-if="previewText(groupKey) && !isChildElement(groupKey)" to=".pw-wizard .pw-preview-column">
          <div v-show="previewActive && isElementVisible(groupKey)" class="pw-element-preview-side">
          <!-- toolbar: the theme (the device follows the switch in the rows) -->
          <div class="pw-preview-switches">
          <!-- theme shown in the preview (shared with the colour switch) -->
          <div class="pw-pill pw-preview-bp pw-preview-theme" role="group">
            <button
              v-for="theme in themes"
              :key="'pt-' + theme"
              type="button"
              class="pw-tool"
              :aria-pressed="colorTheme === theme ? 'true' : 'false'"
              @click="colorTheme = theme"
            >{{ $t('pw.option.' + theme) }}</button>
          </div>
          <!-- guides on/off (shared by all previews) -->
          <div class="pw-pill pw-guides-switch" role="group">
            <button
              type="button"
              class="pw-tool"
              :title="$t('prw.preview.guides')"
              :aria-label="$t('prw.preview.guides')"
              :aria-pressed="guides ? 'true' : 'false'"
              @click="$emit('update:guides', !guides)"
            >
              <k-icon type="prw-guides" />
            </button>
          </div>
          <pw-device-select v-model="previewBp" />
          </div>
          <div class="pw-element-preview" :class="{ 'pw-element-preview-themed': previewThemed(groupKey), 'has-guides': guides, 'is-marked': groupKey === 'heading' && previewMarked }">
            <template v-for="theme in [colorTheme]">
              <div v-for="bp in [previewBp]" :key="theme + '-' + bp" class="pw-element-preview-col" :style="{ backgroundColor: blockBackground(theme) }">
                <template v-if="groupKey === 'media'">
                  <!-- the media: its background with a placeholder, or (switch in the
                       card heading) a drawn sample image with the zoom button -->
                  <div v-if="!previewMediaImage" class="pw-media-preview-img" :style="mediaPreviewStyle(theme)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                  <div v-else class="pw-media-preview-img pw-media-preview-photo" :style="mediaPreviewStyle(theme)">
                    <span class="pw-media-preview-zoom" :style="{ color: mediaColor(theme, 'element-image-zoom'), backgroundColor: mediaColor(theme, 'element-image-zoom-background') }">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </span>
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
                  <!-- two buttons, so the gap between them shows -->
                  <span class="pw-element-preview-buttons" :style="{ columnGap: buttonGap(), rowGap: buttonGap('button-row-gap'), '--pw-button-gap': buttonGap() }">
                    <span class="pw-element-preview-button" :style="previewButtonStyle(groupKey, theme, bp)"><span class="pw-button-content"><span v-if="groupKey === 'button'" class="pw-preview-link-icon" :style="previewButtonIconStyle(theme, bp)"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>{{ previewText(groupKey) }}</span></span>
                    <span class="pw-element-preview-button pw-element-preview-button-second" :style="previewButtonStyle(groupKey, theme, bp)"><span class="pw-button-content"><span v-if="groupKey === 'button'" class="pw-preview-link-icon" :style="previewButtonIconStyle(theme, bp)"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>{{ $t('prw.sample.button.2') }}</span></span>
                    <!-- a third button in a row of its own, so the gap between rows shows -->
                    <span class="pw-element-preview-buttons-row" :style="{ '--pw-button-row-gap': buttonGap('button-row-gap') }">
                      <span class="pw-element-preview-button" :style="previewButtonStyle(groupKey, theme, bp)"><span class="pw-button-content"><span v-if="groupKey === 'button'" class="pw-preview-link-icon" :style="previewButtonIconStyle(theme, bp)"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>{{ $t('prw.sample.button.3') }}</span></span>
                    </span>
                  </span>
                </template>
                <template v-else-if="previewParagraphs(groupKey)">
                  <div class="pw-element-preview-text pw-element-preview-paragraphs" :style="previewStyle(groupKey, bp, theme)">
                    <p v-for="(para, pIdx) in previewParagraphs(groupKey)" :key="pIdx" :style="pIdx > 0 ? { marginTop: previewParagraphGap(groupKey) } : {}">{{ para }}</p>
                  </div>
                </template>
                <template v-else>
                  <!-- Heading: plain, or marked (switch in the toolbar) with the marked line height -->
                  <span v-if="groupKey === 'heading' && previewMarked" class="pw-element-preview-text pw-element-preview-marked" :style="previewStyle(groupKey, bp, theme, true)" v-html="previewHtml(groupKey, theme)"></span>
                  <span v-else class="pw-element-preview-text" :style="previewStyle(groupKey, bp, theme)" v-html="previewHtml(groupKey, theme, groupKey === 'heading')"></span>
                  <!-- flourish below the heading (switch in its card) -->
                  <span v-if="groupKey === 'heading' && previewFlourish" class="pw-element-preview-flourish-box" :style="flourishBoxStyle(bp, theme)">
                    <span class="pw-element-preview-flourish" :style="flourishStyle(bp, theme)"></span>
                  </span>
                </template>
                <template v-if="previewChildText(groupKey) && groupKey !== 'media'">
                  <!-- the source keeps its gap to the quote (cite-spacing) -->
                  <span
                    class="pw-element-preview-text"
                    :class="{ 'pw-element-preview-cite': previewChildKey(groupKey) === 'cite' }"
                    :style="{ ...previewStyle(previewChildKey(groupKey), bp, theme), ...citeGapStyle(previewChildKey(groupKey)) }"
                  >{{ previewChildText(groupKey) }}</span>
                </template>
              </div>
            </template>
          </div>
          </div>
          </pw-portal>
          <!-- One section per former subtab (Text, Sizes, Flourish, Colors): heading above a card with the rows in the table look -->
          <template v-for="st in combinedSubtabs(groupKey)">
          <h2 v-if="st.partLabel" :key="'part-' + st.key" class="pw-part-heading">{{ st.partLabel }}</h2>
          <section :key="'card-' + st.key" class="pw-card-section">
            <div class="pw-card-heading-row">
              <h3 class="pw-card-heading">{{ st.label }}</h3>
              <!-- media: show a sample image in the preview (just the icon) -->
              <button
                v-if="st.elementKey === 'media' && st.category === 'colors'"
                type="button"
                class="pw-marked-switch pw-image-switch"
                :title="$t('prw.label.showImage')"
                :aria-label="$t('prw.label.showImage')"
                :aria-pressed="previewMediaImage ? 'true' : 'false'"
                @click="previewMediaImage = !previewMediaImage"
              >
                <k-icon type="image" />
              </button>
              <!-- flourish: show it in the preview (just the eye icon) -->
              <button
                v-else-if="st.category === 'flourish'"
                type="button"
                class="pw-marked-switch"
                :title="$t('prw.label.showInPreview')"
                :aria-label="$t('prw.label.showInPreview')"
                :aria-pressed="previewFlourish ? 'true' : 'false'"
                @click="previewFlourish = !previewFlourish"
              >
                <k-icon :type="previewFlourish ? 'preview' : 'hidden'" />
              </button>
              <!-- text marking: show it in the preview (just the eye icon) -->
              <button
                v-else-if="st.category === 'marked'"
                type="button"
                class="pw-marked-switch"
                :title="$t('prw.label.showInPreview')"
                :aria-label="$t('prw.label.showInPreview')"
                :aria-pressed="previewMarked ? 'true' : 'false'"
                @click="previewMarked = !previewMarked"
              >
                <k-icon :type="previewMarked ? 'preview' : 'hidden'" />
              </button>
              <!-- colours: choose the theme, the rows show only its value -->
              <span v-if="hasColorRows(st.category) && groupedColorFields(stInfo(st).group, st.category).length" class="pw-pill pw-theme-switch" role="group">
                <button
                  v-for="theme in themes"
                  :key="'th-' + theme"
                  type="button"
                  class="pw-tool"
                  :aria-pressed="colorTheme === theme ? 'true' : 'false'"
                  @click="colorTheme = theme"
                >{{ $t('pw.option.' + theme) }}</button>
              </span>
              <!-- size steps: the step edited in the font size row and shown in
                   the preview ("normal" = the base size, if the element has one) -->
              <span
                v-else-if="st.category === 'sizes' && fontSizesForGroup(stInfo(st).elementKey)"
                class="pw-pill pw-theme-switch"
                role="group"
              >
                <button
                  v-for="step in sizeStepOptions(stInfo(st).elementKey)"
                  :key="'fs-' + step"
                  type="button"
                  class="pw-tool"
                  :aria-pressed="stepOf(stInfo(st).elementKey) === step ? 'true' : 'false'"
                  @click="$set(previewSteps, stInfo(st).elementKey, step)"
                >{{ $t('pw.option.' + step) }}</button>
              </span>
            </div>
            <div class="pw-card pw-field-table">
          <!-- Text / Sizes fields -->
          <template v-if="stInfo(st).category !== 'colors'">
          <!-- the size step chosen in the card heading as a row of its own
               (headings have no base size; without a step "lg" applies) -->
          <template v-if="stInfo(st).category === 'sizes' && fontSizesForGroup(stInfo(st).elementKey) && stepOf(stInfo(st).elementKey) !== 'normal'">
              <div
                v-for="(sizeEntry, sizeName) in chosenStep(stInfo(st).elementKey)"
                :key="'sz-' + sizeName"
                class="pw-field-row"
              >
                <div class="k-input" data-type="text">
                  <span class="k-input-element pw-field-row-inner">
                    <div class="pw-field-row-label-col">
                      <label class="pw-field-row-label">{{ $t('prw.prop.font-size') }}</label>
                    </div>
                    <div class="pw-field-row-options">
                      <span v-for="bp in [previewBp]" :key="bp" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            v-pw-autosize
                            type="text"
                            inputmode="decimal"
                            :step="sizeEntry.step || 0.1"
                            :min="sizeEntry.min"
                            :max="sizeEntry.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :value="stripUnit(getFontSizeOverride(bp, sizeName) || sizeEntry[bp])"
                            @change="setFontSizeValue(bp, sizeName, $event.target.value, sizeEntry[bp], sizeEntry.unit)"
                          />
                          <span class="pw-element-unit">{{ sizeEntry.unit || 'rem' }}</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getFontSizeOverride(bp, sizeName) || sizeEntry[bp], sizeEntry.unit || 'rem') }}</span>
                      </span>
                      <!-- switch the breakpoint (shared with the preview) -->
                      <span class="pw-pill pw-bp-switch" role="group">
                        <button
                          v-for="b in ['default', 'lg', 'xl']"
                          :key="'sw-' + b"
                          type="button"
                          class="pw-tool"
                          :title="bpLabel(b)"
                          :aria-label="bpLabel(b)"
                          :aria-pressed="previewBp === b ? 'true' : 'false'"
                          @click="previewBp = b"
                        ><k-icon :type="bpIcon(b)" /></button>
                      </span>
                    </div>
                  </span>
                </div>
              </div>
          </template>
          <template v-for="(fieldGroup, gIdx) in groupedVarFields(stInfo(st).group, stInfo(st).category)">
            <!-- Group header row -->
            <div v-if="fieldGroup.header && !isCornerGroup(fieldGroup)" :key="'vgh-' + gIdx" class="pw-group-header">
              <div class="pw-field-row-label-col"></div>
              <div class="pw-group-header-labels" :class="'pw-group-type-' + fieldGroup.fieldType">
                <span v-for="label in fieldGroup.header" :key="label" class="pw-group-column-cell"><span class="pw-group-column-label">{{ translateLabel(label) }}</span></span>
              </div>
            </div>
            <!-- Field rows in group -->
            <template v-for="(field, fIdx) in fieldGroup.fields">
            <!-- four values by side (paddings): a row per axis, horizontal
                 (left, right) and vertical (top, bottom), with the side icons -->
            <template v-if="isSides(field.def)">
              <div
                v-for="axis in [{ key: 'h', label: 'prw.label.leftRight', idx: [3, 1] }, { key: 'v', label: 'prw.label.topBottom', idx: [0, 2] }]"
                :key="'ax-' + gIdx + '-' + fIdx + '-' + axis.key"
                class="pw-field-row"
                :data-guide="guides ? 'padding' : null"
              >
                <div class="k-input" data-type="text">
                  <span class="k-input-element pw-field-row-inner">
                    <div class="pw-field-row-label-col">
                      <label class="pw-field-row-label">{{ $t(axis.label) }}</label>
                    </div>
                    <div class="pw-field-row-options pw-corner-grid pw-side-grid pw-axis-grid">
                      <span v-for="idx in axis.idx" :key="idx" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            v-pw-autosize
                            type="text"
                            inputmode="decimal"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number"
                            :value="stripUnit(getQuadValue(field.varName, idx) || field.def.value[idx])"
                            @change="setQuadValue(field.varName, idx, $event.target.value, field.def)"
                          />
                          <span class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span v-if="field.def.unit !== 'px'" class="pw-px-calculator">{{ toPx(getQuadValue(field.varName, idx) || field.def.value[idx], field.def.unit) }}</span>
                        <k-icon :type="['grid-top', 'grid-right', 'grid-bottom', 'grid-left'][idx]" class="pw-side-icon" />
                      </span>
                    </div>
                  </span>
                </div>
              </div>
            </template>
            <!-- the base font size only while the step "normal" is chosen; the
                 button's corner radii only for custom corners -->
            <div
              v-else-if="!(field.varName.endsWith('-font-size') && fontSizesForGroup(stInfo(st).elementKey) && stepOf(stInfo(st).elementKey) !== 'normal') && !(field.varName === 'button-border-radius' && buttonShape() !== 'custom')"
              :key="'vf-' + gIdx + '-' + fIdx"
              class="pw-field-row"
              :data-guide="guideType(field.varName)"
              :class="{
                'pw-dual-first': field.isFollowedByState,
                'pw-dual-next': field.isState,
              }"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label" v-html="field.label"></label>
                  </div>
                  <div class="pw-field-row-options" :class="[fieldGroup.header ? 'pw-group-type-' + fieldGroup.fieldType : '', { 'pw-corner-grid': isCorners(field.def) || isSides(field.def), 'pw-side-grid': isSides(field.def) }]">
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
                            v-pw-autosize
                            type="text"
                            inputmode="decimal"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :value="stripUnit(getQuadValue(field.varName, idx) || val)"
                            @change="setQuadValue(field.varName, idx, $event.target.value, field.def)"
                          />
                          <span class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span v-if="field.def.unit !== 'px'" class="pw-px-calculator">{{ toPx(getQuadValue(field.varName, idx) || val, field.def.unit) }}</span>
                        <!-- paddings: the side as Kirby's grid icon -->
                        <k-icon v-if="isSides(field.def)" :type="['grid-top', 'grid-right', 'grid-bottom', 'grid-left'][idx]" class="pw-side-icon" />
                      </span>
                    </template>
                    <!-- Responsive -->
                    <template v-else-if="field.type === 'responsive'">
                      <span v-for="bp in [previewBp]" :key="bp" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            v-pw-autosize
                            type="text"
                            inputmode="decimal"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :value="stripUnit(getResponsiveOverride(field.varName, bp) || field.def[bp])"
                            @change="setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit)"
                          />
                          <span class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span v-if="field.def.unit !== 'px'" class="pw-px-calculator">{{ toPx(getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit) }}</span>
                      </span>
                      <!-- switch the breakpoint (shared with the preview) -->
                      <span class="pw-pill pw-bp-switch" role="group">
                        <button
                          v-for="b in ['default', 'lg', 'xl']"
                          :key="'sw-' + b"
                          type="button"
                          class="pw-tool"
                          :title="bpLabel(b)"
                          :aria-label="bpLabel(b)"
                          :aria-pressed="previewBp === b ? 'true' : 'false'"
                          @click="previewBp = b"
                        ><k-icon :type="bpIcon(b)" /></button>
                      </span>
                    </template>
                    <!-- Single value with unit -->
                    <template v-else-if="field.def.unit !== undefined">
                      <span class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            v-pw-autosize
                            type="text"
                            inputmode="decimal"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :value="stripUnit(getOverrideValue(field.varName) || field.def.value)"
                            @change="setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit)"
                          />
                          <span class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span v-if="field.def.unit !== 'px'" class="pw-px-calculator">{{ toPx(getOverrideValue(field.varName) || field.def.value, field.def.unit) }}</span>
                      </span>
                    </template>
                  </div>
                </span>
              </div>
              <k-button v-if="hasFieldOverride(field)" class="pw-field-reset" :text="$t('prw.label.reset')" :title="$t('prw.label.reset')" icon="undo" size="xs" variant="filled" @click="resetField(field)" />
            </div>
            <!-- style card: the colours (border, background) right after the
                 border width, before the shadow -->
            <template v-if="stInfo(st).category === 'style' && field.varName === 'button-border-width'">
              <div
                v-for="colorField in (groupedColorFields(stInfo(st).group, 'style')[0] || {}).fields || []"
                :key="'sc-' + colorField.varName"
                class="pw-field-row"
              >
                <div class="k-input" data-type="text">
                  <span class="k-input-element pw-field-row-inner">
                    <div class="pw-field-row-label-col">
                      <label class="pw-field-row-label" v-html="colorField.label"></label>
                    </div>
                    <div class="pw-field-row-options">
                      <span class="pw-state-grid">
                        <span v-for="stateField in colorField.states" :key="stateField.varName" class="pw-state-cell">
                          <span v-if="stateField.state !== 'normal'" class="pw-state-pill" :class="'pw-state-' + stateField.state">:{{ stateField.state === 'hover' ? 'Hover' : 'Active' }}</span>
                          <pw-color-field-row
                            :group="colorTheme"
                            :var-name="stateField.varName"
                            :default-value="stateField.colorVal[colorTheme] || ''"
                            :override-value="getColorOverrideValue(colorTheme, stateField.varName)"
                            @update:value="setColorValue(colorTheme, stateField.varName, $event, stateField.colorVal[colorTheme] || '')"
                          />
                        </span>
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
          <template v-if="hasColorRows(stInfo(st).category) && stInfo(st).category !== 'style'">
          <template v-for="(fieldGroup, gIdx) in groupedColorFields(stInfo(st).group, stInfo(st).category)">
            <!-- Group header row -->
            <div v-if="fieldGroup.header && !isCornerGroup(fieldGroup)" :key="'gh-' + gIdx" class="pw-group-header">
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
                'pw-dual-first': field.isFollowedByState || (field.varName.endsWith('-font-size') && fontSizesForGroup(stInfo(st).elementKey) && openSections[st.key + '-sizes']),
                'pw-dual-next': field.isState,
              }"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <template v-if="field.varName.endsWith('-font-size') && fontSizesForGroup(stInfo(st).elementKey)">
                      <button
                        type="button"
                        class="pw-sizes-toggle"
                        @click.prevent="$set(openSections, st.key + '-sizes', !openSections[st.key + '-sizes'])"
                      >
                        <k-icon class="pw-sizes-chevron" :type="openSections[st.key + '-sizes'] ? 'angle-down' : 'angle-right'" />
                        <span>{{ field.label }}</span>
                      </button>
                    </template>
                    <label v-else class="pw-field-row-label" v-html="field.label"></label>
                  </div>
                  <div class="pw-field-row-options" :class="[fieldGroup.header ? 'pw-group-type-' + fieldGroup.fieldType : '', { 'pw-corner-grid': isCorners(field.def) || isSides(field.def), 'pw-side-grid': isSides(field.def) }]">
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
                            v-pw-autosize
                            type="text"
                            inputmode="decimal"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getQuadValue(field.varName, idx) }"
                            :value="stripUnit(getQuadValue(field.varName, idx) || val)"
                            @change="setQuadValue(field.varName, idx, $event.target.value, field.def)"
                          />
                          <span v-if="field.def.unit" class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span v-if="field.def.unit !== 'px'" class="pw-px-calculator">{{ toPx(getQuadValue(field.varName, idx) || val, field.def.unit) }}</span>
                      </span>
                    </template>
                    <!-- Responsive (default/lg/xl) -->
                    <template v-else-if="field.type === 'responsive'">
                      <span v-for="bp in [previewBp]" :key="bp" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            v-pw-autosize
                            type="text"
                            inputmode="decimal"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getResponsiveOverride(field.varName, bp) }"
                            :value="stripUnit(getResponsiveOverride(field.varName, bp) || field.def[bp])"
                            @change="setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit)"
                          />
                          <span v-if="field.def.unit" class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span v-if="field.def.unit !== 'px'" class="pw-px-calculator">{{ toPx(getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit) }}</span>
                      </span>
                      <!-- switch the breakpoint (shared with the preview) -->
                      <span class="pw-pill pw-bp-switch" role="group">
                        <button
                          v-for="b in ['default', 'lg', 'xl']"
                          :key="'sw-' + b"
                          type="button"
                          class="pw-tool"
                          :title="bpLabel(b)"
                          :aria-label="bpLabel(b)"
                          :aria-pressed="previewBp === b ? 'true' : 'false'"
                          @click="previewBp = b"
                        ><k-icon :type="bpIcon(b)" /></button>
                      </span>
                    </template>
                    <!-- Theme colors (default/variant/variant2) -->
                    <!-- colour with hover/active: the three states side by side -->
                    <template v-else-if="field.type === 'state-colors'">
                      <span class="pw-state-grid">
                        <span v-for="stateField in field.states" :key="stateField.varName" class="pw-state-cell">
                          <!-- hover/active: the purple state pill (as before in the labels) -->
                          <span v-if="stateField.state !== 'normal'" class="pw-state-pill" :class="'pw-state-' + stateField.state">:{{ stateField.state === 'hover' ? 'Hover' : 'Active' }}</span>
                          <pw-color-field-row
                            :group="colorTheme"
                            :var-name="stateField.varName"
                            :default-value="stateField.colorVal[colorTheme] || ''"
                            :override-value="getColorOverrideValue(colorTheme, stateField.varName)"
                            @update:value="setColorValue(colorTheme, stateField.varName, $event, stateField.colorVal[colorTheme] || '')"
                          />
                        </span>
                      </span>
                    </template>
                    <template v-else-if="field.type === 'theme-color'">
                      <pw-color-field-row
                        v-for="theme in [colorTheme]"
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
                            v-pw-autosize
                            type="text"
                            inputmode="decimal"
                            :step="field.def.step || 0.1"
                            :min="field.def.min"
                            :max="field.def.max"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getOverrideValue(field.varName) }"
                            :value="stripUnit(getOverrideValue(field.varName) || field.def.value)"
                            @change="setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit)"
                          />
                          <span v-if="field.def.unit" class="pw-element-unit">{{ field.def.unit }}</span>
                        </span>
                        <span v-if="field.def.unit !== 'px'" class="pw-px-calculator">{{ toPx(getOverrideValue(field.varName) || field.def.value, field.def.unit) }}</span>
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
              <k-button v-if="hasFieldOverride(field)" class="pw-field-reset" :text="$t('prw.label.reset')" :title="$t('prw.label.reset')" icon="undo" size="xs" variant="filled" @click="resetField(field)" />
            </div>
            <!-- Sizes rows (appear after font-size row when toggled) -->
            <template v-if="field.varName.endsWith('-font-size') && fontSizesForGroup(stInfo(st).elementKey) && openSections[st.key + '-sizes']">
              <div
                v-for="(sizeVal, sizeName) in fontSizesForGroup(stInfo(st).elementKey).vars"
                :key="'size-' + sizeName"
                class="pw-field-row pw-dual-first pw-dual-next"
              >
                <div class="k-input" data-type="text">
                  <span class="k-input-element pw-field-row-inner">
                    <div class="pw-field-row-label-col">
                      <label class="pw-field-row-label pw-sizes-label">{{ $t('pw.option.' + sizeName.split('-').pop()) }}</label>
                    </div>
                    <div class="pw-field-row-options pw-group-type-responsive">
                      <span v-for="bp in [previewBp]" :key="bp" class="pw-element-field">
                        <span class="pw-element-input-wrap">
                          <input
                            v-pw-autosize
                            type="text"
                            inputmode="decimal"
                            :step="fontSizesForGroup(stInfo(st).elementKey).step || 0.1"
                            min="0.1"
                            max="20"
                            class="pw-element-input pw-element-input-number pw-px-calculator-input"
                            :class="{ 'is-default': !getFontSizeOverride(bp, sizeName) }"
                            :value="stripUnit(getFontSizeOverride(bp, sizeName) || sizeVal[bp])"
                            @change="setFontSizeValue(bp, sizeName, $event.target.value, sizeVal[bp], 'rem')"
                          />
                          <span class="pw-element-unit">rem</span>
                        </span>
                        <span class="pw-px-calculator">{{ toPx(getFontSizeOverride(bp, sizeName) || sizeVal[bp], 'rem') }}</span>
                      </span>
                      <!-- switch the breakpoint (shared with the preview) -->
                      <span class="pw-pill pw-bp-switch" role="group">
                        <button
                          v-for="b in ['default', 'lg', 'xl']"
                          :key="'sw-' + b"
                          type="button"
                          class="pw-tool"
                          :title="bpLabel(b)"
                          :aria-label="bpLabel(b)"
                          :aria-pressed="previewBp === b ? 'true' : 'false'"
                          @click="previewBp = b"
                        ><k-icon :type="bpIcon(b)" /></button>
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
          </template>
        </div>
    </section>
  </div>
</template>

<script>
import autosize from '../../directives/autosize.js';

export default {
  directives: { 'pw-autosize': autosize },
  props: {
    // preview guides on/off (shared, .sync)
    guides: { type: Boolean, default: false },
    // themes to offer: default + the variants switched on in the settings
    themes: { type: Array, default: () => ['default', 'variant', 'variant2', 'variant3'] },
    // element chosen in the header's select (Overview)
    selectedElement: { type: String, default: null },
    // the elements tab is showing: its previews appear in the sidebar
    previewActive: { type: Boolean, default: false },
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
      // breakpoint shown in the preview sidebar
      previewBp: 'xl',
      // theme whose colours the colour rows show
      colorTheme: 'default',
      // size step shown in the preview (headings without a base size)
      // size step per element (edited and previewed): heading → "lg",
      // elements with a base size → "normal"
      previewSteps: {},
      // heading preview with the text marking / the flourish
      previewMarked: false,
      previewFlourish: false,
      // media preview with a sample image
      previewMediaImage: false,
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
    themes(list) {
      if (!list.includes(this.colorTheme)) this.colorTheme = 'default';
    },
    selectedElement: {
      immediate: true,
      handler(key) {
        if (key && key !== this.activeElement) this.activeElement = key;
      },
    },
    activeElement: {
      immediate: true,
      handler(key) { this.$emit('update:selectedElement', key); },
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
      const options = [{ value: 'default', text: this.$t('prw.label.defaultFont', { font: this.bodyDefaultFont }) }];
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
    // four corner values (top-left, top-right, bottom-left, bottom-right):
    // shown as a 2×2 grid in the cell, like the corners themselves
    // corner values in the 2×2 grid carry their own glyphs: no column labels
    // element with a base font size (e.g. editor); headings have steps only
    hasBaseFontSize(elementKey) {
      return !!this.elementDefaults[elementKey]?.vars?.[elementKey + '-font-size'];
    },
    // step of an element: chosen, else "normal" (base size) or "lg"
    stepOf(elementKey) {
      return this.previewSteps[elementKey] || (this.hasBaseFontSize(elementKey) ? 'normal' : 'lg');
    },
    // pills of the size card: "normal" first when the element has a base size
    sizeStepOptions(elementKey) {
      const steps = this.fontSteps(elementKey);
      return this.hasBaseFontSize(elementKey) ? ['normal', ...steps] : steps;
    },
    // the size steps of an element (xs, sm … 3xl)
    fontSteps(elementKey) {
      const vars = this.fontSizesForGroup(elementKey)?.vars || {};
      return Object.keys(vars).map(name => name.replace(elementKey + '-size-', ''));
    },
    // guide colour of a row while the preview guides are on (a stripe at the
    // label, as in the block defaults): the paragraph spacing, and the
    // flourish's outer spacing when the flourish is shown (cyan lines)
    guideType(varName) {
      if (!this.guides) return null;
      if (varName.endsWith('-paragraph-spacing') || varName.endsWith('cite-spacing') || varName === 'button-gap' || varName === 'button-row-gap') return 'margin';
      if (!this.previewFlourish) return null;
      if (varName.endsWith('-flourish-margin-top') || varName.endsWith('-flourish-margin-bottom')) return 'margin';
      return null;
    },
    // button corners: square, round or custom (then the radii apply)
    buttonShape() {
      return this.getOverrideValue('button-shape') || this.elementDefaults.button?.vars?.['button-shape']?.value || 'custom';
    },
    // button shadow: the chosen step's CSS (generates in elements.json)
    buttonShadow() {
      const def = this.elementDefaults.button?.vars?.['button-shadow'];
      if (!def) return 'none';
      const step = this.getOverrideValue('button-shadow') || def.value;
      return def.generates?.['button-shadow']?.[step] || 'none';
    },
    // gap between buttons (button-gap), as in the frontend
    buttonGap(name = 'button-gap') {
      return this.getOverrideValue(name) || this.elementDefaults.button?.vars?.[name]?.value || '';
    },
    // gap between quote and source, as in the frontend
    citeGapStyle(childKey) {
      if (childKey !== 'cite') return {};
      const gap = this.getOverrideValue('cite-spacing') || this.elementDefaults.cite?.vars?.['cite-spacing']?.value || '';
      return { marginTop: gap, '--pw-cite-gap': gap };
    },
    // flourish below the heading, as in the frontend ([data-flourish]): its
    // em values relate to the heading's font size
    flourishStyle(bp, theme) {
      const vars = this.elementDefaults.heading?.vars || {};
      const ov = this.elementOverrides.global || {};
      // responsive values: the override at the device, else its default
      const val = (name, fallback) => {
        const def = vars[name] || {};
        return (ov[bp] || {})[name] || ov[name] || def[bp] || def.default || def.value || fallback;
      };
      const color = ((ov[theme] || {})['element-heading-flourish-color'])
        || this.elementDefaults.heading?.colors?.['element-heading-flourish-color']?.[theme]
        || 'currentColor';
      return {
        display: 'block',
        width: val('heading-flourish-width', '4em'),
        height: val('heading-flourish-height', '0.15em'),
        backgroundColor: color,
      };
    },
    // the flourish's outer spacing as padding of a box around it, so the
    // guides can mark where that spacing ends
    flourishBoxStyle(bp, theme) {
      const vars = this.elementDefaults.heading?.vars || {};
      const ov = this.elementOverrides.global || {};
      // responsive values: the override at the device, else its default
      const val = (name, fallback) => {
        const def = vars[name] || {};
        return (ov[bp] || {})[name] || ov[name] || def[bp] || def.default || def.value || fallback;
      };
      return {
        display: 'block',
        position: 'relative',
        fontSize: this.previewStyle('heading', bp, theme).fontSize,
        paddingTop: val('heading-flourish-margin-top', '0.5em'),
        paddingBottom: val('heading-flourish-margin-bottom', '0'),
      };
    },
    // only the size step chosen in the card heading: { name: entry }
    chosenStep(elementKey) {
      const name = elementKey + '-size-' + this.stepOf(elementKey);
      const entry = this.fontSizesForGroup(elementKey)?.vars?.[name];
      return entry ? { [name]: entry } : {};
    },
    // a size step's value at a breakpoint (override, else default)
    fontStepValue(elementKey, step, bp) {
      const name = elementKey + '-size-' + step;
      const entry = this.fontSizesForGroup(elementKey)?.vars?.[name];
      if (!entry) return '';
      return this.getFontSizeOverride(bp, name) || entry[bp] || entry.default || '';
    },
    isCornerGroup(fieldGroup) {
      return (fieldGroup.fields || []).some(field => this.isCorners(field.def) || this.isSides(field.def));
    },
    // four values by side (top, right, bottom, left): a 2×2 grid with the
    // side icons
    isSides(def) {
      const names = (def && (def.suffixes || def.labels)) || [];
      return Array.isArray(names) && names.length === 4 && names.some(n => /(^|[.-])top$/.test(String(n)));
    },
    isCorners(def) {
      // four values named by corner, either as CSS suffixes or as labels
      const names = (def && (def.suffixes || def.labels)) || [];
      return Array.isArray(names) && names.length === 4 && names.some(n => String(n).includes('top-left'));
    },
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
        return { type: 'theme-color', labels: ['Default', 'Variant', 'Variant2', 'Variant3'] };
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
    // colour rows of a card: the marking colours (text/background of the
    // marked heading) sit in the "text marking" card, the flourish colour in
    // the flourish card, the rest under colours
    groupedColorFields(group, section = 'colors') {
      const names = Object.keys(group.colors || {});
      // the element's text colour goes to its text card unless the element
      // has hover/active colours (buttons, breadcrumbs keep them together)
      const hasStates = names.some(n => n.endsWith('-hover') || n.endsWith('-active'));
      const sectionOf = (name) => {
        if (name.startsWith('element-button-icon')) return 'icon';
        // buttons: background and border colour with the style, the text
        // colour in the text card (all states)
        if (name.startsWith('element-button-border') || name.startsWith('element-button-background')) return 'style';
        if (name.startsWith('element-button-text')) return 'text';
        if (name.includes('-marked-')) return 'marked';
        if (name.includes('-flourish-')) return 'flourish';
        if (!hasStates && /^element-[a-z]+-text$/.test(name)) return 'text';
        return 'colors';
      };
      const colors = {};
      // border before background (style card: border width, border, background)
      const entries = Object.entries(group.colors || {})
        .sort(([a], [b]) => Number(b.includes('-border')) - Number(a.includes('-border')));
      for (const [name, value] of entries) {
        if (sectionOf(name) === section) colors[name] = value;
      }
      if (!hasStates) return this.groupedFields({ ...group, colors }, 'colors');
      // hover/active colours: one row per colour with the three states as a
      // 3×1 grid (Normal | Hover | Active)
      const fields = Object.keys(colors)
        .filter(name => !name.endsWith('-hover') && !name.endsWith('-active'))
        .map(name => ({
          varName: name,
          def: {},
          label: this.colorLabel(name),
          type: 'state-colors',
          states: ['', '-hover', '-active']
            .filter(suffix => colors[name + suffix])
            .map(suffix => ({ varName: name + suffix, colorVal: colors[name + suffix], state: suffix ? suffix.slice(1) : 'normal' })),
        }));
      if (!fields.length) return [];
      return [{ fields }];
    },
    // element with hover/active colours (buttons, breadcrumbs)
    hasColorStates(elementKey) {
      return Object.keys(this.elementDefaults[elementKey]?.colors || {}).some(n => n.endsWith('-hover') || n.endsWith('-active'));
    },

    // cards that hold colour rows (with the variant switch in their heading)
    hasColorRows(category) {
      return ['colors', 'marked', 'flourish', 'text', 'icon', 'shape', 'style'].includes(category);
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
        // the font size first in a size card (as the size row of headings);
        // in the text card the type values first, then font size, line
        // height and letter spacing
        const textRank = (name) => (name.endsWith('-font-size') ? 1 : name.endsWith('-line-height') ? 2 : name.endsWith('-letter-spacing') ? 3 : 0);
        const entries = Object.entries(group.vars)
          .sort(([a], [b]) => (category === 'text'
            ? textRank(a) - textRank(b)
            : Number(b.endsWith('-font-size')) - Number(a.endsWith('-font-size'))));
        for (const [varName, def] of entries) {
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

    // option label from pagewizard's pw.option.* (e.g. uppercase → "Uppercase"), else the value
    optionText(value) {
      const key = 'pw.option.' + value;
      const t = this.$t(key);
      return t && t !== key ? t : value;
    },
    filteredOptions(varName, options) {
      if (!varName.endsWith('-font-weight')) {
        // text transform: glyph icons, the name as tooltip ("none": as typed)
        if (varName.endsWith('text-transform')) {
          const icons = { none: 'prw-case-none', uppercase: 'prw-case-upper', lowercase: 'prw-case-lower', capitalize: 'prw-case-capitalize' };
          return options.map(o => ({ value: o, icon: icons[o], text: o === 'none' ? this.$t('prw.option.asTyped') : this.optionText(o) }));
        }
        return options.map(o => ({ value: o, text: this.optionText(o) }));
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

      const quadNum = parseFloat(String(value).replace(',', '.'));
      current[index] = (value === '' || isNaN(quadNum)) ? def.value[index] : quadNum + (def.unit || '');

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
        for (const theme of ['default', 'variant', 'variant2', 'variant3']) {
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
        for (const theme of ['default', 'variant', 'variant2', 'variant3']) {
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
      const num = parseFloat(String(value).replace(',', '.'));
      const effectiveUnit = unit || 'rem';
      const withUnit = (value === '' || isNaN(num)) ? '' : num + effectiveUnit;
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
      const num = parseFloat(String(value).replace(',', '.'));
      const withUnit = (value === '' || isNaN(num)) ? '' : num + (unit || '');
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
    // sample texts of the previews, in the panel language (heading: the
    // __marked__ part is the text marking)
    previewText(groupKey) {
      if (groupKey === 'media') return '__media__';
      const key = 'prw.sample.' + groupKey;
      const text = this.$t(key);
      return text && text !== key ? text : null;
    },
    previewParagraphs(groupKey) {
      if (groupKey !== 'editor') return null;
      return [this.$t('prw.sample.editor.1'), this.$t('prw.sample.editor.2')];
    },
    elementSubtabs(groupKey) {
      const tabs = {
        heading:    ['text', 'sizes', 'marked', 'flourish', 'colors'],
        tagline:    ['text', 'colors'],
        editor:     ['text', 'sizes', 'colors'],
        quote:      ['text', 'sizes', 'colors'],
        button:     ['text', 'padding', 'margin', 'shape', 'style', 'icon', 'colors'],
        caption:    ['text', 'colors'],
        breadcrumb: ['text', 'colors'],
        media:      ['colors'],
        cite:       ['text', 'margin', 'colors'],
      };
      return tabs[groupKey] || ['text', 'sizes', 'colors'];
    },
    varCategory(varName) {
      // source: its gap to the quote is its outer spacing
      if (varName === 'cite-spacing') return 'margin';
      // buttons: paddings, outer spacing (gap between buttons), form and icon
      if (varName === 'button-padding') return 'padding';
      if (varName === 'button-gap' || varName === 'button-row-gap') return 'margin';
      if (varName === 'button-shape' || varName === 'button-border-radius') return 'shape';
      if (varName === 'button-border-width' || varName === 'button-shadow') return 'style';
      if (varName === 'button-icon-size' || varName === 'button-icon-gap') return 'icon';
      // text marking (heading): its line height and corner radius
      if (varName.endsWith('-marked-line-height') || varName.endsWith('-marked-radius')) return 'marked';
      if (varName.endsWith('-flourish-width') || varName.endsWith('-flourish-height') ||
          varName.endsWith('-flourish-margin-top') || varName.endsWith('-flourish-margin-bottom')) return 'flourish';
      if (varName.endsWith('-font-family') || varName.endsWith('-font-weight') ||
          varName.endsWith('-text-transform') || varName.endsWith('-font-style') ||
          varName.endsWith('-marks') ||
          (varName.endsWith('-gap') && !varName.endsWith('-icon-gap'))) return 'text';
      if (varName.endsWith('-font-size') || varName.endsWith('-line-height') ||
          varName.endsWith('-paragraph-spacing') ||
          varName.endsWith('-letter-spacing') || varName.endsWith('-padding') ||
          varName.endsWith('-border-radius') || varName.endsWith('-radius') ||
          varName.endsWith('-icon-size') || varName.endsWith('-icon-gap')) {
        // a size card only for elements with size steps (heading, text,
        // quote); for the others font size, line height and letter spacing
        // belong to the text
        const elementKey = varName.split('-')[0];
        return this.fontSizesForGroup(elementKey) ? 'sizes' : 'text';
      }
      return 'text';
    },
    combinedSubtabs(groupKey) {
      const tabLabels = { text: this.$t('prw.subtab.text'), sizes: this.$t('prw.subtab.sizes'), padding: this.$t('prw.headline.paddings'), margin: this.$t('prw.headline.margins'), shape: this.$t('prw.subtab.shape'), style: this.$t('pw.headline.style'), icon: this.$t('prw.subtab.icon'), marked: this.$t('prw.subtab.marked'), flourish: this.$t('prw.subtab.flourish'), colors: this.$t('prw.subtab.colors') };
      const result = [];
      const childKey = this.previewChildKey(groupKey);
      const hasChild = childKey && this.groups[childKey];
      // With a child element (quote + cite, media + caption) each part gets
      // its own sub-heading (partLabel on its first section)
      const parts = hasChild ? [groupKey, childKey] : [groupKey];
      for (const elementKey of parts) {
        // no colours card when all colours sit in other cards
        const subtabs = this.elementSubtabs(elementKey).filter(st =>
          st !== 'colors' || !this.groups[elementKey] || this.groupedColorFields(this.groups[elementKey], 'colors').length > 0);
        subtabs.forEach((st, i) => {
          result.push({
            key: elementKey + ':' + st,
            label: tabLabels[st],
            elementKey,
            category: st,
            partLabel: hasChild && i === 0 ? this.partLabel(elementKey) : null,
          });
        });
      }
      return result;
    },
    partLabel(key) {
      const tKey = 'prw.elementpart.' + key;
      const t = this.$t(tKey);
      return (t && t !== tKey) ? t : this.groupLabel(key);
    },
    bpIcon(bp) {
      return { default: 'mobile', lg: 'tablet', xl: 'display' }[bp];
    },
    bpLabel(bp) {
      return { default: this.$t('prw.label.mobile'), lg: this.$t('prw.label.tablet'), xl: this.$t('prw.label.desktop') }[bp];
    },
    // field group, category and element of one card (former subtab)
    stInfo(st) {
      return { group: this.groups[st.elementKey], category: st.category, elementKey: st.elementKey };
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
    previewHtml(groupKey, theme, plain = false) {
      let text = this.previewText(groupKey);
      if (!text) return '';
      if (plain) return text.replace(/__\/?marked__/g, '');
      const elDef = this.elementDefaults[groupKey] || {};
      const elOv = this.elementOverrides.global || {};
      // Replace __marked__...__/marked__ with styled span
      text = text.replace(/__marked__(.+?)__\/marked__/g, (match, content) => {
        const markedTextColor = ((elOv)[theme] || {})['element-' + groupKey + '-marked-text'] || elDef.colors?.['element-' + groupKey + '-marked-text']?.[theme] || '';
        const markedBgColor = ((elOv)[theme] || {})['element-' + groupKey + '-marked-background'] || elDef.colors?.['element-' + groupKey + '-marked-background']?.[theme] || '';
        let style = '';
        if (markedTextColor) style += 'color:' + markedTextColor + ';';
        if (markedBgColor) style += 'background:' + markedBgColor + ';';
        const markedRadius = elOv[groupKey + '-marked-radius'] || elDef.vars?.[groupKey + '-marked-radius']?.value;
        if (markedRadius) style += 'border-radius:' + markedRadius + ';';
        // Same box as the frontend ([data-textbackground]): each line keeps its corners
        style += 'padding:0.05em 0.3em;box-decoration-break:clone;-webkit-box-decoration-break:clone;';
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
        // colours per state as variables: CSS switches them on hover/active
        '--pw-btn-text': colorVal('element-button-text'),
        '--pw-btn-text-hover': colorVal('element-button-text-hover'),
        '--pw-btn-text-active': colorVal('element-button-text-active'),
        '--pw-btn-bg': colorVal('element-button-background'),
        '--pw-btn-bg-hover': colorVal('element-button-background-hover'),
        '--pw-btn-bg-active': colorVal('element-button-background-active'),
        '--pw-btn-border': colorVal('element-button-border'),
        '--pw-btn-border-hover': colorVal('element-button-border-hover'),
        '--pw-btn-border-active': colorVal('element-button-border-active'),
        '--pw-btn-icon': colorVal('element-button-icon') || 'currentColor',
        '--pw-btn-icon-hover': colorVal('element-button-icon-hover') || 'currentColor',
        '--pw-btn-icon-active': colorVal('element-button-icon-active') || 'currentColor',
        borderWidth: this.getOverrideValue('button-border-width') || this.elementDefaults.button?.vars?.['button-border-width']?.value || '1px',
        boxShadow: this.buttonShadow(),
        borderStyle: 'solid',
        padding: Array.isArray(padding) ? padding.join(' ') : padding,
        borderRadius: { square: '0', round: '999px' }[this.buttonShape()] || (Array.isArray(radius) ? radius.join(' ') : radius),
      };
    },
    previewButtonIconStyle(theme, bp) {
      const groupKey = 'button';
      const iconSizeOv = this.getResponsiveOverride('button-icon-size', bp);
      const iconGapOv  = this.getResponsiveOverride('button-icon-gap',  bp);
      const iconSizeDef = this.elementDefaults[groupKey]?.vars?.['button-icon-size']?.[bp]
        ?? this.elementDefaults[groupKey]?.vars?.['button-icon-size']?.default
        ?? this.elementDefaults[groupKey]?.vars?.['button-icon-size']?.value
        ?? '1em';
      const iconGapDef = this.elementDefaults[groupKey]?.vars?.['button-icon-gap']?.[bp]
        ?? this.elementDefaults[groupKey]?.vars?.['button-icon-gap']?.default
        ?? this.elementDefaults[groupKey]?.vars?.['button-icon-gap']?.value
        ?? '0.4em';
      // the colour comes from the button (per state, see previewButtonStyle)
      return {
        fontSize: iconSizeOv || iconSizeDef,
        marginRight: iconGapOv || iconGapDef,
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
    previewParagraphGap(groupKey) {
      const override = this.getOverrideValue(groupKey + '-paragraph-spacing');
      if (override) return override;
      const group = this.elementDefaults[groupKey];
      if (group && group.vars && group.vars[groupKey + '-paragraph-spacing']) {
        return group.vars[groupKey + '-paragraph-spacing'].value || '';
      }
      return '';
    },
    previewStyle(groupKey, bp, theme, marked = false) {
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
        // headings have no base size: the "lg" step, as in the frontend
        fontSize: (this.fontSizesForGroup(groupKey) && this.stepOf(groupKey) !== 'normal')
          ? this.fontStepValue(groupKey, this.stepOf(groupKey), bp)
          : (responsiveVal('font-size') || this.fontStepValue(groupKey, 'lg', bp)),
        lineHeight: (marked && responsiveVal('marked-line-height')) || responsiveVal('line-height'),
        // as in the frontend: the marked heading keeps the place of its first
        // line (half the extra line height up, the whole of it back below)
        ...(marked && responsiveVal('marked-line-height') ? (() => {
          const extra = (parseFloat(responsiveVal('marked-line-height')) - parseFloat(responsiveVal('line-height'))) || 0;
          return { position: 'relative', top: (-extra / 2) + 'em', marginBottom: (-extra) + 'em' };
        })() : {}),
        letterSpacing: responsiveVal('letter-spacing'),
        textTransform: get('text-transform') || defVal('text-transform', 'value'),
        color: colorOverride || colorDefault,
      };
    },
  },
};
</script>

<style>
/* media preview with an image: a drawn landscape with the zoom button */
.pw-image-switch[aria-pressed="false"] {
  opacity: 0.35;
}
.pw-media-preview-photo {
  position: relative;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90' preserveAspectRatio='xMidYMid slice'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%2387b7e0'/%3E%3Cstop offset='1' stop-color='%23f3d9b1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='160' height='90' fill='url(%23s)'/%3E%3Ccircle cx='118' cy='30' r='11' fill='%23fff3c4'/%3E%3Cpath d='M0 70 L38 38 L64 58 L92 30 L130 64 L160 48 L160 90 L0 90Z' fill='%235f7f6b'/%3E%3Cpath d='M0 78 L30 62 L62 76 L100 58 L140 78 L160 70 L160 90 L0 90Z' fill='%23405c4c'/%3E%3C/svg%3E");
  background-size: cover;
  background-position: center;
  overflow: hidden;
}
/* as in the frontend (media-image.css): square, bottom right, 0.5rem padding */
.pw-media-preview-zoom {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 0.5rem;
  line-height: 0;
}
.pw-media-preview-zoom svg {
  width: 16px;
  height: 16px;
}
/* preview buttons: colours per state from variables (hover/active as in
   the frontend) */
.pw-element-preview-button {
  color: var(--pw-btn-text);
  background-color: var(--pw-btn-bg);
  border-color: var(--pw-btn-border);
  transition: color 0.15s, background-color 0.15s, border-color 0.15s;
}
.pw-element-preview-button:hover {
  color: var(--pw-btn-text-hover);
  background-color: var(--pw-btn-bg-hover);
  border-color: var(--pw-btn-border-hover);
}
.pw-element-preview-button:active {
  color: var(--pw-btn-text-active);
  background-color: var(--pw-btn-bg-active);
  border-color: var(--pw-btn-border-active);
}
.pw-element-preview-button .pw-preview-link-icon {
  color: var(--pw-btn-icon);
}
.pw-element-preview-button:hover .pw-preview-link-icon {
  color: var(--pw-btn-icon-hover);
}
.pw-element-preview-button:active .pw-preview-link-icon {
  color: var(--pw-btn-icon-active);
}
/* the third preview button: a row of its own below the first two */
.pw-element-preview-buttons-row {
  position: relative;
  flex: 0 0 100%;
  display: flex;
  justify-content: flex-start;
}
/* guides: cyan lines where the first row ends and the second begins */
.pw-element-preview.has-guides .pw-element-preview-buttons-row::before,
.pw-element-preview.has-guides .pw-element-preview-buttons-row::after {
  content: "";
  position: absolute;
  left: calc(-1 * var(--spacing-4));
  right: calc(-1 * var(--spacing-4));
  border-top: 1px solid rgba(0, 170, 255, 0.8);
  pointer-events: none;
}
.pw-element-preview.has-guides .pw-element-preview-buttons-row::before {
  top: 0;
}
.pw-element-preview.has-guides .pw-element-preview-buttons-row::after {
  top: calc(-1 * var(--pw-button-row-gap, 0px));
}
/* the button's content (icon and text); guides: its edge in magenta, where
   the paddings end */
.pw-button-content {
  display: inline-flex;
  align-items: center;
}
.pw-element-preview.has-guides .pw-button-content {
  outline: 1px solid rgba(255, 0, 170, 0.6);
}
/* side grid (paddings): the side icon instead of the corner glyph */
.pw-field-table .pw-side-grid > *::after {
  display: none;
}
.pw-side-icon {
  --icon-size: 18px;
  flex-shrink: 0;
  margin-inline-start: auto;
  color: var(--color-text-dimmed);
}
/* the preview buttons, left-aligned and wrapping like the frontend */
.pw-element-preview-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}
/* guides: cyan lines where the first button ends and the second begins */
.pw-element-preview.has-guides .pw-element-preview-button-second {
  position: relative;
}
.pw-element-preview.has-guides .pw-element-preview-button-second::before,
.pw-element-preview.has-guides .pw-element-preview-button-second::after {
  content: "";
  position: absolute;
  top: calc(-1 * var(--spacing-4));
  bottom: calc(-1 * var(--spacing-4));
  border-left: 1px solid rgba(0, 170, 255, 0.8);
  pointer-events: none;
}
.pw-element-preview.has-guides .pw-element-preview-button-second::before {
  left: -1px;
}
.pw-element-preview.has-guides .pw-element-preview-button-second::after {
  left: calc(-1px - var(--pw-button-gap, 0px));
}
/* colours with hover/active: the three states next to each other (as wide
   as their content), hover and active marked by their purple pill */
.pw-state-grid {
  flex: 1;
  align-self: stretch;
  display: flex;
}
.pw-state-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
  padding-block: var(--spacing-1);
}
/* hairlines between the three states, over the full row height */
.pw-state-cell + .pw-state-cell {
  padding-inline-start: var(--table-cell-padding, var(--spacing-3));
  border-inline-start: 1px solid var(--pw-table-border, var(--color-border));
}
.pw-state-cell:not(:last-child) {
  padding-inline-end: var(--table-cell-padding, var(--spacing-3));
}
.pw-field-table .pw-field-row-options:has(> .pw-state-grid) {
  padding-block: 0;
}
.pw-state-cell .pw-state-pill {
  flex-shrink: 0;
}
/* each state only as wide as its content (pill, colour, value) */
.pw-state-cell .pw-color-field {
  flex: none;
  width: auto;
}
.pw-state-cell .pw-color-field .pw-color-value {
  flex: none;
  width: 9ch;
}
/* guides at the source: cyan lines where the quote ends and the source
   begins (the gap between) */
.pw-element-preview.has-guides .pw-element-preview-cite {
  position: relative;
  overflow: visible;
}
.pw-element-preview.has-guides .pw-element-preview-cite::before,
.pw-element-preview.has-guides .pw-element-preview-cite::after {
  content: "";
  position: absolute;
  left: calc(-1 * var(--spacing-4));
  right: calc(-1 * var(--spacing-4));
  border-top: 1px solid rgba(0, 170, 255, 0.8);
  pointer-events: none;
}
.pw-element-preview.has-guides .pw-element-preview-cite::before {
  top: 0;
}
.pw-element-preview.has-guides .pw-element-preview-cite::after {
  top: calc(-1 * var(--pw-cite-gap, 0px));
}
/* guides only where they show a value that can be set: at paragraphs cyan
   lines where a paragraph ends and the next begins (the paragraph spacing) */
.pw-element-preview.has-guides .pw-element-preview-paragraphs p {
  position: relative;
}
.pw-element-preview.has-guides .pw-element-preview-paragraphs p + p::before,
.pw-element-preview.has-guides .pw-element-preview-paragraphs p:not(:last-child)::after {
  content: "";
  position: absolute;
  left: calc(-1 * var(--spacing-4));
  right: calc(-1 * var(--spacing-4));
  border-top: 1px solid rgba(0, 170, 255, 0.8);
  pointer-events: none;
}
.pw-element-preview.has-guides .pw-element-preview-paragraphs p + p::before {
  top: 0;
}
.pw-element-preview.has-guides .pw-element-preview-paragraphs p:not(:last-child)::after {
  bottom: 0;
}
/* guides at the flourish: the edges of its outer spacing as cyan lines
   across the preview */
.pw-element-preview.has-guides .pw-element-preview-flourish-box::before,
.pw-element-preview.has-guides .pw-element-preview-flourish-box::after {
  content: "";
  position: absolute;
  left: calc(-1 * var(--spacing-4));
  right: calc(-1 * var(--spacing-4));
  border-top: 1px solid rgba(0, 170, 255, 0.8);
  pointer-events: none;
}
.pw-element-preview.has-guides .pw-element-preview-flourish-box::before {
  top: 0;
}
.pw-element-preview.has-guides .pw-element-preview-flourish-box::after {
  bottom: 0;
}
/* marked heading in the preview: no padding above it */
.pw-element-preview.is-marked .pw-element-preview-col {
  padding-top: 0;
}
/* the marking switch sits right before the variant pills */
.pw-card-heading-row .pw-marked-switch {
  display: inline-flex;
  margin-inline-start: auto;
  padding: var(--spacing-1);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}
.pw-card-heading-row .pw-marked-switch .k-icon {
  --icon-size: 16px;
}
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
}

/* In the preview sidebar: one breakpoint at a time, the themes below each other */
/* theme pill in the preview a little smaller (more specific than .pw-pill) */
.pw-pill.pw-preview-theme {
  --tool-size: 24px;
}
.pw-preview-theme .pw-tool {
  font-size: var(--text-xs);
  padding-inline: var(--spacing-2);
}
/* devices on the right of the theme switch */
.pw-element-preview-side .pw-preview-switches .pw-bp-switch {
  order: 1;
}
.pw-element-preview-side .pw-preview-switches {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}
.pw-element-preview-side .pw-element-preview {
  grid-template-columns: 1fr;
  margin-bottom: 0;
}
/* button samples centred in their theme field */
.pw-element-preview-side .pw-element-preview-themed .pw-element-preview-col {
  align-items: center;
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

/* The marked background reaches above the first line box; without this room
   overflow:hidden (line clamp) cuts off its top corners. The configured line
   height stays untouched. */
.pw-element-preview-text:has(mark) {
  padding-top: 0.25em;
}

.pw-element-preview-marked {
  margin-top: 0.75em;
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
  display: inline-flex;
  align-items: center;
  width: fit-content;
  cursor: pointer;
}

.pw-preview-link-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}
.pw-preview-link-icon svg {
  width: 1em;
  height: 1em;
  fill: currentColor;
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
