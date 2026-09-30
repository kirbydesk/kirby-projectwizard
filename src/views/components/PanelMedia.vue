<template>
  <!-- the media block's image, slideshow or video in the panel preview, as
       the frontend's snippets (image, images, video): the file's ratio, crop
       and focus, the block's size, alignment and corners -->
  <div v-if="file || externalUrl" class="pw-panel-media" :style="boxStyle">
    <figure :style="figureStyle">
      <div class="pw-panel-media-frame" :style="frameStyle">
        <img v-if="kind !== 'video'" :src="file.url" :srcset="srcset" :style="fitStyle" alt="" />
        <video v-else-if="file" :src="file.url" preload="metadata" muted :style="fitStyle"></video>
        <!-- an external video (YouTube, Vimeo): not loaded here, its
             placeholder as the frontend's consent button -->
        <div v-else class="pw-panel-media-external">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5" /><polygon points="10,8 17,12 10,16" fill="currentColor" /></svg>
          <small>{{ externalHost }}</small>
        </div>
      </div>
      <figcaption v-if="caption" :style="captionStyle">{{ caption }}</figcaption>
    </figure>
    <!-- the slideshow: a dot per image -->
    <div v-if="kind === 'slideshow' && files.length > 1" class="pw-panel-media-dots">
      <span v-for="(f, i) in files" :key="f.id || i" :class="{ 'is-current': i === 0 }"></span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    // the block's content (mediatype, image, slideshow, video, videourl …)
    content: { type: Object, default: () => ({}) },
    // size, alignment, corners and the gap above (PanelRender)
    boxStyle: { type: Object, default: () => ({}) },
    captionStyle: { type: Object, default: () => ({}) },
  },
  data() {
    // the file's own content (ratio, crop, focus, caption)
    return { meta: {} };
  },
  computed: {
    kind() {
      return this.content.mediatype || 'image';
    },
    files() {
      const list = this.content[this.kind === 'slideshow' ? 'slideshow' : this.kind];
      return Array.isArray(list) ? list.filter(Boolean) : [];
    },
    // the image, the slideshow's first one, the video file
    file() {
      if (this.kind === 'video' && this.content.videosource === 'external') return null;
      return this.files[0] || null;
    },
    externalUrl() {
      return this.kind === 'video' && this.content.videosource === 'external' ? String(this.content.videourl || '') : '';
    },
    externalHost() {
      try { return new URL(this.externalUrl).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
    },
    srcset() {
      const f = this.file || {};
      return (f.image && f.image.srcset) || null;
    },
    round() {
      return this.content.mediaradius === 'round';
    },
    // ratio and crop: the file's (round: square, cropped); an external
    // video 16:9
    ratio() {
      if (this.round) return '1/1';
      if (this.externalUrl) return '16/9';
      const r = this.kind === 'video' ? this.meta.videoratio : this.meta.imageratio;
      return r && r !== 'auto' ? r : '';
    },
    crop() {
      return this.round || (this.kind !== 'video' && (this.meta.imagecrop === true || this.meta.imagecrop === 'true'));
    },
    figureStyle() {
      return {
        margin: 0,
        overflow: 'hidden',
        borderRadius: this.round ? '9999px' : this.boxStyle.borderRadius,
      };
    },
    frameStyle() {
      return this.ratio ? { aspectRatio: this.ratio.replace('/', ' / '), overflow: 'hidden' } : {};
    },
    fitStyle() {
      if (!this.ratio) return { display: 'block', width: '100%', height: 'auto' };
      return {
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: this.crop ? 'cover' : 'contain',
        objectPosition: this.crop ? this.meta.focus || '50% 50%' : null,
      };
    },
    caption() {
      return this.kind === 'image' ? String(this.meta.imagecaption || '').trim() : '';
    },
  },
  watch: {
    // (another file chosen: its values)
    'file.link': {
      immediate: true,
      handler() {
        this.load();
      },
    },
  },
  methods: {
    async load() {
      this.meta = {};
      if (!this.file || !this.file.link) return;
      try {
        const response = await this.$api.get(this.file.link, { select: 'content' });
        this.meta = (response && response.content) || {};
      } catch (e) {
        this.meta = {};
      }
    },
  },
};
</script>

<style>
.pw-panel-media figcaption {
  display: block;
}
.pw-panel-media-external {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #fff;
  background: #111;
}
.pw-panel-media-external svg {
  width: 3rem;
  height: 3rem;
}
.pw-panel-media-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 0.5rem;
}
.pw-panel-media-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.3;
}
.pw-panel-media-dots span.is-current {
  opacity: 0.8;
}
</style>
