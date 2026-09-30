<template>
  <!-- a block on a page in the panel, as the wizard's preview draws it (the
       project's colours, fonts, spacings, variants) – with the block's real
       content: no sample texts, no guides, no switches; empty fields are
       left out -->
  <div class="pw-panel-render" :class="{ 'has-grid': hasGrid }" :style="{ backgroundColor: bodyBackground, '--pw-grid-line': elementColor('editor', 'element-editor-text') || '#000' }">
    <div
      class="pw-block-live-block"
      :class="{ 'is-fullscreen': setting('settings', 'block-size') === 'fullscreen' }"
      :style="blockStyle"
    >
      <section class="pw-block-live-section" :style="sectionStyle">
        <div class="pw-block-live-grid" :style="gridStyle">
          <!-- the grid's twelve columns over the block (switched on above the
               blocks) -->
          <div v-if="gridLines && hasGrid" class="pw-panel-gridlines" :style="{ columnGap: gridStyle.columnGap }" aria-hidden="true">
            <span v-for="n in 12" :key="'gl-' + n" :class="{ 'is-used': gridUsed(n) }"></span>
          </div>
          <div class="pw-block-live-item" :style="itemStyle">
          <!-- (the featurelist's split layout: the intro a column of its own
               next to the items) -->
          <div class="pw-block-live-content" :style="contentStyle">
            <div class="pw-block-live-intro">
            <!-- tagline, heading, text, buttons (the intro of every block) -->
            <p v-if="hasField('tagline')" :style="fieldStyle('tagline')" v-html="fieldData('tagline').text"></p>

            <template v-if="hasField('heading')">
              <div :style="headingStyle">
                <template v-if="headingMarked">
                  <template v-for="(line, i) in headingLines">
                    <br v-if="i" :key="'br-' + i" />
                    <span :key="'l-' + i" class="pw-panel-marked" :style="markedStyle" v-html="line"></span>
                  </template>
                </template>
                <span v-else v-html="headingLines.join('<br>')"></span>
              </div>
              <span v-if="fieldData('heading').flourish === 'enabled'" class="pw-panel-flourish" :style="flourishStyle"></span>
            </template>

            <div
              v-if="hasField('editor')"
              class="pw-panel-rich"
              :style="{ ...fieldStyle('editor'), ...richStyle }"
              v-html="editorHtml"
            ></div>
            </div>

            <!-- media: the image, slideshow or video -->
            <pw-panel-media v-if="isMedia" :content="content" :box-style="panelMediaStyle" :caption-style="captionStyle" />

            <!-- logocloud: its logos, as many per row as set for the device,
                 square tiles or one height (flexible) -->
            <div v-if="isLogocloud && panelLogos.length" :style="panelLogosStyle">
              <div v-for="(logo, i) in panelLogos" :key="logo.id || i" :style="panelLogoStyle">
                <img :src="logo.url" alt="" :style="panelLogoImgStyle" />
              </div>
            </div>

            <!-- featurelist: its features (icon, title, text) as the snippet;
                 hidden ones faded -->
            <div v-if="isFeaturelist && featureItems.length" class="pw-featurelist-items" :class="{ 'is-row': featureColumns > 1 }" :style="featureItemsStyle">
              <div
                v-for="(item, i) in featureItems"
                :key="item.id || i"
                class="pw-featurelist-item"
                :class="{ 'is-top': featureIconTop, 'is-hidden': item.isHidden }"
                :style="featureItemStyle"
              >
                <div v-if="!featureNoIcon && item.content.icon" class="pw-featurelist-icon" :style="featureIconStyle">
                  <span class="pw-panel-feature-svg" :style="featureSvgVars" v-html="item.content.icon"></span>
                </div>
                <div class="pw-featurelist-content">
                  <div
                    v-if="featureTitleInline"
                    class="pw-panel-rich"
                    :style="{ ...featureTextStyle, ...entryRichStyle, '--pw-runin-font': featureTitleInlineStyle.fontFamily, '--pw-runin-weight': featureTitleInlineStyle.fontWeight, '--pw-runin-color': featureTitleInlineStyle.color }"
                    v-html="featureRunIn(item.content)"
                  ></div>
                  <template v-else>
                    <div v-if="item.content.heading" :style="featureTitleStyle">{{ item.content.heading }}</div>
                    <div
                      v-if="richFilled(item.content.description)"
                      class="pw-panel-rich"
                      :style="{ ...featureTextBelowStyle, ...(item.content.heading ? {} : { marginTop: 0 }), ...entryRichStyle }"
                      v-html="item.content.description"
                    ></div>
                  </template>
                </div>
              </div>
            </div>

            <!-- quote: its text (marks as the element sets), the source below -->
            <figure v-if="isQuote && quoteHtml" class="pw-panel-quote">
              <blockquote :style="quoteStyle" v-html="quoteHtml"></blockquote>
              <figcaption v-if="hasField('author')"><cite :style="citeStyle">{{ fieldData('author').text }}</cite></figcaption>
            </figure>

            <!-- steplist: its steps (number, title, text) in the block's style;
                 hidden ones faded, without a number (the frontend leaves them
                 out, so the numbers count the shown ones) -->
            <div v-if="isSteplist && stepItems.length" class="pw-steplist-items" :class="{ 'is-row': stepColumns > 1 }" :style="stepItemsStyle">
              <div
                v-for="(item, i) in stepItems"
                :key="item.id || i"
                class="pw-steplist-item"
                :class="{ 'is-connected': currentStepStyle === 'connected', 'is-centered': currentStepStyle === 'centered', 'is-hidden': item.isHidden }"
                :style="stepItemStyle"
              >
                <span v-if="currentStepStyle === 'connected'" class="pw-steplist-connector" :style="stepConnectorStyle(i + 1)"></span>
                <div class="pw-steplist-number" :style="stepNumberStyle">{{ item.isHidden ? '' : stepNumber(i) }}</div>
                <div class="pw-steplist-content">
                  <div v-if="item.content.heading" :style="stepHeadingStyle">{{ item.content.heading }}</div>
                  <div
                    v-if="richFilled(item.content.description)"
                    class="pw-panel-rich"
                    :style="{ ...stepTextStyle, ...(item.content.heading ? {} : { marginTop: 0 }), ...entryRichStyle }"
                    v-html="item.content.description"
                  ></div>
                </div>
              </div>
            </div>

            <div v-if="hasField('buttons')" :style="buttonsRowStyle">
              <span
                v-for="button in visibleButtons"
                :key="button.id"
                class="pw-panel-button"
                :class="{ 'is-hidden': button.isHidden }"
                :style="buttonStyle"
              >
                <span v-if="buttonIcon(button, 'left')" class="pw-panel-button-icon" :style="{ ...buttonIconStyle, marginRight: buttonIconStyle.gap }" v-html="buttonIcon(button, 'left')"></span>
                <span>{{ button.content.linktext || $t('pw.field.link-text.placeholder') }}</span>
                <span v-if="buttonIcon(button, 'right')" class="pw-panel-button-icon" :style="{ ...buttonIconStyle, marginLeft: buttonIconStyle.gap }" v-html="buttonIcon(button, 'right')"></span>
              </span>
            </div>
          </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import BlockPreview from './BlockPreview.vue';
import PanelMedia from './PanelMedia.vue';

// (a field of pagewizard's own types: its JSON; others as they are)
const parse = (value) => {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || value.trim()[0] !== '{') return {};
  try { return JSON.parse(value) || {}; } catch (e) { return {}; }
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  extends: BlockPreview,
  components: { 'pw-panel-media': PanelMedia },
  props: {
    // the block's content (Kirby's block content: fields in lower case)
    content: { type: Object, default: () => ({}) },
    // the grid's columns as lines over the block
    gridLines: { type: Boolean, default: false },
  },
  computed: {
    // the block's own variant (a colour variant no longer active, or the
    // custom colours: the default one)
    currentTheme() {
      const chosen = this.content.theme || this.setting('style', 'theme') || 'default';
      return this.themes.includes(chosen) ? chosen : 'default';
    },
    // custom colours (the block's own): background and text colour from the
    // block, the buttons in the chosen variant's colours, the rest as the
    // default variant – as the frontend's custom-css
    isCustom() {
      return this.content.theme === 'custom';
    },
    headingLines() {
      const d = this.fieldData('heading');
      const text = String(d.text || '');
      if (d.multiline !== 'enabled') return [text];
      return text.split(/\r\n|\r|\n/).filter(line => line !== '');
    },
    headingMarked() {
      return this.fieldData('heading').textbackground === 'enabled';
    },
    headingStyle() {
      const style = this.fieldStyle('heading');
      if (this.headingMarked) style.lineHeight = this.elementValue('heading', 'marked-line-height') || style.lineHeight;
      return style;
    },
    markedStyle() {
      return {
        color: this.elementColor('heading', 'element-heading-marked-text'),
        backgroundColor: this.elementColor('heading', 'element-heading-marked-background'),
        borderRadius: this.elementValue('heading', 'marked-radius'),
      };
    },
    flourishStyle() {
      const align = this.preset('heading', 'align') || 'left';
      return {
        width: this.elementValue('heading', 'flourish-width') || '4em',
        height: this.elementValue('heading', 'flourish-height') || '0.15em',
        backgroundColor: this.elementColor('heading', 'element-heading-flourish-color') || this.elementColor('heading', 'element-heading-text'),
        marginTop: this.elementValue('heading', 'flourish-margin-top') || '0.5em',
        marginBottom: this.elementValue('heading', 'flourish-margin-bottom') || 0,
        marginLeft: align === 'left' ? 0 : 'auto',
        marginRight: align === 'right' ? 0 : 'auto',
        fontSize: this.headingStyle.fontSize,
      };
    },
    // the text as the frontend has it: the writer's HTML; plain text (and
    // markdown, rarely used) masked with its line breaks
    editorHtml() {
      const d = this.fieldData('editor');
      const mode = d.mode || 'textarea';
      const text = String(d[mode] || '');
      if (mode === 'writer') return text;
      return esc(text).replace(/\r\n|\r|\n/g, '<br>');
    },
    // the quote: plain text, masked, its line breaks kept; in marks unless
    // the element switches them off
    quoteHtml() {
      const d = this.fieldData('quote');
      const text = String(d[d.mode || 'textarea'] || d.textarea || '').trim();
      if (!text) return '';
      const html = esc(text).replace(/\r\n|\r|\n/g, '<br>');
      return this.elementValue('quote', 'marks') !== 'disabled' ? '\u201E' + html + '\u201C' : html;
    },
    // paragraphs, lists and links in the text (Elements › Text, Lists,
    // Blocks › Links)
    richStyle() {
      const bullet = { disc: 'disc', circle: 'circle', box: 'square', dash: '"–  "', arrow: '"→  "', chevron: '"›  "', check: '"✓  "', star: '"★  "' }[this.elementValue('list', 'marker')] || 'disc';
      const number = { decimal: 'decimal', 'decimal-paren': 'decimal', 'lower-alpha': 'lower-alpha', 'lower-roman': 'lower-roman' }[this.elementValue('list', 'number-format')] || 'decimal';
      return {
        '--pw-paragraph-gap': this.elementValue('editor', 'paragraph-spacing') || '1em',
        '--pw-ul-style': bullet,
        '--pw-ol-style': number,
        '--pw-ul-indent': this.elementValue('list', 'indent') || '1.25em',
        '--pw-ol-indent': this.elementValue('list', 'number-indent') || '1.5em',
        '--pw-list-gap': this.elementValue('list', 'item-spacing') || 0,
        '--pw-list-marker': this.elementColor('list', 'element-list-marker') || 'currentColor',
        '--pw-list-number': this.elementColor('list', 'element-list-number') || 'currentColor',
        '--pw-list-marker-size': this.elementValue('list', 'marker-size') || '100%',
        // (below a list: the lists' space to what follows)
        '--pw-list-spacing': this.elementValue('list', 'spacing') || this.elementValue('editor', 'paragraph-spacing') || '1em',
        // the links (Blocks › Links), as variables: the text keeps its own weight
        '--pw-link': this.globalColor('block-link') || 'inherit',
        '--pw-link-hover': this.globalColor('block-link-hover') || this.globalColor('block-link') || 'inherit',
        '--pw-link-decoration': (this.linkValue('block-link-decoration') || 'none') === 'none' ? 'none' : 'underline',
        '--pw-link-weight': this.linkValue('block-link-weight') === 'bold' ? 700 : 'inherit',
        '--pw-link-thickness': this.linkValue('block-link-thickness') || 'auto',
        '--pw-link-offset': this.linkValue('block-link-offset') || 'auto',
      };
    },
    // the media's box: the block's size (none set: full width) and
    // alignment, the corners switched on with the element's radii, the gap
    // to the intro above
    panelMediaStyle() {
      const style = { ...this.mediaStyle };
      const widths = { xsmall: '25%', small: '33%', medium: '50%', large: '75%', fullscreen: '100%' };
      style.maxWidth = widths[this.content.mediasize] || '100%';
      return style;
    },
    // the logocloud's logos (its files field)
    panelLogos() {
      const logos = Array.isArray(this.content.logos) ? this.content.logos : [];
      return logos.filter(logo => logo && logo.url);
    },
    // the logos' row, as the block's CSS: at most "per row" tiles wide
    // (flexible: no limit), wrapping, aligned as set; the gap to the intro
    panelLogosStyle() {
      const size = this.itemValueAt('item-size') || '8rem';
      const gap = this.itemValue('item-gap') || '1.5rem';
      const rowGap = this.itemValue('item-row-gap') || gap;
      const perRow = Number(this.setting('layout', 'logos-' + ({ lg: 'lg', xl: 'xl' }[this.bp] || 'sm'))) || 2;
      const align = this.preset('logos', 'align') || 'center';
      return {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: { left: 'flex-start', right: 'flex-end' }[align] || 'center',
        columnGap: gap,
        rowGap,
        maxWidth: this.logosFlexible ? 'none' : 'calc(' + perRow + ' * ' + size + ' + ' + (perRow - 1) + ' * ' + gap + ')',
        marginLeft: align === 'left' ? 0 : 'auto',
        marginRight: align === 'right' ? 0 : 'auto',
        marginTop: this.logosTextGap,
      };
    },
    panelLogoStyle() {
      const style = { ...this.logoStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden' };
      if (this.logosFlexible) return { ...style, flex: '0 0 auto' };
      return { ...style, flex: '0 0 ' + (this.itemValueAt('item-size') || '8rem'), maxWidth: '100%' };
    },
    panelLogoImgStyle() {
      return this.logosFlexible
        ? { display: 'block', width: 'auto', maxWidth: '100%', height: '100%', objectFit: 'contain' }
        : { display: 'block', width: '100%', height: '100%', objectFit: 'contain' };
    },
    // the image's caption (Elements › Caption)
    captionStyle() {
      return {
        ...this.typography('caption'),
        color: this.elementColor('caption', 'element-caption-text'),
        marginTop: this.elementValue('caption', 'spacing'),
      };
    },
    // an entry's description (steplist, featurelist): its paragraphs and
    // lists with the entries' paragraph spacing (Elements › Items), as the
    // frontend – no extra space below a list there
    entryRichStyle() {
      const gap = this.entryValue('item-text-paragraph-spacing') || this.richStyle['--pw-paragraph-gap'];
      return { ...this.richStyle, '--pw-paragraph-gap': gap, '--pw-list-spacing': gap };
    },
    // the steplist's steps (its blocks field)
    stepItems() {
      const items = Array.isArray(this.content.blocks) ? this.content.blocks : [];
      return items.filter(item => item && item.content);
    },
    // the featurelist's features (its blocks field)
    featureItems() {
      return this.isFeaturelist ? this.stepItems : [];
    },
    // the features' columns at the device shown, as set (mobile: one)
    featureColumns() {
      if (!this.hasGrid) return 1;
      return Number(this.setting('layout', 'columns-' + this.bp)) || 1;
    },
    // the icon's size and colour for its own SVG
    featureSvgVars() {
      const s = this.featureSvgStyle;
      return { '--pw-feature-size': s.width, '--pw-feature-fill': s.fill };
    },
    // (the connector ends at the last step shown)
    stepCount() {
      return this.stepItems.length;
    },
    // the buttons: hidden ones faded (so they can still be found), those
    // without a link left out – as the frontend does
    visibleButtons() {
      const buttons = Array.isArray(this.content.buttons) ? this.content.buttons : [];
      return buttons.filter(b => b && b.content && (b.content.linkinternal || b.content.linkexternal));
    },
    // a button's icon: its own colour, size and gap to the text (Elements ›
    // Buttons), as the frontend's .link-icon
    buttonIconStyle() {
      return {
        color: this.elementColor('button', 'element-button-icon') || 'currentColor',
        '--pw-icon-size': this.elementValue('button', 'icon-size') || '1em',
        gap: this.elementValue('button', 'icon-gap') || '0.4em',
      };
    },
    buttonsRowStyle() {
      return {
        ...this.buttonsStyle,
        flexWrap: 'wrap',
        columnGap: this.elementValue('button', 'gap') || '0.5rem',
        rowGap: this.elementValue('button', 'row-gap') || '0.5rem',
      };
    },
  },
  methods: {
    elementColor(element, name) {
      if (this.isCustom) {
        const text = ['element-tagline-text', 'element-heading-text', 'element-editor-text', 'element-list-marker', 'element-list-number', 'element-quote-text', 'element-cite-text'];
        if (text.includes(name) && this.content.textcolor) return this.content.textcolor;
        if (element === 'button') {
          const theme = this.themes.includes(this.content.buttonstyle) ? this.content.buttonstyle : 'default';
          return ((this.elementOverrides.global || {})[theme] || {})[name]
            || this.elementDefaults.button?.colors?.[name]?.[theme] || '';
        }
      }
      return BlockPreview.methods.elementColor.call(this, element, name);
    },
    globalColor(name) {
      if (this.isCustom && name === 'block-background' && this.content.backgroundcolor) return this.content.backgroundcolor;
      return BlockPreview.methods.globalColor.call(this, name);
    },
    // a field's own data (tagline, heading, editor: pagewizard's JSON)
    fieldData(field) {
      return parse(this.content[field]);
    },
    // a block setting: the block's own (content keys: without hyphens),
    // else the project's start value
    // (a field the block has but left empty – a padding switched off –
    // counts as empty, as in the frontend; only a field it does not have
    // yet takes the start value)
    setting(category, key) {
      const k = key.replace(/-/g, '');
      if (Object.prototype.hasOwnProperty.call(this.content, k) && this.content[k] !== null) return this.content[k];
      return BlockPreview.methods.setting.call(this, category, key);
    },
    // a field's alignment, size, level …: its own, else the start value
    preset(field, prop) {
      if (field === 'buttons' && prop === 'align') {
        return this.content.buttonsalignment || BlockPreview.methods.preset.call(this, field, prop);
      }
      // (the media's size, alignment and corners: the block's own fields)
      if (field === 'media') {
        const key = { size: 'mediasize', align: 'mediaalignment', radius: 'mediaradius' }[prop] || prop.replace(/-/g, '');
        const own = this.content[key];
        if (own !== undefined && own !== null && own !== '') return own;
        return BlockPreview.methods.preset.call(this, field, prop);
      }
      // (the logos' alignment: the block's own field)
      if (field === 'logos' && prop === 'align') {
        return this.content.logosalignment || BlockPreview.methods.preset.call(this, field, prop);
      }
      // (the items' alignment: the block's own field)
      if (field === 'blocks' && prop === 'align') {
        return this.content.blocksalignment || BlockPreview.methods.preset.call(this, field, prop);
      }
      const v = this.fieldData(field)[prop === 'sizes' ? 'size' : prop];
      return v || BlockPreview.methods.preset.call(this, field, prop);
    },
    // a field in the block (switched on for the project) and filled
    hasField(field) {
      if (!BlockPreview.methods.hasField.call(this, field)) return false;
      if (field === 'buttons') return this.visibleButtons.length > 0;
      if (field === 'editor') {
        const d = this.fieldData('editor');
        return String(d[d.mode || 'textarea'] || '').replace(/<[^>]*>/g, '').trim() !== '';
      }
      if (['tagline', 'heading', 'author'].includes(field)) {
        return String(this.fieldData(field).text || '').replace(/<[^>]*>/g, '').trim() !== '';
      }
      return true;
    },
    // a step's number: counting the shown steps (hidden ones have none)
    stepNumber(index) {
      return this.stepItems.slice(0, index + 1).filter(item => !item.isHidden).length;
    },
    // a writer's text with something in it
    richFilled(html) {
      return String(html || '').replace(/<[^>]*>/g, '').trim() !== '';
    },
    // a column of the grid the block's content stands on (its size and
    // offset at the device shown)
    gridUsed(n) {
      const size = Number(this.setting('grid', 'grid-size-' + this.bp)) || 12;
      const offset = Number(this.setting('grid', 'grid-offset-' + this.bp)) || 0;
      return n > offset && n <= offset + Math.min(size, 12 - offset);
    },
    // a feature's title as run-in at the start of its text ("Title. Text …"),
    // in its first paragraph as the snippet does
    featureRunIn(c) {
      const text = String(c.description || '');
      const heading = String(c.heading || '');
      if (!heading) return text;
      const runIn = '<strong class="pw-panel-runin">' + esc(heading) + '.</strong> ';
      const pos = text.indexOf('<p>');
      return pos !== -1 && text.slice(0, pos).trim() === ''
        ? text.slice(0, pos) + '<p>' + runIn + text.slice(pos + 3)
        : runIn + text;
    },
    // a button's icon on one side (its position: left or right)
    buttonIcon(button, side) {
      const c = button.content || {};
      if ((c.iconposition || '') !== side) return '';
      return side === 'left' ? c.iconleft || '' : c.iconright || '';
    },
  },
};
</script>

<style>
/* the panel's block: its own light surface (the project's colours, also in
   Kirby's dark mode), links do not lead away (PanelPreview) */
.pw-panel-render {
  /* (a too long word breaks, as in the frontend) */
  overflow-wrap: break-word;
  color-scheme: light;
  color: #000;
  padding-inline: var(--spacing-3);
  border-radius: var(--rounded);
  overflow: hidden;
}
.pw-panel-render .is-fullscreen {
  margin-inline: calc(-1 * var(--spacing-3));
}
.pw-panel-render p {
  margin: 0;
}
/* the grid's twelve columns over the block: magenta, above the content,
   not in the way of clicks */
.pw-panel-render .pw-block-live-grid {
  position: relative;
}
.pw-panel-gridlines {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  pointer-events: none;
}
.pw-panel-gridlines span {
  border-inline: 1px solid rgba(255, 0, 170, 0.25);
}
/* the columns the content stands on: tinted, their lines stronger */
.pw-panel-gridlines span.is-used {
  background: rgba(255, 0, 170, 0.1);
  border-color: rgba(255, 0, 170, 0.6);
}
/* the grid: the content's columns marked by dashed lines at their edges
   (as the old preview did), from tablet on */
.pw-panel-render.has-grid .pw-block-live-item {
  position: relative;
}
.pw-panel-render.has-grid .pw-block-live-item::before,
.pw-panel-render.has-grid .pw-block-live-item::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  border-left: 1px dashed color-mix(in srgb, var(--pw-grid-line) 40%, transparent);
  pointer-events: none;
}
.pw-panel-render.has-grid .pw-block-live-item::before {
  left: 0;
}
.pw-panel-render.has-grid .pw-block-live-item::after {
  right: 0;
}
.pw-panel-quote {
  margin: 0;
}
/* the heading's marking and flourish, as the frontend (body.css) */
.pw-panel-marked {
  padding: 0.05em 0.3em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
.pw-panel-flourish {
  display: block;
}
/* the text: paragraphs, lists, links and marks – Kirby's reset undone */
.pw-panel-rich > * {
  margin: 0;
}
.pw-panel-rich > * + * {
  margin-top: var(--pw-paragraph-gap);
}
.pw-panel-rich ul,
.pw-panel-rich ol {
  padding-inline-start: var(--pw-ul-indent);
  list-style-type: var(--pw-ul-style);
}
.pw-panel-rich ol {
  padding-inline-start: var(--pw-ol-indent);
  list-style-type: var(--pw-ol-style);
}
.pw-panel-rich > :is(ul, ol) + * {
  margin-top: var(--pw-list-spacing, var(--pw-paragraph-gap));
}
.pw-panel-rich li + li {
  margin-top: var(--pw-list-gap);
}
.pw-panel-rich ul > li::marker {
  color: var(--pw-list-marker);
  font-size: var(--pw-list-marker-size);
}
.pw-panel-rich ol > li::marker {
  color: var(--pw-list-number);
}
.pw-panel-rich a {
  color: var(--pw-link);
  font-weight: var(--pw-link-weight);
  text-decoration-line: var(--pw-link-decoration);
  text-decoration-thickness: var(--pw-link-thickness);
  text-underline-offset: var(--pw-link-offset);
}
.pw-panel-rich a:hover {
  color: var(--pw-link-hover);
}
.pw-panel-rich strong,
.pw-panel-rich b {
  font-weight: 700;
}
.pw-panel-rich em,
.pw-panel-rich i {
  font-style: italic;
}
.pw-panel-rich u {
  text-decoration: underline;
}
.pw-panel-rich s {
  text-decoration: line-through;
}
/* the buttons: not clickable here; hidden ones faded as Kirby's blocks */
.pw-panel-button {
  display: inline-flex !important;
  align-items: center;
}
/* a feature's icon (its own SVG) in the item size and colour */
.pw-panel-feature-svg {
  display: flex;
}
.pw-panel-feature-svg svg {
  width: var(--pw-feature-size, 1.5rem);
  height: var(--pw-feature-size, 1.5rem);
  fill: var(--pw-feature-fill, currentColor);
}
/* the run-in title: the heading's font and colour */
.pw-panel-rich .pw-panel-runin {
  font-family: var(--pw-runin-font);
  font-weight: var(--pw-runin-weight);
  color: var(--pw-runin-color);
}
.pw-panel-button.is-hidden,
.pw-panel-render .pw-steplist-item.is-hidden,
.pw-panel-render .pw-featurelist-item.is-hidden {
  opacity: 0.25;
}
.pw-panel-button-icon {
  display: inline-flex;
}
.pw-panel-button-icon svg {
  width: var(--pw-icon-size, 1em);
  height: var(--pw-icon-size, 1em);
  fill: currentColor;
}
</style>
