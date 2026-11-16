<template>
  <!-- Settings › Sending: the project's mail server (pwMail) for every
       plugin that sends mails; the password only ever sent, never shown –
       stored encrypted -->
  <div class="pw-mail">
    <k-box v-if="denied" theme="notice" :text="$t('prw.mail.adminsOnly')" />
    <template v-else>
      <section class="pw-card-section">
        <div class="pw-card-heading-row">
          <h3 class="pw-card-heading">{{ $t('prw.mail.server') }}</h3>
        </div>
        <div class="pw-card pw-field-table">
          <div class="pw-element-list">
            <div v-for="row in serverRows" :key="row.key" class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col"><label class="pw-field-row-label" :for="'pw-mail-' + row.key">{{ $t('prw.mail.' + row.key) }}</label></div>
                  <div class="pw-field-row-options">
                    <input :id="'pw-mail-' + row.key" v-model="form[row.key]" :type="row.type || 'text'" class="pw-element-input pw-mail-input" :placeholder="row.placeholder" autocomplete="off" @input="dirty = true" />
                  </div>
                </span>
              </div>
            </div>
            <div class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col"><label class="pw-field-row-label">{{ $t('prw.mail.security') }}</label></div>
                  <div class="pw-field-row-options">
                    <k-toggles-input
                      :value="form.security === 'ssl' ? 'ssl' : 'tls'"
                      :options="[{ value: 'tls', text: 'STARTTLS' }, { value: 'ssl', text: 'SSL/TLS' }]"
                      :grow="false"
                      :required="true"
                      @input="form.security = $event; dirty = true"
                    />
                  </div>
                </span>
              </div>
            </div>
            <div class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col"><label class="pw-field-row-label" for="pw-mail-username">{{ $t('prw.mail.username') }}</label></div>
                  <div class="pw-field-row-options">
                    <input id="pw-mail-username" v-model="form.username" type="text" class="pw-element-input pw-mail-input" :placeholder="$t('prw.mail.username.placeholder')" autocomplete="off" @input="dirty = true" />
                  </div>
                </span>
              </div>
            </div>
            <div class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col"><label class="pw-field-row-label" for="pw-mail-password">{{ $t('prw.mail.password') }}</label></div>
                  <div class="pw-field-row-options">
                    <template v-if="settings.password !== 'none' && !changePassword">
                      <span class="pw-mail-state" :class="{ 'is-bad': settings.password === 'unreadable' }">
                        {{ $t(settings.password === 'unreadable' ? 'prw.mail.password.unreadable' : 'prw.mail.password.stored') }}
                      </span>
                      <k-button :text="$t('prw.mail.password.change')" size="xs" variant="filled" @click="changePassword = true" />
                    </template>
                    <input v-else id="pw-mail-password" v-model="form.password" type="password" class="pw-element-input pw-mail-input" autocomplete="new-password" @input="dirty = true" />
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>
        <p class="pw-favicon-note">{{ $t('prw.mail.server.help.project') }}</p>
      </section>

      <section class="pw-card-section">
        <div class="pw-card-heading-row">
          <h3 class="pw-card-heading">{{ $t('prw.mail.addresses') }}</h3>
        </div>
        <div class="pw-card pw-field-table">
          <div class="pw-element-list">
            <div v-for="row in addressRows" :key="row.key" class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col"><label class="pw-field-row-label" :for="'pw-mail-' + row.key">{{ $t('prw.mail.' + row.key) }}</label></div>
                  <div class="pw-field-row-options">
                    <input :id="'pw-mail-' + row.key" v-model="form[row.key]" type="text" class="pw-element-input pw-mail-input" :placeholder="row.placeholder" autocomplete="off" @input="dirty = true" />
                  </div>
                </span>
              </div>
            </div>
            <div class="pw-field-row">
              <div class="k-input" data-type="text">
                <span class="k-input-element pw-field-row-inner">
                  <div class="pw-field-row-label-col"><label class="pw-field-row-label">{{ $t('prw.mail.status') }}</label></div>
                  <div class="pw-field-row-options">
                    <span class="pw-mail-state" :class="settings.ready ? 'is-good' : 'is-bad'">● {{ $t(settings.ready ? 'prw.mail.status.ready' : 'prw.mail.status.missing') }}</span>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="pw-mail-actions">
          <k-button :text="$t('prw.mail.test')" variant="filled" size="sm" :disabled="busy || dirty || !settings.ready" @click="test" />
          <k-button :text="$t('prw.mail.save')" variant="filled" theme="positive" size="sm" :disabled="busy || !dirty" @click="save" />
        </div>
        <p v-if="message" class="pw-favicon-note" :class="{ 'pw-favicon-error': message.error }">{{ message.text }}</p>
        <p class="pw-favicon-note">{{ $t('prw.mail.addresses.help') }}</p>
      </section>
    </template>
  </div>
</template>

<script>
export default {
  data() {
    return {
      settings: {},
      form: { recipient: '', host: '', port: '', security: 'tls', username: '', password: '', sender: '', senderName: '' },
      dirty: false,
      busy: false,
      denied: false,
      changePassword: false,
      message: null,
    };
  },
  computed: {
    serverRows() {
      return [
        { key: 'host', placeholder: this.$t('prw.mail.host.placeholder') },
        { key: 'port', placeholder: '587' },
      ];
    },
    addressRows() {
      return [
        { key: 'sender', placeholder: this.$t('prw.mail.sender.placeholder') },
        { key: 'senderName', placeholder: this.settings.siteTitle || '' },
        { key: 'recipient', placeholder: this.form.sender || this.$t('prw.mail.recipient.placeholder') },
      ];
    },
  },
  async created() {
    try {
      this.take(await this.$api.get('projectwizard/mail'));
    } catch (e) {
      this.denied = true;
    }
  },
  methods: {
    take(settings) {
      this.settings = settings;
      for (const key of Object.keys(this.form)) this.form[key] = key === 'password' ? '' : (settings[key] || '');
      this.form.security = settings.security || 'tls';
      this.changePassword = false;
      this.dirty = false;
    },
    async save() {
      this.busy = true;
      this.message = null;
      try {
        this.take(await this.$api.post('projectwizard/mail', this.form));
        this.$panel.notification.success();
      } finally {
        this.busy = false;
      }
    },
    async test() {
      this.busy = true;
      this.message = null;
      try {
        const result = await this.$api.post('projectwizard/mail/test');
        this.message = result.error
          ? { error: true, text: this.$t('prw.mail.test.failed', { error: result.error }) }
          : { error: false, text: this.$t('prw.mail.test.sent', { email: result.sent }) };
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>

<style>
.pw-mail-input {
  width: 100%;
  max-width: 22rem;
}
.pw-mail-state {
  font-size: var(--text-sm);
  margin-right: var(--spacing-2);
}
.pw-mail-state.is-good {
  color: var(--color-positive);
}
.pw-mail-state.is-bad {
  color: var(--color-negative);
}
.pw-mail-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}
</style>
