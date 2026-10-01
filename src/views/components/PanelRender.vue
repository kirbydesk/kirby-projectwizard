<template>
  <!-- a block on a page in the panel, as the wizard's preview draws it (the
       project's colours, fonts, spacings, variants) – with the block's real
       content: no sample texts, no guides, no switches; empty fields are
       left out -->
  <div class="pw-panel-render" :style="{ backgroundColor: bodyBackground }">
    <div
      class="pw-block-live-block"
      :class="{ 'is-fullscreen': setting('settings', 'block-size') === 'fullscreen' }"
      :style="blockStyle"
    >
      <!-- the grid's twelve columns over the block, its outer spacing
           included (switched on above the blocks) -->
      <div v-if="gridLines && hasGrid" class="pw-panel-gridlines" :style="{ columnGap: gridStyle.columnGap }" aria-hidden="true">
        <span v-for="n in 12" :key="'gl-' + n" :class="{ 'is-used': gridUsed(n) }"></span>
      </div>
      <section class="pw-block-live-section" :style="sectionStyle">
        <!-- hero: its background image or video (blurred if set) and the
             overlay in the variant's colour, solid or as a gradient -->
        <template v-if="isHero">
          <img v-if="heroBackground === 'image' && heroFile" :src="heroFile.url" alt="" class="pw-panel-hero-bg" :style="heroBgStyle" />
          <video v-else-if="heroBackground === 'video' && heroFile" :src="heroFile.url" muted preload="metadata" class="pw-panel-hero-bg" :style="heroBgStyle"></video>
          <span v-if="panelHeroOverlayStyle" class="pw-panel-hero-overlay" :style="panelHeroOverlayStyle"></span>
        </template>
        <div class="pw-block-live-grid" :style="gridStyle">
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

            <!-- cardlets: its cards (image, tagline, heading, text, link) in
                 the display set – image above, texts on the image, image
                 standing out; hidden ones faded -->
            <div v-if="isCardlets && panelCards.length" class="pw-cardlets-items pw-featurelist-items" :class="{ 'is-row': cardColumns > 1 }" :style="cardItemsStyle">
              <div
                v-for="(item, i) in panelCards"
                :key="item.id || i"
                class="pw-cardlets-item"
                :class="{ 'is-hidden': item.isHidden }"
                :style="cardStyle"
              >
                <div v-if="cardImageUrl(item)" class="pw-cardlets-image-wrap" :class="{ 'is-overhang': cardOverhang }">
                  <span v-if="cardOverhang" class="pw-cardlets-overhang" :style="cardOverhangStyle"></span>
                  <img :src="cardImageUrl(item)" alt="" class="pw-panel-card-image" :style="panelCardImageStyle(item)" />
                </div>
                <div v-if="cardOverlay" class="pw-cardlets-overlay" :style="cardOverlayStyle"></div>
                <div class="pw-cardlets-content" :style="cardContentStyle">
                  <template v-for="el in itemCardFields(item)">
                    <div
                      v-if="el === 'editor'"
                      :key="'cf-' + el"
                      class="pw-panel-rich"
                      :style="{ ...panelCardFieldStyle(item, el), ...richStyle }"
                      v-html="cardEditorHtml(item)"
                    ></div>
                    <!-- (a heading marked: as the heading's marking) -->
                    <div v-else-if="el === 'heading' && cardJson(item, el).textbackground === 'enabled'" :key="'cf-' + el" :style="{ ...panelCardFieldStyle(item, el), lineHeight: elementValue('heading', 'marked-line-height') || null }">
                      <span class="pw-panel-marked" :style="markedStyle" v-html="cardJson(item, el).text"></span>
                    </div>
                    <div v-else :key="'cf-' + el" :style="panelCardFieldStyle(item, el)" v-html="cardJson(item, el).text"></div>
                  </template>
                  <span v-if="item.content.linkinternal" class="pw-cardlets-cta" :style="panelCtaStyle(item)">{{ item.content.linktext || $t('kirbyblock-cardlets.item.cta') }}<svg v-if="cardCtaIcon" viewBox="0 0 24 24" aria-hidden="true" v-html="cardCtaIcon"></svg></span>
                </div>
              </div>
            </div>

            <!-- multicolumn: its two columns (side by side as the distribution
                 at the size shown, else below each other), each with its
                 sub-blocks and their space below; hidden ones faded -->
            <div v-if="isMulticolumn && mcColumns.length" class="pw-mc-preview" :style="mcStyle">
              <div v-for="col in mcColumns" :key="col.side" class="pw-mc-column" :style="mcColumnStyle(col.side)">
                <pw-panel-sub
                  v-for="(item, i) in col.items"
                  :key="item.id || i"
                  v-bind="$props"
                  :item="item"
                  :class="{ 'is-hidden': item.isHidden }"
                  :style="{ marginBottom: i < col.items.length - 1 ? mcSpace(item) : 0 }"
                />
              </div>
            </div>

            <!-- faq: its questions as the frontend starts them (the first open
                 if set, always open: all), lines or cards; hidden ones faded -->
            <div v-if="isFaq && faqItems.length" class="pw-faq-preview" :style="faqListStyle">
              <div
                v-for="(item, i) in faqItems"
                :key="item.id || i"
                class="pw-faq-item"
                :class="{ 'is-hidden': item.isHidden }"
                :style="faqItemStyle(i + 1)"
              >
                <div class="pw-faq-summary" :style="faqSummaryStyle">
                  <div :style="faqQuestionStyle">{{ item.content.question }}</div>
                  <span v-if="faqIcon !== 'none' && !faqAlwaysOpen" class="pw-faq-icon" :style="faqIconStyle(faqOpen(i + 1))">
                    <svg v-if="faqIcon === 'chevron'" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="faqStroke" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 4 17 12 9 20" /></svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="faqStroke" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12" /><line v-if="!faqOpen(i + 1)" x1="12" y1="4" x2="12" y2="20" /></svg>
                  </span>
                </div>
                <div
                  v-if="faqOpen(i + 1) && faqAnswerHtml(item)"
                  class="pw-panel-rich"
                  :style="{ ...faqAnswerStyle, ...entryRichStyle }"
                  v-html="faqAnswerHtml(item)"
                ></div>
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
  data() {
    // the settings of the cards' image files (ratio, crop, focus) by link
    return { cardMeta: {} };
  },
  watch: {
    cardImageLinks: {
      immediate: true,
      handler(links) {
        links.filter(link => !(link in this.cardMeta)).forEach(link => this.loadCardMeta(link));
      },
    },
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
    // the multicolumn's columns with their sub-blocks (an empty one left out,
    // as the snippet)
    mcColumns() {
      if (!this.isMulticolumn) return [];
      return ['left', 'right']
        .map(side => ({ side, items: (Array.isArray(this.content['blocks' + side]) ? this.content['blocks' + side] : []).filter(item => item && item.content) }))
        .filter(col => col.items.length > 0);
    },
    // the distribution at the size shown (the block's own, else the start value)
    mcDist() {
      if (!this.hasGrid) return '';
      return this.content['distribution' + this.bp] || this.setting('layout', 'columns-' + this.bp) || '';
    },
    // side by side in the distribution's shares, the column gap between them;
    // else below each other with the row gap
    mcStyle() {
      const m = /^dist-(\d)-(\d)$/.exec(this.mcDist);
      if (!m) return { display: 'flex', flexDirection: 'column', gap: this.itemValueAt('row-gap') };
      return { display: 'grid', gridTemplateColumns: 'minmax(0, ' + m[1] + 'fr) minmax(0, ' + m[2] + 'fr)', columnGap: this.itemValueAt('column-gap') };
    },
    // the faq's questions: those with a question (as the snippet)
    faqItems() {
      if (!this.isFaq) return [];
      return this.stepItems.filter(item => String(item.content.question || '').trim() !== '');
    },
    // the cards: those with a text shown (as the snippet)
    panelCards() {
      if (!this.isCardlets) return [];
      return this.stepItems.filter(item => this.itemCardFields(item).length > 0);
    },
    // the cards' columns at the size shown, as set (XS: one)
    cardColumns() {
      if (!this.hasGrid) return 1;
      return Number(this.setting('layout', 'columns-' + this.bp)) || 1;
    },
    // the cards' image files (their settings loaded below)
    cardImageLinks() {
      const files = [...this.panelCards.map(item => this.cardImage(item)), this.isHero ? this.heroFile : null];
      return files.filter(f => f && f.link).map(f => f.link);
    },
    // the hero's background file (image or video)
    heroFile() {
      const list = this.content[this.heroBackground === 'video' ? 'video' : 'image'];
      return Array.isArray(list) ? list[0] || null : null;
    },
    // its picture: filling the hero, at the image's focus, blurred if set
    heroBgStyle() {
      const meta = (this.heroFile && this.cardMeta[this.heroFile.link]) || {};
      const blur = parseInt(this.content[this.heroBackground === 'video' ? 'blurvideo' : 'blurimage'], 10) || 0;
      return {
        objectPosition: this.heroBackground === 'image' ? meta.focus || '50% 50%' : null,
        filter: blur > 0 ? 'blur(' + blur + 'px)' : null,
        transform: blur > 0 ? 'scale(1.05)' : null,
      };
    },
    // the overlay: the variant's colour at the block's strength, over the
    // whole hero or as a gradient from one side (as the block's CSS)
    panelHeroOverlayStyle() {
      const type = this.content.overlaytype;
      if (type !== 'solid' && type !== 'gradient') return null;
      const strength = parseInt(this.content[type === 'solid' ? 'overlayintensity' : 'overlaygradientintensity'], 10) || 0;
      const color = 'color-mix(in srgb, ' + (this.itemColor('overlay') || '#000000') + ' ' + strength + '%, transparent)';
      if (type === 'solid') return { inset: 0, background: color };
      const side = this.content.overlayposition || 'left';
      // its size: the range, else the former steps
      const own = parseInt(this.content.overlaywidth, 10);
      const size = (isNaN(own) ? { small: 25, medium: 50, large: 75, xlarge: 100 }[this.content.overlaysize] || 50 : own) + '%';
      const across = side === 'left' || side === 'right';
      // full strength over its first 35 %, then easing out in steps
      const base = this.itemColor('overlay') || '#000000';
      const stops = [[1, 0], [1, 35], [0.85, 45], [0.62, 55], [0.4, 65], [0.2, 75], [0.07, 87]]
        .map(([k, at]) => 'color-mix(in srgb, ' + base + ' ' + (strength * k) + '%, transparent) ' + at + '%');
      return {
        top: side === 'bottom' ? 'auto' : 0,
        bottom: side === 'top' ? 'auto' : 0,
        left: side === 'right' ? 'auto' : 0,
        right: side === 'left' ? 'auto' : 0,
        width: across ? size : '100%',
        height: across ? '100%' : size,
        background: 'linear-gradient(to ' + { left: 'right', right: 'left', top: 'bottom', bottom: 'top' }[side] + ', ' + stops.join(', ') + ', transparent 100%)',
      };
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
      const perRow = Number(this.setting('layout', 'logos-' + ({ md: 'md', lg: 'lg', xl: 'xl' }[this.bp] || 'sm'))) || 2;
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
    // pagewizard's JSON of a field
    parseJson(value) {
      return parse(value);
    },
    // a sub-block's kind (multicolumnheadlineleft → headline)
    mcKind(item) {
      return String(item.type || '').replace(/^multicolumn/, '').replace(/(left|right)$/, '');
    },
    // a column's vertical place next to the other (the block's own)
    mcColumnStyle(side) {
      if (!this.mcSide) return null;
      const v = this.content[side + 'positionvertical'] || this.setting('layout', 'multicolumn-' + side);
      return { alignSelf: { top: 'start', middle: 'center', bottom: 'end' }[v] || 'start' };
    },
    // the space below a sub-block: the element's (the lists' for a list)
    mcSpace(item) {
      const kind = this.mcKind(item);
      if (kind === 'list') return this.mcListSpacing;
      return this.spaceAfter({ headline: 'heading', text: 'editor' }[kind] || kind);
    },
    mcTaglineStyle(item) {
      const d = parse(item.content.tagline);
      return { ...this.typography('tagline'), color: this.elementColor('tagline', 'element-tagline-text'), textAlign: d.align || this.preset('tagline', 'align') || 'left', margin: 0 };
    },
    mcHeadlineSize(item) {
      const d = parse(item.content.heading);
      return this.sizeStep('heading', d.size || this.preset('headline', 'sizes') || 'lg');
    },
    mcHeadlineStyle(item) {
      const d = parse(item.content.heading);
      const style = { ...this.typography('heading'), color: this.elementColor('heading', 'element-heading-text'), textAlign: d.align || this.preset('headline', 'align') || 'left', margin: 0 };
      const size = this.mcHeadlineSize(item);
      if (size) style.fontSize = size;
      if (d.textbackground === 'enabled') style.lineHeight = this.elementValue('heading', 'marked-line-height') || style.lineHeight;
      return style;
    },
    mcHeadlineHtml(item) {
      const d = parse(item.content.heading);
      const text = String(d.text || '');
      return d.multiline === 'enabled' ? text.split(/\r\n|\r|\n/).filter(l => l !== '').join('<br>') : text;
    },
    mcFlourishStyle(item) {
      const align = parse(item.content.heading).align || this.preset('headline', 'align') || 'left';
      return { ...this.flourishStyle, fontSize: this.mcHeadlineSize(item) || this.flourishStyle.fontSize, marginLeft: align === 'left' ? 0 : 'auto', marginRight: align === 'right' ? 0 : 'auto' };
    },
    mcTextSize(item) {
      const d = parse(item.content.editor);
      const size = d.size || this.preset('text', 'sizes') || 'normal';
      const step = size !== 'normal' ? this.sizeStep('editor', size) : '';
      return { ...this.typography('editor'), ...(step ? { fontSize: step } : {}), color: this.elementColor('editor', 'element-editor-text'), textAlign: d.align || this.preset('text', 'align') || 'left' };
    },
    mcTextHtml(item) {
      const d = parse(item.content.editor);
      const mode = d.mode || 'textarea';
      const text = String(d[mode] || '');
      return mode === 'writer' ? text : esc(text).replace(/\r\n|\r|\n/g, '<br>');
    },
    mcListTag(item) {
      return item.content.liststyle === 'ordered' ? 'ol' : 'ul';
    },
    mcListItems(item) {
      // (a structure: a list, or as JSON text)
      let items = item.content.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { items = []; }
      }
      items = Array.isArray(items) ? items : [];
      return items.map(li => (li && li.text) || '').filter(t => t !== '');
    },
    // the list: its style, alignment and size; marker, indent and gap as
    // the lists (Elements › Lists)
    mcItemListStyle(item) {
      const kind = item.content.liststyle || 'bullet';
      const size = item.content.listsize || 'normal';
      const step = size !== 'normal' ? this.sizeStep('editor', size) : '';
      const marker = kind === 'none' ? 'none'
        : kind === 'ordered' ? ({ decimal: 'decimal', 'decimal-paren': 'decimal', 'lower-alpha': 'lower-alpha', 'lower-roman': 'lower-roman' }[this.elementValue('list', 'number-format')] || 'decimal')
        : ({ disc: 'disc', circle: 'circle', box: 'square', dash: '"–  "', arrow: '"→  "', chevron: '"›  "', check: '"✓  "', star: '"★  "' }[this.elementValue('list', 'marker')] || 'disc');
      return {
        ...this.typography('editor'),
        ...(step ? { fontSize: step } : {}),
        color: this.elementColor('editor', 'element-editor-text'),
        textAlign: item.content.listalignment || 'left',
        margin: 0,
        paddingLeft: kind === 'none' ? 0 : this.elementValue('list', kind === 'ordered' ? 'number-indent' : 'indent'),
        listStyleType: marker,
        '--pw-list-gap': this.elementValue('list', 'item-spacing') || 0,
        '--pw-list-marker': this.elementColor('list', kind === 'ordered' ? 'element-list-number' : 'element-list-marker') || 'currentColor',
        '--pw-list-marker-size': kind === 'ordered' ? '100%' : (this.elementValue('list', 'marker-size') || '100%'),
      };
    },
    mcQuoteHtml(item) {
      const d = parse(item.content.quote);
      const text = String(d[d.mode || 'textarea'] || d.textarea || d.text || '').trim();
      if (!text) return '';
      const html = esc(text).replace(/\r\n|\r|\n/g, '<br>');
      return this.elementValue('quote', 'marks') !== 'disabled' ? '\u201E' + html + '\u201C' : html;
    },
    mcItemQuoteStyle(item) {
      const d = parse(item.content.quote);
      const size = d.size || this.preset('quote', 'sizes') || 'lg';
      return { ...this.quoteStyle, fontSize: this.sizeStep('quote', size) || this.quoteStyle.fontSize, textAlign: d.align || this.quoteStyle.textAlign };
    },
    // a media sub-block's box: its size, alignment and corners
    mcMediaBox(c) {
      const widths = { xsmall: '25%', small: '33%', medium: '50%', large: '75%', fullscreen: '100%' };
      const align = c.mediaalignment || this.preset('media', 'align') || 'left';
      const def = this.elementDefaults.media?.vars?.['media-radius']?.value || [];
      const ov = (this.elementOverrides.global || {})['media-radius'];
      const r = Array.isArray(ov) ? ov : def;
      const on = (v) => v === true || v === 'true';
      const corner = (flag, idx) => (c.mediaradius === 'custom' && on(flag) ? r[idx] || 0 : 0);
      return {
        maxWidth: widths[c.mediasize] || '100%',
        marginLeft: align === 'left' ? 0 : 'auto',
        marginRight: align === 'right' ? 0 : 'auto',
        borderRadius: [corner(c.radiustopleft, 0), corner(c.radiustopright, 1), corner(c.radiusbottomright, 3), corner(c.radiusbottomleft, 2)].join(' '),
      };
    },
    // a button's icon on one side (older: one icon field)
    mcButtonIcon(item, side) {
      const c = item.content || {};
      if ((c.iconposition || '') !== side) return '';
      return (side === 'left' ? c.iconleft : c.iconright) || c.icon || '';
    },
    // faq: open as the frontend starts – always open: all; else the first
    // when set
    faqOpen(n) {
      if (this.faqAlwaysOpen) return true;
      return n === 1 && this.setting('style', 'faq-first-open') === 'yes';
    },
    // an answer: the writer's HTML; plain text masked with its breaks
    faqAnswerHtml(item) {
      const d = parse(item.content.answer);
      const mode = d.mode || 'textarea';
      const text = String(d[mode] || '');
      if (text.replace(/<[^>]*>/g, '').trim() === '') return '';
      return mode === 'writer' ? text : esc(text).replace(/\r\n|\r|\n/g, '<br>');
    },
    // a card's tagline, heading or text (pagewizard's JSON)
    cardJson(item, el) {
      return parse(item.content[{ tagline: 'tagline', heading: 'heading', editor: 'description' }[el]]);
    },
    // the card's texts: switched on for the project and filled
    itemCardFields(item) {
      return ['tagline', 'heading', 'editor'].filter((el) => {
        if (!this.hasField('item-' + el)) return false;
        const d = this.cardJson(item, el);
        const text = el === 'editor' ? d[d.mode || 'textarea'] : d.text;
        return String(text || '').replace(/<[^>]*>/g, '').trim() !== '';
      });
    },
    cardImage(item) {
      return Array.isArray(item.content.image) ? item.content.image[0] || null : null;
    },
    cardImageUrl(item) {
      const image = this.cardImage(item);
      return image && image.url ? image.url : '';
    },
    async loadCardMeta(link) {
      this.$set(this.cardMeta, link, {});
      try {
        const response = await this.$api.get(link, { select: 'content' });
        this.$set(this.cardMeta, link, (response && response.content) || {});
      } catch (e) { /* the image without its settings */ }
    },
    // the card's image as the frontend: the set ratio of the size shown
    // (Original: the file's), above cropped at its focus, standing out the
    // whole cut-out at the bottom; none set: the file's ratio, crop and
    // focus; on the image filling the card
    panelCardImageStyle(item) {
      const image = this.cardImage(item) || {};
      const meta = this.cardMeta[image.link] || {};
      const fileRatio = meta.imageratio && meta.imageratio !== 'auto' ? meta.imageratio : '';
      const fileCrop = meta.imagecrop === true || meta.imagecrop === 'true';
      const focus = meta.focus || '50% 50%';
      const style = { display: 'block', width: '100%' };
      if (this.cardOverlay) {
        return { ...style, position: 'absolute', inset: 0, height: '100%', objectFit: 'cover', objectPosition: fileCrop ? focus : 'center' };
      }
      const key = this.cardOverhang ? 'item-cutout-ratio' : 'item-image-ratio';
      const set = [key, key + '-lg', key + '-xl'].some(k => (this.setting('layout', k) || 'auto') !== 'auto');
      const ratioOf = (r) => (r ? { aspectRatio: r.replace('/', ' / '), height: 'auto' } : { height: 'auto' });
      if (set) {
        const own = this.setting('layout', key + ({ lg: '-lg', xl: '-xl' }[this.bp] || '')) || 'auto';
        const ratio = own !== 'auto' ? own : fileRatio;
        if (this.cardOverhang) return { ...style, ...ratioOf(ratio), objectFit: 'contain', objectPosition: 'center bottom' };
        return { ...style, ...ratioOf(ratio), objectFit: 'cover', objectPosition: focus };
      }
      return { ...style, ...ratioOf(fileRatio), objectFit: fileCrop ? 'cover' : 'contain', objectPosition: fileCrop ? focus : 'center' };
    },
    // a text in the card: as the wizard's, with its own alignment and size;
    // the gap below to the next text, the last one to the link (none
    // without a link)
    panelCardFieldStyle(item, el) {
      const style = this.cardFieldStyle(el);
      const d = this.cardJson(item, el);
      if (d.align) style.textAlign = d.align;
      if (d.size && d.size !== 'normal') {
        const step = this.sizeStep(el, d.size);
        if (step) style.fontSize = step;
      }
      const fields = this.itemCardFields(item);
      const last = fields.indexOf(el) === fields.length - 1;
      style.marginBottom = last
        ? (item.content.linkinternal ? this.itemValue('item-cta-gap') : 0)
        : this.itemValue(el === 'tagline' ? 'item-tagline-spacing' : 'item-heading-spacing');
      return style;
    },
    // the card's text: the writer's HTML; plain text masked with its breaks
    cardEditorHtml(item) {
      const d = this.cardJson(item, 'editor');
      const mode = d.mode || 'textarea';
      const text = String(d[mode] || '');
      return mode === 'writer' ? text : esc(text).replace(/\r\n|\r|\n/g, '<br>');
    },
    // the link: its own alignment
    panelCtaStyle(item) {
      const align = item.content.linkalign || 'left';
      return { ...this.cardCtaStyle, alignSelf: { center: 'center', right: 'flex-end' }[align] || 'flex-start' };
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
.pw-panel-gridlines {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  pointer-events: none;
}
/* as a layout grid in Figma: the columns tinted, no lines, the gaps
   empty; the columns the content stands on stronger */
/* (a hidden block: none – Kirby narrows and fades it, the columns would
   not match the others) */
.k-block-container[data-hidden="true"] .pw-panel-gridlines {
  display: none;
}
.pw-panel-gridlines span {
  background: rgba(255, 0, 170, 0.04);
}
.pw-panel-gridlines span.is-used {
  background: rgba(255, 0, 170, 0.14);
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
/* the hero: its background and overlay below the content */
.pw-panel-hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}
.pw-panel-hero-overlay {
  position: absolute;
  z-index: 1;
  pointer-events: none;
}
.pw-panel-render .pw-block-live-section > .pw-block-live-grid {
  position: relative;
  z-index: 2;
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
.pw-panel-render .pw-cardlets-item.is-hidden,
.pw-panel-render .pw-faq-item.is-hidden,
.pw-panel-render .pw-mc-el.is-hidden,
.pw-panel-render .pw-featurelist-item.is-hidden {
  opacity: 0.25;
}
.pw-panel-mc-list > li + li {
  margin-top: var(--pw-list-gap);
}
.pw-panel-mc-list > li::marker {
  color: var(--pw-list-marker);
  font-size: var(--pw-list-marker-size);
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
