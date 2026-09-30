<template>
  <!-- device of a preview: a button with the chosen device's icon, Kirby's
       black menu with the three devices (v-model) -->
  <div class="pw-pill pw-device-select" role="group">
    <div class="pw-tab-menu">
      <button
        type="button"
        class="pw-tool"
        aria-haspopup="menu"
        :title="label(value)"
        :aria-label="label(value)"
        @click="$refs.menu.toggle()"
      >
        <k-icon :type="icon(value)" />
        <span v-if="showLabel" class="pw-device-select-label">{{ label(value) }}</span>
        <k-icon type="angle-down" class="pw-tab-menu-chevron" />
      </button>
      <k-dropdown-content ref="menu" align-x="end">
        <nav class="k-navigate">
          <button
            v-for="bp in ['default', 'lg', 'xl']"
            :key="bp"
            type="button"
            class="k-dropdown-item k-button pw-menu-item"
            data-has-text="true"
            data-has-icon="true"
            :aria-current="value === bp ? 'true' : undefined"
            @click="$refs.menu.close(); $emit('input', bp)"
          >
            <span class="k-button-icon"><k-icon :type="icon(bp)" /></span>
            <span class="k-button-text">{{ label(bp) }}</span>
          </button>
        </nav>
      </k-dropdown-content>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    // default (mobile), lg (tablet) or xl (desktop)
    value: { type: String, default: 'default' },
    // the device's name next to its icon (e.g. above the blocks)
    showLabel: { type: Boolean, default: false },
  },
  methods: {
    icon(bp) {
      return { default: 'mobile', lg: 'tablet', xl: 'display' }[bp];
    },
    label(bp) {
      return { default: this.$t('prw.label.mobile'), lg: this.$t('prw.label.tablet'), xl: this.$t('prw.label.desktop') }[bp];
    },
  },
};
</script>

<style>
/* as high as the variant pills and the guides button */
.pw-pill.pw-device-select {
  --tool-size: 24px;
}
.pw-device-select .pw-tool {
  gap: 2px;
  padding-inline: var(--spacing-2) var(--spacing-1);
}
.pw-device-select .k-icon {
  --icon-size: 14px;
}
.pw-device-select-label {
  margin-inline: var(--spacing-1) 2px;
  font-size: var(--text-xs);
}
</style>
