<template>
  <!-- one sub-block of the multicolumn (tagline, headline, text, list,
       quote, media, button) in the project's look: in the panel preview's
       columns, and alone in the column's blocks field in the drawer (then on
       the block's background) -->
  <div class="pw-mc-el" :class="{ 'is-standalone': standalone }" :style="standalone ? standaloneStyle : null">
    <p v-if="mcKind(item) === 'tagline'" :style="mcTaglineStyle(item)" v-html="parseJson(item.content.tagline).text"></p>
    <template v-else-if="mcKind(item) === 'headline'">
      <div :style="mcHeadlineStyle(item)">
        <span v-if="parseJson(item.content.heading).textbackground === 'enabled'" class="pw-panel-marked" :style="markedStyle" v-html="mcHeadlineHtml(item)"></span>
        <span v-else v-html="mcHeadlineHtml(item)"></span>
      </div>
      <span v-if="parseJson(item.content.heading).flourish === 'enabled'" class="pw-panel-flourish" :style="mcFlourishStyle(item)"></span>
    </template>
    <div v-else-if="mcKind(item) === 'text'" class="pw-panel-rich" :style="{ ...mcTextSize(item), ...richStyle }" v-html="mcTextHtml(item)"></div>
    <component :is="mcListTag(item)" v-else-if="mcKind(item) === 'list'" class="pw-panel-mc-list" :style="mcItemListStyle(item)">
      <li v-for="(li, n) in mcListItems(item)" :key="n">{{ li }}</li>
    </component>
    <figure v-else-if="mcKind(item) === 'quote' && mcQuoteHtml(item)" class="pw-panel-quote">
      <blockquote :style="mcItemQuoteStyle(item)" v-html="mcQuoteHtml(item)"></blockquote>
      <figcaption v-if="parseJson(item.content.author).text"><cite :style="{ ...citeStyle, textAlign: parseJson(item.content.author).align || citeStyle.textAlign }">{{ parseJson(item.content.author).text }}</cite></figcaption>
    </figure>
    <pw-panel-media v-else-if="mcKind(item) === 'media'" :content="item.content" :box-style="mcMediaBox(item.content)" :caption-style="captionStyle" />
    <div v-else-if="mcKind(item) === 'button'" :style="{ textAlign: item.content.buttonalignment || preset('button', 'align') || 'left' }">
      <span class="pw-panel-button" :style="buttonStyle">
        <span v-if="mcButtonIcon(item, 'left')" class="pw-panel-button-icon" :style="{ ...buttonIconStyle, marginRight: buttonIconStyle.gap }" v-html="mcButtonIcon(item, 'left')"></span>
        <span>{{ item.content.linktext || $t('pw.field.link-text.placeholder') }}</span>
        <span v-if="mcButtonIcon(item, 'right')" class="pw-panel-button-icon" :style="{ ...buttonIconStyle, marginLeft: buttonIconStyle.gap }" v-html="mcButtonIcon(item, 'right')"></span>
      </span>
    </div>
  </div>
</template>

<script>
import PanelRender from './PanelRender.vue';

export default {
  extends: PanelRender,
  props: {
    // the sub-block: { type, content }
    item: { type: Object, required: true },
    // alone in the drawer (its own background and room)
    standalone: { type: Boolean, default: false },
  },
  computed: {
    standaloneStyle() {
      return {
        backgroundColor: this.globalColor('block-background') || this.bodyBackground,
        padding: 'var(--spacing-3)',
        borderRadius: 'var(--rounded)',
        colorScheme: 'light',
        overflowWrap: 'break-word',
      };
    },
  },
};
</script>
