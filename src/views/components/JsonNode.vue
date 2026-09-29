<template>
  <!-- a node of the exceptions' tree: its key, then (an object or a list)
       its children to open and close, or (a value) the value itself; the
       plus takes the node with its current value into the exceptions -->
  <li class="pw-json-node" :class="{ 'is-block': depth === 0, 'is-section': depth === 1 }">
    <div class="pw-json-row" :class="{ 'is-open': open, 'is-branch': isBranch }" @click="isBranch && (open = !open)">
      <span class="pw-json-toggle">
        <k-icon v-if="isBranch" :type="open ? 'angle-down' : 'angle-right'" />
      </span>
      <!-- a block: its icon, name and type -->
      <template v-if="depth === 0">
        <k-icon :type="icon || 'box'" class="pw-json-block-icon" />
        <span class="pw-json-block-name">{{ label || nodeKey }}</span>
        <code class="pw-json-block-type">{{ nodeKey }}</code>
      </template>
      <template v-else>
        <span class="pw-json-key">{{ nodeKey }}</span><span v-if="!isBranch" class="pw-json-colon">:</span>
      </template>
      <!-- the value in a debugger's colours: strings, numbers, true/false,
           null; a list of plain values item by item -->
      <span v-if="!isBranch" class="pw-json-value"><span
        v-for="(token, i) in tokens"
        :key="i"
        :class="token.type ? 'is-' + token.type : null"
      >{{ token.text }}</span></span>
      <span v-else-if="!open" class="pw-json-count">{{ count }}</span>
      <button
        v-if="depth > 0"
        type="button"
        class="pw-json-add"
        :title="$t('prw.patches.take')"
        :aria-label="$t('prw.patches.take')"
        @click.stop="$emit('take', { path, value })"
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
    // (a block: its name and icon next to its type)
    label: { type: String, default: '' },
    icon: { type: String, default: '' },
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
    tokens() {
      const token = (v) => {
        if (v === null) return { type: 'null', text: 'null' };
        if (typeof v === 'string') return { type: 'string', text: JSON.stringify(v) };
        if (typeof v === 'number') return { type: 'number', text: String(v) };
        if (typeof v === 'boolean') return { type: 'boolean', text: String(v) };
        return { type: null, text: JSON.stringify(v) };
      };
      if (!Array.isArray(this.value)) {
        // (an empty object)
        return this.value && typeof this.value === 'object' ? [{ type: 'punct', text: '{}' }] : [token(this.value)];
      }
      const out = [{ type: 'punct', text: '[' }];
      this.value.forEach((v, i) => {
        if (i) out.push({ type: 'punct', text: ', ' });
        out.push(token(v));
      });
      out.push({ type: 'punct', text: ']' });
      return out;
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
/* the children: indented, with a thin guide line along their level */
.pw-json-children {
  margin: 0 0 0 calc(0.5rem - 0.5px);
  padding-left: calc(var(--spacing-3) - 1px);
  border-left: 1px solid var(--color-gray-250, #e6e6e6);
}
.pw-json-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 1.6rem;
  padding: 0 var(--spacing-1) 0 0;
  border-radius: var(--rounded-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.4;
}
.pw-json-row.is-branch {
  cursor: pointer;
}
.pw-json-row:hover {
  background: var(--color-gray-100);
}
.pw-json-toggle {
  flex: 0 0 auto;
  display: inline-flex;
  width: 1rem;
  color: var(--color-gray-500);
}
.pw-json-toggle .k-icon {
  --icon-size: 14px;
}

/* a block: a card-like row – icon, name in the panel's type, its type */
.pw-json-node.is-block {
  margin-bottom: 2px;
}
.pw-json-node.is-block > .pw-json-row {
  min-height: 2.25rem;
  padding: 0 var(--spacing-2) 0 var(--spacing-1);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}
.pw-json-node.is-block > .pw-json-row.is-open {
  background: var(--color-gray-100);
}
.pw-json-block-icon {
  --icon-size: 16px;
  color: var(--color-gray-600);
}
.pw-json-block-name {
  font-weight: var(--font-semi, 600);
}
.pw-json-block-type {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-dimmed);
}

/* keys as in the debugger (purple), the sections of a block (fields,
   values, editor …) and every branch in bold */
.pw-json-key {
  color: #881391;
  white-space: nowrap;
}
.pw-json-row.is-branch .pw-json-key {
  font-weight: 700;
}
.pw-json-node.is-section > .pw-json-row .pw-json-key {
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 10px;
}
.pw-json-colon {
  margin-inline-start: -0.3rem;
  color: var(--color-gray-500);
}

/* values: the debugger's colours */
.pw-json-value {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.pw-json-value .is-string { color: #c41a16; }
.pw-json-value .is-number { color: #1c00cf; font-weight: 600; }
.pw-json-value .is-boolean { color: #0d22aa; font-weight: 600; }
.pw-json-value .is-null { color: #808080; font-style: italic; }
.pw-json-value .is-punct { color: var(--color-gray-500); }

/* closed: how many entries, as a small blue badge */
.pw-json-count {
  padding: 0 0.4rem;
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4rem;
  color: var(--color-blue-700, #1d4ed8);
  background: var(--color-blue-200, #dbeafe);
  border-radius: 999px;
}

/* the plus at the row's end, visible while the row is hovered */
.pw-json-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  margin-inline-start: auto;
  padding: 0;
  color: var(--color-white);
  background: var(--color-blue-600);
  border-radius: 999px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.1s;
}
.pw-json-row:hover .pw-json-add,
.pw-json-add:focus-visible {
  opacity: 1;
}
.pw-json-add:hover {
  background: var(--color-blue-700, #1d4ed8);
}
.pw-json-add .k-icon {
  --icon-size: 12px;
}
</style>
