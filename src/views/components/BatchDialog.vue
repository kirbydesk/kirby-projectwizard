<template>
  <!-- translating several pages (Settings › Translation): asked first
       (pages, characters), then the progress, then the result; the state
       lives in the wizard (host), which runs the pages one by one -->
  <k-dialog
    class="pw-batch-dialog"
    size="medium"
    :visible="visible"
    :cancel-button="host.batchDialogCancel"
    :submit-button="host.batchDialogSubmit"
    @cancel="host.onBatchCancel()"
    @submit="host.onBatchSubmit()"
  >
    <template v-if="dialog">
      <template v-if="dialog.step === 'ask'">
        <p class="pw-batch-dialog-text">{{ $t('prw.translate.batch.chars', { chars: dialog.chars.toLocaleString(), lang: dialog.lang.name }) }}</p>
        <k-box v-if="host.batchOverQuota" theme="negative" :text="$t('prw.translate.batch.over')" />
        <!-- (not enough usage: only that is said) -->
        <k-box v-else-if="dialog.mode === 'all' && !dialog.simulate" theme="negative" :text="$t('prw.translate.batch.overwrite')" />
        <!-- a dry run: everything but DeepL and saving -->
        <k-toggle-input
          :value="dialog.simulate"
          :text="$t('prw.translate.batch.simulate')"
          @input="host.batchDialog = { ...dialog, simulate: $event }"
        />
      </template>

      <!-- running and done in the same shape (two lines, the bar), so the
           centred dialog keeps its height and nothing jumps -->
      <template v-else-if="dialog.step === 'run'">
        <div class="pw-batch-dialog-lines">
          <p class="pw-batch-dialog-headline">{{ $t('prw.translate.batch.progress', { n: Math.min(batch.done + 1, batch.total), total: batch.total }) }}</p>
          <p class="pw-batch-dialog-page">{{ batch.current }}</p>
        </div>
        <div class="pw-usage-bar">
          <span :style="{ width: (batch.done / batch.total * 100) + '%' }"></span>
        </div>
      </template>

      <template v-else-if="batch.result">
        <div class="pw-batch-dialog-lines">
          <p class="pw-batch-dialog-headline">{{ $t('prw.translate.batch.done', { count: batch.result.done, chars: batch.result.doneChars.toLocaleString() }) }}</p>
          <p class="pw-batch-dialog-page">{{ batch.result.stopped ? $t('prw.translate.batch.pending', { count: batch.result.left, chars: batch.result.leftChars.toLocaleString() }) : '\u00a0' }}</p>
        </div>
        <div class="pw-usage-bar">
          <span :style="{ width: (batch.done / batch.total * 100) + '%' }"></span>
        </div>
        <k-box v-for="err in batch.result.errors" :key="err.path" theme="negative" :text="err.title + ': ' + err.message" />
      </template>
    </template>
  </k-dialog>
</template>

<script>
export default {
  props: {
    // the wizard (Overview): its batch state and actions
    host: { type: Object, required: true },
    // the panel hands this in when it opens the dialog
    visible: { type: Boolean, default: false },
  },
  computed: {
    dialog() {
      return this.host.batchDialog;
    },
    batch() {
      return this.host.batch;
    },
    usage() {
      return this.host.deeplUsage;
    },
  },
};
</script>

<style>
.pw-batch-dialog .k-dialog-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
.pw-batch-dialog-text {
  line-height: 1.5;
}
/* the headline and its line as one block, a normal line height (nothing
   cut off below) */
.pw-batch-dialog-lines {
  line-height: 1.5;
}
.pw-batch-dialog-page {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.pw-batch-dialog-headline {
  font-weight: var(--font-semi);
}
.pw-batch-dialog-help {
  color: var(--color-text-dimmed);
  font-size: var(--text-sm);
  line-height: 1.5;
}
</style>
