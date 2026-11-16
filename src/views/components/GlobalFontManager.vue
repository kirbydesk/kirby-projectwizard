<template>
  <div class="pw-font-manager">
    <!-- installed fonts -->
    <section v-if="mode === 'installed'">
      <!-- one row per family: its name in its own font, what it has, where it comes from -->
      <div class="pw-font-families">
        <div v-for="item in families" :key="item.key" class="pw-font-family">
          <span class="pw-font-family-name" :style="familyStyle(item.font)">{{ item.font.family }}</span>
          <span class="pw-font-family-meta">
            {{ categoryLabel(item.font.category) }} · <span v-html="summary(item.font)"></span>
          </span>
          <span class="pw-font-badge">{{ sourceLabel(item.font) }}</span>
          <button v-if="!item.font.builtin" type="button" class="pw-font-delete" :title="$t('remove')" @click="deleteFont(item.key, item.font)">×</button>
          <!-- (built in: no ×, the column stays aligned) -->
          <span v-else class="pw-font-delete" aria-hidden="true" style="visibility: hidden">×</span>
        </div>
        <div v-if="installing && !hasFamily(installing)" class="pw-font-family is-loading">
          <span class="pw-font-family-name">{{ installing }}</span>
          <span class="pw-font-family-meta">{{ $t('prw.fonts.loading') }}</span>
          <k-icon type="loader" class="pw-font-loader" />
        </div>
      </div>
    </section>

    <!-- own font files: all files of a font at once; weight and italic read
         from the file names, checked in a small table -->
    <section v-if="mode === 'add'" class="pw-font-upload">
      <div
        v-if="!staged.length"
        class="pw-card pw-favicon-card is-empty"
        :class="{ 'is-over': over }"
        @dragover.prevent="over = true"
        @dragleave="over = false"
        @drop.prevent="onDrop"
      >
        <k-icon type="upload" class="pw-favicon-drop-icon" />
        <strong class="pw-favicon-drop-title">{{ $t('prw.fonts.drop') }}</strong>
        <span class="pw-favicon-drop-text">{{ $t('prw.fonts.drop.text') }}</span>
        <k-button :text="$t('prw.fonts.drop.button')" variant="filled" size="sm" @click="$refs.input.click()" />
      </div>
      <template v-else>
        <div
          class="pw-card pw-font-upload-card"
          :class="{ 'is-over': over }"
          @dragover.prevent="over = true"
          @dragleave="over = false"
          @drop.prevent="onDrop"
        >
          <div class="pw-font-upload-row">
            <label class="pw-font-upload-label" for="pw-font-upload-name">{{ $t('prw.fonts.name') }}</label>
            <div class="pw-font-upload-value">
              <input id="pw-font-upload-name" v-model="family" type="text" class="pw-font-upload-name" :placeholder="$t('prw.fonts.familyPlaceholder')" />
            </div>
          </div>
          <div class="pw-font-upload-row">
            <span class="pw-font-upload-label">{{ $t('prw.fonts.category') }}</span>
            <div class="pw-font-upload-value">
              <k-toggles-input :value="category" :options="categoryOptions" :grow="false" :required="true" @input="category = $event" />
            </div>
          </div>
          <table class="pw-font-upload-files">
            <thead>
              <tr>
                <th>{{ $t('prw.fonts.col.file') }}</th>
                <th>{{ $t('prw.fonts.col.weight') }}</th>
                <th>{{ $t('prw.fonts.col.style') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(file, i) in staged" :key="file.name">
                <td class="pw-font-upload-file">{{ file.name }}</td>
                <td>
                  <select v-model="file.weight" class="pw-font-upload-select">
                    <option v-for="w in weights" :key="w" :value="w">{{ w }} {{ weightNames[w] }}</option>
                    <option value="100 900">{{ $t('prw.fonts.variableAll') }}</option>
                  </select>
                </td>
                <td>
                  <k-toggles-input
                    :value="file.style"
                    :options="[{ value: 'normal', text: $t('pw.option.normal') }, { value: 'italic', text: $t('pw.option.italic') }]"
                    :grow="false"
                    :required="true"
                    @input="file.style = $event"
                  />
                </td>
                <td><button type="button" class="pw-font-delete" :title="$t('remove')" @click="staged.splice(i, 1)">×</button></td>
              </tr>
            </tbody>
          </table>
          <div class="pw-font-upload-actions">
            <k-button :text="$t('prw.fonts.more')" variant="filled" size="sm" :disabled="busy" @click="$refs.input.click()" />
            <k-button :text="$t('cancel')" variant="filled" size="sm" :disabled="busy" @click="reset" />
            <k-button :text="$t('prw.fonts.add')" variant="filled" theme="positive" size="sm" :disabled="busy || !family.trim()" @click="addFont" />
          </div>
        </div>
        <p v-if="error" class="pw-favicon-note pw-favicon-error">{{ error }}</p>
        <p class="pw-favicon-note">{{ $t('prw.fonts.checkHelp') }}</p>
      </template>
      <input ref="input" type="file" accept=".woff2" multiple hidden @change="onSelect" />
    </section>
  </div>
</template>

<script>
// what a file name tells: "open-sans-v44-latin-700italic", "MarkOT-BoldItalic",
// "InterVariable-Italic" → family, weight, italic
const WORDS = [
  ['extralight', '200'], ['ultralight', '200'], ['extrabold', '800'], ['ultrabold', '800'],
  ['semibold', '600'], ['demibold', '600'], ['hairline', '100'], ['regular', '400'],
  ['medium', '500'], ['normal', '400'], ['black', '900'], ['heavy', '900'],
  ['light', '300'], ['thin', '100'], ['bold', '700'], ['book', '400'],
];
const TRAILING = /[-_ ]?(variable|vf|italic|oblique|thin|hairline|extralight|ultralight|light|regular|normal|book|medium|semibold|demibold|bold|extrabold|ultrabold|black|heavy|[1-9]00)$/i;

export function guessFont(name) {
  const base = name.replace(/\.woff2$/i, '');
  const lower = base.toLowerCase();
  const variable = /variable|(^|[-_])vf($|[-_])|\[wght/i.test(base);
  const italic = /italic|oblique/.test(lower);
  let weight = '400';
  const number = lower.match(/(?:^|[-_ ])([1-9]00)(?:italic)?(?:$|[-_ ])/);
  if (number) {
    weight = number[1];
  } else {
    const flat = lower.replace(/[-_ ]/g, '');
    const word = WORDS.find(([w]) => flat.includes(w));
    if (word) weight = word[1];
  }
  // google-webfonts-helper: "open-sans-v44-latin-700" → "open-sans"; then
  // the style words at the end, as often as they come
  let family = base.replace(/-v\d+-.*$/i, '');
  for (let before = ''; before !== family; ) {
    before = family;
    family = family.replace(TRAILING, '');
  }
  family = family.replace(/[-_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  return { family, weight: variable ? '100 900' : weight, style: italic ? 'italic' : 'normal' };
}

export default {
  props: {
    fonts: { type: Object, default: () => ({}) },
    mode: { type: String, default: 'installed' },
    // a Google font being installed: shown as loading in the list
    installing: { type: String, default: '' },
  },
  data() {
    return {
      staged: [],
      family: '',
      category: 'sans-serif',
      over: false,
      busy: false,
      error: '',
      weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
      weightNames: { 100: 'Thin', 200: 'Extra Light', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra Bold', 900: 'Black' },
    };
  },
  computed: {
    // the built-in fonts first, then the project's by name
    families() {
      const items = [];
      for (const [key, font] of Object.entries(this.fonts.builtin || {})) items.push({ key, font });
      const own = Object.entries(this.fonts.project || {}).map(([key, font]) => ({ key, font }));
      own.sort((a, b) => a.font.family.localeCompare(b.font.family));
      return items.concat(own.filter((item) => item.font && item.font.family));
    },
    categoryOptions() {
      return ['sans-serif', 'serif', 'monospace', 'display', 'cursive'].map((c) => ({ value: c, text: this.categoryLabel(c) }));
    },
  },
  methods: {
    categoryLabel(cat) {
      const key = 'prw.fontcategory.' + cat;
      const text = this.$t(key);
      return text && text !== key ? text : cat;
    },
    familyStyle(font) {
      return { fontFamily: "'" + font.family + "', " + (font.category === 'display' ? 'sans-serif' : font.category || 'sans-serif') };
    },
    hasFamily(family) {
      return this.families.some((item) => item.font.family === family);
    },
    // "<b>Variabel</b> · 100–900 · mit Kursiv" or "300 · 400 · 600 · mit Kursiv"
    summary(font) {
      const files = font.files || [];
      const variable = files.find((f) => String(f.weight || '').includes(' '));
      const italic = font.italic || files.some((f) => f.style === 'italic');
      const parts = variable
        ? ['<b>' + this.$t('prw.fonts.variable') + '</b>', this.formatWeight(variable.weight)]
        : [...new Set(files.map((f) => String(f.weight || '400')))].sort((a, b) => a - b);
      if (italic) parts.push(this.$t('prw.fonts.withItalic'));
      return parts.join(' · ');
    },
    sourceLabel(font) {
      if (font.builtin) return this.$t('prw.fonts.source.builtin');
      return this.$t(font.source === 'google' ? 'prw.fonts.source.google' : 'prw.fonts.source.upload');
    },
    formatWeight(w) {
      const parts = String(w || '').split(' ');
      return parts.length === 2 ? parts[0] + '–' + parts[1] : w;
    },
    async deleteFont(key, font) {
      if (!window.confirm(this.$t('prw.fonts.delete.font', { family: font.family }))) return;
      await this.$api.delete('projectwizard/fonts/' + key);
      // the server removed the font's uses – the open settings drop them, too
      this.$emit('update', { removedFamily: font.family });
    },

    // own files
    onSelect(event) {
      this.stage(Array.from(event.target.files));
      event.target.value = '';
    },
    onDrop(event) {
      this.over = false;
      this.stage(Array.from(event.dataTransfer.files));
    },
    stage(files) {
      this.error = '';
      for (const file of files) {
        if (!/\.woff2$/i.test(file.name) || this.staged.some((f) => f.name === file.name)) continue;
        const guess = guessFont(file.name);
        if (!this.family && guess.family) this.family = guess.family;
        this.staged.push({ name: file.name, file, weight: guess.weight, style: guess.style });
      }
    },
    reset() {
      this.staged = [];
      this.family = '';
      this.category = 'sans-serif';
      this.error = '';
    },
    async addFont() {
      if (!this.family.trim() || !this.staged.length) return;
      this.busy = true;
      this.error = '';
      try {
        for (const staged of this.staged) {
          const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(staged.file);
          });
          const result = await this.$api.post('projectwizard/fonts/upload', { name: staged.name, data });
          if (result.error) {
            this.error = staged.name + ': ' + result.error;
            return;
          }
        }
        // a family that exists already gets the files added
        await this.$api.post('projectwizard/fonts', {
          family: this.family.trim(),
          category: this.category,
          italic: false,
          files: this.staged.map((f) => ({ src: f.name, weight: f.weight, style: f.style })),
        });
        const family = this.family.trim();
        this.reset();
        this.$emit('update', { installedFamily: family });
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>

<style>
.pw-font-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-lg);
  color: var(--color-text-dimmed);
  margin-left: auto;
  padding: 0 var(--spacing-1);
}
.pw-font-delete:hover {
  color: var(--color-negative-600, #dc2626);
}
.pw-font-help a {
  text-decoration: underline;
}

/* installed fonts: one row per family */
.pw-font-families {
  background: light-dark(var(--color-white), var(--color-gray-850));
  border-radius: var(--rounded);
  box-shadow: var(--shadow);
}
.pw-font-family {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-height: 3.5rem;
  padding: var(--spacing-2) var(--spacing-4);
}
.pw-font-family + .pw-font-family {
  border-top: 1px solid var(--color-border);
}
.pw-font-family-name {
  flex: 0 0 13rem;
  min-width: 0;
  font-size: 1.2rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pw-font-family-meta {
  flex: 1;
  min-width: 0;
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--color-text-dimmed);
}
.pw-font-family-meta b {
  font-weight: var(--font-semi);
  color: var(--color-text);
}
.pw-font-badge {
  flex: none;
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  padding: 0 var(--spacing-1);
  border-radius: var(--rounded-sm);
  background: light-dark(var(--color-gray-200), var(--color-gray-800));
  white-space: nowrap;
}
.pw-font-family.is-loading .pw-font-family-name {
  opacity: 0.5;
}
.pw-font-loader {
  color: var(--color-text-dimmed);
}
@media (max-width: 40rem) {
  .pw-font-family { flex-wrap: wrap; }
  .pw-font-family-name { flex-basis: 100%; }
}

/* own files: name, category, the files in a table */
.pw-font-upload {
  margin-top: var(--spacing-3);
}
.pw-font-upload-card.is-over {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}
.pw-font-upload-row {
  display: grid;
  grid-template-columns: 10rem 1fr;
  border-bottom: 1px solid var(--color-border);
}
.pw-font-upload-label {
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-3);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  background: light-dark(var(--color-gray-100), var(--color-gray-900));
  border-right: 1px solid var(--color-border);
}
.pw-font-upload-value {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: var(--spacing-2) var(--spacing-3);
}
.pw-font-upload-name {
  width: 100%;
  max-width: 18rem;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  background: transparent;
  font: inherit;
  color: var(--color-text);
}
.pw-font-upload-files {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.pw-font-upload-files th {
  padding: var(--spacing-2) var(--spacing-3) var(--spacing-1);
  text-align: start;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: normal;
  color: var(--color-text-dimmed);
}
.pw-font-upload-files td {
  padding: var(--spacing-2) var(--spacing-3);
  border-top: 1px solid var(--color-border);
  vertical-align: middle;
}
.pw-font-upload-file {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  word-break: break-all;
}
.pw-font-upload-select {
  appearance: auto;
  padding: var(--spacing-1);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded);
  background: transparent;
  font: inherit;
  color: var(--color-text);
}
.pw-font-upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  border-top: 1px solid var(--color-border);
}
</style>
