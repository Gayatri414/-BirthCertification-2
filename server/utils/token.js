const jwt = require('jsonwebtoken');
const env = require('../config/env');

const COOKIE_NAME = 'sb_token';

function parseDurationMs(str) {
  const m = /^(\d+)([smhd])$/.exec(str);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
  return Number(m[1]) * mult;
}

const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
  maxAge: parseDurationMs(env.jwtExpiresIn),
  path: '/',
});

// Token travels only in an httpOnly cookie, so JS in the browser (and XSS) cannot read it.
const attachToken = (res, user) => res.cookie(COOKIE_NAME, signToken(user), cookieOptions());
const clearToken = (res) => res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });

module.exports = { COOKIE_NAME, signToken, attachToken, clearToken };
