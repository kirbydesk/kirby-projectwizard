<template>
  <!-- Project → Favicon: the upload, the preview in the sidebar. Saved right
       away (like a font upload) – files, not settings with a save button -->
  <div class="pw-favicon">
    <section class="pw-card-section">
      <div class="pw-card-heading-row">
        <h3 class="pw-card-heading">{{ $t('prw.tab.favicon') }}</h3>
      </div>
      <div class="pw-card pw-favicon-card">
        <p class="pw-favicon-help">{{ $t('prw.favicon.intro') }}</p>

        <!-- the PNG, then the optional SVG -->
        <div v-for="kind in ['png', 'svg']" :key="kind" class="pw-favicon-field">
          <div class="pw-favicon-label">
            {{ $t('prw.favicon.' + kind) }}
            <small>{{ $t('prw.favicon.' + kind + '.help') }}</small>
          </div>
          <div
            class="pw-favicon-drop"
            :class="{ 'is-over': over === kind }"
            @dragover.prevent="over = kind"
            @dragleave="over = null"
            @drop.prevent="onDrop(kind, $event)"
          >
            <span class="pw-favicon-thumb">
              <img v-if="data[kind]" :src="data[kind].url" alt="" />
              <k-icon v-else type="add" />
            </span>
            <span class="pw-favicon-meta">
              <template v-if="data[kind]">
                {{ data[kind].name }}
                <small>{{ kind === 'png' ? data.png.width + ' × ' + data.png.height + ' · ' : '' }}{{ fileSize(data[kind].size) }}</small>
              </template>
              <template v-else>{{ $t(kind === 'png' ? 'prw.favicon.drop' : 'prw.favicon.dropSvg') }}</template>
            </span>
            <k-button
              :text="$t(data[kind] ? 'prw.favicon.replace' : 'prw.favicon.choose')"
              variant="filled"
              size="sm"
              :disabled="busy"
              @click="$refs['input-' + kind][0].click()"
            />
            <k-button
              v-if="data[kind]"
              :text="$t('prw.favicon.remove')"
              variant="filled"
              size="sm"
              :disabled="busy"
              @click="remove(kind)"
            />
            <input
              :ref="'input-' + kind"
              type="file"
              :accept="kind === 'png' ? 'image/png' : 'image/svg+xml,.svg'"
              hidden
              @change="onSelect(kind, $event)"
            />
          </div>
          <p v-if="errors[kind]" class="pw-favicon-error">{{ errors[kind] }}</p>
        </div>

        <!-- background of the app icons -->
        <div class="pw-favicon-field">
          <div class="pw-favicon-label">
            {{ $t('prw.favicon.background') }}
            <small>{{ $t('prw.favicon.background.help') }}</small>
          </div>
          <pw-color-field-row
            group="favicon"
            var-name="background"
            default-value="#ffffff"
            :override-value="data.background === '#ffffff' ? '' : data.background"
            @update:value="setBackground"
          />
        </div>
      </div>
    </section>

    <!-- the preview in the wizard's sidebar on the right, like the fonts -->
    <pw-portal to=".pw-wizard .pw-preview-column">
      <div class="pw-favicon-preview">
        <p v-if="!data.urls" class="pw-favicon-help">{{ $t('prw.favicon.preview.empty') }}</p>
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
export default {
  data() {
    return {
      data: { png: null, svg: null, background: '#ffffff', urls: null, files: [] },
      errors: { png: '', svg: '' },
      over: null,
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
  },
  methods: {
    fileSize(bytes) {
      return bytes >= 1024 ? Math.round(bytes / 1024) + ' KB' : bytes + ' B';
    },
    onSelect(kind, event) {
      const file = event.target.files[0];
      event.target.value = '';
      if (file) this.upload(kind, file);
    },
    onDrop(kind, event) {
      this.over = null;
      const file = event.dataTransfer.files[0];
      if (file) this.upload(kind, file);
    },
    async upload(kind, file) {
      this.errors[kind] = '';
      this.busy = true;
      try {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });
        const result = await this.$api.post('projectwizard/favicon/upload', { kind, name: file.name, data: base64 });
        if (result.error) this.errors[kind] = result.error;
        else this.data = result;
      } finally {
        this.busy = false;
      }
    },
    async remove(kind) {
      this.busy = true;
      try {
        this.data = await this.$api.delete('projectwizard/favicon/' + kind);
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
  padding: var(--spacing-6);
}
.pw-favicon-help {
  font-size: var(--text-sm);
  color: var(--color-text-dimmed);
  margin-bottom: var(--spacing-6);
}
.pw-favicon-field + .pw-favicon-field {
  margin-top: var(--spacing-6);
}
.pw-favicon-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semi);
  margin-bottom: var(--spacing-2);
}
.pw-favicon-label small {
  font-weight: var(--font-normal);
  color: var(--color-text-dimmed);
  margin-left: var(--spacing-2);
}
.pw-favicon-drop {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--rounded);
  background: light-dark(var(--color-gray-100), var(--color-gray-850));
}
.pw-favicon-drop.is-over {
  border-color: var(--color-focus);
}
.pw-favicon-thumb {
  width: 3.5rem;
  height: 3.5rem;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: var(--rounded);
  border: 1px solid var(--color-border);
  color: var(--color-text-dimmed);
  background: repeating-conic-gradient(light-dark(#eee, #333) 0 25%, transparent 0 50%) 0 0 / 12px 12px;
}
.pw-favicon-thumb img {
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
}
.pw-favicon-meta {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  overflow-wrap: anywhere;
}
.pw-favicon-meta small {
  display: block;
  color: var(--color-text-dimmed);
}
.pw-favicon-error {
  margin-top: var(--spacing-2);
  font-size: var(--text-sm);
  color: var(--color-negative);
}

/* preview (in the sidebar) */
.pw-favicon-preview .pw-favicon-help {
  margin-bottom: 0;
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
