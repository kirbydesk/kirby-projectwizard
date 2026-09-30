<template>
  <!-- a value the exceptions set (Settings › Configuration): the lock at the
       right of the label cell; a click opens the configuration -->
  <button
    type="button"
    class="pw-lock"
    :title="$t('prw.patches.locked')"
    :aria-label="$t('prw.patches.locked')"
    @click="open"
  ><k-icon type="lock" /></button>
</template>

<script>
export default {
  inject: { pwOpenPatches: { default: null } },
  methods: {
    open() {
      if (this.pwOpenPatches) this.pwOpenPatches();
    },
  },
};
</script>

<style>
.pw-lock {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* at the right of the label cell, as the eye of hidden fields */
  margin-inline-start: auto;
  padding: 2px;
  color: var(--color-text-dimmed);
  border-radius: var(--rounded-sm);
  cursor: pointer;
}
.pw-lock:hover {
  color: var(--color-blue-600);
}
.pw-lock .k-icon {
  --icon-size: 14px;
}
/* the locked controls: shown with the value that applies, not usable */
.pw-field-row [inert] {
  opacity: 0.5;
}
</style>
