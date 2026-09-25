<template>
  <div class="pw-portal"><slot /></div>
</template>

<script>
/**
 * Renders its content into another element of the page (Vue 2 has no
 * <Teleport>). Used to place the wizard's tabs and save buttons in Kirby's
 * topbar while the view keeps owning their state (same as kirby-explorer).
 * Without the target it stays in place.
 */
export default {
  props: {
    to: { type: String, required: true },
  },
  mounted() {
    document.querySelector(this.to)?.appendChild(this.$el);
  },
  beforeDestroy() {
    this.$el.remove();
  },
};
</script>
