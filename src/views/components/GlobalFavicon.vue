<template>
  <!-- Project → Favicon: the upload, the preview in the sidebar. Saved right
       away (like a font upload) – files, not settings with a save button -->
  <div class="pw-favicon">
    <section class="pw-card-section">
      <div class="pw-card-heading-row">
        <h3 class="pw-card-heading">{{ $t('prw.tab.favicon') }}</h3>
      </div>
      <!-- the same rows as the fonts: label on the left, the file on the right -->
      <div class="pw-card pw-field-table">
        <section class="pw-element-section">
          <div class="pw-element-list">
            <div
              class="pw-field-row"
              :class="{ 'is-over': over }"
              @dragover.prevent="over = true"
              @dragleave="over = false"
              @drop.prevent="onDrop"
            >
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col">
                    <label class="pw-field-row-label">{{ $t('prw.favicon.svg') }}</label>
                  </div>
                  <div class="pw-field-row-options">
                    <template v-if="data.svg">
                      <img class="pw-favicon-thumb" :src="data.svg.url" alt="" />
                      <span class="pw-font-file-name pw-favicon-file">{{ data.svg.name }}</span>
                      <span class="pw-font-weight-label pw-favicon-size">{{ fileSize(data.svg.size) }}</span>
                    </template>
                    <label class="pw-font-upload-btn" :class="{ 'is-disabled': busy }">
                      <k-icon type="upload" />
                      {{ $t(data.svg ? 'prw.favicon.replace' : 'prw.favicon.upload') }}
                      <input type="file" accept="image/svg+xml,.svg" style="display:none" :disabled="busy" @change="onSelect" />
                    </label>
                    <button v-if="data.svg" type="button" class="pw-font-delete" :title="$t('prw.favicon.remove')" :disabled="busy" @click="remove">×</button>
                  </div>
                </span>
              </div>
            </div>
            <div v-if="error" class="pw-font-help pw-favicon-error">{{ error }}</div>
            <div class="pw-font-help">{{ $t('prw.favicon.intro') }} {{ $t('prw.favicon.svg.help') }}</div>

            <!-- background of the app icons -->
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
            <div class="pw-font-help">{{ $t('prw.favicon.background.help') }}</div>
          </div>
        </section>
      </div>
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

export default {
  data() {
    return {
      data: { png: null, svg: null, background: '#ffffff', urls: null, files: [] },
      error: '',
      over: false,
      busy: false,
    };
  },
  computed: {
    siteTitle() {
      return this.$panel.system?.title || this.$panel.site?.title || '';
    },
    siteUrl() {
      return window.location.origin;
    },
  },
  async created() {
    this.data = await this.$api.get('projectwizard/favicon');
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
        else this.data = result;
      } finally {
        this.busy = false;
      }
    },
    async remove() {
      this.busy = true;
      try {
        this.data = await this.$api.delete('projectwizard/favicon/svg');
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
.pw-favicon .pw-field-row.is-over {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}
.pw-favicon .pw-field-row-options {
  flex-wrap: nowrap;
  min-width: 0;
}
/* (the fonts' file names keep a minimum width – here the name may shrink) */
.pw-favicon-file {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pw-favicon-thumb {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex: none;
}
.pw-favicon-size,
.pw-favicon .pw-font-upload-btn {
  flex: none;
  white-space: nowrap;
}
.pw-favicon .pw-font-upload-btn.is-disabled {
  opacity: 0.5;
  pointer-events: none;
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
