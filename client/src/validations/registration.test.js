import { describe, it, expect } from 'vitest';
import { registrationSchema, validateFile, hospitalCorrectionSchema, citizenCorrectionSchema } from './registration';

const valid = {
  firstName: 'Aarav', middleName: '', lastName: 'Sharma', dateOfBirth: '2026-03-14', timeOfBirth: '09:30', gender: 'MALE',
  birthWeightKg: '3.2', birthPlace: 'City Care Hospital', fatherName: 'Raj Sharma', motherName: 'Priya Sharma',
  guardianPhone: '9876543210', parentEmail: '', parentAddress: '12 MG Road, Pune', doctorName: 'Dr. Mehta',
  hospitalRegistrationNumber: 'MH-HOSP-1001', maskedReference: '',
};
const fails = (over) => registrationSchema.safeParse({ ...valid, ...over });
const field = (r) => r.error.issues[0].path[0];

describe('registration validation', () => {
  it('accepts a valid registration and coerces weight to a number', () => {
    const r = registrationSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data.birthWeightKg).toBe(3.2);
  });
  it('rejects future date of birth', () => {
    expect(field(fails({ dateOfBirth: '2999-01-01' }))).toBe('dateOfBirth');
  });
  it('rejects unreasonable birth weight', () => {
    expect(fails({ birthWeightKg: '0.1' }).success).toBe(false);
    expect(fails({ birthWeightKg: '12' }).success).toBe(false);
    expect(fails({ birthWeightKg: 'abc' }).success).toBe(false);
  });
  it('rejects real-looking Aadhaar numbers, only masked format allowed', () => {
    expect(fails({ maskedReference: '123456789012' }).success).toBe(false);
    expect(fails({ maskedReference: 'XXXX-XXXX-1234' }).success).toBe(true);
  });
  it('validates guardian phone and optional parent email', () => {
    expect(field(fails({ guardianPhone: '1234' }))).toBe('guardianPhone');
    expect(field(fails({ parentEmail: 'nope' }))).toBe('parentEmail');
  });
});

describe('file validation', () => {
  const f = (type, size) => ({ type, size });
  it('accepts PDF/JPG/PNG up to 5 MB', () => {
    expect(validateFile(f('application/pdf', 1000))).toBe('');
    expect(validateFile(f('image/png', 5 * 1024 * 1024))).toBe('');
  });
  it('rejects other types and oversized files', () => {
    expect(validateFile(f('application/x-msdownload', 10))).toMatch(/PDF, JPG or PNG/);
    expect(validateFile(f('image/jpeg', 6 * 1024 * 1024))).toMatch(/5 MB/);
  });
  it('treats no file as no error (required-ness is checked separately)', () => {
    expect(validateFile(null)).toBe('');
  });
});

describe('correction schemas', () => {
  const { hospitalRegistrationNumber, parentEmail, maskedReference, ...base } = valid;
  it('hospital correction does not require registration number or demo fields', () => {
    expect(hospitalCorrectionSchema.safeParse({ ...base, note: 'Fixed' }).success).toBe(true);
  });
  it('citizen correction only validates parent fields and ignores child fields', () => {
    const r = citizenCorrectionSchema.safeParse({ fatherName: 'Raj', motherName: 'Priya', guardianPhone: '9876543210', parentAddress: '12 MG Road', firstName: 'Hacked' });
    expect(r.success).toBe(true);
    expect(r.data.firstName).toBeUndefined();
  });
  it('citizen correction rejects an invalid phone', () => {
    expect(citizenCorrectionSchema.safeParse({ fatherName: 'Raj', motherName: 'Priya', guardianPhone: '1', parentAddress: '12 MG Road' }).success).toBe(false);
  });
});
