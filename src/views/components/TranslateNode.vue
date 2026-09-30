<template>
  <!-- a node of the translated fields' tree (Settings › Translation), in
       the look of the configuration's tree: the page or a block with its
       text fields – each with a switch – and its nested blocks -->
  <li class="pw-json-node" :class="{ 'is-block': depth === 0 }">
    <div class="pw-json-row is-branch" :class="{ 'is-open': open }" @click="open = !open">
      <span class="pw-json-toggle">
        <k-icon :type="open ? 'angle-down' : 'angle-right'" />
      </span>
      <k-icon :type="node.icon || 'box'" class="pw-json-block-icon" />
      <span class="pw-json-block-name">{{ node.label }}</span>
      <code v-if="node.key !== 'page'" class="pw-json-block-type">{{ node.key }}</code>
      <!-- how many of its fields (with the nested ones) are translated -->
      <span class="pw-json-count pw-translate-count" :class="{ 'is-none': counts.on === 0 }">{{ counts.on }}/{{ counts.all }}</span>
    </div>
    <ul v-if="open" class="pw-json-children">
      <li v-for="field in node.fields" :key="field.key" class="pw-json-node">
        <div class="pw-json-row pw-translate-field" :class="{ 'is-off': !values[field.key] }">
          <span class="pw-json-toggle"></span>
          <span class="pw-translate-label">{{ field.label }}</span>
          <code class="pw-json-key">{{ field.name }}</code>
          <span class="pw-translate-type">{{ field.type }}</span>
          <k-toggle-input
            class="pw-translate-switch"
            :value="!!values[field.key]"
            @input="$emit('toggle', { key: field.key, value: $event })"
          />
        </div>
      </li>
      <pw-translate-node
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :values="values"
        :depth="depth + 1"
        @toggle="$emit('toggle', $event)"
      />
    </ul>
  </li>
</template>

<script>
export default {
  name: 'pw-translate-node',
  props: {
    // { key, label, icon, fields: [{ key, name, label, type }], children }
    node: { type: Object, required: true },
    // "owner.field" → on/off
    values: { type: Object, default: () => ({}) },
    depth: { type: Number, default: 0 },
  },
  data() {
    return { open: false };
  },
  computed: {
    counts() {
      const count = (node) => node.fields.reduce(
        (acc, f) => ({ on: acc.on + (this.values[f.key] ? 1 : 0), all: acc.all + 1 }),
        (node.children || []).map(count).reduce((a, b) => ({ on: a.on + b.on, all: a.all + b.all }), { on: 0, all: 0 })
      );
      return count(this.node);
    },
  },
};
</script>

<style>
/* a field: its label, name and type, the switch at the end */
.pw-translate-field {
  gap: var(--spacing-2);
  min-height: 2rem;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}
.pw-translate-label {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.pw-translate-field .pw-json-key {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
}
.pw-translate-type {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-dimmed);
}
.pw-translate-switch {
  flex: 0 0 auto;
  margin-inline-start: auto;
}
/* not translated: the label faded */
.pw-translate-field.is-off .pw-translate-label,
.pw-translate-field.is-off .pw-json-key {
  opacity: 0.5;
}
/* the count stays visible while open too; none translated: grey */
.pw-translate-count {
  margin-inline-start: auto;
}
.pw-translate-count.is-none {
  color: var(--color-text-dimmed);
  background: light-dark(var(--color-gray-200), var(--color-gray-800));
}
</style>
