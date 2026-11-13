<template>
  <!-- Project → Favicon: the upload, the preview in the sidebar. Saved right
       away (like a font upload) – files, not settings with a save button -->
  <div class="pw-favicon">
    <!-- the icon, large: you see right away which favicon is set -->
    <section class="pw-card-section">
      <div class="pw-card-heading-row">
        <h3 class="pw-card-heading">{{ $t('prw.tab.favicon') }}</h3>
        <!-- SVG by default; PNG for customers who have no SVG -->
        <k-toggles-input
          :value="format"
          :options="[{ value: 'svg', text: 'SVG' }, { value: 'png', text: 'PNG' }]"
          :grow="false"
          :required="true"
          @input="format = $event; error = ''"
        />
      </div>
      <div
        class="pw-card pw-favicon-card"
        :class="{ 'is-over': over, 'is-empty': !current }"
        @dragover.prevent="over = true"
        @dragleave="over = false"
        @drop.prevent="onDrop"
      >
        <template v-if="current">
          <span class="pw-favicon-big"><img :src="current.url" alt="" /></span>
          <div class="pw-favicon-info">
            <div class="pw-favicon-name">{{ current.name }}</div>
            <div class="pw-favicon-size">{{ currentMeta }}</div>
            <div class="pw-favicon-buttons">
              <k-button :text="$t('prw.favicon.replace')" variant="filled" size="sm" :disabled="busy" @click="$refs.input.click()" />
              <k-button :text="$t('prw.favicon.remove')" variant="filled" size="sm" :disabled="busy" @click="remove" />
            </div>
          </div>
        </template>
        <template v-else>
          <k-icon type="upload" class="pw-favicon-drop-icon" />
          <strong class="pw-favicon-drop-title">{{ $t(format === 'png' ? 'prw.favicon.dropPng' : 'prw.favicon.dropSvg') }}</strong>
          <span class="pw-favicon-drop-text">{{ format === 'png' ? $t('prw.favicon.png.help') + ' ' + $t('prw.favicon.svg.help') : $t('prw.favicon.svg.help') }}</span>
          <k-button :text="$t(format === 'png' ? 'prw.favicon.uploadPng' : 'prw.favicon.upload')" variant="filled" size="sm" :disabled="busy" @click="$refs.input.click()" />
        </template>
        <input ref="input" type="file" :accept="format === 'png' ? 'image/png,.png' : 'image/svg+xml,.svg'" hidden @change="onSelect" />
      </div>
      <p v-if="error" class="pw-favicon-note pw-favicon-error">{{ error }}</p>
      <p class="pw-favicon-note">{{ $t('prw.favicon.intro') }}<template v-if="current"> {{ $t('prw.favicon.svg.help') }}</template><template v-if="format === 'png'"> {{ $t('prw.favicon.png.hint') }}</template></p>
    </section>

    <!-- background of the app icons: one row, like the colours under Site -->
    <section class="pw-card-section">
      <div class="pw-card-heading-row">
        <h3 class="pw-card-heading">{{ $t('prw.favicon.appIcons') }}</h3>
      </div>
      <div class="pw-card pw-field-table">
        <section class="pw-element-section">
          <div class="pw-element-list">
            <div class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ $t('prw.favicon.background') }}</label>
                  </div>
                  <div class="pw-field-row-options">
                    <pw-color-field-row
                      group="favicon"
                      var-name="background"
                      default-value="#ffffff"
                      :override-value="data.background === '#ffffff' ? '' : data.background"
                      @update:value="setBackground"
                    />
                  </div>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
      <p class="pw-favicon-note">{{ $t('prw.favicon.background.help') }}</p>
    </section>

    <!-- the preview in the wizard's sidebar on the right, like the fonts -->
    <pw-portal to=".pw-wizard .pw-preview-column">
      <div class="pw-favicon-preview">
        <p v-if="!data.urls" class="pw-font-help">{{ $t('prw.favicon.preview.empty') }}</p>
        <template v-else>
          <div class="pw-favicon-group">
            <h4>{{ $t('prw.favicon.preview.tab') }}</h4>
            <div class="pw-favicon-tabs">
              <div v-for="theme in ['light', 'dark']" :key="theme" class="pw-favicon-browser" :data-theme="theme">
                <span class="pw-favicon-browser-tab"><img :src="data.urls.tab" alt="" />{{ siteTitle }}</span>
              </div>
            </div>
          </div>
          <div class="pw-favicon-group">
            <h4>{{ $t('prw.favicon.preview.home') }}</h4>
            <div class="pw-favicon-home">
              <span class="pw-favicon-app"><img :src="data.urls.apple" alt="" />iPhone</span>
              <span class="pw-favicon-app is-round"><img :src="data.urls.icon" alt="" />Android</span>
            </div>
          </div>
          <div class="pw-favicon-group">
            <h4>{{ $t('prw.favicon.preview.search') }}</h4>
            <div class="pw-favicon-serp">
              <span class="pw-favicon-serp-icon"><img :src="data.urls.tab" alt="" /></span>
              <span>{{ siteTitle }}<small>{{ siteUrl }}</small></span>
            </div>
          </div>
          <div class="pw-favicon-group">
            <h4>{{ $t('prw.favicon.preview.files') }}</h4>
            <code class="pw-favicon-files">{{ data.files.join(' · ') }}</code>
          </div>
        </template>
      </div>
    </pw-portal>
  </div>
</template>

<script>
/** The SVG drawn into a square PNG (contained, centred, transparent) – base64 without the data: prefix */
async function svgToPng(text, size = 512) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg') throw new Error('no svg');
  // the proportions from the viewBox, otherwise from width/height
  const box = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
  let width = box.length === 4 ? box[2] : parseFloat(svg.getAttribute('width'));
  let height = box.length === 4 ? box[3] : parseFloat(svg.getAttribute('height'));
  if (!(width > 0 && height > 0)) width = height = size;
  const scale = size / Math.max(width, height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    canvas.getContext('2d').drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL('image/png').split(',')[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** A file as base64 without the data: prefix */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default {
  data() {
    return {
      data: { png: null, svg: null, background: '#ffffff', urls: null, files: [] },
      error: '',
      over: false,
      busy: false,
      format: 'svg',
    };
  },
  computed: {
    /** The uploaded file of the chosen format – the PNG counts only without an SVG (otherwise it's made from it) */
    current() {
      if (this.format === 'svg') return this.data.svg;
      return this.data.svg ? null : this.data.png;
    },
    currentMeta() {
      const file = this.current;
      return this.format === 'png'
        ? `PNG · ${file.width} × ${file.height} · ${this.fileSize(file.size)}`
        : `SVG · ${this.fileSize(file.size)}`;
    },
    siteTitle() {
      return this.$panel.system?.title || this.$panel.site?.title || '';
    },
    siteUrl() {
      return window.location.origin;
    },
  },
  async created() {
    this.data = await this.$api.get('projectwizard/favicon');
    if (this.data.png && !this.data.svg) this.format = 'png';
    // an SVG without its PNG (uploaded before the PNG was made from it): make it now
    if (this.data.svg && !this.data.png) {
      const response = await fetch(this.data.svg.url);
      if (response.ok) await this.upload(new File([await response.text()], this.data.svg.name, { type: 'image/svg+xml' }));
    }
  },
  methods: {
    fileSize(bytes) {
      return bytes >= 1024 ? Math.round(bytes / 1024) + ' KB' : bytes + ' B';
    },
    onSelect(event) {
      const file = event.target.files[0];
      event.target.value = '';
      if (file) this.upload(file);
    },
    onDrop(event) {
      this.over = false;
      const file = event.dataTransfer.files[0];
      if (file) this.upload(file);
    },
    async upload(file) {
      this.error = '';
      this.busy = true;
      try {
        // the file decides: a PNG dropped onto the SVG switch is fine too
        if (file.type === 'image/png' || /\.png$/i.test(file.name)) {
          const result = await this.$api.post('projectwizard/favicon/upload', {
            kind: 'png',
            name: file.name,
            data: await fileToBase64(file),
          });
          if (result.error) this.error = result.error;
          else { this.data = result; this.format = 'png'; }
          return;
        }
        const text = await file.text();
        let png;
        try {
          png = await svgToPng(text);
        } catch (e) {
          this.error = this.$t('prw.favicon.error.render');
          return;
        }
        const result = await this.$api.post('projectwizard/favicon/upload', {
          kind: 'svg',
          name: file.name,
          data: btoa(unescape(encodeURIComponent(text))),
          png,
        });
        if (result.error) this.error = result.error;
        else { this.data = result; this.format = 'svg'; }
      } finally {
        this.busy = false;
      }
    },
    async remove() {
      this.busy = true;
      try {
        this.data = await this.$api.delete('projectwizard/favicon/' + this.format);
      } finally {
        this.busy = false;
      }
    },
    async setBackground(value) {
      this.data = await this.$api.post('projectwizard/favicon', { background: value || '#ffffff' });
    },
  },
};
</script>

<style>
.pw-favicon-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-6);
  padding: var(--spacing-6);
}
.pw-favicon-card.is-over {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}
/* nothing set: the card itself is the drop area */
.pw-favicon-card.is-empty {
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-8) var(--spacing-6);
  text-align: center;
  border: 1px dashed var(--color-border);
  box-shadow: none;
}
.pw-favicon-drop-icon {
  color: var(--color-text-dimmed);
}
.pw-favicon-drop-title {
  font-weight: var(--font-semi);
}
.pw-favicon-drop-text {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  margin-bottom: var(--spacing-2);
}
.pw-favicon-big {
  width: 88px;
  height: 88px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: var(--rounded-lg);
  border: 1px solid var(--color-border);
  background: repeating-conic-gradient(light-dark(#eee, #333) 0 25%, transparent 0 50%) 0 0 / 12px 12px;
}
.pw-favicon-big img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
.pw-favicon-info {
  flex: 1;
  min-width: 0;
}
.pw-favicon-name {
  font-weight: var(--font-semi);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pw-favicon-size {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  margin: var(--spacing-1) 0 var(--spacing-3);
}
.pw-favicon-buttons {
  display: flex;
  gap: var(--spacing-2);
}
/* help below a card, like Kirby's field help */
.pw-favicon-note {
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--color-text-dimmed);
  padding: var(--spacing-2) var(--spacing-1) 0;
}
.pw-favicon-error {
  color: var(--color-negative);
}

/* preview (in the sidebar), on white like the configuration's tree – not
   on the page background of the site */
.pw-wizard .pw-preview-column:has(> .pw-portal > .pw-favicon-preview) {
  background: light-dark(var(--color-white), var(--color-gray-900));
}
.pw-favicon-group + .pw-favicon-group {
  margin-top: var(--spacing-6);
}
.pw-favicon-group h4 {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-dimmed);
  margin-bottom: var(--spacing-2);
}
.pw-favicon-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}
.pw-favicon-browser {
  padding: 8px 8px 0;
  border-radius: 8px;
  background: #dfe1e5;
  min-width: 0;
}
.pw-favicon-browser[data-theme="dark"] {
  background: #202124;
}
.pw-favicon-browser-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px 8px 0 0;
  font-size: 12px;
  background: #fff;
  color: #202124;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pw-favicon-browser[data-theme="dark"] .pw-favicon-browser-tab {
  background: #35363a;
  color: #e8eaed;
}
.pw-favicon-browser-tab img {
  width: 16px;
  height: 16px;
  flex: none;
}
.pw-favicon-home {
  display: flex;
  gap: 18px;
  padding: 14px 18px;
  border-radius: 12px;
  background: linear-gradient(160deg, #6a7fd6, #b06ab3);
}
.pw-favicon-app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #fff;
}
.pw-favicon-app img {
  width: 58px;
  height: 58px;
  border-radius: 13px;
}
.pw-favicon-app.is-round img {
  border-radius: 50%;
}
.pw-favicon-serp {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 12px;
}
.pw-favicon-serp small {
  display: block;
  color: var(--color-text-dimmed);
}
.pw-favicon-serp-icon {
  width: 26px;
  height: 26px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #f1f3f4;
}
.pw-favicon-serp-icon img {
  width: 16px;
  height: 16px;
}
.pw-favicon-files {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
}
</style>
