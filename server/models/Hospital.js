const mongoose = require('mongoose');

// Hospital profile. Login identity lives in User (role HOSPITAL).
const hospitalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    authorizedPerson: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

hospitalSchema.index({ name: 'text' });
module.exports = mongoose.model('Hospital', hospitalSchema);
