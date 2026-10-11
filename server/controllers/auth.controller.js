const authService = require('../services/auth.service');
const audit = require('../services/audit.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { attachToken, clearToken } = require('../utils/token');
const { AUDIT_ACTIONS } = require('../constants');
const env = require('../config/env');

const registered = (res, user) =>
  sendSuccess(
    res,
    { user, otpRequired: true, demoOtpHint: env.mock.otp ? 'DEMO MODE: use OTP 123456' : undefined },
    'Registration successful. Verify the OTP sent to your email',
    201
  );

exports.registerCitizen = asyncHandler(async (req, res) => {
  const user = await authService.registerCitizen(req.body);
  await audit.log({ req, actor: user, action: AUDIT_ACTIONS.REGISTER, entityType: 'User', entityId: user._id, description: 'Citizen registered' });
  registered(res, user);
});

exports.registerHospital = asyncHandler(async (req, res) => {
  const user = await authService.registerHospital(req.body);
  await audit.log({ req, actor: user, action: AUDIT_ACTIONS.REGISTER, entityType: 'User', entityId: user._id, description: 'Hospital registered' });
  registered(res, user);
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const user = await authService.verifyAccount(req.body);
  attachToken(res, user);
  sendSuccess(res, { user }, 'Account verified');
});

exports.resendOtp = asyncHandler(async (req, res) => {
  await authService.resendOtp(req.body.email);
  sendSuccess(res, {}, 'If the account exists, a new OTP has been sent');
});

exports.login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  attachToken(res, user);
  await audit.log({ req, actor: user, action: AUDIT_ACTIONS.LOGIN, entityType: 'User', entityId: user._id, description: 'User logged in' });
  sendSuccess(res, { user }, 'Login successful');
});

exports.logout = asyncHandler(async (req, res) => {
  await audit.log({ req, action: AUDIT_ACTIONS.LOGOUT, entityType: 'User', entityId: req.user._id, description: 'User logged out' });
  clearToken(res);
  sendSuccess(res, {}, 'Logged out');
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  sendSuccess(res, {}, 'If the email is registered, a reset link has been sent');
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const user = await authService.resetPassword(req.body);
  await audit.log({ req, actor: user, action: AUDIT_ACTIONS.PASSWORD_CHANGED, entityType: 'User', entityId: user._id, description: 'Password reset via email link' });
  sendSuccess(res, {}, 'Password reset successful. Please log in');
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword(req.user._id, req.body);
  await audit.log({ req, action: AUDIT_ACTIONS.PASSWORD_CHANGED, entityType: 'User', entityId: user._id, description: 'Password changed' });
  attachToken(res, user); // reissue so the current session stays valid
  sendSuccess(res, {}, 'Password changed');
});
