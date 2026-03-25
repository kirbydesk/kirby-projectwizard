<template>
  <div>
    <section class="pw-element-section">
      <div class="pw-section-header">
        <button class="pw-section-toggle" @click="open = !open">
          <span>{{ $t('prw.headline.activeBlocks') || 'Active Blocks' }}</span>
          <k-icon :type="open ? 'angle-down' : 'angle-right'" />
        </button>
      </div>
      <transition name="pw-slide">
        <div v-show="open" class="pw-element-list">
          <div
            v-for="block in blocks"
            :key="block.blockType"
            class="pw-field-row"
          >
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col">
                  <label class="pw-field-row-label">{{ blockLabel(block.blockType) }}</label>
                </div>
                <div class="pw-field-row-options">
                  <k-toggles-input
                    :value="block.active ? 'true' : 'false'"
                    :options="[{ value: 'true', text: $t('pw.option.enabled') || 'Enabled' }, { value: 'false', text: $t('pw.option.disabled') || 'Disabled' }]"
                    :grow="false"
                    :required="true"
                    @input="$emit('toggle', { blockType: block.blockType, checked: $event === 'true' })"
                  />
                </div>
              </span>
            </div>
          </div>
        </div>
      </transition>
    </section>
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
  data() {
    return { open: true };
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
