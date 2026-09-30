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
        <p class="pw-batch-dialog-headline">{{ $t('prw.translate.batch.confirm', { count: dialog.pages.length, lang: dialog.lang.name }) }}</p>
        <k-box theme="info" :text="usage
          ? $t('prw.translate.batch.charsfree', { chars: dialog.chars.toLocaleString(), free: Math.max(0, usage.limit - usage.count).toLocaleString() })
          : $t('prw.translate.batch.chars', { chars: dialog.chars.toLocaleString() })" />
        <k-box v-if="usage && !dialog.simulate && dialog.chars > usage.limit - usage.count" theme="negative" :text="$t('prw.translate.batch.over')" />
        <k-box v-if="dialog.mode === 'all' && !dialog.simulate" theme="notice" :text="$t('prw.translate.batch.overwrite')" />
        <p class="pw-batch-dialog-help">{{ $t('prw.translate.batch.keepopen') }}</p>
        <!-- a dry run: everything but DeepL and saving -->
        <k-toggle-input
          :value="dialog.simulate"
          :text="$t('prw.translate.batch.simulate')"
          @input="host.batchDialog = { ...dialog, simulate: $event }"
        />
      </template>

      <template v-else-if="dialog.step === 'run'">
        <p class="pw-batch-dialog-headline">{{ $t('prw.translate.batch.progress', { n: Math.min(batch.done + 1, batch.total), total: batch.total, title: batch.current }) }}</p>
        <div class="pw-usage-bar">
          <span :style="{ width: (batch.done / batch.total * 100) + '%' }"></span>
        </div>
        <p class="pw-batch-dialog-help">{{ batch.stop ? $t('prw.translate.batch.stopping') : $t('prw.translate.batch.keepopen') }}</p>
      </template>

      <template v-else-if="batch.result">
        <p class="pw-batch-dialog-headline">{{ $t(batch.result.simulated ? 'prw.translate.batch.simulated' : 'prw.translate.batch.done', { count: batch.result.done }) }}</p>
        <k-box v-if="batch.result.stopped" theme="notice" :text="$t('prw.translate.batch.stopped', { count: batch.result.left })" />
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
.pw-batch-dialog-headline {
  font-weight: var(--font-semi);
}
.pw-batch-dialog-help {
  color: var(--color-text-dimmed);
  font-size: var(--text-sm);
  line-height: 1.5;
}
</style>
