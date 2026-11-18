<template>
  <!-- a block's design (Blocks › its block › Design) where a plugin edits
       its content, e.g. the Form Wizard's form: the same values, saved to
       the same place – shown live in the preview beside it (the shared
       preview store), the variant shared with it. So far the form blocks'
       cards (fields, colours, spacing). Saved with the wizard's save button
       above: the page holding it calls save() and discard(). -->
  <div class="pw-block-design">
    <template v-if="defaults">
      <!-- (as above the block's design in the wizard) -->
      <p class="pw-block-view-intro">{{ $t('prw.view.design.intro') }}</p>
      <section class="pw-card-section">
        <div class="pw-card-heading-row">
          <h3 class="pw-card-heading">{{ $t('prw.form.fields') }}</h3>
        </div>
        <div class="pw-card pw-field-table">
          <pw-block-values :bp.sync="bp" :defaults="defaults" :overrides="overrides" :show-only="['field-font-size', 'field-label-size', 'field-padding', 'field-radius', 'field-border-width']" :hide-section-headers="true" @update:overrides="change" />
        </div>
        <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.formFields')" />
      </section>
      <!-- the form's subheadings (with a text below) -->
      <section v-if="hasInfo" class="pw-card-section">
        <div class="pw-card-heading-row">
          <h3 class="pw-card-heading">{{ $t('prw.form.info') }}</h3>
        </div>
        <div class="pw-card pw-field-table">
          <pw-block-values :bp.sync="bp" :defaults="defaults" :overrides="overrides" :show-only="['info-font-size', 'info-font-weight', 'info-spacing-top', 'info-text-gap']" :hide-section-headers="true" @update:overrides="change" />
        </div>
      </section>
      <section class="pw-card-section">
        <div class="pw-card-heading-row">
          <h3 class="pw-card-heading">{{ $t('prw.subtab.colors') }}</h3>
          <span class="pw-pill pw-theme-switch" role="group">
            <button v-for="t in themes" :key="'th-' + t" type="button" class="pw-tool" :aria-pressed="theme === t ? 'true' : 'false'" @click="pickTheme(t)">
              <span class="pw-variant-dot is-small" :style="{ backgroundColor: variantBackground(t) }"></span>{{ $t('pw.option.' + t) }}
            </button>
          </span>
        </div>
        <div class="pw-card pw-field-table">
          <pw-block-values :bp.sync="bp" :labels="colorLabels" :fallbacks="colorFallbacks" :theme="theme" :defaults="defaults" :overrides="overrides" :show-only="colorNames" :hide-section-headers="true" @update:overrides="change" />
        </div>
        <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.formColors')" />
      </section>
      <section class="pw-card-section">
        <div class="pw-card-heading-row">
          <h3 class="pw-card-heading">{{ $t('prw.headline.spacing') }}</h3>
        </div>
        <div class="pw-card pw-field-table">
          <pw-block-values :bp.sync="bp" :defaults="defaults" :overrides="overrides" :show-only="['field-gap', 'field-column-gap', 'item-text-gap']" :hide-section-headers="true" @update:overrides="change" />
        </div>
        <k-text size="tiny" class="k-help pw-card-help" :html="$t('prw.hint.formSpacing')" />
      </section>
    </template>
  </div>
</template>

<script>
import { previewState, ensurePreviewData, setPreviewTheme, setDesignBp, announcePreviewSaved } from '../../preview/store.js';
import { themes } from '../../preview/derive.js';
import { readPreviewBp, savePreviewBp } from '../../helpers/preview-bp.js';

// the paths whose values differ (an empty value counts as none)
function changedPaths(a, b, path = []) {
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  if (isObj(a) || isObj(b)) {
    const x = isObj(a) ? a : {};
    const y = isObj(b) ? b : {};
    return [...new Set([...Object.keys(x), ...Object.keys(y)])].flatMap((k) => changedPaths(x[k], y[k], [...path, k]));
  }
  const empty = (v) => v === undefined || v === null || v === '';
  if (empty(a) && empty(b)) return [];
  return JSON.stringify(a) === JSON.stringify(b) ? [] : [path];
}

const COLORS = ['field-background', 'field-border', 'field-focus', 'field-text', 'field-placeholder', 'field-label', 'field-help', 'field-error', 'info-heading', 'info-text'];

export default {
  props: {
    // the block type (pwform)
    type: { type: String, required: true },
  },
  emits: ['pending'],
  data() {
    return {
      defaults: null,
      overrides: {},
      saved: '{}',
      busy: false,
    };
  },
  computed: {
    state() {
      return previewState();
    },
    // the device: shared with the preview (its icons switch it, as on the
    // wizard's block pages)
    bp: {
      get() {
        return this.state.designBp || readPreviewBp();
      },
      set(bp) {
        setDesignBp(bp);
        savePreviewBp(bp);
      },
    },
    themes() {
      return this.state.data ? themes(this.state.data.variants) : ['default'];
    },
    theme() {
      return this.themes.includes(this.state.theme) ? this.state.theme : 'default';
    },
    colorNames() {
      return COLORS;
    },
    colorLabels() {
      return {
        'field-background': this.$t('prw.form.color.background'),
        'field-border': this.$t('prw.form.color.border'),
        'field-focus': this.$t('prw.form.color.focus'),
        'field-text': this.$t('prw.form.color.text'),
        'field-placeholder': this.$t('prw.form.color.placeholder'),
        'field-label': this.$t('prw.form.color.label'),
        'field-help': this.$t('prw.form.color.help'),
        'field-error': this.$t('prw.form.color.error'),
        'info-heading': this.$t('prw.form.color.info-heading'),
        'info-text': this.$t('prw.form.color.info-text'),
      };
    },
    // the colours that apply without a value of their own (the website's
    // CSS): label – the page's text (black), help – the label paler,
    // placeholder – the input paler
    colorFallbacks() {
      const t = this.theme;
      const own = (name) => ((this.overrides[t] || {})[name]) || this.colorDefault(name, t);
      const solid = (c) => (c || '#000000').slice(0, 7);
      const label = own('field-label') || '#000000';
      const help = own('field-help') || solid(label) + 'BF';
      return {
        'field-label': '#000000',
        'field-help': solid(label) + 'BF',
        'field-placeholder': solid(own('field-text') || '#16171A') + '8C',
        // (a subheading as the labels, its text as the help)
        'info-heading': label,
        'info-text': help,
      };
    },
    hasInfo() {
      return Object.values(this.defaults || {}).some((g) => g && g.vars && g.vars['info-font-size']);
    },
    dirty() {
      return JSON.stringify(this.overrides) !== this.saved;
    },
    // how many values differ from the saved ones (the count at the save button)
    pending() {
      return changedPaths(this.overrides, JSON.parse(this.saved)).length;
    },
  },
  watch: {
    pending(count) {
      this.$emit('pending', count);
    },
  },
  async created() {
    await ensurePreviewData(this.$api);
    const res = await this.$api.get('projectwizard/values/' + this.type);
    const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
    this.defaults = obj(res.defaults);
    this.overrides = JSON.parse(JSON.stringify(obj(res.overrides)));
    this.saved = JSON.stringify(this.overrides);
  },
  beforeDestroy() {
    // (unsaved: the preview back to what is saved – and no changes left
    // counted for a page that no longer shows it)
    if (this.dirty) this.live(JSON.parse(this.saved));
    this.$emit('pending', 0);
  },
  methods: {
    colorDefault(name, theme) {
      for (const g of Object.values(this.defaults || {})) {
        if (g && g.colors && g.colors[name]) return g.colors[name][theme] || '';
      }
      return '';
    },
    variantBackground(theme) {
      const g = (this.state.data && this.state.data.global) || { defaults: {}, overrides: {} };
      return ((g.overrides.global || {})[theme] || {})['block-background'] || g.defaults.colors?.colors?.['block-background']?.[theme] || '#ffffff';
    },
    pickTheme(theme) {
      setPreviewTheme(theme);
    },
    // a value changed: shown in the preview right away
    change(overrides) {
      this.overrides = overrides;
      this.live(overrides);
    },
    live(overrides) {
      const block = this.state.data && this.state.data.blocks[this.type];
      if (block) block.valueOverrides = JSON.parse(JSON.stringify(overrides));
    },
    discard() {
      this.overrides = JSON.parse(this.saved);
      this.live(this.overrides);
    },
    // saved (the wizard's save button): false when it failed (its message shown)
    async save() {
      if (!this.dirty) return true;
      if (this.busy) return false;
      this.busy = true;
      try {
        const res = await this.$api.post('projectwizard/values/' + this.type, this.overrides);
        const ov = res.overrides && !Array.isArray(res.overrides) ? res.overrides : {};
        this.overrides = JSON.parse(JSON.stringify(ov));
        this.saved = JSON.stringify(this.overrides);
        announcePreviewSaved();
        return true;
      } catch (e) {
        this.$panel.notification.error(e);
        return false;
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>
