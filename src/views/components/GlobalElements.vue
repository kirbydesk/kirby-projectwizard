<template>
  <!-- which blocks can be used: one card per group (heading above) -->
  <div>
    <template v-for="group in groups">
      <section
        v-if="group.blocks.length"
        :key="group.key"
        class="pw-card-section"
      >
        <div class="pw-card-heading-row">
          <h3 class="pw-card-heading">{{ group.label }}</h3>
        </div>
        <div class="pw-card pw-field-table">
          <div
            v-for="block in group.blocks"
            :key="block.blockType"
            class="pw-field-row pw-active-row"
            :class="{ 'is-inactive': !block.active }"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <!-- its icon (as in the blocks menu) before the name -->
                  <label class="pw-field-row-label pw-active-label">
                    <k-icon :type="block.icon || 'box'" class="pw-active-icon" />
                    <span>{{ blockLabel(block.blockType) }}</span>
                  </label>
                </div>
                <div class="pw-field-row-options">
                  <!-- one switch; at the end how often the block is used -->
                  <k-toggle-input
                    :value="block.active"
                    @input="$emit('toggle', { blockType: block.blockType, checked: $event })"
                  />
                  <span class="pw-active-count">{{ usage[block.blockType] ? $t('prw.label.usedTimes', { count: usage[block.blockType] }) : $t('prw.label.unused') }}</span>
                </div>
              </span>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    blocks: {
      type: Array,
      default: () => [],
    },
    // how often each block is used in the project (blockType → count)
    usage: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    groups() {
      return [
        {
          key: 'pagewizard',
          label: this.$t('prw.headline.pagewizard') || 'Pagewizard',
          blocks: this.blocks.filter(b => (b.blockType || '').startsWith('pw')),
        },
        {
          key: 'projectRelated',
          label: this.$t('prw.headline.projectRelated') || 'Project Related',
          blocks: this.blocks.filter(b => !(b.blockType || '').startsWith('pw')),
        },
      ];
    },
  },
  methods: {
    blockLabel(blockType) {
      const block = this.blocks.find(b => b.blockType === blockType);
      if (block && block.name) return block.name;
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

<style>
.pw-active-label {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}
.pw-active-icon {
  --icon-size: 16px;
  color: var(--color-gray-600);
}
.pw-active-count {
  margin-inline-start: auto;
  font-size: var(--text-xs);
  color: var(--color-gray-500);
  font-variant-numeric: tabular-nums;
}
/* switched off: faded, the switch stays clear */
.pw-active-row.is-inactive :is(.pw-active-label, .pw-active-count) {
  opacity: 0.45;
}
</style>
