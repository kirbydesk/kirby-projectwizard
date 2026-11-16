<template>
  <!-- Project → Fonts: a Google font by name – choose it, the Project Wizard
       downloads it into the project (GoogleFonts.php) -->
  <div class="pw-font-search">
    <div class="pw-font-search-field">
      <k-icon type="search" class="pw-font-search-icon" />
      <input
        ref="input"
        v-model="query"
        type="text"
        class="pw-font-search-input"
        :placeholder="$t('prw.fonts.google.search')"
        :disabled="!!installing"
        autocomplete="off"
        spellcheck="false"
        @focus="openList"
        @input="highlight = 0; openList()"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="pickHighlighted"
        @keydown.esc="close"
        @blur="close"
      />
      <div v-if="open" class="pw-font-search-list" @mousedown.prevent>
        <p v-if="!list" class="pw-font-search-empty">{{ $t('prw.fonts.loading') }}</p>
        <p v-else-if="!matches.length" class="pw-font-search-empty">{{ $t('prw.fonts.google.none') }}</p>
        <button
          v-for="(font, i) in matches"
          :key="font[0]"
          type="button"
          class="pw-font-search-option"
          :class="{ 'is-highlighted': i === highlight, 'is-installed': isInstalled(font[0]) }"
          :disabled="isInstalled(font[0])"
          @mouseenter="highlight = i; preview(font[0])"
          @click="install(font[0])"
        >
          <span class="pw-font-search-name" :style="{ fontFamily: nameFamily(font) }">{{ font[0] }}</span>
          <span class="pw-font-search-meta">{{ isInstalled(font[0]) ? $t('prw.fonts.google.installed') : categoryLabel(font[1]) + (font[3] !== null ? ' · ' + $t('prw.fonts.google.variable') : '') }}</span>
        </button>
      </div>
    </div>
    <p v-if="error" class="pw-favicon-note pw-favicon-error">{{ error }}</p>
    <p class="pw-favicon-note">{{ $t('prw.fonts.google.help') }}</p>
  </div>
</template>

<script>
// Google's names in their own font: only the letters of the name, a few KB
// (the Panel loads them while searching – the website loads nothing from Google)
const loaded = new Set();
function loadGoogle(family, nameOnly) {
  const key = family + (nameOnly ? '' : '*');
  if (loaded.has(key)) return;
  loaded.add(key);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(family).replace(/%20/g, '+') +
    (nameOnly ? '&text=' + encodeURIComponent(family) : '') + '&display=swap';
  document.head.appendChild(link);
}

export default {
  props: {
    fonts: { type: Object, default: () => ({}) },
    installing: { type: String, default: '' },
  },
  data() {
    return { list: null, query: '', open: false, highlight: 0, error: '' };
  },
  computed: {
    installedFamilies() {
      const all = { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
      return new Set(Object.values(all).map((f) => f && f.family));
    },
    // names starting with the query first, then those containing it
    matches() {
      if (!this.list) return [];
      const q = this.query.trim().toLowerCase();
      if (!q) return this.list.slice(0, 12);
      const starts = [];
      const contains = [];
      for (const font of this.list) {
        const name = font[0].toLowerCase();
        if (name.startsWith(q)) starts.push(font);
        else if (name.includes(q)) contains.push(font);
        if (starts.length >= 12) break;
      }
      return starts.concat(contains).slice(0, 12);
    },
  },
  methods: {
    async openList() {
      this.open = true;
      if (this.list) return;
      const result = await this.$api.get('projectwizard/fonts/google');
      if (result.error) {
        this.error = result.error;
        this.open = false;
        return;
      }
      this.error = '';
      this.list = result.fonts;
    },
    close() {
      this.open = false;
      this.$emit('preview', null);
    },
    move(step) {
      if (!this.open) return this.openList();
      const count = this.matches.length;
      if (!count) return;
      this.highlight = (this.highlight + step + count) % count;
      this.preview(this.matches[this.highlight][0]);
      this.$nextTick(() => {
        const el = this.$el.querySelector('.pw-font-search-option.is-highlighted');
        if (el) el.scrollIntoView({ block: 'nearest' });
      });
    },
    pickHighlighted() {
      const font = this.matches[this.highlight];
      if (font && !this.isInstalled(font[0])) this.install(font[0]);
    },
    nameFamily(font) {
      loadGoogle(font[0], true);
      return "'" + font[0] + "', " + font[1];
    },
    // the sidebar shows the font under the mouse (its regular style)
    preview(family) {
      loadGoogle(family, false);
      this.$emit('preview', family);
    },
    isInstalled(family) {
      return this.installedFamilies.has(family);
    },
    categoryLabel(cat) {
      const key = 'prw.fontcategory.' + cat;
      const text = this.$t(key);
      return text && text !== key ? text : cat;
    },
    async install(family) {
      if (this.installing || this.isInstalled(family)) return;
      this.query = '';
      this.error = '';
      this.$refs.input.blur();
      this.$emit('installing', family);
      try {
        const result = await this.$api.post('projectwizard/fonts/google', { family });
        if (result.error) this.error = result.error;
        else this.$emit('update', { installedFamily: family });
      } finally {
        this.$emit('installing', '');
      }
    },
  },
};
</script>

<style>
.pw-font-own-toggle {
  margin-top: var(--spacing-3);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.pw-font-search-field {
  position: relative;
}
.pw-font-search-icon {
  position: absolute;
  left: var(--spacing-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-dimmed);
  pointer-events: none;
}
.pw-font-search-input {
  width: 100%;
  height: 2.5rem;
  padding: 0 var(--spacing-3) 0 2.25rem;
  border: 0;
  border-radius: var(--rounded);
  background: var(--input-color-back, light-dark(var(--color-white), var(--color-gray-850)));
  box-shadow: var(--shadow);
  font: inherit;
  font-size: var(--text-sm);
  color: var(--color-text);
  outline: none;
}
.pw-font-search-input:focus {
  outline: var(--outline);
}
.pw-font-search-list {
  position: absolute;
  z-index: 20;
  left: 0;
  right: 0;
  top: calc(100% + var(--spacing-1));
  max-height: 22rem;
  overflow: auto;
  padding: var(--spacing-1);
  border-radius: var(--rounded-lg);
  background: light-dark(var(--color-white), var(--color-gray-850));
  box-shadow: var(--shadow-xl);
}
.pw-font-search-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--rounded);
  text-align: start;
  cursor: pointer;
}
.pw-font-search-option.is-highlighted {
  background: light-dark(var(--color-gray-100), var(--color-gray-800));
}
.pw-font-search-option.is-installed {
  opacity: 0.45;
  cursor: default;
}
.pw-font-search-name {
  flex: 1;
  min-width: 0;
  font-size: 1.125rem;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pw-font-search-meta,
.pw-font-search-empty {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  white-space: nowrap;
}
.pw-font-search-empty {
  padding: var(--spacing-2) var(--spacing-3);
}
</style>
