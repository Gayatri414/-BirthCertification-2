const { z } = require('zod');
const { MASKED_RE } = require('../services/mock/verification.service');
const { APPLICATION_STATUS } = require('../constants');

// multipart bodies arrive as strings; empty optional strings are treated as "not provided"
const optional = (schema) => z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());
const text = (label, min = 2, max = 120) => z.string({ required_error: `${label} is required` }).trim().min(min, `${label} is required`).max(max);
const phone = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

const createRegistration = z.object({
  firstName: text('Child first name'),
  middleName: optional(z.string().trim().max(60)),
  lastName: text('Child last name'),
  dateOfBirth: z
    .string({ required_error: 'Date of birth is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .transform((v) => new Date(`${v}T00:00:00.000Z`))
    .refine((d) => !Number.isNaN(d.getTime()), 'Invalid date')
    .refine((d) => d.getTime() <= Date.now() + 14 * 3600 * 1000, 'Date of birth cannot be in the future'), // 14h tolerance for time zones
  timeOfBirth: z.string({ required_error: 'Time of birth is required' }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { errorMap: () => ({ message: 'Select a gender' }) }),
  birthWeightKg: z.coerce.number({ invalid_type_error: 'Enter birth weight' }).min(0.3, 'Birth weight must be between 0.3 and 8 kg').max(8, 'Birth weight must be between 0.3 and 8 kg'),
  birthPlace: text('Birth place', 2, 200),
  fatherName: text("Father's name"),
  motherName: text("Mother's name"),
  guardianName: optional(z.string().trim().max(120)),
  guardianPhone: phone,
  parentEmail: optional(z.string().trim().toLowerCase().email('Enter a valid email address')),
  parentAddress: text('Parent address', 5, 400),
  doctorName: text('Doctor / authorized person'),
  hospitalRegistrationNumber: text('Hospital registration number', 4, 40),
  maskedReference: optional(z.string().regex(MASKED_RE, 'Use the masked format XXXX-XXXX-1234')),
  biometricProof: optional(z.string()),
  identityProof: optional(z.string()),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  status: optional(z.enum(Object.values(APPLICATION_STATUS))),
  search: optional(z.string().trim().max(100)),
  from: optional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')),
  to: optional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')),
  hospital: optional(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid hospital id')),
  sort: optional(z.enum(['-createdAt', 'createdAt', 'child.fullName', '-child.fullName', '-child.dateOfBirth', 'child.dateOfBirth'])),
});

const maskedBody = z.object({ maskedReference: z.string().max(40) });
const hospitalProfile = z.object({
  phone: phone.optional(),
  address: z.string().trim().min(5).max(400).optional(),
  authorizedPerson: z.string().trim().min(2).max(120).optional(),
}).strict();

module.exports = { createRegistration, listQuery, maskedBody, hospitalProfile };

// ---- municipal review ----
const { z: _z } = require('zod');
const CHECKLIST_KEYS = ['childInfo', 'parentInfo', 'hospitalInfo', 'documents', 'biometric', 'identity', 'noDuplicate'];
const reviewBody = _z.object({
  checklist: _z.object(Object.fromEntries(CHECKLIST_KEYS.map((k) => [k, _z.boolean().optional()]))).strict().optional(),
}).strict();
const approveBody = _z.object({ comment: _z.string().trim().max(500).optional() }).strict();
const rejectBody = _z.object({ reason: _z.string({ required_error: 'A rejection reason is required' }).trim().min(10, 'Rejection reason must be at least 10 characters').max(500) }).strict();
const resubmitBody = _z.object({ comments: _z.string({ required_error: 'Comments are required' }).trim().min(10, 'Comments must be at least 10 characters').max(500) }).strict();
const auditQuery = _z.object({
  page: _z.coerce.number().int().min(1).optional(),
  limit: _z.coerce.number().int().min(1).max(50).optional(),
  action: _z.preprocess((v) => (v === '' ? undefined : v), _z.enum(Object.keys(require('../constants').AUDIT_ACTIONS)).optional()),
  search: _z.preprocess((v) => (v === '' ? undefined : v), _z.string().trim().max(100).optional()),
  from: _z.preprocess((v) => (v === '' ? undefined : v), _z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  to: _z.preprocess((v) => (v === '' ? undefined : v), _z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});
const reportQuery = _z.object({ months: _z.coerce.number().int().refine((n) => [3, 6, 12].includes(n), 'months must be 3, 6 or 12').optional() });
Object.assign(module.exports, { reviewBody, approveBody, rejectBody, resubmitBody, auditQuery, reportQuery });

// ---- corrections / resubmission ----
const note = optional(_z.string().trim().max(500));
// Hospitals may correct any clinical/parent field. Registration number, parent e-mail and demo proofs are not editable here.
const hospitalCorrection = createRegistration
  .omit({ hospitalRegistrationNumber: true, parentEmail: true, maskedReference: true, biometricProof: true, identityProof: true })
  .partial()
  .extend({ note });
// Citizens may only correct parent details.
const citizenCorrection = _z.object({
  fatherName: createRegistration.shape.fatherName.optional(),
  motherName: createRegistration.shape.motherName.optional(),
  guardianName: createRegistration.shape.guardianName,
  guardianPhone: createRegistration.shape.guardianPhone.optional(),
  parentAddress: createRegistration.shape.parentAddress.optional(),
  note,
});
Object.assign(module.exports, { hospitalCorrection, citizenCorrection });

// ---- certificates ----
const certificateList = _z.object({
  page: _z.coerce.number().int().min(1).optional(),
  limit: _z.coerce.number().int().min(1).max(50).optional(),
  status: _z.preprocess((v) => (v === '' ? undefined : v), _z.enum(['VALID', 'REVOKED']).optional()),
  search: _z.preprocess((v) => (v === '' ? undefined : v), _z.string().trim().max(40).optional()),
});
const revokeBody = _z.object({ reason: _z.string({ required_error: 'A reason is required' }).trim().min(10, 'Reason must be at least 10 characters').max(500) }).strict();
Object.assign(module.exports, { certificateList, revokeBody });
