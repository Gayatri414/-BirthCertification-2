import { z } from 'zod';

const text = (label, min = 2) => z.string().trim().min(min, `${label} is required`);

export const MASKED_RE = /^X{4}-X{4}-\d{4}$/;

export const registrationSchema = z.object({
  firstName: text('Child first name'),
  middleName: z.string().trim().optional(),
  lastName: text('Child last name'),
  dateOfBirth: z.string().min(1, 'Date of birth is required').refine((v) => new Date(v) <= new Date(), 'Date of birth cannot be in the future'),
  timeOfBirth: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { errorMap: () => ({ message: 'Select a gender' }) }),
  birthWeightKg: z.coerce.number({ invalid_type_error: 'Enter birth weight' }).min(0.3, 'Birth weight must be between 0.3 and 8 kg').max(8, 'Birth weight must be between 0.3 and 8 kg'),
  birthPlace: text('Birth place'),
  fatherName: text("Father's name"),
  motherName: text("Mother's name"),
  guardianName: z.string().trim().optional(),
  guardianPhone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  parentEmail: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  parentAddress: text('Parent address', 5),
  doctorName: text('Doctor / authorized person'),
  hospitalRegistrationNumber: text('Hospital registration number', 4),
  maskedReference: z.string().trim().regex(MASKED_RE, 'Use the masked format XXXX-XXXX-1234').optional().or(z.literal('')),
});

export const hospitalProfileSchema = z.object({
  authorizedPerson: text('Authorized person'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  address: text('Address', 5),
});

export const FILE_RULES = { maxBytes: 5 * 1024 * 1024, types: ['application/pdf', 'image/jpeg', 'image/png'] };

// Returns an error message, or '' when the file is acceptable.
export function validateFile(file) {
  if (!file) return '';
  if (!FILE_RULES.types.includes(file.type)) return 'Only PDF, JPG or PNG files are allowed';
  if (file.size > FILE_RULES.maxBytes) return 'File must be 5 MB or smaller';
  return '';
}

const note = z.string().trim().max(500).optional().or(z.literal(''));
const phone = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

// Hospital: every clinical / parent field. Citizen: parent details only.
export const hospitalCorrectionSchema = registrationSchema
  .omit({ hospitalRegistrationNumber: true, parentEmail: true, maskedReference: true })
  .extend({ note });
export const citizenCorrectionSchema = z.object({
  fatherName: text("Father's name"),
  motherName: text("Mother's name"),
  guardianName: z.string().trim().optional(),
  guardianPhone: phone,
  parentAddress: text('Parent address', 5),
  note,
});
