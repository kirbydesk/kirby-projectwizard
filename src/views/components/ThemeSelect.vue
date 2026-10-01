<template>
  <!-- variant of a preview: a button with the chosen variant's name, Kirby's
       black menu with all variants (v-model) – as the device select -->
  <div class="pw-pill pw-theme-select" role="group">
    <div class="pw-tab-menu">
      <button
        type="button"
        class="pw-tool"
        aria-haspopup="menu"
        @click="$refs.menu.toggle()"
      >
        <span class="pw-theme-select-text">{{ $t('pw.option.' + value) }}</span>
        <k-icon type="angle-down" class="pw-tab-menu-chevron" />
      </button>
      <k-dropdown-content ref="menu" align-x="start">
        <nav class="k-navigate">
          <button
            v-for="theme in themes"
            :key="theme"
            type="button"
            class="k-dropdown-item k-button pw-menu-item"
            data-has-text="true"
            :aria-current="value === theme ? 'true' : undefined"
            @click="$refs.menu.close(); $emit('input', theme)"
          >
            <span class="k-button-text">{{ $t('pw.option.' + theme) }}</span>
          </button>
        </nav>
      </k-dropdown-content>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    // the variant shown (default, variant, variant2 …)
    value: { type: String, default: 'default' },
    themes: { type: Array, default: () => [] },
  },
};
</script>

<style>
/* as high as the device select and the guides button */
.pw-pill.pw-theme-select {
  --tool-size: 24px;
}
.pw-pill.pw-theme-select .pw-tool {
  gap: 2px;
  padding-inline: var(--spacing-2) var(--spacing-1);
  font-size: var(--text-xs);
  white-space: nowrap;
}
.pw-theme-select .k-icon {
  --icon-size: 14px;
}
</style>
