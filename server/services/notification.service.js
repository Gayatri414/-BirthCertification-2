const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendMail } = require('./mail.service');
const { sendSms } = require('./sms.service');

/**
 * Creates the in-app notification, then fans out to email and SMS.
 * A failure in any channel is logged and never breaks the workflow that triggered it.
 */
async function notify(userId, { title, message, type, application }) {
  try {
    if (!userId) return null;
    const n = await Notification.create({ user: userId, title, message, type, application });
    const user = await User.findById(userId).select('email phone');
    if (user) {
      const results = await Promise.allSettled([
        sendMail({ to: user.email, subject: `SmartBirth: ${title}`, text: message }),
        sendSms({ to: user.phone, text: `SmartBirth: ${title}. ${message}` }),
      ]);
      results.filter((r) => r.status === 'rejected').forEach((r) => console.error('Notification channel failed:', r.reason?.message));
    }
    return n;
  } catch (err) {
    console.error('Notification failed:', err.message);
    return null;
  }
}

module.exports = { notify };
