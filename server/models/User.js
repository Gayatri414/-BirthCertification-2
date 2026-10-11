const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'] },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER, index: true },
    address: { type: String, trim: true, maxlength: 400 },
    officeName: { type: String, trim: true }, // municipal officers
    employeeId: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    otp: { codeHash: String, expiresAt: Date, purpose: String, attempts: { type: Number, default: 0 } },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date();
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password; delete ret.otp; delete ret.passwordResetToken;
    delete ret.passwordResetExpires; delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
