<?php

use Kirby\Toolkit\V;

/**
 * The project's mail server (Project Wizard › Settings › Sending): the SMTP
 * account the website sends its mails through – for every plugin that
 * sends mails (kirby-formwizard …). The settings travel with the content
 * (content/.projectwizard/mail.json); the password only encrypted, its key
 * lives with the code (site/config/mail.key, made on the first save).
 *
 *   pwMail::ready()            everything there to send?
 *   pwMail::send([...])        Kirby's email() with the server, sender and name set
 *   pwMail::recipient()        the default recipients
 *   pwMail::used()             does an installed plugin send mails?
 *
 * A plugin that sends mails says so with its option `mail` => true
 * (kirby-formwizard, kirbyblock-contactform): only then the Project Wizard
 * shows Settings › Sending.
 */
class pwMail
{
	/** The settings with their start values (the password apart) */
	public const SETTINGS = [
		'recipient'  => '',
		'host'       => '',
		'port'       => '587',
		'security'   => 'tls',     // tls (STARTTLS), ssl – none only for a local test server
		'username'   => '',
		'sender'     => '',
		'senderName' => '',        // empty: the website's title
	];

	/** An installed plugin sends mails (its option `mail` is true) */
	public static function used(): bool
	{
		foreach (kirby()->plugins() as $plugin) {
			if (kirby()->option(str_replace('/', '.', $plugin->name()) . '.mail') === true) return true;
		}
		return false;
	}

	/**
	 * Settings taken over from elsewhere (the contact form's own mail server
	 * before it used this one) – only when nothing is set here yet. The
	 * password comes as it was stored, encrypted with the contact form's key
	 * – readable as long as there is no key of its own (see keyFile()).
	 */
	public static function adopt(array $values, ?string $encryptedPassword): bool
	{
		if (is_file(self::file())) return false;
		$stored = array_intersect_key($values, self::SETTINGS);
		if ($encryptedPassword && self::keyFile() === self::LEGACY_KEY) $stored['password'] = $encryptedPassword;
		if (!is_dir(dirname(self::file()))) mkdir(dirname(self::file()), 0755, true);
		file_put_contents(self::file(), json_encode($stored, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
		return true;
	}

	/* -------------- Settings --------------*/

	public static function file(): string
	{
		return pwConfig::projectDir() . '/mail.json';
	}

	private static function stored(): array
	{
		$file = self::file();
		$data = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
		return is_array($data) ? $data : [];
	}

	private static function values(): array
	{
		return array_merge(self::SETTINGS, array_intersect_key(self::stored(), self::SETTINGS));
	}

	/** The settings for the Panel – never the password, only whether it's there and readable */
	public static function settings(): array
	{
		$settings = self::values();
		$hasPassword = !empty(self::stored()['password']);
		$settings['password'] = $hasPassword ? (self::password() !== null ? 'stored' : 'unreadable') : 'none';
		$settings['ready'] = self::ready();
		$settings['siteTitle'] = site()->title()->value();
		return $settings;
	}

	/** Changes from the Panel: a password given is stored encrypted, an empty one keeps the stored */
	public static function save(array $changes): void
	{
		$stored = self::stored();
		foreach (self::SETTINGS as $key => $default) {
			if (array_key_exists($key, $changes)) $stored[$key] = trim((string) $changes[$key]);
		}
		if (!in_array($stored['security'] ?? 'tls', ['tls', 'ssl', 'none'], true)) $stored['security'] = 'tls';
		if (isset($stored['port']) && !ctype_digit((string) $stored['port'])) $stored['port'] = self::SETTINGS['port'];
		if (isset($changes['password']) && $changes['password'] !== '') {
			$stored['password'] = self::encrypt((string) $changes['password']);
		}
		if (!empty($changes['removePassword'])) unset($stored['password']);
		// (the start values are not stored)
		$stored = array_filter($stored, fn ($value, $key) => !(isset(self::SETTINGS[$key]) && $value === self::SETTINGS[$key]), ARRAY_FILTER_USE_BOTH);
		$file = self::file();
		if (!is_dir(dirname($file))) mkdir(dirname($file), 0755, true);
		file_put_contents($file, json_encode($stored, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
	}

	/** Everything there to send: server, user, sender and a readable password */
	public static function ready(): bool
	{
		$s = self::values();
		if ($s['host'] === '' || $s['sender'] === '' || !V::email($s['sender'])) return false;
		// (a local test server without login: no user, no password)
		if ($s['security'] === 'none') return true;
		return $s['username'] !== '' && self::password() !== null;
	}

	/** The default recipients: the address(es) set, else the sender */
	public static function recipient(): array
	{
		$s = self::values();
		return self::addresses($s['recipient'] ?: $s['sender']);
	}

	/** "a@x.de, b@x.de" → the valid addresses */
	public static function addresses(string $list): array
	{
		return array_values(array_filter(array_map('trim', preg_split('/[,;]/', $list)), fn ($a) => V::email($a)));
	}

	/* -------------- The password, encrypted --------------*/

	/** The contact form's key from before it used this server */
	private const LEGACY_KEY = 'contactform.key';

	/**
	 * The key file with the code: mail.key – or, where the contact form had
	 * its own server before, its key (the password taken over stays readable
	 * and nothing new needs to reach the other servers)
	 */
	private static function keyFile(): string
	{
		$dir = kirby()->root('config');
		if (!is_file($dir . '/mail.key') && is_file($dir . '/' . self::LEGACY_KEY)) return self::LEGACY_KEY;
		return 'mail.key';
	}

	private static function key(bool $create = false): ?string
	{
		$file = kirby()->root('config') . '/' . self::keyFile();
		if (is_file($file)) {
			$key = base64_decode(trim((string) file_get_contents($file)), true);
			if ($key !== false && strlen($key) === SODIUM_CRYPTO_SECRETBOX_KEYBYTES) return $key;
		}
		if (!$create) return null;
		$key = sodium_crypto_secretbox_keygen();
		file_put_contents($file, base64_encode($key) . "\n");
		return $key;
	}

	private static function encrypt(string $plain): string
	{
		$nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
		return base64_encode($nonce . sodium_crypto_secretbox($plain, $nonce, self::key(true)));
	}

	/** The password – null without one or when it can't be read (no key on this server) */
	private static function password(): ?string
	{
		$stored = self::stored()['password'] ?? '';
		$key = self::key();
		$raw = $stored !== '' ? base64_decode($stored, true) : false;
		if ($raw === false || $key === null || strlen($raw) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) return null;
		$plain = sodium_crypto_secretbox_open(substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), $key);
		return $plain === false ? null : $plain;
	}

	/* -------------- Sending --------------*/

	/** The SMTP transport for Kirby's email() */
	private static function transport(): array
	{
		$s = self::values();
		return [
			'type'     => 'smtp',
			'host'     => $s['host'],
			'port'     => (int) ($s['port'] ?: 587),
			'security' => ['ssl' => 'ssl', 'none' => false][$s['security']] ?? 'tls',
			'auth'     => $s['security'] !== 'none',
			'username' => $s['username'],
			'password' => (string) self::password(),
		];
	}

	/**
	 * A mail sent through the project's server: the parameters of Kirby's
	 * email() (to, subject, body, replyTo, attachments …); the transport,
	 * the sender and its name are set here. Throws when it can't be sent.
	 */
	public static function send(array $mail): void
	{
		if (!self::ready()) throw new \Exception('The mail server is not set up (Project Wizard › Settings › Sending).');
		$s = self::values();
		kirby()->email(array_merge($mail, [
			'transport' => self::transport(),
			'from'      => $s['sender'],
			'fromName'  => $mail['fromName'] ?? ($s['senderName'] ?: site()->title()->value()),
		]));
	}

	/** A test mail to an address – null when sent, else the server's answer */
	public static function test(string $to): ?string
	{
		if (!self::ready()) return t('prw.mail.status.missing');
		if (!V::email($to)) return 'No address to send to.';
		try {
			self::send([
				'to'      => $to,
				'subject' => t('prw.mail.test.subject'),
				'body'    => t('prw.mail.test.body'),
			]);
		} catch (\Throwable $e) {
			return $e->getMessage();
		}
		return null;
	}
}
