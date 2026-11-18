/* Settings › Sending (MailSettings.vue): its state lives in the wizard,
   loaded, counted and saved with its other pages */

// (no recipient: each form has its own – the one from before stays stored)
const FIELDS = ['host', 'port', 'security', 'username', 'password', 'sender', 'senderName'];

export function mailState() {
  return { loaded: false, denied: false, settings: {}, form: Object.fromEntries(FIELDS.map((k) => [k, k === 'security' ? 'tls' : ''])), saved: '{}', changePassword: false };
}

// the server's settings into the form (the password never comes back)
export function takeMail(mail, settings) {
  mail.settings = settings;
  for (const key of FIELDS) mail.form[key] = key === 'password' ? '' : (settings[key] || '');
  mail.form.security = settings.security || 'tls';
  mail.saved = JSON.stringify(mail.form);
  mail.changePassword = false;
  mail.loaded = true;
}

export async function loadMail(api, mail) {
  try {
    takeMail(mail, await api.get('projectwizard/mail'));
  } catch (e) {
    mail.denied = true;
    mail.loaded = true;
  }
}

// how many values differ from the saved ones
export function mailPending(mail) {
  if (!mail.loaded || mail.denied) return 0;
  const saved = JSON.parse(mail.saved);
  return FIELDS.filter((k) => String(mail.form[k] || '') !== String(saved[k] || '')).length;
}

export function discardMail(mail) {
  Object.assign(mail.form, JSON.parse(mail.saved));
  mail.changePassword = false;
}

export async function saveMail(api, mail) {
  takeMail(mail, await api.post('projectwizard/mail', mail.form));
}
