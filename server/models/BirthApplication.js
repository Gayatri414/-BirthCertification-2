const mongoose = require('mongoose');
const { APPLICATION_STATUS } = require('../constants');

const documentSchema = new mongoose.Schema({
  kind: { type: String, enum: ['HOSPITAL_DOCUMENT', 'PARENT_ID', 'SUPPORTING'], required: true },
  originalName: String,
  storedName: String,
  mimeType: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

documentSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.storedName; return ret; }, // internal disk name is never exposed
});

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(APPLICATION_STATUS), required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: String,
    actorRole: String,
    comment: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, required: true, unique: true },
    child: {
      firstName: { type: String, required: true, trim: true },
      middleName: { type: String, trim: true },
      lastName: { type: String, required: true, trim: true },
      fullName: { type: String, index: true },
      dateOfBirth: { type: Date, required: true },
      timeOfBirth: { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm'] },
      gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
      birthWeightKg: { type: Number, required: true, min: [0.3, 'Birth weight too low'], max: [8, 'Birth weight too high'] },
      birthPlace: { type: String, required: true, trim: true },
    },
    parents: {
      fatherName: { type: String, required: true, trim: true },
      motherName: { type: String, required: true, trim: true },
      guardianName: { type: String, trim: true },
      guardianPhone: { type: String, required: true, match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'] },
      address: { type: String, required: true, trim: true },
    },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    doctorName: { type: String, required: true, trim: true },
    registrationDate: { type: Date, default: Date.now },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // parent account

    documents: [documentSchema],

    // DEMO ONLY: no real biometric/Aadhaar is ever stored.
    biometricVerification: {
      isDemo: { type: Boolean, default: true },
      status: { type: String, enum: ['NOT_VERIFIED', 'VERIFIED', 'FAILED'], default: 'NOT_VERIFIED' },
      sampleHash: String,
      verifiedAt: Date,
    },
    identityVerification: {
      isDemo: { type: Boolean, default: true },
      maskedReference: { type: String, match: [/^X{4}-X{4}-\d{4}$/, 'Use masked format XXXX-XXXX-1234'] },
      status: { type: String, enum: ['NOT_VERIFIED', 'VERIFIED', 'FAILED'], default: 'NOT_VERIFIED' },
      verifiedAt: Date,
    },

    checklist: {
      childInfo: { type: Boolean, default: false },
      parentInfo: { type: Boolean, default: false },
      hospitalInfo: { type: Boolean, default: false },
      documents: { type: Boolean, default: false },
      biometric: { type: Boolean, default: false },
      identity: { type: Boolean, default: false },
      noDuplicate: { type: Boolean, default: false },
    },
    duplicateFlags: [{ applicationId: String, reason: String }],

    status: { type: String, enum: Object.values(APPLICATION_STATUS), default: APPLICATION_STATUS.PENDING, index: true },
    resubmissionCount: { type: Number, default: 0 },
    rejectionReason: String,
    resubmissionReason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    history: [historySchema],
  },
  { timestamps: true }
);

applicationSchema.pre('validate', function (next) {
  const c = this.child;
  if (c) c.fullName = [c.firstName, c.middleName, c.lastName].filter(Boolean).join(' ');
  if (c?.dateOfBirth && c.dateOfBirth > new Date()) {
    this.invalidate('child.dateOfBirth', 'Date of birth cannot be in the future');
  }
  next();
});

applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({
  'child.fullName': 'text', applicationId: 'text',
  'parents.motherName': 'text', 'parents.fatherName': 'text',
});
// supports duplicate detection lookups
applicationSchema.index({ 'child.fullName': 1, 'child.dateOfBirth': 1, 'parents.motherName': 1, hospital: 1 });

module.exports = mongoose.model('BirthApplication', applicationSchema);
