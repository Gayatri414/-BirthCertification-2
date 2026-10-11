const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { sendMail } = require('./mail.service');

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MOCK_CODE = '123456'; // DEMO MODE ONLY (MOCK_OTP=true)

const hash = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

async function issueOtp(user, purpose = 'VERIFY_ACCOUNT') {
  const code = env.mock.otp ? MOCK_CODE : String(crypto.randomInt(100000, 1000000));
  user.otp = { codeHash: hash(code), expiresAt: new Date(Date.now() + OTP_TTL_MS), purpose, attempts: 0 };
  await user.save();
  await sendMail({
    to: user.email,
    subject: 'SmartBirth verification code',
    text: `Your verification code is ${code}. It expires in 10 minutes.${env.mock.otp ? ' (DEMO MODE: code is always 123456)' : ''}`,
  });
}

async function verifyOtp(user, code, purpose = 'VERIFY_ACCOUNT') {
  const otp = user.otp;
  if (!otp?.codeHash || otp.purpose !== purpose) throw ApiError.badRequest('No OTP requested. Please request a new code');
  if (otp.expiresAt < new Date()) throw ApiError.badRequest('OTP has expired. Please request a new code');
  if (otp.attempts >= MAX_ATTEMPTS) throw ApiError.badRequest('Too many incorrect attempts. Request a new code');

  const a = Buffer.from(hash(code));
  const b = Buffer.from(otp.codeHash);
  if (!crypto.timingSafeEqual(a, b)) {
    user.otp.attempts += 1;
    await user.save();
    throw ApiError.badRequest('Incorrect OTP');
  }
  user.otp = undefined;
}

module.exports = { issueOtp, verifyOtp };
