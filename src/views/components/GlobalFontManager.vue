<template>
  <div class="pw-font-manager">
    <!-- Installed Fonts -->
    <section class="pw-element-section">
      <div class="pw-section-header pw-font-header">
        <span class="pw-section-title">{{ $t('prw.fonts.installed') || 'Installed Fonts' }}</span>
        <k-button
          :text="showAddForm ? 'Cancel' : ($t('prw.fonts.add') || 'Add Font')"
          :icon="showAddForm ? 'cancel' : 'add'"
          size="xs"
          @click="showAddForm = !showAddForm; if (!showAddForm) resetAddForm()"
        />
      </div>
      <div class="pw-element-list">
          <template v-for="(font, key) in allFonts">
            <div
              v-for="(file, fIdx) in font.files"
              :key="key + '-' + fIdx"
              class="pw-field-row"
              :class="{ 'pw-dual-first': fIdx === 0 && font.files.length > 1, 'pw-dual-next': fIdx > 0 }"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label
                      class="pw-field-row-label pw-font-label-clickable"
                      :class="{ 'is-default': font.family === defaultFont }"
                      @click="setDefaultFont(font.family)"
                    >{{ font.family }}</label>
                    <span class="pw-quad-label">{{ categoryLabel(font.category) }}</span>
                  </div>
                  <div class="pw-field-row-options">
                    <span class="pw-font-file-name">{{ file.src }} <span class="pw-font-weight-label">{{ font.italic ? 'normal, italic' : file.style }}, {{ formatWeight(file.weight) }}</span></span>
                    <span v-if="font.family === defaultFont" class="pw-font-default-badge">Default</span>
                    <button v-if="!font.builtin && font.family !== defaultFont && fIdx === 0" type="button" class="pw-font-delete" @click="deleteFont(key)">×</button>
                  </div>
                </span>
              </div>
            </div>
          </template>
        </div>
    </section>

    <!-- Add Font Form -->
    <section v-if="showAddForm" class="pw-element-section">
        <div class="pw-section-header">
          <span class="pw-section-toggle"><span>{{ $t('prw.fonts.add') || 'Add Font' }}</span></span>
        </div>
        <div class="pw-element-list">
          <!-- Upload Font File -->
          <div class="pw-field-row">
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label">Font File *</label>
                </div>
                <div class="pw-field-row-options">
                  <label class="pw-font-upload-btn">
                    <k-icon type="upload" />
                    Upload .woff2
                    <input type="file" accept=".woff2" @change="onFileSelect" style="display:none" />
                  </label>
                  <span v-if="newFont.files.length" class="pw-font-file-selected">{{ newFont.files[0].name }}</span>
                </div>
              </span>
            </div>
          </div>
          <div class="pw-font-help">
            Upload a .woff2 font file. You can use <a href="https://gwfh.mranftl.com/" target="_blank" rel="noopener">Google Webfonts Helper</a> to download Google Fonts as .woff2.
          </div>

            <!-- Family Name -->
            <div class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">Font Family Name *</label>
                  </div>
                  <div class="pw-field-row-options">
                    <input type="text" class="pw-element-input pw-font-name-input" v-model="newFont.family" placeholder="e.g. Acme, Roboto" />
                  </div>
                </span>
              </div>
            </div>
            <div class="pw-font-help">
              {{ $t('prw.fonts.nameHelp') || 'Enter the exact font family name as specified by the font provider (e.g. "Roboto", "Open Sans", "Playfair Display").' }}
            </div>

            <!-- Category -->
            <div class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">Category *</label>
                  </div>
                  <div class="pw-field-row-options">
                    <k-toggles-input
                      :value="newFont.category"
                      :options="categoryOptions"
                      :grow="false"
                      :required="true"
                      @input="newFont.category = $event"
                    />
                  </div>
                </span>
              </div>
            </div>
            <div class="pw-font-help">
              {{ $t('prw.fonts.categoryHelp') || 'Select the font category. This is used as CSS fallback (e.g. sans-serif, serif) when the font is not yet loaded.' }}
            </div>

            <!-- Supports Italic + Choose Style -->
            <div class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">Supports Italic Automatically *</label>
                  </div>
                  <div class="pw-field-row-options">
                    <k-toggles-input
                      :value="newFont.italic === null ? '' : (newFont.italic ? 'yes' : 'no')"
                      :options="[{ value: 'yes', text: 'Yes' }, { value: 'no', text: 'No' }]"
                      :grow="false"
                      :required="true"
                      @input="newFont.italic = $event === 'yes'"
                    />
                    <template v-if="newFont.italic === false">
                      <span class="pw-font-inline-label">Choose Style</span>
                      <k-toggles-input
                        :value="newFont.style"
                        :options="[{ value: 'normal', text: 'Normal' }, { value: 'italic', text: 'Italic' }]"
                        :grow="false"
                        :required="true"
                        @input="newFont.style = $event"
                      />
                    </template>
                  </div>
                </span>
              </div>
            </div>
            <div class="pw-font-help">
              {{ $t('prw.fonts.italicHelp') || 'Enable if the font includes italic styles. Some variable fonts include italic in a separate file, others have it built-in.' }}
            </div>

            <!-- Weight (multi-select) -->
            <div class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">Weight *</label>
                  </div>
                  <div class="pw-field-row-options">
                    <div class="pw-weight-toggles">
                      <button
                        v-for="w in ['100','200','300','400','500','600','700','800','900']"
                        :key="w"
                        type="button"
                        class="pw-weight-toggle"
                        :class="{ 'is-active': newFont.weights.includes(w), 'is-in-range': isInWeightRange(w) }"
                        @click="toggleWeight(w)"
                      >{{ w }}</button>
                    </div>
                  </div>
                </span>
              </div>
            </div>
            <div class="pw-font-help">
              {{ $t('prw.fonts.weightHelp') || 'Select one weight for static fonts, or multiple for variable fonts (e.g. 100–900).' }}
            </div>

            <!-- Default Weight (only for range) -->
            <div v-if="newFont.weights.length >= 2" class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">Default Weight *</label>
                  </div>
                  <div class="pw-field-row-options">
                    <k-toggles-input
                      :value="newFont.defaultWeight"
                      :options="rangeWeightOptions"
                      :grow="false"
                      :required="true"
                      @input="newFont.defaultWeight = $event"
                    />
                  </div>
                </span>
              </div>
            </div>
            <div v-if="newFont.weights.length >= 2" class="pw-font-help">
              {{ $t('prw.fonts.defaultWeightHelp') || 'Choose the default weight used for body text. Other weights are available for headings, buttons, etc.' }}
            </div>

            <!-- Add button -->
            <div class="pw-font-actions">
              <k-button
                :disabled="!canAddFont"
                text="Add Font"
                icon="check"
                theme="positive"
                variant="filled"
                size="sm"
                @click="addFont"
              />
            </div>
        </div>
    </section>
  </div>
</template>

<script>
export default {
  props: {
    fonts: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      showAddForm: false,
      newFont: {
        family: '',
        category: '',
        italic: null,
        style: 'normal',
        weights: [],
        defaultWeight: '',
        files: [],
      },
      pendingFiles: [],
    };
  },
  computed: {
    allFonts() {
      return { ...(this.fonts.builtin || {}), ...(this.fonts.project || {}) };
    },
    defaultFont() {
      return this.fonts.default || 'Inter';
    },
    categoryOptions() {
      return ['sans-serif', 'serif', 'monospace', 'display', 'cursive'].map(c => ({
        value: c,
        text: this.categoryLabel(c),
      }));
    },
    fontFamilyOptions() {
      return Object.values(this.allFonts).map(f => ({
        value: f.family,
        text: f.family,
      }));
    },
    canAddFont() {
      const hasWeight = this.newFont.weights.length > 0;
      const hasDefaultWeight = this.newFont.weights.length < 2 || this.newFont.defaultWeight;
      return this.newFont.family.trim() && this.newFont.category && this.newFont.italic !== null && hasWeight && hasDefaultWeight && this.newFont.files.length > 0;
    },
    rangeWeightOptions() {
      if (this.newFont.weights.length < 2) return [];
      const sorted = [...this.newFont.weights].map(Number).sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const all = [100, 200, 300, 400, 500, 600, 700, 800, 900];
      return all.filter(w => w >= min && w <= max).map(w => ({ value: String(w), text: String(w) }));
    },
    computedWeight() {
      if (this.newFont.weights.length === 0) return '';
      const sorted = [...this.newFont.weights].sort((a, b) => Number(a) - Number(b));
      if (sorted.length === 1) return sorted[0];
      return sorted[0] + ' ' + sorted[sorted.length - 1];
    },
  },
  methods: {
    resetAddForm() {
      this.newFont = { family: '', category: '', italic: null, style: 'normal', weights: [], defaultWeight: '', files: [] };
    },
    categoryLabel(cat) {
      const tKey = 'prw.fontcategory.' + cat;
      const t = this.$t(tKey);
      return (t && t !== tKey) ? t : cat;
    },
    formatWeight(w) {
      if (!w) return '';
      const parts = w.split(' ');
      return parts.length === 2 ? parts[0] + '–' + parts[1] : w;
    },
    isInWeightRange(w) {
      if (this.newFont.weights.length < 2) return false;
      const nums = this.newFont.weights.map(Number);
      const n = Number(w);
      return n > Math.min(...nums) && n < Math.max(...nums) && !this.newFont.weights.includes(w);
    },
    toggleWeight(w) {
      if (this.newFont.weights.length === 1 && this.newFont.weights[0] === w) {
        this.newFont.weights = [];
        this.newFont.defaultWeight = '';
      } else if (this.newFont.weights.length >= 2) {
        this.newFont.weights = [w];
        this.newFont.defaultWeight = '';
      } else {
        this.newFont.weights.push(w);
      }
    },
    onFileSelect(e) {
      const files = Array.from(e.target.files);
      for (const file of files) {
        if (!file.name.endsWith('.woff2')) continue;
        this.newFont.files.push({
          name: file.name,
          file: file,
          style: 'normal',
        });
        this.pendingFiles.push(file);
      }
      e.target.value = '';
    },
    async addFont() {
      if (!this.canAddFont) return;

      // Upload file via base64 through the API
      for (const staged of this.newFont.files) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(staged.file);
        });
        await this.$api.post('projectwizard/fonts/upload', {
          name: staged.name,
          data: base64,
        });
      }

      // Add font config
      const fontData = {
        family: this.newFont.family.trim(),
        category: this.newFont.category,
        italic: this.newFont.italic,
        files: this.newFont.files.map(f => ({
          src: f.name,
          weight: this.computedWeight,
          style: this.newFont.italic ? 'normal' : this.newFont.style,
        })),
      };
      if (this.newFont.weights.length >= 2 && this.newFont.defaultWeight) {
        fontData.defaultWeight = this.newFont.defaultWeight;
      }
      await this.$api.post('projectwizard/fonts', fontData);

      // Reset form and close
      this.resetAddForm();
      this.pendingFiles = [];
      this.showAddForm = false;

      this.$emit('update');
    },
    async deleteFont(key) {
      const font = this.allFonts[key];
      const name = font ? font.family : key;
      if (!window.confirm('Delete font "' + name + '"?')) return;
      await this.$api.delete('projectwizard/fonts/' + key);
      this.$emit('update');
    },
    async setDefaultFont(family) {
      await this.$api.post('projectwizard/fonts/default', { family });
      this.$emit('update');
    },
  },
};
</script>

<style>
.pw-font-card {
  background: var(--color-white);
  border-radius: var(--rounded);
  padding: var(--spacing-3);
  margin-bottom: var(--spacing-2);
  box-shadow: var(--shadow);
}

.pw-font-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.pw-font-card-name {
  font-weight: 600;
  font-size: var(--text-sm);
}

.pw-font-card-meta {
  display: flex;
  gap: var(--spacing-1);
}

.pw-font-card-files {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.pw-font-file {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  font-family: var(--font-mono);
}

.pw-font-file-name {
  min-width: 200px;
}

.pw-font-file-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.pw-font-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pw-font-label-clickable {
  cursor: pointer;
  font-weight: 600;
}

.pw-font-label-clickable:hover {
  color: var(--color-blue-600);
}

.pw-font-default-badge {
  margin-left: auto;
  background: var(--color-blue-600);
  color: var(--color-white);
  font-size: var(--text-sm);
  padding: 0 var(--spacing-2);
  height: 22px;
  display: inline-flex;
  align-items: center;
  border-radius: 5px;
}

.pw-font-category-label {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  margin-left: var(--spacing-2);
}

.pw-font-weight-label {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-text-dimmed);
  margin-left: var(--spacing-2);
}

.pw-font-name-input {
  width: 450px;
}

.pw-font-inline-label {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  margin-left: var(--spacing-4);
}

.pw-font-file-selected {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
}

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

.pw-font-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-gray-100);
  border: 1px dashed var(--color-border);
  border-radius: var(--rounded);
  font-size: var(--text-sm);
  cursor: pointer;
}

.pw-font-upload-btn:hover {
  background: var(--color-gray-200);
}

.pw-font-help a {
  color: var(--color-blue-600);
  text-decoration: underline;
}

.pw-font-help {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  padding: var(--spacing-1) var(--spacing-3);
  margin-bottom: var(--spacing-3);
}

.pw-weight-toggles {
  display: flex;
  gap: 0;
}

.pw-weight-toggle {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  cursor: pointer;
  margin-left: -1px;
}

.pw-weight-toggle:first-child {
  border-radius: var(--rounded) 0 0 var(--rounded);
  margin-left: 0;
}

.pw-weight-toggle:last-child {
  border-radius: 0 var(--rounded) var(--rounded) 0;
}

.pw-weight-toggle.is-active {
  background: var(--color-blue-600);
  color: var(--color-white);
  border-color: var(--color-blue-600);
  z-index: 1;
  position: relative;
}

.pw-weight-toggle.is-in-range {
  background: var(--color-blue-600);
  color: var(--color-white);
  border-color: var(--color-blue-600);
}

.pw-font-actions {
  padding: var(--spacing-3);
}
</style>
