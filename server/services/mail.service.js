const nodemailer = require('nodemailer');
const env = require('../config/env');

// Test-only inbox so tests can read OTPs / reset links. Never populated outside NODE_ENV=test.
const outbox = [];

let transporter = null;
if (env.email.host && env.email.user) {
  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: { user: env.email.user, pass: env.email.password },
  });
}

async function sendMail({ to, subject, text }) {
  if (env.nodeEnv === 'test') { outbox.push({ to, subject, text }); return; }
  if (!transporter) {
    console.log(`\n[MOCK EMAIL] to=${to}\n  subject: ${subject}\n  ${text}\n`);
    return;
  }
  try {
    await transporter.sendMail({ from: `SmartBirth <${env.email.user}>`, to, subject, text });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

module.exports = { sendMail, outbox };
