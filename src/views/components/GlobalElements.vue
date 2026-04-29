<template>
  <div>
    <template v-for="group in groups">
      <section
        v-if="group.blocks.length"
        :key="group.key"
        class="pw-element-section"
      >
        <div class="pw-section-header">
          <button class="pw-section-toggle" @click="$set(open, group.key, !isOpen(group.key))">
            <span>{{ group.label }}</span>
            <k-icon :type="isOpen(group.key) ? 'angle-down' : 'angle-right'" />
          </button>
        </div>
        <transition name="pw-slide">
          <div v-show="isOpen(group.key)" class="pw-element-list">
            <div
              v-for="block in group.blocks"
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
  },
  data() {
    return { open: {} };
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
    isOpen(key) {
      return this.open[key] !== false;
    },
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
