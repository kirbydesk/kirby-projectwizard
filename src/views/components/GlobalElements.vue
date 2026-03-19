<template>
  <div class="pw-wizard-global-content">
    <fieldset class="pw-wizard-fieldgroup">
      <h3 class="pw-wizard-fieldgroup-title">Active Blocks</h3>
      <p class="pw-wizard-hint">Select which blocks are available in the content editor.</p>
      <div class="pw-wizard-checklist">
        <label
          v-for="block in blocks"
          :key="block.blockType"
          class="pw-wizard-check"
        >
          <input
            type="checkbox"
            :checked="block.active"
            @change="$emit('toggle', { blockType: block.blockType, checked: $event.target.checked })"
          />
          <span class="pw-wizard-check-label">{{ blockLabel(block.blockType) }}</span>
          <span class="pw-wizard-check-meta">{{ block.plugin }}</span>
        </label>
      </div>
    </fieldset>
  </div>
</template>

<script>
export default {
  props: {
    blocks: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    blockLabel(blockType) {
      const block = this.blocks.find(b => b.blockType === blockType);
      if (block) {
        const translated = this.$t(block.plugin + '.name');
        if (translated && translated !== block.plugin + '.name') return translated;
      }
      const name = blockType.replace(/^pw/, '').replace(/([A-Z])/g, ' $1').trim() || blockType;
      return name.charAt(0).toUpperCase() + name.slice(1);
    },
  },
};
</script>
