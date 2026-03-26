<template>
  <k-panel-inside class="pw-wizard pw-setup">
  </k-panel-inside>
</template>

<script>
export default {
  data() {
    return {
      projectName: '',
      valetHost: '',
      isPublic: false,
      running: false,
      completed: false,
    };
  },
  async created() {
    try {
      const res = await this.$api.get('projectwizard/setup/status');
      if (res.defaults) {
        this.projectName = res.defaults.projectName || '';
        this.valetHost = res.defaults.valetHost || '';
        this.isPublic = res.defaults.isPublic || false;
      }
      this.$nextTick(() => {
        if (this.isPublic) {
          this.openSetupDialog();
        } else {
          this.openPublicWarning();
        }
      });
    } catch (e) {
      console.error('Failed to load setup status', e);
    }
  },
  methods: {
    openPublicWarning() {
      this.$panel.dialog.open({
        component: 'k-form-dialog',
        props: {
          fields: {
            info: {
              type: 'info',
              label: this.$t('prw.setup.title'),
              text: this.$t('prw.setup.publicRequired'),
              theme: 'negative',
            },
          },
          value: {},
          submitButton: false,
        },
        on: {
          cancel: () => { this.$panel.dialog.close(); window.location.href = '/panel'; },
        },
      });
    },
    openSetupDialog() {
      this.$panel.dialog.open({
        component: 'k-form-dialog',
        props: {
          fields: {
            info: {
              type: 'info',
              label: this.$t('prw.setup.title'),
              text: this.$t('prw.setup.warning'),
              theme: 'passive',
            },
          },
          value: {},
          submitButton: {
            text: this.$t('prw.setup.run'),
            theme: 'negative',
          },
        },
        on: {
          submit: () => {
            this.$panel.dialog.close();
            this.runSetup();
          },
          cancel: () => { this.$panel.dialog.close(); window.location.href = '/panel'; },
        },
      });
    },
    async runSetup() {
      this.running = true;

      // Show running dialog
      this.$panel.dialog.open({
        component: 'k-text-dialog',
        props: {
          text: '<div style="text-align:center;padding:var(--spacing-6)"><div class="pw-setup-spinner" style="width:32px;height:32px;border:3px solid var(--color-gray-300);border-top-color:var(--color-blue-600);border-radius:50%;animation:pw-spin 0.6s linear infinite;margin:0 auto var(--spacing-4)"></div><p>' + this.$t('prw.setup.step.running') + '</p></div><style>@keyframes pw-spin{to{transform:rotate(360deg)}}</style>',
          cancelButton: false,
          submitButton: false,
        },
      });

      try {
        const res = await this.$api.post('projectwizard/setup/run', {}, { timeout: 300000 });

        if (res.success) {
          this.$panel.dialog.open({
            component: 'k-text-dialog',
            props: {
              text: '<div style="text-align:center;padding:var(--spacing-6)"><div style="font-size:3rem;margin-bottom:var(--spacing-4)">&#10003;</div><h2>' + this.$t('prw.setup.complete') + '</h2><p style="color:var(--color-text-dimmed);margin-top:var(--spacing-2)">' + this.$t('prw.setup.completeHint') + '</p></div>',
              submitButton: {
                text: this.$t('prw.setup.reload'),
                icon: 'refresh',
                theme: 'positive',
              },
              cancelButton: false,
            },
            on: {
              submit: () => {
                this.$panel.dialog.close();
                window.location.reload();
              },
            },
          });
        } else {
          this.$panel.dialog.open({
            component: 'k-text-dialog',
            props: {
              text: '<div style="text-align:center;padding:var(--spacing-6)"><div style="font-size:3rem;margin-bottom:var(--spacing-4);color:var(--color-negative-600)">&#10007;</div><h2>Setup Failed</h2><p style="color:var(--color-text-dimmed);margin-top:var(--spacing-2)">Step: ' + (res.failedStep || 'unknown') + '</p><p style="font-family:var(--font-mono);font-size:var(--text-xs);margin-top:var(--spacing-2);color:var(--color-negative-600)">' + (res.error || 'Unknown error') + '</p></div>',
            },
          });
        }
      } catch (e) {
        this.$panel.dialog.open({
          component: 'k-text-dialog',
          props: {
            text: '<div style="text-align:center;padding:var(--spacing-6)"><div style="font-size:3rem;margin-bottom:var(--spacing-4);color:var(--color-negative-600)">&#10007;</div><h2>Setup Failed</h2><p style="font-family:var(--font-mono);font-size:var(--text-xs);margin-top:var(--spacing-2);color:var(--color-negative-600)">' + (e.message || 'Request failed') + '</p></div>',
          },
        });
      }
    },
  },
};
</script>

<style>
.pw-setup {
  max-width: 640px;
  margin: 0 auto;
}

.pw-setup-form {
  margin-top: var(--spacing-6);
}

.pw-setup-actions {
  padding: var(--spacing-6) var(--spacing-3);
}

.pw-setup-progress {
  margin-top: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-6);
}

.pw-setup-step {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-white);
  border-radius: var(--rounded);
  border: 1px solid var(--color-border);
}

.pw-setup-step.is-done {
  border-color: var(--color-positive-600, #16a34a);
}

.pw-setup-step.is-running {
  border-color: var(--color-blue-600);
  background: var(--color-blue-100, #eff6ff);
}

.pw-setup-step.is-error {
  border-color: var(--color-negative-600, #dc2626);
  background: var(--color-negative-100, #fef2f2);
}

.pw-setup-step-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pw-setup-step.is-done .pw-setup-step-icon {
  color: var(--color-positive-600, #16a34a);
}

.pw-setup-step.is-error .pw-setup-step-icon {
  color: var(--color-negative-600, #dc2626);
}

.pw-setup-step-label {
  font-size: var(--text-sm);
}

.pw-setup-step-error {
  font-size: var(--text-xs);
  color: var(--color-negative-600, #dc2626);
  margin-left: auto;
  font-family: var(--font-mono);
}

.pw-setup-step-pending {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-gray-300);
}

.pw-setup-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-blue-200);
  border-top-color: var(--color-blue-600);
  border-radius: 50%;
  animation: pw-spin 0.6s linear infinite;
}

@keyframes pw-spin {
  to { transform: rotate(360deg); }
}

.pw-setup-complete {
  text-align: center;
  padding: var(--spacing-12);
}

.pw-setup-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-positive-100, #f0fdf4);
  color: var(--color-positive-600, #16a34a);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-6);
}

.pw-setup-icon .k-icon {
  width: 32px;
  height: 32px;
}

.pw-setup-complete h2 {
  margin-bottom: var(--spacing-2);
}

.pw-setup-complete p {
  color: var(--color-text-dimmed);
  margin-bottom: var(--spacing-8);
}
</style>
