<template>
  <!-- a node of the exceptions' tree: its key, then (an object or a list)
       its children to open and close, or (a value) the value itself; the
       plus takes the node with its current value into the exceptions -->
  <li class="pw-json-node">
    <div class="pw-json-row" :class="{ 'is-open': open }">
      <button
        v-if="isBranch"
        type="button"
        class="pw-json-toggle"
        :aria-expanded="open ? 'true' : 'false'"
        @click="open = !open"
      ><k-icon :type="open ? 'angle-down' : 'angle-right'" /></button>
      <span v-else class="pw-json-toggle-space"></span>
      <span class="pw-json-key" :class="{ 'is-branch': isBranch }" @click="isBranch && (open = !open)">{{ label || nodeKey }}</span>
      <span v-if="!isBranch" class="pw-json-value">{{ shown }}</span>
      <span v-else-if="!open" class="pw-json-count">{{ count }}</span>
      <button
        v-if="depth > 0"
        type="button"
        class="pw-json-add"
        :title="$t('prw.patches.take')"
        :aria-label="$t('prw.patches.take')"
        @click="$emit('take', { path, value })"
      ><k-icon type="add" /></button>
    </div>
    <ul v-if="isBranch && open" class="pw-json-children">
      <pw-json-node
        v-for="(child, key) in value"
        :key="key"
        :node-key="String(key)"
        :value="child"
        :path="[...path, key]"
        :depth="depth + 1"
        @take="$emit('take', $event)"
      />
    </ul>
  </li>
</template>

<script>
export default {
  name: 'pw-json-node',
  props: {
    nodeKey: { type: String, required: true },
    // (a block: its name next to its type)
    label: { type: String, default: '' },
    value: { default: null },
    path: { type: Array, default: () => [] },
    depth: { type: Number, default: 0 },
  },
  data() {
    return { open: false };
  },
  computed: {
    // objects open; lists of plain values (options, nodes …) show as one value
    isBranch() {
      if (!this.value || typeof this.value !== 'object') return false;
      if (Array.isArray(this.value)) return this.value.some(v => v && typeof v === 'object');
      return Object.keys(this.value).length > 0;
    },
    shown() {
      return JSON.stringify(this.value);
    },
    count() {
      return Array.isArray(this.value) ? this.value.length : Object.keys(this.value).length;
    },
  },
};
</script>

<style>
.pw-json-node {
  list-style: none;
}
.pw-json-children {
  margin: 0;
  padding-left: var(--spacing-4);
}
.pw-json-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  min-height: 1.75rem;
  padding-right: var(--spacing-1);
  border-radius: var(--rounded-sm);
}
.pw-json-row:hover {
  background: var(--color-gray-200);
}
.pw-json-toggle,
.pw-json-toggle-space {
  flex: 0 0 auto;
  width: 1rem;
}
.pw-json-toggle {
  display: inline-flex;
  padding: 0;
  color: var(--color-text-dimmed);
  background: none;
  cursor: pointer;
}
.pw-json-toggle .k-icon {
  --icon-size: 14px;
}
.pw-json-key {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  white-space: nowrap;
}
.pw-json-key.is-branch {
  cursor: pointer;
}
.pw-json-value {
  min-width: 0;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.pw-json-count {
  font-size: var(--text-xs);
  color: var(--color-text-dimmed);
}
/* the plus at the row's end, visible while the row is hovered */
.pw-json-add {
  display: inline-flex;
  margin-inline-start: auto;
  padding: 0;
  color: var(--color-text-dimmed);
  background: none;
  cursor: pointer;
  opacity: 0;
}
.pw-json-row:hover .pw-json-add,
.pw-json-add:focus-visible {
  opacity: 1;
}
.pw-json-add:hover {
  color: var(--color-text);
}
.pw-json-add .k-icon {
  --icon-size: 14px;
}
</style>
