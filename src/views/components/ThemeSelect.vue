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
        <!-- all names in one cell, only the chosen one visible: as wide as
             the longest, so nothing moves when the choice changes -->
        <span class="pw-select-sizer">
          <span v-for="theme in themes" :key="'s-' + theme" :class="{ 'is-current': theme === value }">{{ $t(prefix + theme) }}</span>
        </span>
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
            :data-has-icon="colors ? 'true' : null"
            :aria-current="value === theme ? 'true' : undefined"
            @click="$refs.menu.close(); $emit('input', theme)"
          >
            <!-- (the dot in the icon's place, as the device select's icons) -->
            <span v-if="colors" class="k-button-icon"><span class="pw-variant-dot pw-theme-select-dot" :style="{ backgroundColor: colors[theme] }"></span></span>
            <span class="k-button-text">{{ $t(prefix + theme) }}</span>
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
/* the names stacked in one grid cell: the widest sets the width */
.pw-select-sizer {
  display: inline-grid;
  text-align: start;
}
.pw-select-sizer > * {
  grid-area: 1 / 1;
  visibility: hidden;
}
.pw-select-sizer > .is-current {
  visibility: visible;
}
.pw-theme-select .k-icon {
  --icon-size: 14px;
}
/* the variant's dot: before its name, in the button and in the menu */
.pw-pill.pw-theme-select .pw-variant-dot.is-small {
  margin-inline-end: 3px;
}
.pw-theme-select-dot {
  display: block;
  width: 10px;
  height: 10px;
  /* (a grey line inside, a white ring on the dark menu) */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.25), 0 0 0 1px #ffffff;
}
</style>
