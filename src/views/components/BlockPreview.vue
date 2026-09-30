<template>
  <!-- Live preview of a block in the sidebar: rebuilt from the wizard's
       current (also unsaved) values the way the frontend CSS uses them –
       the block frame (background, paddings, corners, grid width) and its
       fields in the element typography with the block's presets. -->
  <!-- a value's label hovered (guides on): no lines, only its tinted area -->
  <div
    class="pw-element-preview-side pw-block-live-preview"
    :class="{ 'has-focus': guides && highlightsArea }"
    :data-focus="guides && highlightsArea ? highlight : null"
  >
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
      <section class="pw-block-live-section" :class="{ 'has-guides': blockGuides, 'is-hero': isHero, 'pw-media-preview-photo': heroImage }" :style="sectionStyle">
        <!-- hero, design tab: the overlay in the variant's colour -->
        <span v-if="isHero && designView" class="pw-hero-overlay" :style="heroOverlayStyle" aria-hidden="true"></span>
        <!-- hero with a video background: the sample image and a play mark -->
        <span v-if="isHero && heroBackground === 'video'" class="pw-hero-video-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
        <!-- like the frontend: grid (12 columns from tablet on) > item with
             the paddings -->
        <div class="pw-block-live-grid" :style="gridStyle">
          <div class="pw-block-live-item" :style="itemStyle">
          <!-- hero guides: the edge of the paddings (the content inside is
               smaller and placed by its position, so its own frame would not
               show where the paddings end) -->
          <span v-if="isHero && blockGuides" class="pw-hero-pad" :style="heroPadStyle"></span>
          <div class="pw-block-live-content" :class="{ 'is-split': featureSplit && hasGrid }" :style="contentStyle">
          <!-- tagline, heading, text; in the featurelist's split layout a
               column of their own next to the items -->
          <div class="pw-block-live-intro">
          <p v-if="hasField('tagline')" :style="fieldStyle('tagline')">{{ $t('prw.preview.tagline') }}</p>
          <div v-if="hasField('heading') && spaceBand('heading')" class="pw-space-band" :class="['is-' + spaceBand('heading').prev, { 'is-hot': highlight === spaceBand('heading').prev + '-spacing' }]" :style="{ height: spaceBand('heading').height }"></div>
          <div v-if="hasField('heading')" :style="fieldStyle('heading')">{{ $t('prw.preview.heading') }}</div>
          <div v-if="hasField('editor') && spaceBand('editor')" class="pw-space-band" :class="['is-' + spaceBand('editor').prev, { 'is-hot': highlight === spaceBand('editor').prev + '-spacing' }]" :style="{ height: spaceBand('editor').height }"></div>
          <p v-if="hasField('editor')" class="pw-block-live-text" :style="fieldStyle('editor')">{{ $t('prw.preview.text.before') }} <a class="pw-block-live-link" :data-decoration="linkValue('block-link-decoration') || 'none'" :style="linkStyle">{{ $t('prw.preview.text.link') }}</a>{{ $t('prw.preview.text.after') }}</p>
          </div>
          <!-- guides: the offset (split layout) as a track of its own, a line on
               either side -->
          <span v-if="featureSplit && hasGrid && guides" class="pw-featurelist-offset-gap" :class="{ 'is-hot': highlight === 'item-offset-gap' }"></span>
          <!-- quote: the quote (element typography, its size step and marks)
               and its source below -->
          <figure v-if="isQuote" class="pw-quote-preview">
            <blockquote :style="quoteStyle">{{ quoteText }}</blockquote>
            <figcaption v-if="hasField('author')"><cite :style="citeStyle">{{ $t('prw.sample.cite') }}</cite></figcaption>
          </figure>
          <!-- media: a sample image (as in the element's preview) with the
               element's corner radii -->
          <!-- guides: the gap to the intro (as the cardlets') -->
          <div v-if="isMedia && hasField('media') && guides && mediaTextGap" class="pw-logocloud-text-gap" :class="{ 'is-hot': highlight === 'item-text-gap' }" :style="{ height: mediaTextGap }"></div>
          <div v-if="isMedia && hasField('media')" class="pw-media-preview-img pw-media-preview-photo" :style="mediaStyle"></div>
          <!-- logocloud: four sample logos, two by two (so the gap shows
               between the columns and between the rows), shrinking in a
               narrow preview -->
          <!-- guides: the gap to the text as an element of its own, a cyan line
               above (end of the text) and below (start of the logos) -->
          <div v-if="isLogocloud && guides && logosTextGap" class="pw-logocloud-text-gap" :class="{ 'is-hot': highlight === 'item-text-gap' }" :style="{ height: logosTextGap }"></div>
          <div v-if="isLogocloud" class="pw-logocloud-preview" :class="{ 'has-guides': guides, 'is-flexible': logosFlexible, 'is-hot-gap': highlight === 'item-gap', 'is-hot-row-gap': highlight === 'item-row-gap' }" :style="logosStyle">
            <div
              v-for="(logo, index) in dummyLogos"
              :key="'logo-' + index"
              class="pw-logocloud-item"
              :style="logoTileStyle(index)"
            >
              <svg :viewBox="'0 0 ' + logo[0] + ' ' + logo[1]" :style="{ aspectRatio: logo[0] + ' / ' + logo[1] }" aria-hidden="true" v-html="logo[2]"></svg>
              <!-- guides: the edge of the padding (inset by exactly its values,
                   so the lines match the tinted bands) -->
              <span v-if="guides" class="pw-logocloud-pad" :style="{ inset: logoPadding }"></span>
              <!-- guides: the tile's box (a rectangle, also around a round
                   tile) – a padding hovered is tinted in it, square as its lines -->
              <span v-if="guides" class="pw-logocloud-box" :style="logoBoxStyle"></span>
            </div>
            <!-- guides: the gap as elements of their own, two cyan lines each
                 (between the columns, between the rows) -->
            <template v-if="guides && !logosFlexible">
              <!-- each gap through the whole grid (they cross in the middle) -->
              <span class="pw-logocloud-gap is-column" :class="{ 'is-hot': highlight === 'item-gap' }" style="grid-area: 1 / 2 / 4 / 3"></span>
              <span class="pw-logocloud-gap is-row" :class="{ 'is-hot': highlight === 'item-row-gap' }" style="grid-area: 2 / 1 / 3 / 4"></span>
            </template>
          </div>
          <div v-if="hasField('buttons') && spaceBand('buttons')" class="pw-space-band" :class="['is-' + spaceBand('buttons').prev, { 'is-hot': highlight === spaceBand('buttons').prev + '-spacing' }]" :style="{ height: spaceBand('buttons').height }"></div>
          <div v-if="hasField('buttons')" :style="buttonsStyle">
            <span :style="buttonStyle">{{ $t('prw.preview.button') }}</span>
          </div>
          <!-- cardlets: two cards (image, tagline, heading, text, link) as in its snippet -->
          <!-- guides: the gap to the intro, between the cards (as the featurelist's) -->
          <div v-if="isCardlets && guides && cardTextGap" class="pw-logocloud-text-gap" :class="{ 'is-hot': highlight === 'item-text-gap' }" :style="{ height: cardTextGap }"></div>
          <div v-if="isCardlets" class="pw-cardlets-items pw-featurelist-items" :class="{ 'is-row': cardColumns > 1 }" :style="cardItemsStyle">
            <template v-for="n in 2">
            <span v-if="guides && n > 1" :key="'card-gap-' + n" class="pw-featurelist-gap" :class="{ 'is-hot': highlight === 'item-gap' }" :style="cardColumns > 1 ? { width: itemValueAt('item-gap') } : { height: itemValueAt('item-gap') }"></span>
            <div :key="'card-' + n" class="pw-cardlets-item" :style="cardStyle">
              <!-- the image; standing out: the card's upper piece behind it
                   from the overhang down (guides: the overhang as a band) -->
              <div class="pw-cardlets-image-wrap" :class="{ 'is-overhang': cardOverhang }">
                <span v-if="cardOverhang" class="pw-cardlets-overhang" :style="cardOverhangStyle"></span>
                <span v-if="cardOverhang && guides" class="pw-card-overhang" :class="{ 'is-hot': highlight === 'item-overhang' }" :style="{ height: itemValueAt('item-overhang') }"></span>
                <div class="pw-media-preview-photo pw-cardlets-image" :class="{ 'is-overlay': cardOverlay, 'is-cutout': cardOverhang }" :style="cardImageStyle"></div>
              </div>
              <!-- on the image: the overlay fades in from the texts' side -->
              <div v-if="cardOverlay" class="pw-cardlets-overlay" :style="cardOverlayStyle"></div>
              <div class="pw-cardlets-content" :class="{ 'has-pad-guides': guides, 'is-hot-x': highlight === 'item-padding-x', 'is-hot-y': highlight === 'item-padding-y' }" :style="cardContentStyle">
                <!-- tagline, heading, text; the gap below each (guides: a band) -->
                <template v-for="el in cardFields">
                  <div :key="'cf-' + el" :style="cardFieldStyle(el)">{{ cardFieldText(el, n) }}</div>
                  <span v-if="guides && cardGapAfter(el)" :key="'cg-' + el" class="pw-card-gap" :class="['is-' + cardGapKind(el), { 'is-hot': highlight === cardGapVar(el) }]" :style="{ height: cardGapAfter(el) }"></span>
                </template>
                <!-- the link at the card's bottom: text (with icon) or button -->
                <span class="pw-cardlets-cta" :style="cardCtaStyle">{{ $t('prw.preview.card.cta') }}<svg v-if="cardCtaIcon" viewBox="0 0 24 24" aria-hidden="true" v-html="cardCtaIcon"></svg></span>
              </div>
            </div>
            </template>
          </div>
          <!-- multicolumn: two columns as its distribution at the device
               shown (stacked on mobile), its elements in the order of the
               design card – left tagline, heading, text, list; right quote,
               image, button. Guides: the gaps between the columns (cyan, below
               each other violet) and each element's space below as a band in
               its colour (the design card's) -->
          <div v-if="isMulticolumn" class="pw-mc-preview" :style="mcStyle">
            <div class="pw-mc-column" :style="mcColumnStyle('left')">
              <div :style="mcTextStyle('tagline', 'tagline')">{{ $t('prw.preview.tagline') }}</div>
              <span v-if="guides" class="pw-mc-band is-tagline" :class="{ 'is-hot': highlight === 'tagline-spacing' }" :style="{ height: spaceAfter('tagline') }"></span>
              <div :style="mcTextStyle('heading', 'heading')">{{ $t('prw.preview.heading') }}</div>
              <span v-if="guides" class="pw-mc-band is-heading" :class="{ 'is-hot': highlight === 'heading-spacing' }" :style="{ height: spaceAfter('heading') }"></span>
              <!-- (a longer text: the left column clearly higher, so the right
                   one's position – top, middle, bottom – shows) -->
              <p :style="mcTextStyle('editor', 'editor')">{{ $t('prw.preview.card.textLong') }}</p>
              <span v-if="guides" class="pw-mc-band is-editor" :class="{ 'is-hot': highlight === 'editor-spacing' }" :style="{ height: spaceAfter('editor') }"></span>
              <!-- a list (Elements › Lists) with its space below -->
              <ul class="pw-mc-list" :style="mcListStyle">
                <li v-for="n in 2" :key="'mcl-' + n">{{ $t('prw.preview.list.' + n) }}</li>
              </ul>
              <span v-if="guides" class="pw-mc-band is-list" :class="{ 'is-hot': highlight === 'list-spacing' }" :style="{ height: mcListSpacing, fontSize: mcListStyle.fontSize }"></span>
              <!-- (a text last, so every element above has its space below) -->
              <p :style="mcTextStyle('editor', null)">{{ $t('prw.preview.mc.text') }}</p>
            </div>
            <span v-if="guides" class="pw-mc-gap" :class="{ 'is-row': !mcSide, 'is-hot': highlight === (mcSide ? 'column-gap' : 'row-gap') }" :style="mcSide ? null : { height: itemValueAt('row-gap') }"></span>
            <div class="pw-mc-column" :style="mcColumnStyle('right')">
              <blockquote class="pw-mc-quote" :style="mcQuoteStyle">{{ $t('prw.preview.quote') }}</blockquote>
              <span v-if="guides" class="pw-mc-band is-quote" :class="{ 'is-hot': highlight === 'quote-spacing' }" :style="{ height: spaceAfter('quote') }"></span>
              <div class="pw-media-preview-photo pw-mc-image" :style="{ marginBottom: guides ? 0 : spaceAfter('media') }"></div>
              <span v-if="guides" class="pw-mc-band is-media" :class="{ 'is-hot': highlight === 'media-spacing' }" :style="{ height: spaceAfter('media') }"></span>
              <div :style="{ marginBottom: guides ? 0 : spaceAfter('button'), textAlign: preset('button', 'align') || 'left' }"><span :style="buttonStyle">{{ $t('prw.preview.button') }}</span></div>
              <span v-if="guides" class="pw-mc-band is-button" :class="{ 'is-hot': highlight === 'button-spacing' }" :style="{ height: spaceAfter('button') }"></span>
              <p :style="mcTextStyle('editor', null)">{{ $t('prw.preview.mc.text') }}</p>
            </div>
          </div>
          <!-- featurelist: two features (icon, title, text) as in its snippet -->
          <!-- guides: the gaps as elements of their own with a line on either
               side – between the features cyan, icon and text violet, title
               and text gold; the tile's padding magenta -->
          <!-- guides: the gap to the text as an element of its own -->
          <div v-if="isFeaturelist && guides && featureTextGap" class="pw-logocloud-text-gap" :class="{ 'is-hot': highlight === 'item-text-gap' }" :style="{ height: featureTextGap }"></div>
          <div v-if="isFeaturelist" class="pw-featurelist-items" :class="{ 'has-guides': guides, 'is-row': featureColumns > 1 }" :style="featureItemsStyle">
            <template v-for="n in 2">
            <span v-if="guides && n > 1" :key="'feature-gap-' + n" class="pw-featurelist-gap" :class="{ 'is-hot': highlight === 'item-gap' }" :style="featureGapStyle"></span>
            <div :key="'feature-' + n" class="pw-featurelist-item" :class="{ 'is-top': featureIconTop }" :style="featureItemStyle">
              <div v-if="!featureNoIcon" class="pw-featurelist-icon" :style="featureIconStyle">
                <svg viewBox="0 0 24 24" :style="featureSvgStyle" aria-hidden="true"><path :d="featureIcons[n - 1]" /></svg>
                <span v-if="guides && featureTile" class="pw-featurelist-pad" :style="{ inset: itemValue('item-icon-tile-padding') }"></span>
              </div>
              <span v-if="guides && !featureNoIcon" class="pw-featurelist-icon-gap" :class="{ 'is-hot': highlight === 'item-icon-gap' }" :style="featureIconGapStyle"></span>
              <div class="pw-featurelist-content">
                <!-- title as run-in at the start of the text, or above it -->
                <div v-if="featureTitleInline" :style="featureTextStyle"><strong :style="featureTitleInlineStyle">{{ $t('prw.preview.feature.title') }} {{ n }}.</strong> {{ $t('prw.preview.feature.text') }}</div>
                <template v-else>
                  <div :style="featureTitleStyle">{{ $t('prw.preview.feature.title') }} {{ n }}</div>
                  <span v-if="guides" class="pw-featurelist-title-gap" :class="{ 'is-hot': highlight === 'item-title-spacing' }" :style="{ height: entryValue('item-title-spacing') }"></span>
                  <div :style="featureTextBelowStyle">{{ $t('prw.preview.feature.text') }}</div>
                </template>
              </div>
            </div>
            </template>
          </div>
          <!-- steplist: two steps (number, title, text) as in its snippet -->
          <!-- guides: the gaps as elements of their own with a line on either
               side – between the steps cyan, between number and text violet -->
          <!-- guides: the gap to the intro (as the cardlets') -->
          <div v-if="isSteplist && guides && stepTextGap" class="pw-logocloud-text-gap" :class="{ 'is-hot': highlight === 'item-text-gap' }" :style="{ height: stepTextGap }"></div>
          <div v-if="isSteplist" class="pw-steplist-items" :class="{ 'has-guides': guides, 'is-row': stepColumns > 1 }" :style="stepItemsStyle">
            <template v-for="n in stepCount">
            <span v-if="guides && n > 1" :key="'step-gap-' + n" class="pw-steplist-step-gap" :class="{ 'is-hot': highlight === 'item-gap' }" :style="stepStepGapStyle"></span>
            <div
              :key="'step-' + n"
              class="pw-steplist-item"
              :class="{ 'is-connected': currentStepStyle === 'connected', 'is-centered': currentStepStyle === 'centered' }"
              :style="stepItemStyle"
            >
              <span v-if="currentStepStyle === 'connected'" class="pw-steplist-connector" :style="stepConnectorStyle(n)"></span>
              <div class="pw-steplist-number" :style="stepNumberStyle">{{ n }}</div>
              <!-- guides: the gap between number and text as its own element,
                   a violet line on either side -->
              <span v-if="guides" class="pw-steplist-gap" :class="{ 'is-hot': highlight && highlight.startsWith('item-content-gap') }" :style="stepGapStyle"></span>
              <div class="pw-steplist-content">
                <div :style="stepHeadingStyle">{{ $t('prw.preview.step.title') }} {{ n }}</div>
                <!-- guides: the gap between title and text (gold), as the featurelist's -->
                <span v-if="guides" class="pw-featurelist-title-gap" :class="{ 'is-hot': highlight === 'item-title-spacing' }" :style="{ height: entryValue('item-title-spacing') }"></span>
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
// the screen height of the shown device (px): the preview is as wide as the
// sidebar, the hero as high as on that device (its heights are vh)
import { SCREEN_HEIGHTS } from '../../helpers/preview-bp.js';
import { validStart } from '../../helpers/valid-start.js';

// fixed gaps between the fields, from the blocks' own CSS (kirbyblock-text,
// kirbyblock-steplist: tagline / heading / text before the items)
const GAPS = {
  // (also kirbyblock-featurelist: before the items)
  'tagline>items': '1rem',
  'heading>items': '1.2rem',
  'editor>items': '2rem',
  // (between tagline, heading, text and buttons: only the elements' space
  // below – the blocks' fixed pair gaps are gone)
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

// sample icons of the featurelist (24×24): a check mark, a star
const FEATURE_ICONS = [
  'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
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
    // featurelist: the layout to show (stacked / split, chosen in the gaps card)
    featureLayout: { type: String, default: '' },
    // hero: the height to show (chosen in the design tab's height card)
    heroHeight: { type: String, default: '' },
    // cardlets: the display chosen in the design tab (else the start value)
    cardDisplay: { type: String, default: '' },
    // the design tab (the hero: on the sample image with its overlay, to
    // check the overlay colour with the text)
    designView: { type: Boolean, default: false },
    // the value whose row the pointer is over (guides on: its area tinted)
    highlight: { type: String, default: null },
    // variant shown, shared with the colour cards (.sync); empty: the block's preset
    variant: { type: String, default: '' },
  },
  computed: {
    // the value whose field has the cursor, if it has an area to tint (the
    // gaps, the paddings): its lines stay, the other guides give way
    highlightsArea() {
      const h = this.highlight || '';
      return ['item-gap', 'item-row-gap', 'item-text-gap', 'item-padding', 'item-padding-y',
        'item-icon-gap', 'item-title-spacing', 'item-icon-tile-padding', 'item-offset-gap',
        'tagline-spacing', 'heading-spacing', 'editor-spacing',
        'item-tagline-spacing', 'item-heading-spacing', 'item-cta-gap',
        'item-padding-x', 'item-overhang', 'column-gap', 'row-gap', 'list-spacing', 'quote-spacing', 'media-spacing', 'button-spacing',
        'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'margin-top', 'margin-bottom'].includes(h)
        || h.startsWith('item-content-gap');
    },
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
      if (this.isFeaturelist) return [...fields, 'items'];
      if (this.isCardlets) return [...fields, 'items'];
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
        // (with a band of its own above: none)
        marginTop: this.guides ? 0 : this.mediaTextGap,
        maxWidth: widths[this.preset('media', 'size')] || '33%',
        marginLeft: align === 'left' ? 0 : 'auto',
        marginRight: align === 'right' ? 0 : 'auto',
        borderRadius: r.length === 4
          ? [corner('top-left', 0), corner('top-right', 1), corner('bottom-right', 3), corner('bottom-left', 2)].join(' ')
          : 0,
      };
    },
    // media: the gap to the intro above (when there is one)
    mediaTextGap() {
      const idx = this.fields.indexOf('media');
      return idx > 0 ? this.itemValue('item-text-gap') : 0;
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
        // guides: the gap between the rows – all tiles have one height, so
        // the rows repeat every height + gap: a line at the end of a row and
        // at the start of the next across the whole width, the band between
        // them tinted while its label is hovered
        const size = this.itemValueAt('item-size');
        // (hovered: the band only, without its lines)
        const line = this.highlight === 'item-row-gap' ? 'transparent' : 'rgba(130, 80, 255, 0.9)';
        const fill = this.highlight === 'item-row-gap' ? 'rgba(130, 80, 255, 0.18)' : 'transparent';
        const hidden = this.highlight && this.highlight !== 'item-row-gap';
        const end = 'calc(' + size + ' + ' + rowGap + ')';
        const bands = this.guides && !hidden
          ? 'repeating-linear-gradient(to bottom, transparent 0, transparent ' + size
            + ', ' + line + ' ' + size + ', ' + line + ' calc(' + size + ' + 1px)'
            + ', ' + fill + ' calc(' + size + ' + 1px), ' + fill + ' calc(' + end + ' - 1px)'
            + ', ' + line + ' calc(' + end + ' - 1px), ' + line + ' ' + end + ')'
          : null;
        return {
          backgroundImage: bands,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: { left: 'flex-start', right: 'flex-end' }[align] || 'center',
          columnGap: gap,
          rowGap,
          marginTop: this.logosMarginTop,
        };
      }
      // guides: the gaps are tracks of their own (for their lines)
      if (this.guides) {
        return {
          display: 'grid',
          gridTemplateColumns: 'minmax(0, ' + size + ') ' + gap + ' minmax(0, ' + size + ')',
          gridTemplateRows: 'auto ' + rowGap + ' auto',
          justifyContent: justify,
          marginTop: this.logosMarginTop,
        };
      }
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, ' + size + '))',
        justifyContent: justify,
        columnGap: gap,
        rowGap,
        marginTop: this.logosMarginTop,
      };
    },
    // the tile's padding: vertical, horizontal (older: one value)
    logoPadding() {
      const x = this.itemValue('item-padding');
      return (this.itemValue('item-padding-y') || x) + ' ' + x;
    },
    // the gap between the text above and the logos (none without text)
    logosTextGap() {
      return this.gapBefore('logos') ? this.itemValue('item-text-gap') || this.gapBefore('logos') : 0;
    },
    // the logos' own top margin (with guides the gap is an element above)
    logosMarginTop() {
      return this.guides ? 0 : this.logosTextGap;
    },
    // the tile's box: a padding hovered tinted in it (square bands)
    logoBoxStyle() {
      if (this.highlight !== 'item-padding' && this.highlight !== 'item-padding-y') return {};
      const x = this.itemValue('item-padding');
      const y = this.itemValue('item-padding-y') || x;
      return {
        // (with the outer edges as lines, the inner ones are the guides')
        boxShadow: this.highlight === 'item-padding'
          ? 'inset 1px 0 0 0 rgba(255, 0, 170, 0.6), inset -1px 0 0 0 rgba(255, 0, 170, 0.6), inset ' + x + ' 0 0 0 rgba(255, 0, 170, 0.18), inset calc(-1 * ' + x + ') 0 0 0 rgba(255, 0, 170, 0.18)'
          : 'inset 0 1px 0 0 rgba(0, 180, 90, 0.9), inset 0 -1px 0 0 rgba(0, 180, 90, 0.9), inset 0 ' + y + ' 0 0 rgba(0, 180, 90, 0.18), inset 0 calc(-1 * ' + y + ') 0 0 rgba(0, 180, 90, 0.18)',
      };
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
    // the link in the sample text: as the block links (Global › Blocks)
    linkStyle() {
      return {
        '--pw-link': this.globalColor('block-link'),
        '--pw-link-hover': this.globalColor('block-link-hover'),
        fontWeight: this.linkValue('block-link-weight') === 'bold' ? 700 : null,
        textDecorationThickness: this.linkValue('block-link-thickness'),
        textUnderlineOffset: this.linkValue('block-link-offset'),
      };
    },
    isHero() {
      return this.blockType === 'pwhero';
    },
    // the block's own space below its tagline, heading and text (hero)
    ownSpacing() {
      return this.setting('layout', 'item-spacing') === 'own';
    },
    // the block brings values for its own space below (then its design tab
    // shows the space, own or global, with guides)
    hasOwnSpacingValues() {
      return Object.values(this.valueDefaults || {}).some(g => g && g.vars
        && ['tagline-spacing', 'heading-spacing', 'editor-spacing'].some(name => g.vars[name]));
    },
    // the background: the start value (design tab: the sample image, for the
    // overlay colour)
    heroBackground() {
      if (this.designView) return 'image';
      return this.setting('style', 'background-type') || 'color';
    },
    // design tab: a solid overlay at 50 % (the start strength) in the
    // variant's overlay colour
    heroOverlayStyle() {
      const color = this.itemColor('overlay') || '#000000';
      return { background: 'color-mix(in srgb, ' + color + ' 50%, transparent)' };
    },
    // image or video: the drawn sample image (as in the media preview)
    heroImage() {
      return this.isHero && ['image', 'video'].includes(this.heroBackground);
    },
    // its height: a share of the device's screen, "auto" as its content
    heroHeightPx() {
      const height = this.heroHeight || this.setting('style', 'height');
      if (height === 'fullscreen') return SCREEN_HEIGHTS[this.bp] + 'px';
      // small, medium, large: the design values (vh) at the shown device
      const vh = parseFloat(this.itemValueAt('height-' + height));
      return vh ? Math.round(SCREEN_HEIGHTS[this.bp] * vh / 100) + 'px' : null;
    },
    // the paddings' edge inside the grid item
    heroPadStyle() {
      const st = this.itemStyle;
      const v = (x) => x || 0;
      return { inset: [v(st.paddingTop), v(st.paddingRight), v(st.paddingBottom), v(st.paddingLeft)].join(' ') };
    },
    // the content's place (as the frontend's data-h / data-v margins)
    heroContentStyle() {
      const h = this.setting('layout', 'position-horizontal') || 'left';
      const v = this.setting('layout', 'position-vertical') || 'middle';
      return {
        display: 'flex',
        flexDirection: 'column',
        marginLeft: h === 'left' ? 0 : 'auto',
        marginRight: h === 'right' ? 0 : 'auto',
        marginTop: v === 'top' ? 0 : 'auto',
        marginBottom: v === 'bottom' ? 0 : 'auto',
      };
    },
    isCardlets() {
      return this.blockType === 'pwcardlets';
    },
    // the cards: columns at the shown device (at most two samples), the gap
    // between them as in its CSS
    cardColumns() {
      if (!this.hasGrid) return 1;
      return Math.min(Number(this.setting('layout', 'columns-' + GRID_BP[this.bp])) || 1, 2);
    },
    // the gap to the intro above (alone: the intro's last element has no space below there)
    cardTextGap() {
      const idx = this.fields.indexOf('items');
      if (idx <= 0) return 0;
      // (alone: the intro's last element has no space below before the items)
      return this.itemValue('item-text-gap');
    },
    cardItemsStyle() {
      const marginTop = this.guides ? 0 : this.cardTextGap;
      const gap = this.itemValueAt('item-gap');
      const cols = this.cardColumns;
      // guides: the gap is an element of its own (a track between the columns)
      if (this.guides) {
        if (cols > 1) return { marginTop, display: 'grid', gridTemplateColumns: Array.from({ length: cols }, () => 'minmax(0, 1fr)').join(' ' + gap + ' ') };
        return { marginTop, display: 'flex', flexDirection: 'column' };
      }
      if (!this.hasGrid) return { marginTop, display: 'flex', flexDirection: 'column', gap };
      return { marginTop, display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))', gap };
    },
    // a card: background, border (switched on), the corners switched on
    cardStyle() {
      // form round: the radii (top-left, top-right, bottom-left, bottom-right)
      const r = this.setting('layout', 'item-shape') === 'square' ? [] : (this.itemValue('item-radius') || []);
      const corner = (key, idx) => r[idx] || 0;
      return {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        // on the image: the card in its ratio, the image fills it
        position: this.cardOverlay ? 'relative' : null,
        aspectRatio: this.cardOverlay ? (this.setting('layout', { default: 'item-ratio', lg: 'item-ratio-lg', xl: 'item-ratio-xl' }[this.bp] || 'item-ratio') || '4/5').replace('/', ' / ') : null,
        backgroundColor: this.itemColor('item-background'),
        border: this.setting('layout', 'item-border') === true ? this.itemValue('item-border-width') + ' solid ' + this.itemColor('item-border-color') : 0,
        // the shadow step (as the buttons')
        boxShadow: { sm: '0 1px 2px rgba(0, 0, 0, 0.12)', md: '0 4px 10px rgba(0, 0, 0, 0.15)', lg: '0 10px 24px rgba(0, 0, 0, 0.18)' }[this.setting('layout', 'item-shadow')] || null,
        borderRadius: [corner('top-left', 0), corner('top-right', 1), corner('bottom-right', 3), corner('bottom-left', 2)].join(' '),
        // the image standing out: the card drawn in two pieces (see
        // cardOverhangStyle and the content), the card itself bare
        ...(this.cardOverhang ? { overflow: 'visible', backgroundColor: 'transparent', border: 0, boxShadow: 'none', borderRadius: 0 } : {}),
      };
    },
    // its content inside the card's padding, the link at the bottom
    cardContentStyle() {
      const x = this.itemValue('item-padding-x');
      const y = this.itemValue('item-padding-y');
      const style = { flex: 1, display: 'flex', flexDirection: 'column', padding: y + ' ' + x, position: 'relative', '--pw-card-px': x, '--pw-card-py': y };
      // the image standing out: the lower piece of the card (without the
      // joint's border and shadow)
      if (this.cardOverhang) {
        const piece = this.cardPiece;
        Object.assign(style, {
          backgroundColor: piece.backgroundColor,
          border: piece.border,
          borderTopWidth: 0,
          borderRadius: '0 0 ' + piece.radius[2] + ' ' + piece.radius[3],
          boxShadow: [piece.shadow, style.boxShadow].filter(Boolean).join(', ') || null,
          clipPath: 'inset(0 -3rem -3rem -3rem)',
        });
      }
      // on the image: above the image, the texts at the top or bottom
      if (this.cardOverlay) {
        Object.assign(style, { position: 'relative', justifyContent: this.cardTextTop ? 'flex-start' : 'flex-end' });
      }
      // a padding hovered: tinted on its two sides (horizontal magenta, vertical green)
      if (this.guides && this.highlight === 'item-padding-x') {
        // (with the outer edges as lines, the inner ones are the guides')
        style.boxShadow = 'inset 1px 0 0 0 rgba(255, 0, 170, 0.6), inset -1px 0 0 0 rgba(255, 0, 170, 0.6), inset ' + x + ' 0 0 0 rgba(255, 0, 170, 0.18), inset calc(-1 * ' + x + ') 0 0 0 rgba(255, 0, 170, 0.18)';
      } else if (this.guides && this.highlight === 'item-padding-y') {
        style.boxShadow = 'inset 0 1px 0 0 rgba(0, 180, 90, 0.9), inset 0 -1px 0 0 rgba(0, 180, 90, 0.9), inset 0 ' + y + ' 0 0 rgba(0, 180, 90, 0.18), inset 0 calc(-1 * ' + y + ') 0 0 rgba(0, 180, 90, 0.18)';
      }
      return style;
    },

    // the display on the image (start value), the texts at the top
    cardOverlay() {
      return (this.cardDisplay || this.setting('style', 'card-display')) === 'overlay';
    },
    // image above / standing out: the images' ratio at the device shown
    // (Original: the sample's own 16:9); standing out the whole cut-out
    // image at the bottom of its box
    cardImageStyle() {
      if (this.cardOverlay) return null;
      const key = this.cardOverhang ? 'item-cutout-ratio' : 'item-image-ratio';
      const ratio = this.setting('layout', { default: key, lg: key + '-lg', xl: key + '-xl' }[this.bp] || key);
      if (!ratio || ratio === 'auto') return null;
      const style = { aspectRatio: ratio.replace('/', ' / ') };
      if (this.cardOverhang) Object.assign(style, { backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center bottom' });
      return style;
    },
    cardOverhang() {
      return (this.cardDisplay || this.setting('style', 'card-display')) === 'overhang';
    },
    // the card's look shared by its two pieces: background, border, corners
    // (top-left, top-right, bottom-right, bottom-left), shadow
    cardPiece() {
      const r = this.setting('layout', 'item-shape') === 'square' ? [] : (this.itemValue('item-radius') || []);
      return {
        backgroundColor: this.itemColor('item-background'),
        border: this.setting('layout', 'item-border') === true ? this.itemValue('item-border-width') + ' solid ' + this.itemColor('item-border-color') : 0,
        radius: [r[0] || 0, r[1] || 0, r[3] || 0, r[2] || 0],
        shadow: { sm: '0 1px 2px rgba(0, 0, 0, 0.12)', md: '0 4px 10px rgba(0, 0, 0, 0.15)', lg: '0 10px 24px rgba(0, 0, 0, 0.18)' }[this.setting('layout', 'item-shadow')] || null,
      };
    },
    // the upper piece: behind the image, from the overhang down
    cardOverhangStyle() {
      const piece = this.cardPiece;
      return {
        top: this.itemValueAt('item-overhang'),
        backgroundColor: piece.backgroundColor,
        border: piece.border,
        borderBottomWidth: 0,
        borderRadius: piece.radius[0] + ' ' + piece.radius[1] + ' 0 0',
        boxShadow: piece.shadow,
        clipPath: 'inset(-3rem -3rem 0 -3rem)',
      };
    },
    cardTextTop() {
      return this.setting('layout', 'item-text-position') === 'top';
    },
    // the overlay in the variant's colour with its strength, from the
    // texts' side
    cardOverlayStyle() {
      const color = this.itemColor('item-overlay') || '#000000';
      const strength = parseFloat(this.itemValue('item-overlay-strength')) || 50;
      // full strength behind the texts (the first 35 %), then easing out in
      // steps (as in the frontend)
      const stops = [[1, 0], [1, 35], [0.85, 45], [0.62, 55], [0.4, 65], [0.2, 75], [0.07, 87]]
        .map(([k, at]) => 'color-mix(in srgb, ' + color + ' ' + (strength * k) + '%, transparent) ' + at + '%');
      return { background: 'linear-gradient(to ' + (this.cardTextTop ? 'bottom' : 'top') + ', ' + stops.join(', ') + ', transparent 100%)' };
    },
    // the card's texts shown (as switched on in the block)
    cardFields() {
      return ['tagline', 'heading', 'editor'].filter(el => this.hasField('item-' + el));
    },
    // the link: text (link colour, underline, icon) or a button
    cardCtaStyle() {
      // at the card's bottom, or right after the text
      const base = { display: 'inline-flex', alignItems: 'center', gap: '0.4em', width: 'max-content', marginTop: this.setting('layout', 'item-link-position') === 'inline' || this.cardOverlay ? 0 : 'auto' };
      if (this.setting('layout', 'item-link-style') !== 'button') {
        return {
          ...base,
          ...this.typography('editor'),
          // medium, or bold as the block links
          fontWeight: this.linkValue('block-link-weight') === 'bold' ? 700 : 500,
          color: this.itemColor('item-link'),
          textDecoration: this.setting('layout', 'item-link-decoration') === 'underline' ? 'underline' : 'none',
        };
      }
      const style = this.setting('layout', 'item-button-style') || 'default';
      const color = (name) => ((this.elementOverrides.global || {})[style] || {})[name] || this.elementDefaults.button?.colors?.[name]?.[style] || '';
      return { ...this.buttonStyle, display: 'inline-flex', width: 'max-content', marginTop: base.marginTop, color: color('element-button-text'), backgroundColor: color('element-button-background'), borderColor: color('element-button-border') };
    },
    // the link's icon (text style): the chosen one of its icon choice
    cardCtaIcon() {
      if (this.setting('layout', 'item-link-style') === 'button') return '';
      const def = this.nested(this.config.defaults || {}, 'settings.fields.layout.item-link-icon');
      const key = this.setting('layout', 'item-link-icon');
      const opt = def && Array.isArray(def.options) ? def.options.find(o => o.value === key) : null;
      return opt ? opt.svg : '';
    },
    isMulticolumn() {
      return this.blockType === 'pwmulticolumn';
    },
    // side by side from the device whose distribution is set (mobile stacked)
    mcDist() {
      const key = GRID_BP[this.bp];
      return key ? this.setting('layout', 'columns-' + key) || '' : '';
    },
    mcSide() {
      return /^dist-\d-\d$/.test(this.mcDist);
    },
    // the columns: side by side (a distribution set for the device) in equal
    // halves with the gap between them (with guides a track of its own);
    // stacked below each other with the row gap
    mcStyle() {
      if (!this.mcSide) {
        return { display: 'flex', flexDirection: 'column', gap: this.guides ? 0 : this.itemValueAt('row-gap') };
      }
      // (always two equal columns: the distribution's shares do not fit the
      // narrow preview)
      const a = 1;
      const b = 1;
      const gap = this.itemValueAt('column-gap');
      return this.guides
        ? { display: 'grid', gridTemplateColumns: 'minmax(0, ' + a + 'fr) ' + gap + ' minmax(0, ' + b + 'fr)' }
        : { display: 'grid', gridTemplateColumns: 'minmax(0, ' + a + 'fr) minmax(0, ' + b + 'fr)', columnGap: gap };
    },
    // the list in a column: the text's type, the lists' indent, gap, marker
    // (Elements › Lists); its space below the block's own or the lists'
    mcListStyle() {
      // its start values: style (bullets, numbers, none), alignment, size
      const kind = this.preset('list', 'style') || 'bullet';
      const marker = kind === 'none' ? 'none'
        : kind === 'ordered' ? ({ decimal: 'decimal', 'decimal-paren': 'pw-decimal-paren', 'lower-alpha': 'lower-alpha', 'lower-roman': 'lower-roman' }[this.elementValue('list', 'number-format')] || 'decimal')
        : ({ disc: 'disc', circle: 'circle', box: 'square', dash: '"–  "', arrow: '"→  "', chevron: '"›  "', check: '"✓  "', star: '"★  "' }[this.elementValue('list', 'marker')] || 'disc');
      const size = this.preset('list', 'sizes') || 'normal';
      const step = size !== 'normal' ? this.sizeStep('editor', size) : '';
      return {
        ...this.typography('editor'),
        ...(step ? { fontSize: step } : {}),
        color: this.elementColor('editor', 'element-editor-text'),
        textAlign: this.preset('list', 'align') || 'left',
        margin: 0,
        marginBottom: this.guides ? 0 : this.mcListSpacing,
        paddingLeft: kind === 'none' ? 0 : this.elementValue('list', kind === 'ordered' ? 'number-indent' : 'indent'),
        listStyleType: marker,
        '--pw-list-gap': this.elementValue('list', 'item-spacing'),
        '--pw-list-marker': this.elementColor('list', kind === 'ordered' ? 'element-list-number' : 'element-list-marker'),
        '--pw-list-marker-size': kind === 'ordered' ? '100%' : (this.elementValue('list', 'marker-size') || '100%'),
      };
    },
    // the quote in a column: the quote's type and colour, its start values
    // (alignment, size), its space below
    mcQuoteStyle() {
      const step = this.sizeStep('quote', this.preset('quote', 'sizes') || 'lg');
      return { ...this.typography('quote'), ...(step ? { fontSize: step } : {}), color: this.elementColor('quote', 'element-quote-text'), textAlign: this.preset('quote', 'align') || 'left', margin: 0, marginBottom: this.guides ? 0 : this.spaceAfter('quote') };
    },
    mcListSpacing() {
      if (this.ownSpacing) {
        const own = this.itemValue('list-spacing');
        if (own) return own;
      }
      return this.elementValue('list', 'spacing');
    },
    isFeaturelist() {
      return this.blockType === 'pwfeaturelist';
    },
    featureIcons() {
      return FEATURE_ICONS;
    },
    // split layout (from tablet on): intro one third, the items two thirds
    featureSplit() {
      return this.isFeaturelist && (this.featureLayout || this.setting('style', 'section-layout')) === 'split';
    },
    contentStyle() {
      if (this.isHero) return this.heroContentStyle;
      if (!this.featureSplit || !this.hasGrid) return {};
      const gap = this.itemValue('item-offset-gap');
      // the intro at the top or centred to the features
      const alignItems = this.setting('layout', 'item-offset-align') === 'center' ? 'center' : 'start';
      // guides: the offset is a track of its own (for its lines)
      if (this.guides) return { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) ' + gap + ' minmax(0, 2fr)', alignItems };
      return { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', columnGap: gap, alignItems };
    },
    // columns of the features at the shown device (mobile: one below the other)
    // (at most as many as sample features shown: no empty column; split:
    // one below the other, so the layout reads in the narrow sidebar)
    featureColumns() {
      if (!this.hasGrid || this.featureSplit) return 1;
      return Math.min(Number(this.setting('layout', 'columns-' + GRID_BP[this.bp])) || 1, 2);
    },
    featureItemsStyle() {
      const gap = this.itemValueAt('item-gap');
      // above the items: the gap to the text (with guides an element of its
      // own); split: none beside the intro
      const marginTop = this.guides ? 0 : this.featureTextGap;
      const cols = this.featureColumns;
      // guides: the gap is an element of its own – side by side a track
      // between the columns, else one below the other
      if (this.guides) {
        if (cols > 1) {
          const tracks = Array.from({ length: cols }, () => 'minmax(0, 1fr)').join(' ' + gap + ' ');
          return { marginTop, display: 'grid', gridTemplateColumns: tracks };
        }
        return { marginTop, display: 'flex', flexDirection: 'column' };
      }
      // the gap only between the features (none below the last)
      if (!this.hasGrid) return { marginTop, display: 'flex', flexDirection: 'column', gap };
      return { marginTop, display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))', gap };
    },
    // the gap between the text above and the features (none without text,
    // none beside the intro); the text's space below meets it, the larger wins
    featureTextGap() {
      if (this.featureSplit && this.hasGrid) return 0;
      const idx = this.fields.indexOf('items');
      if (idx <= 0) return 0;
      // (alone: the intro's last element has no space below before the items)
      return this.itemValue('item-text-gap');
    },
    // the gap between two features: as high (one below the other) or as
    // wide (side by side) as the gap
    featureGapStyle() {
      const gap = this.itemValueAt('item-gap');
      return this.featureColumns > 1 ? { width: gap } : { height: gap };
    },
    // icon position "none": the features without icons
    featureNoIcon() {
      return this.setting('layout', 'item-icon-position') === 'none';
    },
    // icon beside the content: top (with its offset) or centre
    featureIconAlign() {
      return this.setting('layout', 'item-icon-align') || 'top';
    },
    featureIconTop() {
      return this.setting('layout', 'item-icon-position') === 'top';
    },
    featureTile() {
      return this.setting('layout', 'item-icon-style') === 'tile';
    },
    // the gap between icon and text: beside as wide, above as high as it is
    featureIconGapStyle() {
      const gap = this.itemValue('item-icon-gap');
      return this.featureIconTop ? { height: gap, alignSelf: 'stretch' } : { width: gap, alignSelf: 'stretch', flexShrink: 0 };
    },
    featureItemStyle() {
      return {
        display: 'flex',
        flexDirection: this.featureIconTop ? 'column' : 'row',
        // with guides the gap is an element of its own (two lines)
        gap: this.guides ? 0 : this.itemValue('item-icon-gap'),
        // icon beside the content: at the top or centred to it
        alignItems: !this.featureIconTop && this.featureIconAlign === 'center' ? 'center' : 'flex-start',
      };
    },
    // the icon: plain, or on a tile (padding, background, shape)
    featureIconStyle() {
      const style = { display: 'flex', flexShrink: 0, position: 'relative' };
      // beside the content at the top: its fine vertical offset
      if (!this.featureIconTop && this.featureIconAlign !== 'center') style.translate = '0 ' + (this.itemValue('item-icon-offset') || '0rem');
      if (!this.featureTile) return style;
      const shape = this.setting('layout', 'item-shape') || 'custom';
      const r = this.itemValue('item-radius') || [];
      const custom = Array.isArray(r) && r.length === 4 ? [r[0], r[1], r[3], r[2]].join(' ') : 0;
      const pad = this.itemValue('item-icon-tile-padding');
      return {
        ...style,
        padding: pad,
        // its padding hovered: tinted all around
        boxShadow: this.guides && this.highlight === 'item-icon-tile-padding' ? 'inset 0 0 0 ' + pad + ' rgba(255, 0, 170, 0.25)' : null,
        backgroundColor: this.itemColor('item-icon-tile-background'),
        borderRadius: { square: 0, round: '50%' }[shape] ?? custom,
      };
    },
    featureSvgStyle() {
      const size = this.itemValueAt('item-icon-size');
      return { width: size, height: size, fill: this.itemColor('item-icon-fill') };
    },
    featureTitleInline() {
      return this.setting('layout', 'item-title-style') === 'inline';
    },
    // title and description: Elements › Items (the block's own values when
    // switched on)
    featureTitleStyle() {
      return { ...this.entryTypography('title'), textAlign: this.preset('blocks', 'align') || 'left' };
    },
    featureTitleInlineStyle() {
      const heading = this.typography('heading');
      return { fontFamily: heading.fontFamily, fontWeight: heading.fontWeight, color: this.elementColor('heading', 'element-heading-text') };
    },
    // the text below the title: the title gap above it
    featureTextBelowStyle() {
      // (with guides the gap is an element of its own)
      return { ...this.featureTextStyle, marginTop: this.guides ? 0 : this.entryValue('item-title-spacing') };
    },
    featureTextStyle() {
      return { ...this.entryTypography('text'), textAlign: this.preset('blocks', 'align') || 'left' };
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
    // the gap to the intro above (alone: the intro's last element has no space below there)
    stepTextGap() {
      const idx = this.fields.indexOf('items');
      if (idx <= 0) return 0;
      // (alone: the intro's last element has no space below before the items)
      return this.itemValue('item-text-gap');
    },
    stepItemsStyle() {
      const gap = this.itemValue('item-gap');
      // (with a band of its own above: none)
      const style = { marginTop: this.guides ? 0 : this.stepTextGap };
      const cols = this.stepColumns;
      if (this.guides) {
        // guides: the gaps are elements of their own – side by side a track
        // between the columns, else one below the other
        if (cols > 1) {
          const tracks = Array.from({ length: cols }, () => 'minmax(0, 1fr)').join(' ' + gap + ' ');
          return { ...style, display: 'grid', gridTemplateColumns: tracks };
        }
        return { ...style, display: 'flex', flexDirection: 'column' };
      }
      // the gap only between the steps (none below the last)
      if (!this.hasGrid) return { ...style, display: 'flex', flexDirection: 'column', gap };
      return { ...style, display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))', gap };
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
    // step title and description: Elements › Items (own values when switched on)
    stepHeadingStyle() {
      return this.entryTypography('title');
    },
    stepTextStyle() {
      // (with guides the gap is a band of its own)
      return { ...this.entryTypography('text'), marginTop: this.guides ? 0 : this.entryValue('item-title-spacing') };
    },
    sectionStyle() {
      const layout = (key) => this.setting('layout', key);
      const radius = this.globalValue('global-') || [];
      const corner = (key, idx) => (layout('radius-' + key) === true ? radius[idx] || 0 : 0);
      return {
        // hero: its height, a sample image as background
        // (a minimum, as in the frontend: more content lets the hero grow; the
        // grid fills it as a flex column)
        ...(this.isHero ? { minHeight: this.heroHeightPx, display: 'flex', flexDirection: 'column' } : {}),
        backgroundColor: this.heroImage ? null : this.globalColor('block-background'),
        // global- values: top-left, top-right, bottom-left, bottom-right
        borderRadius: [corner('top-left', 0), corner('top-right', 1), corner('bottom-right', 3), corner('bottom-left', 2)].join(' '),
      };
    },
    // outer spacing (settings: margin-top / margin-bottom) in page colour
    blockStyle() {
      const margin = (key, name) => (this.setting('settings', key) === true ? this.globalValue(name) || '0px' : '0px');
      const top = margin('margin-top', 'global-margin-top');
      const bottom = margin('margin-bottom', 'global-margin-bottom');
      // a margin's label hovered: its room above / below tinted
      const tint = 'rgba(0, 170, 255, 0.15)';
      const shadow = !this.guides ? null
        : this.highlight === 'margin-top' ? 'inset 0 ' + top + ' 0 0 ' + tint
        : this.highlight === 'margin-bottom' ? 'inset 0 calc(-1 * ' + bottom + ') 0 0 ' + tint
        : null;
      return { paddingTop: top, paddingBottom: bottom, boxShadow: shadow };
    },
    hasGrid() {
      return !!GRID_BP[this.bp];
    },
    gridStyle() {
      // hero: grid and item as high as the section (content placed in it)
      const fill = this.isHero ? { flex: '1 1 auto' } : {};
      if (!this.hasGrid) return { display: 'block', ...fill };
      return {
        ...fill,
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
      // a padding's label hovered: that side's padding tinted
      const tint = ' 0 0 rgba(255, 0, 170, 0.15)';
      const sides = {
        'padding-top': () => 'inset 0 ' + style.paddingTop + tint,
        'padding-bottom': () => 'inset 0 calc(-1 * ' + style.paddingBottom + ')' + tint,
        'padding-left': () => 'inset ' + style.paddingLeft + ' 0' + tint,
        'padding-right': () => 'inset calc(-1 * ' + style.paddingRight + ') 0' + tint,
      };
      const value = { 'padding-top': style.paddingTop, 'padding-bottom': style.paddingBottom, 'padding-left': style.paddingLeft, 'padding-right': style.paddingRight }[this.highlight];
      if (this.guides && sides[this.highlight] && value) style.boxShadow = sides[this.highlight]();
      if (this.isHero) {
        style.display = 'flex';
        style.height = '100%';
        style.boxSizing = 'border-box';
        style.position = 'relative';
      }
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
        marginTop: this.spaceBand('buttons') ? 0 : this.gapBefore('buttons'),
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
      const style = this.guides && !this.logosFlexible && cells[index] ? { ...this.logoStyle, gridArea: cells[index] } : { ...this.logoStyle };
      // flexible (no gap elements): a gap hovered – half of it tinted on
      // either side of each tile, two halves make the gap between two tiles
      if (this.guides && this.logosFlexible && (this.highlight === 'item-gap' || this.highlight === 'item-row-gap')) {
        // (the gap between the rows: bands of the logos' area, see logosStyle)
        if (this.highlight === 'item-gap') {
          const half = 'calc(' + this.itemValue('item-gap') + ' / 2)';
          style.boxShadow = half + ' 0 0 0 rgba(0, 170, 255, 0.15), calc(-1 * ' + half + ') 0 0 0 rgba(0, 170, 255, 0.15)';
        }
      }
      return style;
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
      const path = 'settings.fields.' + category + '.' + key;
      const ov = this.nested(this.overrides || {}, path + '.default');
      const value = ov !== undefined ? ov : this.nested(this.config.defaults || {}, path + '.default');
      return validStart(value, this.nested(this.config.defaults || {}, path + '.options'));
    },
    // a content field preset (align, sizes, …)
    preset(field, prop) {
      const path = 'settings.fields.content.' + field + '.' + prop;
      const ov = this.nested(this.overrides || {}, path + '.default');
      const value = ov !== undefined ? ov : this.nested(this.config.defaults || {}, path + '.default');
      return validStart(value, this.nested(this.config.defaults || {}, path + '.options'));
    },
    // a content field of the block, unless hidden from the editors (then
    // nobody fills it in)
    hasField(field) {
      // (the multicolumn has no intro: its tagline, headline … are the
      // columns' elements, shown in its own preview)
      if (this.isMulticolumn) return false;
      const content = this.nested(this.config.defaults || {}, 'settings.fields.content') || {};
      const hidden = this.nested(this.overrides || {}, 'settings.hidden');
      if (Array.isArray(hidden) && hidden.includes(field)) return false;
      return content[field] !== undefined && content[field] !== false;
    },
    // a value of the block links (override, else the plugin's)
    linkValue(name) {
      const ov = (this.globalOverrides.global || {})[name];
      if (ov !== undefined && ov !== '') return ov;
      return this.globalDefaults.links?.vars?.[name]?.value || '';
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
    // the gap above a field: the element before keeps its "space after"
    // (tagline, heading, text); before the block's own content (items,
    // media, logos) the block's CSS sets the gap – margins meet there, the
    // larger one wins as in the frontend
    gapBefore(field) {
      const idx = this.fields.indexOf(field);
      if (idx <= 0) return 0;
      const prev = this.fields[idx - 1];
      const after = ['tagline', 'heading', 'editor'].includes(prev) ? this.spaceAfter(prev) : '';
      const own = GAPS[prev + '>' + field];
      if (own && after) return 'max(' + own + ', ' + after + ')';
      return own || after || 0;
    },
    // a value of the entries: the block's own (switched on: item-entry own),
    // else the global items' (Elements › Items), at the shown device
    entryValue(name) {
      if (this.setting('layout', 'item-entry') === 'own') {
        const ov = (this.valueOverrides || {})[name];
        if (ov && typeof ov === 'object') { if (ov[this.bp]) return ov[this.bp]; } else if (ov) return ov;
        for (const group of Object.values(this.valueDefaults || {})) {
          const def = group && group.vars && group.vars[name];
          if (def) return def[this.bp] || def.default || def.value;
        }
      }
      return this.elementValue('item', name.replace(/^item-/, ''));
    },
    // title or description of an entry: the type of Elements › Items, its
    // colour from the variant
    entryTypography(part) {
      const g = (prop) => this.elementValue('item', part + '-' + prop);
      let family = g('font-family');
      if (!family || family === 'default') family = this.bodyDefaultFont;
      const all = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      const font = Object.values(all).find(f => f.family === family);
      return {
        fontFamily: "'" + family + "', " + ((font && font.category) || 'sans-serif'),
        fontWeight: g('font-weight'),
        fontStyle: g('font-style'),
        fontSize: this.entryValue('item-' + part + '-font-size'),
        lineHeight: part === 'title' ? this.entryValue('item-title-line-height') : g('line-height'),
        letterSpacing: g('letter-spacing'),
        textTransform: g('text-transform'),
        color: this.elementColor('item', 'element-item-' + part + '-text'),
      };
    },
    // the space below an element: the block's own (switched on in its design
    // tab) or the element's
    spaceAfter(element) {
      if (this.ownSpacing) {
        const own = this.itemValue(element + '-spacing');
        if (own) return own;
      }
      return this.elementValue(element, 'spacing');
    },
    // guides with the block's own space below: the gap above a field as a
    // band of its own, coloured by the element above (tagline cyan, heading
    // violet, text orange)
    spaceBand(field) {
      // (blocks with values for it: the hero – own or the global elements')
      if (!this.guides || !this.hasOwnSpacingValues) return null;
      const idx = this.fields.indexOf(field);
      const prev = idx > 0 ? this.fields[idx - 1] : '';
      if (!['tagline', 'heading', 'editor'].includes(prev)) return null;
      const height = this.gapBefore(field);
      return height ? { height, prev } : null;
    },
    // tagline, heading and text in a card: the element's type, the card's
    // text colours, the preset size step and alignment
    // the gap below a text in the card: to the next one, or (the last) to the link
    cardGapVar(el) {
      const i = this.cardFields.indexOf(el);
      if (i === this.cardFields.length - 1) return 'item-cta-gap';
      return el === 'tagline' ? 'item-tagline-spacing' : el === 'heading' ? 'item-heading-spacing' : '';
    },
    cardGapAfter(el) {
      const name = this.cardGapVar(el);
      return name ? this.itemValue(name) : 0;
    },
    // its guide colour: tagline violet, heading gold, to the link teal
    cardGapKind(el) {
      return { 'item-tagline-spacing': 'tagline', 'item-heading-spacing': 'heading', 'item-cta-gap': 'cta' }[this.cardGapVar(el)] || '';
    },
    cardFieldText(el, n) {
      if (el === 'tagline') return this.$t('prw.preview.tagline');
      if (el === 'heading') return this.$t('prw.preview.card.title') + ' ' + n;
      // the first card with a longer text: side by side the cards differ in
      // height, so the link's position (bottom / after the text) shows
      return this.$t(n === 1 ? 'prw.preview.card.textLong' : 'prw.preview.card.text');
    },
    cardFieldStyle(el) {
      const style = {
        ...this.typography(el),
        color: this.itemColor('item-' + el + '-text'),
        textAlign: this.preset('item-' + el, 'align') || 'left',
        margin: 0,
        // the gap below it (with guides a band of its own)
        marginBottom: this.guides ? 0 : this.cardGapAfter(el),
      };
      const size = this.preset('item-' + el, 'sizes');
      if (size && size !== 'normal') {
        const step = this.sizeStep(el, size);
        if (step) style.fontSize = step;
      } else if (!style.fontSize) {
        style.fontSize = this.sizeStep(el, 'md');
      }
      return style;
    },
    // a column: its vertical position next to the other (start value)
    mcColumnStyle(side) {
      if (!this.mcSide) return null;
      return { alignSelf: { top: 'start', middle: 'center', bottom: 'end' }[this.setting('layout', 'multicolumn-' + side)] || 'start' };
    },
    // a text in a column: the element's type and colour, the preset size step
    // (headline lg, text normal), its space below (with guides a band instead)
    mcTextStyle(element, spaceOf) {
      // (the column's fields: tagline, headline, text – their start values)
      const field = { tagline: 'tagline', heading: 'headline', editor: 'text' }[element];
      const style = { ...this.typography(element), color: this.elementColor(element, 'element-' + element + '-text'), margin: 0, textAlign: this.preset(field, 'align') || 'left' };
      const preset = element === 'heading' ? (this.preset('headline', 'sizes') || 'lg') : element === 'editor' ? (this.preset('text', 'sizes') || 'normal') : 'normal';
      if (preset !== 'normal') {
        const step = this.sizeStep(element, preset);
        if (step) style.fontSize = step;
      }
      if (spaceOf && !this.guides) style.marginBottom = this.spaceAfter(spaceOf);
      return style;
    },
    fieldStyle(field) {
      const style = {
        ...this.typography(field),
        color: this.elementColor(field, 'element-' + field + '-text'),
        textAlign: this.preset(field, 'align') || 'left',
        margin: 0,
        // (with a band of its own above: none)
        marginTop: this.spaceBand(field) ? 0 : this.gapBefore(field),
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
  /* (a too long word breaks, as in the frontend) */
  overflow-wrap: break-word;
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
/* the gap between number and text, the second gap: two violet lines
   around it (beside: left and right, centered: above and below) */
.pw-steplist-gap {
  box-sizing: border-box;
  border-inline: 1px solid rgba(130, 80, 255, 0.9);
}
.pw-steplist-item.is-centered .pw-steplist-gap {
  border-inline: 0;
  border-block: 1px solid rgba(130, 80, 255, 0.9);
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
  border-block: 1px solid rgba(130, 80, 255, 0.9);
}
/* the block's own space below (guides): a band between two lines, below
   the tagline cyan, the heading violet, the text orange */
/* multicolumn: the columns; guides as bands inside a column (heading
   violet, text orange, after the image gold) and the gap between the
   columns (cyan, side by side a track, stacked a band violet) */
.pw-mc-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.pw-mc-image {
  aspect-ratio: 16 / 9;
  background-size: cover;
  background-position: center;
}
.pw-mc-band,
.pw-mc-gap {
  display: block;
  flex-shrink: 0;
  box-sizing: border-box;
}
.pw-mc-band {
  border-block: 1px solid transparent;
}
.pw-mc-band.is-tagline { border-color: rgba(0, 170, 255, 0.8); }
.pw-mc-band.is-list { border-color: rgba(215, 160, 0, 0.95); }
.pw-mc-band.is-list.is-hot { background: rgba(215, 160, 0, 0.18); }
.pw-mc-band.is-quote { border-color: rgba(0, 150, 136, 0.9); }
.pw-mc-band.is-quote.is-hot { background: rgba(0, 150, 136, 0.15); }
.pw-mc-band.is-media { border-color: rgba(230, 60, 60, 0.9); }
.pw-mc-band.is-button { border-color: rgba(40, 90, 220, 0.9); }
.pw-mc-band.is-button.is-hot { background: rgba(40, 90, 220, 0.15); }
.pw-mc-band.is-media.is-hot { background: rgba(230, 60, 60, 0.18); }
.pw-mc-list > li + li { margin-top: var(--pw-list-gap); }
.pw-mc-list > li::marker { color: var(--pw-list-marker); font-size: var(--pw-list-marker-size); }
.pw-mc-band.is-heading { border-color: rgba(130, 80, 255, 0.9); }
.pw-mc-band.is-editor { border-color: rgba(255, 140, 0, 0.9); }
.pw-mc-band.is-tagline.is-hot { background: rgba(0, 170, 255, 0.15); }
.pw-mc-band.is-heading.is-hot { background: rgba(130, 80, 255, 0.15); }
.pw-mc-band.is-editor.is-hot { background: rgba(255, 140, 0, 0.15); }
.pw-mc-gap {
  border-inline: 1px solid rgba(0, 170, 255, 0.8);
}
.pw-mc-gap.is-row {
  border-inline: 0;
  border-block: 1px solid rgba(130, 80, 255, 0.9);
}
.pw-mc-gap.is-hot { background: rgba(0, 170, 255, 0.15); }
.pw-mc-gap.is-row.is-hot { background: rgba(130, 80, 255, 0.15); }
.pw-block-live-preview.has-focus :is(.pw-mc-band, .pw-mc-gap):not(.is-hot) {
  border-color: transparent;
}
.pw-space-band {
  position: relative;
  align-self: stretch;
}
/* lines and tint across the whole block (cut off at its edge) */
.pw-space-band::before {
  content: "";
  position: absolute;
  inset: 0 -100vw;
  box-sizing: border-box;
  border-block: 1px solid rgba(0, 170, 255, 0.8);
  pointer-events: none;
}
.pw-space-band.is-heading::before { border-color: rgba(130, 80, 255, 0.9); }
.pw-space-band.is-editor::before { border-color: rgba(255, 140, 0, 0.9); }
.pw-space-band.is-tagline.is-hot::before { background: rgba(0, 170, 255, 0.15); }
.pw-space-band.is-heading.is-hot::before { background: rgba(130, 80, 255, 0.15); }
.pw-space-band.is-editor.is-hot::before { background: rgba(255, 140, 0, 0.15); }
.pw-block-live-preview.has-focus .pw-space-band:not(.is-hot)::before {
  border-color: transparent;
}
/* the sample text's link: as the block links */
.pw-block-live-link {
  color: var(--pw-link);
  text-decoration-line: none;
  cursor: pointer;
}
.pw-block-live-link:hover {
  color: var(--pw-link-hover);
}
.pw-block-live-link[data-decoration="always"],
.pw-block-live-link[data-decoration="hover"]:hover {
  text-decoration-line: underline;
}
/* hero guides: the paddings' edge (magenta) in place of the content's frame */
.pw-hero-pad {
  position: absolute;
  outline: 1px solid rgba(255, 0, 170, 0.6);
  pointer-events: none;
}
.pw-block-live-section.is-hero.has-guides .pw-block-live-content {
  outline: 0;
}
.pw-block-live-preview.has-focus:not([data-focus^="padding-"]) .pw-hero-pad {
  display: none;
}
/* hero: its overlay over the background, below the content */
.pw-hero-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.pw-block-live-section.is-hero .pw-block-live-grid {
  position: relative;
}
/* hero: a video background marked by a play symbol */
.pw-block-live-section.is-hero {
  background-size: cover;
  background-position: center;
}
.pw-hero-video-mark {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  display: flex;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0.25rem;
  border-radius: 50%;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
}
/* cardlets guides: the gaps inside the card, below the tagline violet,
   below the heading gold, to the link teal (a line above and below) */
.pw-card-gap {
  display: block;
  flex-shrink: 0;
  /* across the whole card (past the horizontal padding) */
  margin-inline: calc(-1 * var(--pw-card-px, 0px));
  box-sizing: border-box;
  border-block: 1px solid rgba(130, 80, 255, 0.9);
}
.pw-card-gap.is-heading { border-color: rgba(215, 160, 0, 0.95); }
.pw-card-gap.is-cta { border-color: rgba(0, 150, 136, 0.9); }
.pw-card-gap.is-tagline.is-hot { background: rgba(130, 80, 255, 0.15); }
.pw-card-gap.is-heading.is-hot { background: rgba(215, 160, 0, 0.18); }
.pw-card-gap.is-cta.is-hot { background: rgba(0, 150, 136, 0.15); }
.pw-block-live-preview.has-focus .pw-card-gap:not(.is-hot) {
  border-color: transparent;
}
/* cardlets: the image flush at the top of the card, the link's icon */
.pw-cardlets-image {
  aspect-ratio: 16 / 9;
  background-size: cover;
  background-position: center;
}
/* on the image: the image fills the card, the overlay above it */
.pw-cardlets-image.is-overlay,
.pw-cardlets-overlay {
  position: absolute;
  inset: 0;
  aspect-ratio: auto;
}
/* cardlets guides: where the paddings end – left/right magenta (through the
   card's content from top to bottom), top/bottom green (from side to side);
   a padding's field with the cursor: only its lines stay */
.pw-cardlets-content.has-pad-guides::before,
.pw-cardlets-content.has-pad-guides::after {
  content: "";
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
}
.pw-cardlets-content.has-pad-guides::before {
  inset: 0 var(--pw-card-px);
  border-inline: 1px solid rgba(255, 0, 170, 0.6);
}
.pw-cardlets-content.has-pad-guides::after {
  inset: var(--pw-card-py) 0;
  border-block: 1px solid rgba(0, 180, 90, 0.9);
}
.pw-block-live-preview.has-focus .pw-cardlets-content:not(.is-hot-x)::before,
.pw-block-live-preview.has-focus .pw-cardlets-content:not(.is-hot-y)::after {
  border-color: transparent;
}
/* standing out: the image above the card's upper piece */
.pw-cardlets-image-wrap.is-overhang {
  position: relative;
  isolation: isolate;
}
.pw-cardlets-overhang {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: -1;
}
/* standing out: the landscape's mountains cut out (without sky and sun),
   their peaks rising out of the card */
.pw-cardlets-image.is-cutout {
  background-color: transparent;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90' preserveAspectRatio='xMidYMid slice'%3E%3Cpath d='M0 90 L0 58 L40 12 L70 42 L100 4 L138 48 L160 34 L160 90Z' fill='%235f7f6b'/%3E%3Cpath d='M0 90 L0 72 L32 50 L62 68 L102 42 L142 68 L160 60 L160 90Z' fill='%23405c4c'/%3E%3C/svg%3E");
}
/* guides: the overhang as a band from the image's top to the card's (red,
   a kind of its own) */
.pw-card-overhang {
  position: absolute;
  inset-inline: 0;
  top: 0;
  z-index: 1;
  box-sizing: border-box;
  border-block: 1px solid rgba(230, 60, 60, 0.9);
  pointer-events: none;
}
.pw-card-overhang.is-hot { background: rgba(230, 60, 60, 0.18); }
.pw-block-live-preview.has-focus .pw-card-overhang:not(.is-hot) {
  border-color: transparent;
}
.pw-cardlets-cta svg {
  width: 1em;
  height: 1em;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* featurelist: a feature and its content may shrink to their column,
   long words break (the narrow sidebar) */
.pw-featurelist-item,
.pw-featurelist-content {
  min-width: 0;
}
.pw-featurelist-content {
  flex: 1;
  overflow-wrap: break-word;
  hyphens: auto;
}
.pw-block-live-intro {
  min-width: 0;
}
/* split (intro in a narrow column): tagline and heading on one line, the
   text on three, each cut off with "…" – the layout reads, not the words */
.pw-block-live-content.is-split .pw-block-live-intro > * {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.pw-block-live-content.is-split .pw-block-live-intro > .pw-block-live-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  white-space: normal;
}
.pw-block-live-intro {
  overflow-wrap: break-word;
  hyphens: auto;
}
/* featurelist guides: between the features cyan, between icon and text
   violet, between title and text gold (to the text above: orange; a line
   on either side), the
   icon's area inside the tile's padding magenta */
.pw-featurelist-gap,
.pw-featurelist-icon-gap,
.pw-featurelist-title-gap {
  display: block;
  box-sizing: border-box;
}
.pw-featurelist-gap {
  border-block: 1px solid rgba(0, 170, 255, 0.8);
}
.pw-featurelist-items.is-row .pw-featurelist-gap {
  border-block: 0;
  border-inline: 1px solid rgba(0, 170, 255, 0.8);
}
.pw-featurelist-icon-gap {
  border-inline: 1px solid rgba(130, 80, 255, 0.9);
}
.pw-featurelist-item.is-top .pw-featurelist-icon-gap {
  border-inline: 0;
  border-block: 1px solid rgba(130, 80, 255, 0.9);
}
.pw-featurelist-title-gap {
  border-block: 1px solid rgba(215, 160, 0, 0.95);
}
/* the offset (split layout): orange, as the gap to the intro */
.pw-featurelist-offset-gap {
  align-self: stretch;
  box-sizing: border-box;
  border-inline: 1px solid rgba(255, 140, 0, 0.9);
}
.pw-featurelist-offset-gap.is-hot { background: rgba(255, 140, 0, 0.15); }
.pw-featurelist-pad {
  position: absolute;
  outline: 1px solid rgba(255, 0, 170, 0.6);
  pointer-events: none;
}
.pw-block-live-preview.has-focus .pw-featurelist-offset-gap:not(.is-hot),
.pw-block-live-preview.has-focus .pw-featurelist-gap:not(.is-hot),
.pw-block-live-preview.has-focus .pw-featurelist-icon-gap:not(.is-hot),
.pw-block-live-preview.has-focus .pw-featurelist-title-gap:not(.is-hot) {
  border-color: transparent;
}
.pw-block-live-preview.has-focus:not([data-focus="item-icon-tile-padding"]) .pw-featurelist-pad {
  display: none;
}
.pw-featurelist-gap.is-hot { background: rgba(0, 170, 255, 0.15); }
.pw-featurelist-icon-gap.is-hot { background: rgba(130, 80, 255, 0.15); }
.pw-featurelist-title-gap.is-hot { background: rgba(215, 160, 0, 0.18); }
/* a value's field with the cursor: its area tinted with its lines, every
   other guide hidden (each rule prefixed with the preview's class, so it
   beats the guides' own, e.g. the gaps side by side or with the icon on
   top) – the block's own lines, the other gaps, the padding frames, the
   flexible tiles' edges */
.pw-block-live-preview.has-focus:not([data-focus="margin-top"]) .pw-block-live-block::before,
.pw-block-live-preview.has-focus:not([data-focus="margin-bottom"]) .pw-block-live-block::after {
  display: none;
}
.pw-block-live-preview.has-focus:not([data-focus^="padding-"]) .pw-block-live-section.has-guides .pw-block-live-content {
  outline: 0;
}
.pw-block-live-preview.has-focus .pw-steplist-step-gap:not(.is-hot),
.pw-block-live-preview.has-focus .pw-steplist-gap:not(.is-hot),
.pw-block-live-preview.has-focus .pw-logocloud-gap:not(.is-hot),
.pw-block-live-preview.has-focus .pw-logocloud-text-gap:not(.is-hot)::before {
  border-color: transparent;
}
.pw-block-live-preview.has-focus:not([data-focus="item-padding"]):not([data-focus="item-padding-y"]) .pw-logocloud-preview.has-guides .pw-logocloud-pad,
.pw-block-live-preview.has-focus:not([data-focus="item-gap"]) .pw-logocloud-preview.is-flexible .pw-logocloud-item::before {
  display: none;
}
/* a value's row hovered (guides on): its area tinted in its colour */
.pw-logocloud-text-gap.is-hot::before { background: rgba(255, 140, 0, 0.15); }
.pw-logocloud-gap.is-column.is-hot,
.pw-steplist-step-gap.is-hot { background: rgba(0, 170, 255, 0.15); }
.pw-logocloud-gap.is-row.is-hot { background: rgba(130, 80, 255, 0.18); }
.pw-steplist-gap.is-hot { background: rgba(130, 80, 255, 0.15); }
/* the gap between the text and the items (logos, features, cards):
   lines and tint across the whole block (cut off at its edge), as the
   elements' space below */
.pw-logocloud-text-gap {
  position: relative;
}
.pw-logocloud-text-gap::before {
  content: "";
  position: absolute;
  inset: 0 -100vw;
  box-sizing: border-box;
  border-block: 1px solid rgba(255, 140, 0, 0.9);
  pointer-events: none;
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
  pointer-events: none;
}
/* the logo's area inside the padding: left and right magenta (horizontal
   padding) from top to bottom of the tile, top and bottom green (vertical
   padding) from side to side – cut off at the tile's box (a rectangle, so
   a round tile shows them over its whole height and width too) */
.pw-logocloud-preview.has-guides .pw-logocloud-item {
  clip-path: inset(0);
}
.pw-logocloud-preview.has-guides .pw-logocloud-pad::before,
.pw-logocloud-preview.has-guides .pw-logocloud-pad::after {
  content: "";
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
}
.pw-logocloud-preview.has-guides .pw-logocloud-pad::before {
  inset: -100vh 0;
  border-inline: 1px solid rgba(255, 0, 170, 0.6);
}
.pw-logocloud-preview.has-guides .pw-logocloud-pad::after {
  inset: 0 -100vw;
  border-block: 1px solid rgba(0, 180, 90, 0.9);
}
/* a padding's field with the cursor: only its own lines */
.pw-block-live-preview.has-focus[data-focus="item-padding"] .pw-logocloud-pad::after,
.pw-block-live-preview.has-focus[data-focus="item-padding-y"] .pw-logocloud-pad::before {
  display: none;
}
/* logocloud: a sample logo in its tile (as "contain" in the frontend) */
.pw-logocloud-item {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: var(--color-gray-400);
}
.pw-logocloud-item {
  position: relative;
}
.pw-logocloud-item svg {
  width: 100%;
  height: 100%;
}
.pw-logocloud-pad,
.pw-logocloud-box {
  position: absolute;
  pointer-events: none;
}
.pw-logocloud-box {
  inset: 0;
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
