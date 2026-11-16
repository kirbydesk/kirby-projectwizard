<template>
  <!-- Blocks › Contact form › Sending: the recipient and the mail server
       (kirbyblock-contactform's API); the password only ever sent, never
       shown – stored encrypted -->
  <div class="pw-cf-mail">
    <section class="pw-card-section">
      <div class="pw-card-heading-row">
        <h3 class="pw-card-heading">{{ $t('prw.mail.recipient') }}</h3>
      </div>
      <div class="pw-card pw-field-table">
        <div class="pw-element-list">
          <div class="pw-field-row">
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col"><label class="pw-field-row-label" for="pw-cf-recipient">{{ $t('prw.mail.email') }}</label></div>
                <div class="pw-field-row-options">
                  <input id="pw-cf-recipient" v-model="form.recipient" type="text" class="pw-element-input pw-cf-mail-input" @input="dirty = true" />
                </div>
              </span>
            </div>
          </div>
        </div>
      </div>
      <p class="pw-favicon-note">{{ $t('prw.mail.recipient.help') }}</p>
    </section>

    <section class="pw-card-section">
      <div class="pw-card-heading-row">
        <h3 class="pw-card-heading">{{ $t('prw.mail.server') }}</h3>
      </div>
      <div class="pw-card pw-field-table">
        <div class="pw-element-list">
          <div v-for="row in textRows" :key="row.key" class="pw-field-row">
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col"><label class="pw-field-row-label" :for="'pw-cf-' + row.key">{{ $t('prw.mail.' + row.key) }}</label></div>
                <div class="pw-field-row-options">
                  <input :id="'pw-cf-' + row.key" v-model="form[row.key]" type="text" class="pw-element-input pw-cf-mail-input" :placeholder="row.placeholder" autocomplete="off" @input="dirty = true" />
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
                <div class="pw-field-row-label-col"><label class="pw-field-row-label" for="pw-cf-password">{{ $t('prw.mail.password') }}</label></div>
                <div class="pw-field-row-options">
                  <template v-if="settings.password !== 'none' && !changePassword">
                    <span class="pw-cf-state" :class="{ 'is-bad': settings.password === 'unreadable' }">
                      {{ $t(settings.password === 'unreadable' ? 'prw.mail.password.unreadable' : 'prw.mail.password.stored') }}
                    </span>
                    <k-button :text="$t('prw.mail.password.change')" size="xs" variant="filled" @click="changePassword = true" />
                  </template>
                  <input v-else id="pw-cf-password" v-model="form.password" type="password" class="pw-element-input pw-cf-mail-input" autocomplete="new-password" @input="dirty = true" />
                </div>
              </span>
            </div>
          </div>
          <div class="pw-field-row">
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col"><label class="pw-field-row-label" for="pw-cf-sender">{{ $t('prw.mail.sender') }}</label></div>
                <div class="pw-field-row-options">
                  <input id="pw-cf-sender" v-model="form.sender" type="text" class="pw-element-input pw-cf-mail-input" :placeholder="$t('prw.mail.sender.placeholder')" autocomplete="off" @input="dirty = true" />
                </div>
              </span>
            </div>
          </div>
          <div class="pw-field-row">
            <div class="k-input" data-type="text">
              <span class="k-input-element pw-field-row-inner">
                <div class="pw-field-row-label-col"><label class="pw-field-row-label">{{ $t('prw.mail.status') }}</label></div>
                <div class="pw-field-row-options">
                  <span class="pw-cf-state" :class="settings.ready ? 'is-good' : 'is-bad'">● {{ $t(settings.ready ? 'prw.mail.status.ready' : 'prw.mail.status.missing') }}</span>
                </div>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="pw-cf-actions">
        <k-button :text="$t('prw.mail.test')" variant="filled" size="sm" :disabled="busy || dirty || !settings.ready" @click="test" />
        <k-button :text="$t('prw.mail.save')" variant="filled" theme="positive" size="sm" :disabled="busy || !dirty" @click="save" />
      </div>
      <p v-if="message" class="pw-favicon-note" :class="{ 'pw-favicon-error': message.error }">{{ message.text }}</p>
      <p class="pw-favicon-note">{{ $t('prw.mail.server.help') }}</p>
    </section>
  </div>
</template>

<script>
export default {
  data() {
    return {
      settings: {},
      form: { recipient: '', host: '', port: '', security: 'tls', username: '', password: '', sender: '' },
      dirty: false,
      busy: false,
      changePassword: false,
      message: null,
    };
  },
  computed: {
    textRows() {
      return [
        { key: 'host', placeholder: this.$t('prw.mail.host.placeholder') },
        { key: 'port', placeholder: '587' },
        { key: 'username', placeholder: this.$t('prw.mail.username.placeholder') },
      ];
    },
  },
  async created() {
    this.take(await this.$api.get('contactform/settings'));
  },
  methods: {
    take(settings) {
      this.settings = settings;
      for (const key of ['recipient', 'host', 'port', 'security', 'username', 'sender']) this.form[key] = settings[key] || '';
      this.form.password = '';
      this.changePassword = false;
      this.dirty = false;
    },
    async save() {
      this.busy = true;
      this.message = null;
      try {
        this.take(await this.$api.post('contactform/settings', this.form));
      } finally {
        this.busy = false;
      }
    },
    async test() {
      this.busy = true;
      this.message = null;
      try {
        const result = await this.$api.post('contactform/test');
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
.pw-cf-mail-input {
  width: 100%;
  max-width: 22rem;
}
.pw-cf-state {
  font-size: var(--text-sm);
  margin-right: var(--spacing-2);
}
.pw-cf-state.is-good {
  color: var(--color-positive);
}
.pw-cf-state.is-bad {
  color: var(--color-negative);
}
.pw-cf-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}
</style>
