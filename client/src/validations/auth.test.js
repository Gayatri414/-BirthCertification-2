import { describe, it, expect } from 'vitest';
import { citizenRegisterSchema, loginSchema, certificateNumberSchema, passwordRule, changePasswordSchema } from './auth';

const valid = {
  name: 'Asha Patil', email: 'Asha@Example.com', phone: '9876543210',
  password: 'Citizen@123', confirmPassword: 'Citizen@123', address: '12 MG Road, Pune',
};

describe('auth validations', () => {
  it('accepts valid citizen registration and lowercases email', () => {
    const r = citizenRegisterSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data.email).toBe('asha@example.com');
  });
  it('rejects mismatched passwords on confirmPassword', () => {
    const r = citizenRegisterSchema.safeParse({ ...valid, confirmPassword: 'Other@1234' });
    expect(r.error.issues[0].path).toEqual(['confirmPassword']);
  });
  it('rejects invalid phone numbers', () => {
    expect(citizenRegisterSchema.safeParse({ ...valid, phone: '12345' }).success).toBe(false);
    expect(citizenRegisterSchema.safeParse({ ...valid, phone: '5876543210' }).success).toBe(false);
  });
  it('enforces password strength', () => {
    ['Sh1!', 'alllowercase1!', 'ALLUPPERCASE1!', 'NoNumbers!!', 'NoSpecial123'].forEach((p) =>
      expect(passwordRule.safeParse(p).success).toBe(false));
    expect(passwordRule.safeParse('Strong@123').success).toBe(true);
  });
  it('requires a known role to log in', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x', role: 'ROOT' }).success).toBe(false);
  });
  it('validates certificate number format', () => {
    expect(certificateNumberSchema.safeParse('cert-2026-000001').success).toBe(true);
    expect(certificateNumberSchema.safeParse('12345').success).toBe(false);
  });
  it('requires new password to differ from current', () => {
    const r = changePasswordSchema.safeParse({ currentPassword: 'Same@1234', newPassword: 'Same@1234', confirmPassword: 'Same@1234' });
    expect(r.success).toBe(false);
  });
});
