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
          <div class="pw-block-live-item" :style="itemStyle">
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
      </section>
    </div>
  </div>
</template>

<script>
import BlockPreview from './BlockPreview.vue';

// (a field of pagewizard's own types: its JSON; others as they are)
const parse = (value) => {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || value.trim()[0] !== '{') return {};
  try { return JSON.parse(value) || {}; } catch (e) { return {}; }
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  extends: BlockPreview,
  props: {
    // the block's content (Kirby's block content: fields in lower case)
    content: { type: Object, default: () => ({}) },
  },
  computed: {
    // the block's own variant (a colour variant no longer active, or the
    // custom colours: the default one)
    currentTheme() {
      const chosen = this.content.theme || this.setting('style', 'theme') || 'default';
      return this.themes.includes(chosen) ? chosen : 'default';
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
        // the links (Blocks › Links), as variables: the text keeps its own weight
        '--pw-link': this.globalColor('block-link') || 'inherit',
        '--pw-link-hover': this.globalColor('block-link-hover') || this.globalColor('block-link') || 'inherit',
        '--pw-link-decoration': (this.linkValue('block-link-decoration') || 'none') === 'none' ? 'none' : 'underline',
        '--pw-link-weight': this.linkValue('block-link-weight') === 'bold' ? 700 : 'inherit',
        '--pw-link-thickness': this.linkValue('block-link-thickness') || 'auto',
        '--pw-link-offset': this.linkValue('block-link-offset') || 'auto',
      };
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
      if (['tagline', 'heading'].includes(field)) {
        return String(this.fieldData(field).text || '').replace(/<[^>]*>/g, '').trim() !== '';
      }
      return true;
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
.pw-panel-button.is-hidden {
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
