const crypto = require('crypto');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants');
const { issueOtp, verifyOtp } = require('./otp.service');
const { sendMail } = require('./mail.service');

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

async function registerCitizen(data) {
  if (await User.exists({ email: data.email })) throw ApiError.conflict('An account with this email already exists');
  const user = await User.create({
    name: data.name, email: data.email, phone: data.phone,
    password: data.password, address: data.address, role: ROLES.USER,
  });
  await issueOtp(user);
  return user;
}

async function registerHospital(data) {
  if (await User.exists({ email: data.email })) throw ApiError.conflict('An account with this email already exists');
  if (await Hospital.exists({ registrationNumber: data.registrationNumber.toUpperCase() })) {
    throw ApiError.conflict('A hospital with this registration number already exists');
  }
  const user = await User.create({
    name: data.authorizedPerson, email: data.email, phone: data.phone,
    password: data.password, address: data.address, role: ROLES.HOSPITAL,
  });
  try {
    await Hospital.create({
      user: user._id, name: data.hospitalName, registrationNumber: data.registrationNumber,
      email: data.email, phone: data.phone, address: data.address, authorizedPerson: data.authorizedPerson,
    });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // compensate (no multi-doc transactions on standalone Mongo)
    throw err;
  }
  await issueOtp(user);
  return user;
}

async function verifyAccount({ email, code }) {
  const user = await User.findOne({ email });
  if (!user) throw ApiError.badRequest('Incorrect OTP'); // do not reveal whether the email exists
  await verifyOtp(user, code, 'VERIFY_ACCOUNT');
  user.isVerified = true;
  await user.save();
  return user;
}

async function resendOtp(email) {
  const user = await User.findOne({ email, isVerified: false });
  if (user) await issueOtp(user); // silent if unknown/already verified
}

async function login({ email, password, role }) {
  const user = await User.findOne({ email }).select('+password');
  const invalid = ApiError.unauthorized('Invalid email, password or role');
  if (!user || user.role !== role) throw invalid;
  if (!(await user.comparePassword(password))) throw invalid;
  if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated. Contact support');
  if (role === ROLES.HOSPITAL) {
    const hospital = await Hospital.findOne({ user: user._id });
    if (hospital && !hospital.isActive) throw ApiError.forbidden('This hospital has been deactivated');
  }
  if (!user.isVerified) {
    throw ApiError.forbidden('Account not verified. Enter the OTP sent to you', [
      { field: 'code', message: 'ACCOUNT_NOT_VERIFIED' },
    ]);
  }
  return user;
}

async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user || !user.isActive) return; // identical response either way
  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = sha256(token);
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();
  await sendMail({
    to: user.email,
    subject: 'Reset your SmartBirth password',
    text: `Reset link (valid 30 minutes): ${env.clientUrl}/reset-password?token=${token}`,
  });
}

async function resetPassword({ token, password }) {
  const user = await User.findOne({
    passwordResetToken: sha256(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetToken +passwordResetExpires');
  if (!user) throw ApiError.badRequest('Reset link is invalid or has expired');
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  return user;
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.validation([{ field: 'currentPassword', message: 'Current password is incorrect' }]);
  }
  user.password = newPassword;
  await user.save();
  return user;
}

module.exports = {
  registerCitizen, registerHospital, verifyAccount, resendOtp,
  login, forgotPassword, resetPassword, changePassword,
};
