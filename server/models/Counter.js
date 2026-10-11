const mongoose = require('mongoose');
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

// Atomic sequential IDs, e.g. nextId('APP-2026') -> APP-2026-000001
counterSchema.statics.nextId = async function (prefix) {
  const doc = await this.findOneAndUpdate({ key: prefix }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `${prefix}-${String(doc.seq).padStart(6, '0')}`;
};
module.exports = mongoose.model('Counter', counterSchema);
