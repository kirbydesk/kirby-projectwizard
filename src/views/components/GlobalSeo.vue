<template>
  <!-- Project → Search engines: how pages appear in Google and when shared
       (pagewizard's pwMeta); saved right away. A page can differ under
       "Properties". -->
  <div class="pw-seo">
    <p class="pw-block-view-intro">{{ $t('prw.seo.intro') }}</p>

    <!-- the title: the website's name, the order, the separator, the home page -->
    <section class="pw-card-section">
      <div class="pw-card-heading-row">
        <h3 class="pw-card-heading">{{ $t('prw.seo.title') }}</h3>
      </div>
      <div class="pw-card pw-field-table">
        <div class="pw-element-list">
          <div class="pw-field-row">
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col"><label class="pw-field-row-label" for="pw-seo-site">{{ $t('prw.seo.site') }}</label></div>
                <div class="pw-field-row-options">
                  <input id="pw-seo-site" v-model="site" type="text" class="pw-element-input pw-seo-site" :placeholder="data.siteTitle" @change="save({ site: site.trim() })" />
                </div>
              </span>
            </div>
          </div>
          <div v-for="row in toggleRows" :key="row.key" class="pw-field-row">
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col"><label class="pw-field-row-label">{{ row.label }}</label></div>
                <div class="pw-field-row-options">
                  <k-toggles-input :value="settings[row.key]" :options="row.options" :grow="false" :required="true" @input="save({ [row.key]: $event })" />
                </div>
              </span>
            </div>
          </div>
        </div>
      </div>
      <p class="pw-favicon-note">{{ $t('prw.seo.title.help') }}</p>
    </section>

    <!-- the description without its own -->
    <section class="pw-card-section">
      <div class="pw-card-heading-row">
        <h3 class="pw-card-heading">{{ $t('prw.seo.description') }}</h3>
      </div>
      <div class="pw-card pw-field-table">
        <div class="pw-element-list">
          <div class="pw-field-row">
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col"><label class="pw-field-row-label">{{ $t('prw.seo.description.fallback') }}</label></div>
                <div class="pw-field-row-options">
                  <k-toggles-input
                    :value="settings.description"
                    :options="[{ value: 'text', text: $t('prw.seo.description.text') }, { value: 'none', text: $t('prw.seo.description.none') }]"
                    :grow="false"
                    :required="true"
                    @input="save({ description: $event })"
                  />
                </div>
              </span>
            </div>
          </div>
        </div>
      </div>
      <p class="pw-favicon-note">{{ $t('prw.seo.description.help') }}</p>
    </section>

    <!-- the image for sharing -->
    <section class="pw-card-section">
      <div class="pw-card-heading-row">
        <h3 class="pw-card-heading">{{ $t('prw.seo.share') }}</h3>
      </div>
      <div
        class="pw-card pw-favicon-card"
        :class="{ 'is-over': over, 'is-empty': !data.image }"
        @dragover.prevent="over = true"
        @dragleave="over = false"
        @drop.prevent="onDrop"
      >
        <template v-if="data.image">
          <span class="pw-seo-thumb"><img :src="data.image.url" alt="" /></span>
          <div class="pw-favicon-info">
            <div class="pw-favicon-name">{{ data.image.name }}</div>
            <div class="pw-favicon-size">1200 × 630 · {{ fileSize(data.image.size) }}</div>
            <div class="pw-favicon-buttons">
              <k-button :text="$t('prw.favicon.replace')" variant="filled" size="sm" :disabled="busy" @click="$refs.input.click()" />
              <k-button :text="$t('prw.favicon.remove')" variant="filled" size="sm" :disabled="busy" @click="removeImage" />
            </div>
          </div>
        </template>
        <template v-else>
          <k-icon type="upload" class="pw-favicon-drop-icon" />
          <strong class="pw-favicon-drop-title">{{ $t('prw.seo.share.drop') }}</strong>
          <span class="pw-favicon-drop-text">{{ $t('prw.seo.share.size') }}</span>
          <k-button :text="$t('prw.seo.share.upload')" variant="filled" size="sm" :disabled="busy" @click="$refs.input.click()" />
        </template>
        <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onSelect" />
      </div>
      <p v-if="error" class="pw-favicon-note pw-favicon-error">{{ error }}</p>
      <p class="pw-favicon-note">{{ $t('prw.seo.share.help') }}</p>
    </section>

    <!-- the preview in the wizard's sidebar: in Google and when shared -->
    <pw-portal to=".pw-wizard .pw-preview-column">
      <div class="pw-favicon-preview pw-seo-preview">
        <div v-if="data.examples.length > 1" class="pw-seo-examples">
          <k-toggles-input
            :value="String(example)"
            :options="data.examples.map((e, i) => ({ value: String(i), text: $t(e.isHome ? 'prw.seo.preview.home' : 'prw.seo.preview.subpage') }))"
            :grow="false"
            :required="true"
            @input="example = Number($event)"
          />
        </div>
        <div v-if="current" class="pw-favicon-group">
          <h4>{{ $t('prw.seo.preview.google') }}</h4>
          <div class="pw-seo-serp">
            <div class="pw-seo-serp-site">
              <span class="pw-favicon-serp-icon"><img v-if="favicon" :src="favicon" alt="" /></span>
              <span>{{ siteName }}<small>{{ current.url }}</small></span>
            </div>
            <div class="pw-seo-serp-title">{{ shortTitle }}</div>
            <div class="pw-seo-serp-text">{{ description || $t('prw.seo.preview.noDescription') }}</div>
          </div>
        </div>
        <div v-if="current" class="pw-favicon-group">
          <h4>{{ $t('prw.seo.preview.share') }}</h4>
          <div class="pw-seo-share">
            <div class="pw-seo-share-image"><img v-if="data.image" :src="data.image.url" alt="" /></div>
            <div class="pw-seo-share-text">
              <small>{{ current.url.split('/')[0] }}</small>
              <strong>{{ title }}</strong>
              <span v-if="description">{{ description }}</span>
            </div>
          </div>
        </div>
      </div>
    </pw-portal>
  </div>
</template>

<script>
const LIMIT = 155;

export default {
  data() {
    return {
      data: { settings: {}, siteTitle: '', image: null, examples: [] },
      site: '',
      example: 0,
      over: false,
      busy: false,
      error: '',
      favicon: '',
    };
  },
  computed: {
    settings() {
      return this.data.settings;
    },
    siteName() {
      return (this.settings.site || '').trim() || this.data.siteTitle;
    },
    toggleRows() {
      const sep = this.settings.separator || '–';
      return [
        {
          key: 'order',
          label: this.$t('prw.seo.order'),
          options: [
            { value: 'page', text: this.$t('prw.seo.order.page', { sep }) },
            { value: 'site', text: this.$t('prw.seo.order.site', { sep }) },
            { value: 'none', text: this.$t('prw.seo.order.none') },
          ],
        },
        { key: 'separator', label: this.$t('prw.seo.separator'), options: ['–', '|', '·', '/'].map((s) => ({ value: s, text: s })) },
        {
          key: 'home',
          label: this.$t('prw.seo.home'),
          options: [
            { value: 'site', text: this.$t('prw.seo.home.site') },
            { value: 'same', text: this.$t('prw.seo.home.same') },
          ],
        },
      ];
    },
    current() {
      return this.data.examples[this.example] || this.data.examples[0] || null;
    },
    // as pwMeta::autoTitle() builds it (own title first)
    title() {
      const page = this.current;
      if (!page) return '';
      if (page.own) return page.own;
      if (page.isHome && this.settings.home === 'site') return this.siteName;
      if (this.settings.order === 'none' || !this.siteName) return page.title;
      const sep = ' ' + (this.settings.separator || '–') + ' ';
      return this.settings.order === 'site' ? this.siteName + sep + page.title : page.title + sep + this.siteName;
    },
    shortTitle() {
      return this.title.length > 62 ? this.title.slice(0, 60) + ' …' : this.title;
    },
    description() {
      const text = (this.current && this.current.text) || '';
      if (!text || this.settings.description === 'none') return '';
      return text.length > LIMIT ? text.slice(0, LIMIT).replace(/\s+\S*$/, '') + ' …' : text;
    },
  },
  async created() {
    this.data = await this.$api.get('projectwizard/seo');
    this.site = this.settings.site || '';
    try {
      const fav = await this.$api.get('projectwizard/favicon');
      this.favicon = (fav.urls && fav.urls.tab) || '';
    } catch (e) {
      /* no favicon */
    }
  },
  methods: {
    async save(changes) {
      this.data = await this.$api.post('projectwizard/seo', { ...this.settings, ...changes });
    },
    fileSize(bytes) {
      return bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.round(bytes / 1024) + ' KB';
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
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const result = await this.$api.post('projectwizard/seo/image', { name: file.name, data });
        if (result.error) this.error = result.error;
        else this.data = result;
      } finally {
        this.busy = false;
      }
    },
    async removeImage() {
      this.busy = true;
      try {
        this.data = await this.$api.delete('projectwizard/seo/image');
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>

<style>
.pw-seo-site {
  width: 100%;
  max-width: 20rem;
}
.pw-seo-thumb {
  width: 12rem;
  aspect-ratio: 1200 / 630;
  flex: none;
  border-radius: var(--rounded);
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.pw-seo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pw-seo-examples {
  margin-bottom: var(--spacing-6);
}
.pw-seo-serp {
  font-family: Arial, sans-serif;
}
.pw-seo-serp-site {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #202124;
}
.pw-seo-serp-site small {
  display: block;
  color: #4d5156;
}
.pw-seo-serp-title {
  margin: 6px 0 3px;
  font-size: 19px;
  line-height: 1.3;
  color: #1a0dab;
}
.pw-seo-serp-text {
  font-size: 13.5px;
  line-height: 1.55;
  color: #4d5156;
}
.pw-seo-share {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}
.pw-seo-share-image {
  aspect-ratio: 1200 / 630;
  background: #e5e7eb;
}
.pw-seo-share-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pw-seo-share-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  background: #f6f7f9;
  color: #1c1e21;
  font-size: 12.5px;
  line-height: 1.4;
}
.pw-seo-share-text small {
  text-transform: uppercase;
  font-size: 11.5px;
  color: #65676b;
}
.pw-seo-share-text strong {
  font-size: 14.5px;
}
.pw-seo-share-text span {
  color: #65676b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
