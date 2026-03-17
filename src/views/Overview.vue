<template>
  <k-panel-inside class="pw-wizard-overview">
    <k-header>
      Project Wizard
    </k-header>

    <!-- Active Blocks -->
    <section class="pw-wizard-section">
      <h2 class="pw-wizard-section-title">Active Blocks</h2>
      <p class="pw-wizard-section-info">
        Drag to reorder. Toggle blocks to include them in the content editor.
      </p>

      <div class="pw-wizard-active-blocks">
        <label
          v-for="block in blocks"
          :key="block.blockType"
          class="pw-wizard-block-toggle"
        >
          <input
            type="checkbox"
            :checked="block.active"
            @change="toggleBlock(block.blockType, $event.target.checked)"
          />
          <span class="pw-wizard-block-name">{{ block.blockType }}</span>
          <span class="pw-wizard-block-plugin">{{ block.plugin }}</span>
        </label>
      </div>

      <div class="pw-wizard-actions" v-if="activeBlocksDirty">
        <k-button
          text="Save block list"
          theme="positive"
          variant="filled"
          size="sm"
          @click="saveActiveBlocks"
        />
      </div>
    </section>

    <!-- Block Cards -->
    <section class="pw-wizard-section">
      <h2 class="pw-wizard-section-title">Block Configuration</h2>

      <div class="pw-wizard-grid">
        <button
          v-for="block in blocks"
          :key="block.blockType"
          class="pw-wizard-card"
          :class="{ 'is-customized': block.customized, 'is-active': block.active }"
          @click="openBlock(block.blockType)"
        >
          <span class="pw-wizard-card-type">{{ block.blockType }}</span>
          <span class="pw-wizard-card-plugin">{{ block.plugin }}</span>
          <span class="pw-wizard-card-status">
            {{ block.customized ? 'Customized' : 'Default' }}
          </span>
        </button>
      </div>
    </section>
  </k-panel-inside>
</template>

<script>
export default {
  data() {
    return {
      blocks: [],
      activeBlocks: [],
      activeBlocksDirty: false,
    };
  },
  async created() {
    await this.load();
  },
  methods: {
    async load() {
      try {
        const res = await this.$api.get('projectwizard/blocks');
        this.blocks = res.blocks || [];
        this.activeBlocks = res.activeBlocks || [];
        this.activeBlocksDirty = false;
      } catch (e) {
        console.error('Failed to load blocks', e);
      }
    },
    toggleBlock(blockType, checked) {
      const block = this.blocks.find(b => b.blockType === blockType);
      if (block) block.active = checked;

      if (checked) {
        if (!this.activeBlocks.includes(blockType)) {
          this.activeBlocks.push(blockType);
        }
      } else {
        this.activeBlocks = this.activeBlocks.filter(b => b !== blockType);
      }
      this.activeBlocksDirty = true;
    },
    async saveActiveBlocks() {
      try {
        await this.$api.post('projectwizard/blocks/active', {
          blocks: this.activeBlocks,
        });
        this.activeBlocksDirty = false;
      } catch (e) {
        console.error('Failed to save active blocks', e);
      }
    },
    openBlock(blockType) {
      this.$go('projectwizard/block/' + blockType);
    },
  },
};
</script>

<style>
.pw-wizard-overview {
  padding: var(--spacing-6);
}

.pw-wizard-section {
  margin-bottom: var(--spacing-12);
}

.pw-wizard-section-title {
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-2);
}

.pw-wizard-section-info {
  color: var(--color-text-dimmed);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-6);
}

.pw-wizard-active-blocks {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.pw-wizard-block-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-background);
  border-radius: var(--rounded);
  cursor: pointer;
}

.pw-wizard-block-toggle:hover {
  background: var(--color-gray-100);
}

.pw-wizard-block-name {
  font-weight: 500;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.pw-wizard-block-plugin {
  color: var(--color-text-dimmed);
  font-size: var(--text-xs);
  margin-left: auto;
}

.pw-wizard-actions {
  margin-top: var(--spacing-4);
}

.pw-wizard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-4);
}

.pw-wizard-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-4);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--rounded-lg);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s;
}

.pw-wizard-card:hover {
  border-color: var(--color-focus);
}

.pw-wizard-card.is-active {
  border-left: 3px solid var(--color-positive-600);
}

.pw-wizard-card.is-customized .pw-wizard-card-status {
  color: var(--color-notice-600);
}

.pw-wizard-card-type {
  font-weight: 600;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.pw-wizard-card-plugin {
  color: var(--color-text-dimmed);
  font-size: var(--text-xs);
}

.pw-wizard-card-status {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  margin-top: var(--spacing-2);
}
</style>
