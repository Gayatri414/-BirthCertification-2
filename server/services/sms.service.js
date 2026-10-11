const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Test-only inbox. Never populated outside NODE_ENV=test.
const outbox = [];
const mask = (n) => `${'*'.repeat(Math.max(0, String(n).length - 4))}${String(n).slice(-4)}`;

/**
 * SMS channel abstraction. Only the mock provider exists, so no paid SMS API is needed.
 * To add a real gateway, add a provider here that implements send({to, text}) and select it with SMS_PROVIDER.
 */
const providers = {
  mock: {
    async send({ to, text }) {
      if (env.nodeEnv === 'test') { outbox.push({ to, text }); return; }
      console.log(`[MOCK SMS] to=${mask(to)} ${text}`); // phone masked in logs
    },
  },
};

async function sendSms({ to, text }) {
  if (!to) return;
  const provider = providers[env.smsProvider];
  if (!provider) throw new ApiError(501, `SMS provider "${env.smsProvider}" is not implemented`);
  await provider.send({ to, text: String(text).slice(0, 300) });
}

module.exports = { sendSms, outbox };
