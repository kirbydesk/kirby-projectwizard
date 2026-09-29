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
                  <!-- used: a click lists the pages (loaded then), each opens in the panel -->
                  <span v-if="usage[block.blockType]" class="pw-active-count pw-active-usage">
                    <button type="button" class="pw-active-usage-button" @click="openUsage(block.blockType)">
                      {{ $t('prw.label.usedTimes', { count: usage[block.blockType] }) }}<k-icon type="angle-down" />
                    </button>
                    <k-dropdown-content :ref="'usage-' + block.blockType" align-x="end">
                      <nav class="k-navigate">
                        <p v-if="!usagePages[block.blockType]" class="pw-active-usage-loading">…</p>
                        <button
                          v-for="page in usagePages[block.blockType] || []"
                          :key="page.link"
                          type="button"
                          class="k-dropdown-item k-button pw-menu-item"
                          data-has-text="true"
                          @click="$go(page.link)"
                        >
                          <span class="k-button-text">{{ page.title }} <span class="pw-menu-count">{{ page.count }}×</span></span>
                        </button>
                      </nav>
                    </k-dropdown-content>
                  </span>
                  <span v-else class="pw-active-count">{{ $t('prw.label.unused') }}</span>
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
  data() {
    return {
      // the pages using a block (blockType → list), loaded on the first click
      usagePages: {},
    };
  },
  methods: {
    async openUsage(blockType) {
      const ref = this.$refs['usage-' + blockType];
      (Array.isArray(ref) ? ref[0] : ref).toggle();
      if (this.usagePages[blockType]) return;
      try {
        this.$set(this.usagePages, blockType, await this.$api.get('projectwizard/blocks/usage/' + blockType));
      } catch (e) {
        this.$set(this.usagePages, blockType, []);
      }
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
/* the usage: a button opening the list of pages */
.pw-active-usage-button {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  color: var(--color-blue-600);
  font: inherit;
  background: none;
  cursor: pointer;
}
.pw-active-usage-button:hover {
  color: var(--color-blue-700, #1d4ed8);
  text-decoration: underline;
}
.pw-active-usage-button .k-icon {
  --icon-size: 12px;
  opacity: 0.7;
}
.pw-active-usage-loading {
  padding: var(--spacing-2) var(--spacing-3);
  color: var(--color-gray-500);
}
/* switched off: faded, the switch stays clear */
.pw-active-row.is-inactive :is(.pw-active-label, .pw-active-count) {
  opacity: 0.45;
}
</style>
