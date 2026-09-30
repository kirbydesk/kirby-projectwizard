<template>
  <!-- a node of the translated fields' tree (Settings › Translation), in
       the look of the configuration's tree: the page or a block with its
       text fields – each with a switch – and its nested blocks -->
  <li class="pw-json-node" :class="{ 'is-block': depth === 0 }">
    <div class="pw-json-row is-branch" :class="{ 'is-open': open }" :title="node.title || null" @click="open = !open">
      <span class="pw-json-toggle">
        <k-icon :type="open ? 'angle-down' : 'angle-right'" />
      </span>
      <k-icon :type="node.icon || 'box'" class="pw-json-block-icon" />
      <span class="pw-json-block-name">{{ node.label }}</span>
      <code v-if="node.code" class="pw-json-block-type">{{ node.code }}</code>
      <!-- how many of its fields (with the nested ones) are translated -->
      <span class="pw-json-count pw-translate-count" :class="{ 'is-none': counts.on === 0 }">{{ counts.on }}/{{ counts.all }}</span>
    </div>
    <ul v-if="open" class="pw-json-children">
      <li v-for="field in node.fields" :key="field.key" class="pw-json-node">
        <!-- the whole row switches; a small box at its end -->
        <div
          class="pw-json-row pw-translate-field"
          :class="{ 'is-off': !values[field.key] }"
          role="checkbox"
          tabindex="0"
          :aria-checked="values[field.key] ? 'true' : 'false'"
          :title="field.name"
          @click="$emit('toggle', { key: field.key, value: !values[field.key] })"
          @keydown.space.prevent="$emit('toggle', { key: field.key, value: !values[field.key] })"
        >
          <span class="pw-json-toggle"></span>
          <span class="pw-translate-label">{{ field.label }}</span>
          <span class="pw-translate-type">{{ field.type }}</span>
          <span class="pw-translate-check" :class="{ 'is-on': values[field.key] }">
            <!-- a plain check (Kirby's "check" has a circle): Remix check-line -->
            <svg v-if="values[field.key]" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z" /></svg>
          </span>
        </div>
      </li>
      <pw-translate-node
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :values="values"
        :depth="depth + 1"
        :expanded="expanded"
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
    // "expand all" / "collapse all" of the page: every node follows
    expanded: { type: Boolean, default: false },
  },
  data() {
    return { open: this.expanded };
  },
  watch: {
    expanded(now) {
      this.open = now;
    },
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
.pw-translate-field {
  cursor: pointer;
}
.pw-translate-field:focus-visible {
  outline: var(--outline);
  outline-offset: -2px;
}
/* the box at the row's end: Kirby's green with a check while on, an empty frame
   while off */
.pw-translate-check {
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: 1rem;
  height: 1rem;
  box-sizing: border-box;
  border: 1px solid light-dark(var(--color-gray-400), var(--color-gray-600));
  border-radius: var(--rounded-sm);
  background: light-dark(var(--color-white), var(--color-gray-850));
}
.pw-translate-check.is-on {
  border-color: var(--color-positive);
  background: var(--color-positive);
  color: var(--color-white);
}
.pw-translate-check svg {
  width: 12px;
  height: 12px;
  fill: currentColor;
}
/* the type right after the label, the check at the row's end */
.pw-translate-check {
  margin-inline-start: auto;
}
/* not translated: the label faded */
.pw-translate-field.is-off .pw-translate-label,
.pw-translate-field.is-off .pw-translate-type {
  opacity: 0.5;
}
/* the count stays visible while open too, right after the name (the
   row's end is the fields' boxes); none translated: grey */
.pw-translate-count.is-none {
  color: var(--color-text-dimmed);
  background: light-dark(var(--color-gray-200), var(--color-gray-800));
}
</style>
