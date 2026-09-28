<template>
  <!-- Live preview of a block in the sidebar: rebuilt from the wizard's
       current (also unsaved) values the way the frontend CSS uses them –
       the block frame (background, paddings, corners, grid width) and its
       fields in the element typography with the block's presets. -->
  <div class="pw-element-preview-side pw-block-live-preview">
    <div class="pw-preview-switches">
      <!-- guides on/off: the padding line, as in Photoshop -->
      <div class="pw-pill pw-guides-switch" role="group">
        <button
          type="button"
          class="pw-tool"
          :title="$t('prw.preview.guides')"
          :aria-label="$t('prw.preview.guides')"
          :aria-pressed="guides ? 'true' : 'false'"
          @click="toggleGuides"
        >
          <k-icon type="prw-guides" />
        </button>
      </div>
      <pw-device-select :value="bp" @input="$emit('update:bp', $event)" />
      <div class="pw-pill pw-preview-bp pw-preview-theme" role="group">
        <button
          v-for="t in themes"
          :key="'pt-' + t"
          type="button"
          class="pw-tool"
          :aria-pressed="currentTheme === t ? 'true' : 'false'"
          @click="$emit('update:variant', t)"
        >{{ $t('pw.option.' + t) }}</button>
      </div>
    </div>

    <div class="pw-block-live-body" :style="{ backgroundColor: bodyBackground }">
      <!-- outer spacing as padding of a wrapper: the guides mark its edge
           (towards the neighbouring blocks) across the whole width -->
      <div
        class="pw-block-live-block"
        :class="{ 'has-guide-top': blockGuides && setting('settings', 'margin-top') === true, 'has-guide-bottom': blockGuides && setting('settings', 'margin-bottom') === true, 'is-fullscreen': setting('settings', 'block-size') === 'fullscreen' }"
        :style="blockStyle"
      >
      <section class="pw-block-live-section" :class="{ 'has-guides': blockGuides }" :style="sectionStyle">
        <!-- like the frontend: grid (12 columns from tablet on) > item with
             the paddings -->
        <div class="pw-block-live-grid" :style="gridStyle">
          <div class="pw-block-live-item" :style="itemStyle">
          <div class="pw-block-live-content">
          <p v-if="hasField('tagline')" :style="fieldStyle('tagline')">{{ $t('prw.preview.tagline') }}</p>
          <div v-if="hasField('heading')" :style="fieldStyle('heading')">{{ $t('prw.preview.heading') }}</div>
          <p v-if="hasField('editor')" :style="fieldStyle('editor')">{{ $t('prw.preview.text.before') }} {{ $t('prw.preview.text.link') }}{{ $t('prw.preview.text.after') }}</p>
          <!-- quote: the quote (element typography, its size step and marks)
               and its source below -->
          <figure v-if="isQuote" class="pw-quote-preview">
            <blockquote :style="quoteStyle">{{ quoteText }}</blockquote>
            <figcaption v-if="hasField('author')"><cite :style="citeStyle">{{ $t('prw.sample.cite') }}</cite></figcaption>
          </figure>
          <!-- media: a sample image (as in the element's preview) with the
               element's corner radii -->
          <div v-if="isMedia && hasField('media')" class="pw-media-preview-img pw-media-preview-photo" :style="mediaStyle"></div>
          <!-- logocloud: four sample logos, two by two (so the gap shows
               between the columns and between the rows), shrinking in a
               narrow preview -->
          <div v-if="isLogocloud" class="pw-logocloud-preview" :class="{ 'has-guides': guides, 'is-flexible': logosFlexible }" :style="logosStyle">
            <div
              v-for="(logo, index) in dummyLogos"
              :key="'logo-' + index"
              class="pw-logocloud-item"
              :style="logoTileStyle(index)"
            >
              <svg :viewBox="'0 0 ' + logo[0] + ' ' + logo[1]" :style="{ aspectRatio: logo[0] + ' / ' + logo[1] }" aria-hidden="true" v-html="logo[2]"></svg>
            </div>
            <!-- guides: the gap as elements of their own, two cyan lines each
                 (between the columns, between the rows) -->
            <template v-if="guides && !logosFlexible">
              <span class="pw-logocloud-gap is-column" style="grid-area: 1 / 2"></span>
              <span class="pw-logocloud-gap is-column" style="grid-area: 3 / 2"></span>
              <span class="pw-logocloud-gap is-row" style="grid-area: 2 / 1"></span>
              <span class="pw-logocloud-gap is-row" style="grid-area: 2 / 3"></span>
            </template>
          </div>
          <div v-if="hasField('buttons')" :style="buttonsStyle">
            <span :style="buttonStyle">{{ $t('prw.preview.button') }}</span>
          </div>
          <!-- steplist: two steps (number, title, text) as in its snippet -->
          <!-- guides: the gaps as elements of their own with a line on either
               side – between the steps cyan, between number and text magenta -->
          <div v-if="isSteplist" class="pw-steplist-items" :class="{ 'has-guides': guides, 'is-row': stepColumns > 1 }" :style="stepItemsStyle">
            <template v-for="n in stepCount">
            <span v-if="guides && n > 1" :key="'step-gap-' + n" class="pw-steplist-step-gap" :style="stepStepGapStyle"></span>
            <div
              :key="'step-' + n"
              class="pw-steplist-item"
              :class="{ 'is-connected': currentStepStyle === 'connected', 'is-centered': currentStepStyle === 'centered' }"
              :style="stepItemStyle"
            >
              <span v-if="currentStepStyle === 'connected'" class="pw-steplist-connector" :style="stepConnectorStyle(n)"></span>
              <div class="pw-steplist-number" :style="stepNumberStyle">{{ n }}</div>
              <!-- guides: the gap between number and text as its own element,
                   a magenta line on either side -->
              <span v-if="guides" class="pw-steplist-gap" :style="stepGapStyle"></span>
              <div class="pw-steplist-content">
                <div :style="stepHeadingStyle">{{ $t('prw.preview.step.title') }} {{ n }}</div>
                <div :style="stepTextStyle">{{ $t('prw.preview.step.text') }}</div>
              </div>
            </div>
            </template>
          </div>
          </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  </div>
</template>

<script>
// fixed gaps between the fields, from the blocks' own CSS (kirbyblock-text,
// kirbyblock-steplist: tagline / heading / text before the items)
const GAPS = {
  'tagline>items': '1rem',
  'heading>items': '1.2rem',
  'editor>items': '2rem',
  'tagline>heading': '0.5rem',
  'tagline>editor': '0.3rem',
  'tagline>buttons': '1rem',
  'heading>editor': '0.5rem',
  'heading>buttons': '1.2rem',
  'editor>buttons': '1.2rem',
  // (kirbyblock-logocloud: before the logos)
  'tagline>logos': '1rem',
  'heading>logos': '2rem',
  'editor>logos': '2rem',
  // (kirbyblock-media: before the image, slideshow or video)
  'tagline>media': '0.8rem',
  'heading>media': '1.2rem',
  'editor>media': '1.2rem',
};
// made-up sample logos for the logo cloud, in different formats (wide,
// medium, a square mark, very wide): [width, height, svg]
const DUMMY_LOGOS = [
  [120, 60, '<circle cx="30" cy="30" r="13" fill="#4b5563"/><circle cx="30" cy="30" r="6" fill="#fff"/><text x="50" y="36" font-family="Helvetica, Arial, sans-serif" font-size="17" font-weight="700" fill="#4b5563">Lumo</text>'],
  [90, 60, '<path d="M14 42 L26 18 L38 42 Z" fill="#6b7280"/><text x="44" y="36" font-family="Georgia, serif" font-size="17" font-style="italic" fill="#6b7280">Nova</text>'],
  [60, 60, '<rect x="14" y="14" width="32" height="32" rx="7" fill="#374151"/><rect x="23" y="23" width="14" height="14" rx="3" fill="#fff"/>'],
  [180, 60, '<path d="M14 36 Q22 22 30 36 T46 36" fill="none" stroke="#6b7280" stroke-width="4" stroke-linecap="round"/><text x="54" y="37" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="300" letter-spacing="3" fill="#6b7280">velamaris</text>'],
];

// device → grid breakpoint (below 640px there is no grid: full width)
const GRID_BP = { default: null, lg: 'lg', xl: 'xl' };
// column gap of the frontend grid (gap-12 at lg, gap-16 at xl) as a share
// of the device width, so the grid fits the narrow preview
const GRID_GAP = { lg: 48 / 1024 * 100 + '%', xl: 64 / 1280 * 100 + '%' };

export default {
  props: {
    // the block (pwtext, pwsteplist …): decides the parts after the fields
    blockType: { type: String, default: '' },
    config: { type: Object, default: () => ({}) },
    overrides: { type: Object, default: () => ({}) },
    elementDefaults: { type: Object, default: () => ({}) },
    elementOverrides: { type: Object, default: () => ({}) },
    globalDefaults: { type: Object, default: () => ({}) },
    globalOverrides: { type: Object, default: () => ({}) },
    fontDefaults: { type: Object, default: () => ({}) },
    fontOverrides: { type: Object, default: () => ({}) },
    fonts: { type: Object, default: () => ({}) },
    bodyDefaultFont: { type: String, default: 'Inter' },
    bodyBackground: { type: String, default: '' },
    themes: { type: Array, default: () => ['default'] },
    // device shown: the one chosen in the rows (default / lg / xl)
    bp: { type: String, default: 'default' },
    // guides on/off (shared with the settings rows, .sync)
    guides: { type: Boolean, default: false },
    // the block's own values (items: sizes, gaps, colours) and their overrides
    valueDefaults: { type: Object, default: () => ({}) },
    valueOverrides: { type: Object, default: () => ({}) },
    // the block's own guides (paddings, outer spacing): not in the design
    // tab, which sets the items' values only
    withBlockGuides: { type: Boolean, default: true },
    // steplist: the item style to show (chosen in the design tab)
    stepStyle: { type: String, default: '' },
    // variant shown, shared with the colour cards (.sync); empty: the block's preset
    variant: { type: String, default: '' },
  },
  computed: {
    dummyLogos() {
      return DUMMY_LOGOS;
    },
    blockGuides() {
      return this.guides && this.withBlockGuides;
    },
    // the chosen variant (here or in the colour cards), else the block's preset
    currentTheme() {
      const chosen = this.variant || this.setting('style', 'theme') || 'default';
      return this.themes.includes(chosen) ? chosen : 'default';
    },
    // fields shown in the order of the snippet (steplist: its items last)
    fields() {
      const fields = ['tagline', 'heading', 'editor', 'buttons'].filter(f => this.hasField(f));
      if (this.isSteplist) return [...fields, 'items'];
      if (this.isMedia && this.hasField('media')) return [...fields, 'media'];
      if (this.isLogocloud) return [...fields, 'logos'];
      return fields;
    },
    isMedia() {
      return this.blockType === 'pwmedia';
    },
    // the media as a new block starts: its size (max width as in the
    // frontend) and alignment, its corners – none, round (all four) or
    // custom (the chosen ones) with the element's radii (Elements › Media)
    mediaStyle() {
      const def = this.elementDefaults.media?.vars?.['media-radius']?.value || [];
      const ov = (this.elementOverrides.global || {})['media-radius'];
      const r = Array.isArray(ov) ? ov : def;
      const style = this.preset('media', 'radius') || 'none';
      const corner = (key, idx) => {
        if (style === 'round') return r[idx] || 0;
        if (style === 'custom' && this.preset('media', 'radius-' + key) === true) return r[idx] || 0;
        return 0;
      };
      const widths = { xsmall: '25%', small: '33%', medium: '50%', large: '75%', fullscreen: '100%' };
      const align = this.preset('media', 'align') || 'left';
      return {
        marginTop: this.gapBefore('media'),
        maxWidth: widths[this.preset('media', 'size')] || '33%',
        marginLeft: align === 'left' ? 0 : 'auto',
        marginRight: align === 'right' ? 0 : 'auto',
        borderRadius: r.length === 4
          ? [corner('top-left', 0), corner('top-right', 1), corner('bottom-right', 3), corner('bottom-left', 2)].join(' ')
          : 0,
      };
    },
    isLogocloud() {
      return this.blockType === 'pwlogocloud';
    },
    // the logos: two columns and two rows with the gap between them,
    // aligned as set
    logosStyle() {
      const size = this.itemValueAt('item-size');
      const align = this.preset('logos', 'align') || 'center';
      const justify = { left: 'start', right: 'end' }[align] || 'center';
      // between the logos of a row / between the rows (older: one gap)
      const gap = this.itemValue('item-gap');
      const rowGap = this.itemValue('item-row-gap') || gap;
      // flexible: one height, each tile as wide as its logo, wrapping
      if (this.logosFlexible) {
        return {
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: { left: 'flex-start', right: 'flex-end' }[align] || 'center',
          columnGap: gap,
          rowGap,
          marginTop: this.gapBefore('logos'),
        };
      }
      // guides: the gaps are tracks of their own (for their lines)
      if (this.guides) {
        return {
          display: 'grid',
          gridTemplateColumns: 'minmax(0, ' + size + ') ' + gap + ' minmax(0, ' + size + ')',
          gridTemplateRows: 'auto ' + rowGap + ' auto',
          justifyContent: justify,
          marginTop: this.gapBefore('logos'),
        };
      }
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, ' + size + '))',
        justifyContent: justify,
        columnGap: gap,
        rowGap,
        marginTop: this.gapBefore('logos'),
      };
    },
    // the tile's padding: vertical, horizontal (older: one value)
    logoPadding() {
      const x = this.itemValue('item-padding');
      return (this.itemValue('item-padding-y') || x) + ' ' + x;
    },
    // logocloud format: square tiles or one height ("flexible")
    logosFlexible() {
      return this.setting('layout', 'item-format') === 'flexible';
    },
    // a logo's tile: size, padding, shape and background as in the frontend
    logoStyle() {
      const shape = this.setting('layout', 'item-shape') || 'round';
      if (this.logosFlexible) {
        const r = this.itemValue('item-radius') || [];
        const custom = Array.isArray(r) && r.length === 4 ? [r[0], r[1], r[3], r[2]].join(' ') : 0;
        return {
          height: this.itemValueAt('item-size'),
          maxWidth: '100%',
          padding: this.logoPadding,
          backgroundColor: this.itemColor('item-background'),
          borderRadius: { square: 0, round: '999px' }[shape] ?? custom,
        };
      }
      const r = this.itemValue('item-radius') || [];
      const custom = Array.isArray(r) && r.length === 4 ? [r[0], r[1], r[3], r[2]].join(' ') : 0;
      return {
        minWidth: 0,
        aspectRatio: '1',
        padding: this.logoPadding,
        backgroundColor: this.itemColor('item-background'),
        borderRadius: { square: 0, round: '50%' }[shape] ?? custom,
      };
    },
    isQuote() {
      return this.blockType === 'pwquote';
    },
    // the sample quote, with the element's quote marks (or none)
    quoteText() {
      const text = this.$t('prw.sample.quote').replace(/^[„"“«»]+|[“"”«»]+$/g, '');
      const marks = this.elementValue('quote', 'marks') !== 'disabled';
      return marks ? '\u201E' + text + '\u201C' : text;
    },
    quoteStyle() {
      const size = this.preset('quote', 'sizes') || 'lg';
      return {
        ...this.typography('quote'),
        fontSize: this.sizeStep('quote', size) || this.sizeStep('quote', 'lg'),
        color: this.elementColor('quote', 'element-quote-text'),
        textAlign: this.preset('quote', 'align') || 'left',
        margin: 0,
      };
    },
    citeStyle() {
      return {
        ...this.typography('cite'),
        display: 'block',
        color: this.elementColor('cite', 'element-cite-text'),
        textAlign: this.preset('author', 'align') || 'left',
        marginTop: this.elementValue('cite', 'spacing'),
      };
    },
    isSteplist() {
      return this.blockType === 'pwsteplist';
    },
    // steplist: item style (default, centered, connected, minimal), number
    // alignment, the items' grid and their parts as in its CSS
    // steps shown in the preview
    stepCount() {
      return 2;
    },
    currentStepStyle() {
      return this.stepStyle || this.setting('style', 'item-style') || 'default';
    },
    // columns of the steps at the shown device (no grid: one; connected: one)
    stepColumns() {
      if (!this.hasGrid || this.currentStepStyle === 'connected') return 1;
      return Number(this.setting('layout', 'columns-' + GRID_BP[this.bp])) || 1;
    },
    stepItemsStyle() {
      const gap = this.itemValue('item-gap');
      const style = { marginTop: this.gapBefore('items') };
      const cols = this.stepColumns;
      if (this.guides) {
        // guides: the gaps are elements of their own – side by side a track
        // between the columns, else one below the other
        if (cols > 1) {
          const tracks = Array.from({ length: cols }, () => 'minmax(0, 1fr)').join(' ' + gap + ' ');
          return { ...style, display: 'grid', gridTemplateColumns: tracks, marginBottom: gap };
        }
        return { ...style, display: 'flex', flexDirection: 'column', marginBottom: this.hasGrid ? gap : 0 };
      }
      if (!this.hasGrid) return style;
      return { ...style, display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))', gap, marginBottom: gap };
    },
    // the gap between two steps: as high (one below the other) or as wide
    // (side by side) as the gap
    stepStepGapStyle() {
      const gap = this.itemValue('item-gap');
      return this.stepColumns > 1 ? { width: gap } : { height: gap };
    },
    // the number's alignment of the shown style (centered: always centre)
    stepAlign() {
      if (this.currentStepStyle === 'centered') return 'center';
      const key = 'item-number-align' + (this.currentStepStyle === 'default' ? '' : '-' + this.currentStepStyle);
      return this.setting('layout', key) || 'center';
    },
    stepItemStyle() {
      const centered = this.currentStepStyle === 'centered';
      const align = this.stepAlign;
      return {
        display: 'flex',
        flexDirection: centered ? 'column' : 'row',
        alignItems: centered || align === 'center' ? 'center' : (this.currentStepStyle === 'minimal' ? 'baseline' : 'flex-start'),
        textAlign: centered ? 'center' : null,
        // with guides the gap is an element of its own (two lines)
        gap: this.guides ? 0 : this.stepValue('item-content-gap'),
        // (with guides the gap below is an element of its own)
        marginBottom: this.hasGrid || this.guides ? 0 : this.itemValue('item-gap'),
      };
    },
    // the gap element: as wide (beside) or as high (centered) as the gap
    stepGapStyle() {
      const gap = this.stepValue('item-content-gap');
      return this.currentStepStyle === 'centered'
        ? { height: gap, alignSelf: 'stretch' }
        : { width: gap, alignSelf: 'stretch', flexShrink: 0 };
    },
    stepNumberStyle() {
      const size = this.stepValue('item-number-size');
      if (this.currentStepStyle === 'minimal') {
        return { color: this.itemColor('item-number-background'), fontSize: this.stepValue('item-number-size'), fontWeight: 700, translate: '0 ' + this.stepOffset };
      }
      const shape = this.setting('layout', 'item-shape') || 'round';
      const r = this.itemValue('item-radius') || [];
      const custom = Array.isArray(r) && r.length === 4 ? [r[0], r[1], r[3], r[2]].join(' ') : 0;
      return {
        flexShrink: 0,
        width: size,
        height: size,
        fontSize: 'calc(' + size + ' * 0.4)',
        fontWeight: 700,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
        backgroundColor: this.itemColor('item-number-background'),
        color: this.itemColor('item-number-text'),
        borderRadius: { round: '50%', square: 0 }[shape] ?? custom,
        translate: '0 ' + this.stepOffset,
      };
    },
    // the number's fine vertical offset
    stepOffset() {
      // only with the number at the top (centre and centered: none)
      if (this.stepAlign !== 'top') return '0rem';
      return this.stepValue('item-number-offset') || '0rem';
    },
    // item title and text: heading at its "lg" step, text like the editor
    stepHeadingStyle() {
      return { ...this.typography('heading'), fontSize: this.sizeStep('heading', 'lg'), color: this.itemColor('item-heading-text') };
    },
    stepTextStyle() {
      return { ...this.typography('editor'), marginTop: '0.2rem', color: this.itemColor('item-editor-text') };
    },
    sectionStyle() {
      const layout = (key) => this.setting('layout', key);
      const radius = this.globalValue('global-') || [];
      const corner = (key, idx) => (layout('radius-' + key) === true ? radius[idx] || 0 : 0);
      return {
        backgroundColor: this.globalColor('block-background'),
        // global- values: top-left, top-right, bottom-left, bottom-right
        borderRadius: [corner('top-left', 0), corner('top-right', 1), corner('bottom-right', 3), corner('bottom-left', 2)].join(' '),
      };
    },
    // outer spacing (settings: margin-top / margin-bottom) in page colour
    blockStyle() {
      const margin = (key, name) => (this.setting('settings', key) === true ? this.globalValue(name) || '0px' : '0px');
      const top = margin('margin-top', 'global-margin-top');
      const bottom = margin('margin-bottom', 'global-margin-bottom');
      return { paddingTop: top, paddingBottom: bottom };
    },
    hasGrid() {
      return !!GRID_BP[this.bp];
    },
    gridStyle() {
      if (!this.hasGrid) return { display: 'block' };
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
        columnGap: GRID_GAP[this.bp],
      };
    },
    // the grid item: its columns and the block's paddings (as in the frontend)
    itemStyle() {
      const layout = (key) => this.setting('layout', key);
      const pair = (name, which) => {
        const v = this.globalValue(name);
        return Array.isArray(v) ? v[which === 'large' ? 1 : 0] : v;
      };
      const top = layout('padding-top');
      const bottom = layout('padding-bottom');
      const style = {
        paddingTop: top === 'small' || top === 'large' ? pair('global-padding-top', top) : 0,
        paddingBottom: bottom === 'small' || bottom === 'large' ? pair('global-padding-bottom', bottom) : 0,
        paddingLeft: layout('padding-left') === true ? this.globalValue('global-padding-left') : 0,
        paddingRight: layout('padding-right') === true ? this.globalValue('global-padding-right') : 0,
      };
      if (this.hasGrid) {
        const gbp = GRID_BP[this.bp];
        const size = Number(this.setting('grid', 'grid-size-' + gbp)) || 12;
        const offset = Number(this.setting('grid', 'grid-offset-' + gbp)) || 0;
        style.gridColumn = (offset + 1) + ' / span ' + Math.min(size, 12 - offset);
      }
      return style;
    },
    buttonsStyle() {
      const align = this.preset('buttons', 'align') || 'left';
      return {
        display: 'flex',
        justifyContent: { left: 'flex-start', center: 'center', right: 'flex-end' }[align] || 'flex-start',
        marginTop: this.gapBefore('buttons'),
      };
    },
    buttonStyle() {
      const vars = this.elementDefaults.button?.vars || {};
      const quad = (name) => {
        const ov = (this.elementOverrides.global || {})[name];
        const v = Array.isArray(ov) ? ov : (vars[name]?.value || []);
        return Array.isArray(v) ? v.join(' ') : v;
      };
      const color = (name) => this.elementColor('button', name);
      return {
        ...this.typography('button'),
        color: color('element-button-text'),
        backgroundColor: color('element-button-background'),
        border: ((this.elementOverrides.global || {})['button-border-width'] || vars['button-border-width']?.value || '1px') + ' solid ' + color('element-button-border'),
        boxShadow: vars['button-shadow']?.generates?.['button-shadow']?.[(this.elementOverrides.global || {})['button-shadow'] || vars['button-shadow']?.value] || 'none',
        padding: quad('button-padding'),
        // corners: square, round or the custom radii (button-shape)
        borderRadius: { square: '0', round: '999px' }[(this.elementOverrides.global || {})['button-shape'] || vars['button-shape']?.value] || quad('button-border-radius'),
        display: 'inline-block',
      };
    },
  },
  methods: {
    // a logo's tile; with guides one of the four corners of the 3×3 tracks
    logoTileStyle(index) {
      const cells = ['1 / 1', '1 / 3', '3 / 1', '3 / 3'];
      return this.guides && !this.logosFlexible && cells[index] ? { ...this.logoStyle, gridArea: cells[index] } : this.logoStyle;
    },
    // steplist "connected": the line through all numbers, from the first
    // number's centre to the last one's
    stepConnectorStyle(n) {
      const size = this.stepValue('item-number-size');
      const width = this.itemValue('item-connector-width');
      const offset = this.stepOffset;
      const centre = this.stepAlign === 'center'
        ? 'calc(50% + ' + offset + ')'
        : 'calc(' + size + ' / 2 + ' + offset + ')';
      return {
        left: 'calc(' + size + ' / 2 - ' + width + ' / 2)',
        width,
        top: n === 1 ? centre : 0,
        bottom: n === this.stepCount ? 'calc(100% - ' + centre + ')' : 'calc(' + this.itemValue('item-gap') + ' * -1)',
        background: this.itemColor('item-connector'),
      };
    },
    // a value of the shown item style ("default": the plain name)
    stepValue(name) {
      const style = this.currentStepStyle;
      return this.itemValue(style === 'default' ? name : name + '-' + style);
    },
    // a responsive value of the block's own (item-size …) at the shown device
    itemValueAt(name) {
      const ov = (this.valueOverrides || {})[name];
      if (ov && typeof ov === 'object' && !Array.isArray(ov) && ov[this.bp]) return ov[this.bp];
      for (const group of Object.values(this.valueDefaults || {})) {
        const def = group && group.vars && group.vars[name];
        if (def) return def[this.bp] || def.default || def.value;
      }
      return undefined;
    },
    // a value of the block's own (item-gap, item-radius …): override, else the plugin's
    itemValue(name) {
      const ov = (this.valueOverrides || {})[name];
      if (ov !== undefined && ov !== '') return ov;
      for (const group of Object.values(this.valueDefaults || {})) {
        if (group && group.vars && group.vars[name]) return group.vars[name].value;
      }
      return undefined;
    },
    itemColor(name) {
      const ov = ((this.valueOverrides || {})[this.currentTheme] || {})[name];
      if (ov) return ov;
      for (const group of Object.values(this.valueDefaults || {})) {
        if (group && group.colors && group.colors[name]) return group.colors[name][this.currentTheme] || '';
      }
      return '';
    },
    toggleGuides() {
      this.$emit('update:guides', !this.guides);
    },
    nested(obj, path) {
      return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
    },
    // a block setting (category field) default: override, else the plugin's
    setting(category, key) {
      const path = 'settings.fields.' + category + '.' + key + '.default';
      const ov = this.nested(this.overrides || {}, path);
      return ov !== undefined ? ov : this.nested(this.config.defaults || {}, path);
    },
    // a content field preset (align, sizes, …)
    preset(field, prop) {
      const path = 'settings.fields.content.' + field + '.' + prop + '.default';
      const ov = this.nested(this.overrides || {}, path);
      return ov !== undefined ? ov : this.nested(this.config.defaults || {}, path);
    },
    // a content field of the block, unless hidden from the editors (then
    // nobody fills it in)
    hasField(field) {
      const content = this.nested(this.config.defaults || {}, 'settings.fields.content') || {};
      const hidden = this.nested(this.overrides || {}, 'settings.hidden');
      if (Array.isArray(hidden) && hidden.includes(field)) return false;
      return content[field] !== undefined && content[field] !== false;
    },
    globalValue(name) {
      const ov = (this.globalOverrides.global || {})[name];
      if (ov !== undefined && ov !== '') return ov;
      return this.globalDefaults.layout?.vars?.[name]?.value;
    },
    globalColor(name) {
      return ((this.globalOverrides.global || {})[this.currentTheme] || {})[name]
        || this.globalDefaults.colors?.colors?.[name]?.[this.currentTheme] || '';
    },
    elementColor(element, name) {
      return ((this.elementOverrides.global || {})[this.currentTheme] || {})[name]
        || this.elementDefaults[element]?.colors?.[name]?.[this.currentTheme] || '';
    },
    // element value: responsive ones at the current device
    elementValue(element, prop) {
      const name = element + '-' + prop;
      const def = this.elementDefaults[element]?.vars?.[name];
      const ov = this.elementOverrides.global || {};
      if (def && def.default !== undefined) {
        return (ov[this.bp] || {})[name] || def[this.bp] || def.default;
      }
      return ov[name] || (def ? def.value : '') || '';
    },
    // size step (heading-size-lg, editor-size-xl …) at the current device
    sizeStep(element, size) {
      const name = element + '-size-' + size;
      const def = this.fontDefaults[element]?.vars?.[name];
      if (!def) return '';
      return ((this.fontOverrides.global || {})[this.bp] || {})[name] || def[this.bp] || def.default || '';
    },
    typography(element) {
      let family = this.elementValue(element, 'font-family');
      if (!family || family === 'default') family = this.bodyDefaultFont;
      const all = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      const font = Object.values(all).find(f => f.family === family);
      return {
        fontFamily: "'" + family + "', " + ((font && font.category) || 'sans-serif'),
        fontWeight: this.elementValue(element, 'font-weight'),
        fontStyle: this.elementValue(element, 'font-style'),
        fontSize: this.elementValue(element, 'font-size'),
        lineHeight: this.elementValue(element, 'line-height'),
        letterSpacing: this.elementValue(element, 'letter-spacing'),
        textTransform: this.elementValue(element, 'text-transform'),
      };
    },
    gapBefore(field) {
      const idx = this.fields.indexOf(field);
      if (idx <= 0) return 0;
      return GAPS[this.fields[idx - 1] + '>' + field] || 0;
    },
    fieldStyle(field) {
      const style = {
        ...this.typography(field),
        color: this.elementColor(field, 'element-' + field + '-text'),
        textAlign: this.preset(field, 'align') || 'left',
        margin: 0,
        marginTop: this.gapBefore(field),
      };
      // the preset size step (heading and editor); "normal" keeps the element
      // size; a heading without a step gets "lg", as in the frontend
      const size = this.preset(field, 'sizes') || (style.fontSize ? '' : 'lg');
      if (size && size !== 'normal') {
        const step = this.sizeStep(field, size);
        if (step) style.fontSize = step;
      }
      return style;
    },
  },
};
</script>

<style>
.pw-block-live-body {
  padding: var(--spacing-6) var(--spacing-3);
}
.pw-block-live-section {
  position: relative;
  overflow: hidden;
}
.pw-block-live-block {
  position: relative;
}
/* guides: the edge to the neighbouring blocks as fixed horizontal lines
   across the whole preview, each only while its outer spacing is on; the
   outer spacing is the room between line and block */
.pw-block-live-block.has-guide-top::before,
.pw-block-live-block.has-guide-bottom::after {
  content: "";
  position: absolute;
  z-index: 1;
  /* edge to edge: past the preview's own padding and the sidebar's */
  inset-inline: calc(-1 * (var(--spacing-3) + var(--spacing-6)));
  height: 0;
  border-top: 1px solid rgba(0, 170, 255, 0.8);
  pointer-events: none;
}
.pw-block-live-block.has-guide-top::before {
  top: 0;
}
.pw-block-live-block.has-guide-bottom::after {
  bottom: 0;
}
/* block size "fullscreen": the block runs edge to edge of the sidebar */
.pw-block-live-block.is-fullscreen {
  margin-inline: calc(-1 * (var(--spacing-3) + var(--spacing-6)));
}
.pw-block-live-block.is-fullscreen::before,
.pw-block-live-block.is-fullscreen::after {
  inset-inline: 0;
}
.pw-block-live-item {
  box-sizing: border-box;
  min-width: 0;
}
/* guides: the content edge (where the paddings end) as a fine line – as in
   Photoshop / Figma */
.pw-block-live-section.has-guides .pw-block-live-content {
  outline: 1px solid rgba(255, 0, 170, 0.6);
}
/* the gap between two steps: two cyan lines around it (one below the
   other: above and below, side by side: left and right) */
.pw-steplist-step-gap {
  display: block;
  box-sizing: border-box;
  border-block: 1px solid rgba(0, 170, 255, 0.8);
}
.pw-steplist-items.is-row .pw-steplist-step-gap {
  border-block: 0;
  border-inline: 1px solid rgba(0, 170, 255, 0.8);
}
/* the gap between number and text: two magenta lines around it (beside:
   left and right, centered: above and below) */
.pw-steplist-gap {
  box-sizing: border-box;
  border-inline: 1px solid rgba(255, 0, 170, 0.6);
}
.pw-steplist-item.is-centered .pw-steplist-gap {
  border-inline: 0;
  border-block: 1px solid rgba(255, 0, 170, 0.6);
}
/* logocloud guides: the gap between the logos (cyan, a line on either
   side), the logo's area inside the tile's padding (magenta) */
.pw-logocloud-gap {
  box-sizing: border-box;
}
.pw-logocloud-gap.is-column {
  border-inline: 1px solid rgba(0, 170, 255, 0.8);
}
/* the gap between the rows in orange, told apart from the one between
   the logos of a row (cyan) */
.pw-logocloud-gap.is-row {
  border-block: 1px solid rgba(255, 140, 0, 0.9);
}
/* flexible (the logos wrap freely): the gaps shown at each tile's outer
   edge – left and right cyan (between the logos), top and bottom orange
   (between the rows); square, also around a pill */
.pw-logocloud-preview.is-flexible.has-guides .pw-logocloud-item {
  position: relative;
}
.pw-logocloud-preview.is-flexible.has-guides .pw-logocloud-item::before {
  content: "";
  position: absolute;
  inset: 0;
  border-inline: 1px solid rgba(0, 170, 255, 0.8);
  border-block: 1px solid rgba(255, 140, 0, 0.9);
  pointer-events: none;
}
/* the logo's area inside the padding: left and right magenta (horizontal
   padding), top and bottom green (vertical padding) */
.pw-logocloud-preview.has-guides .pw-logocloud-item svg {
  box-shadow:
    -1px 0 0 rgba(255, 0, 170, 0.6),
    1px 0 0 rgba(255, 0, 170, 0.6),
    0 -1px 0 rgba(0, 180, 90, 0.9),
    0 1px 0 rgba(0, 180, 90, 0.9);
}
/* logocloud: a sample logo in its tile (as "contain" in the frontend) */
.pw-logocloud-item {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: var(--color-gray-400);
}
.pw-logocloud-item svg {
  width: 100%;
  height: 100%;
}
/* flexible: the logo as wide as its height allows */
.pw-logocloud-preview.is-flexible .pw-logocloud-item svg {
  width: auto;
  max-width: 100%;
}
/* steplist: the connector line sits behind the numbers */
.pw-steplist-item {
  position: relative;
}
.pw-steplist-connector {
  position: absolute;
  opacity: 0.4;
}
.pw-steplist-content {
  flex: 1;
}
/* order of the toolbar: see Overview (variants left, guides right) */
</style>
