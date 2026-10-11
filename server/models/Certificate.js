const mongoose = require('mongoose');
const { CERTIFICATE_STATUS } = require('../constants');

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: { type: String, required: true, unique: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'BirthApplication', required: true, unique: true },
    verificationCode: { type: String, required: true },
    pdfPath: { type: String, required: true }, // server-side path; never exposed directly
    qrCode: { type: String }, // data URL of verification QR
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(CERTIFICATE_STATUS), default: CERTIFICATE_STATUS.VALID, index: true },
    issuingAuthority: { type: String, required: true },
    pdfHash: { type: String, required: true }, // sha256 of the stored PDF, checked on every download
    revokedReason: String,
    revokedAt: Date,
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Certificate', certificateSchema);
