const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../constants');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: String,
    action: { type: String, enum: Object.values(AUDIT_ACTIONS), required: true, index: true },
    entityType: String,
    entityId: String,
    description: String,
    ipAddress: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
module.exports = mongoose.model('AuditLog', auditLogSchema);
