const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../constants');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), default: NOTIFICATION_TYPES.GENERAL },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'BirthApplication' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);
