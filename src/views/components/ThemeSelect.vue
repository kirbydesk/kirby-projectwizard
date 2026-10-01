<template>
  <!-- variant of a preview (or another choice of it, e.g. the layout): a
       button with the chosen one's name, Kirby's black menu with all of them
       (v-model) – as the device select -->
  <div class="pw-pill pw-theme-select" role="group">
    <div class="pw-tab-menu">
      <button
        type="button"
        class="pw-tool"
        aria-haspopup="menu"
        @click="$refs.menu.toggle()"
      >
        <span v-if="colors" class="pw-variant-dot is-small" :style="{ backgroundColor: colors[value] }"></span>
        <span class="pw-theme-select-text">{{ $t(prefix + value) }}</span>
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
            <span class="k-button-text"><span v-if="colors" class="pw-variant-dot is-small" :style="{ backgroundColor: colors[theme] }"></span>{{ $t(prefix + theme) }}</span>
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
    // the names' translation keys (prefix + value)
    prefix: { type: String, default: 'pw.option.' },
    // the variants' block background (value → colour): a dot before the name
    colors: { type: Object, default: null },
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
/* the variant's dot: before its name, in the button and in the menu */
.pw-pill.pw-theme-select .pw-variant-dot.is-small {
  margin-inline-end: 3px;
}
.pw-theme-select .k-dropdown-item .pw-variant-dot.is-small {
  margin-inline-end: var(--spacing-2);
}
</style>
