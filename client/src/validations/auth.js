import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const phone = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

export const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/\d/, 'Password needs a number')
  .regex(/[^A-Za-z0-9]/, 'Password needs a special character');

const matchPasswords = (d) => d.password === d.confirmPassword;
const mismatch = { path: ['confirmPassword'], message: 'Passwords do not match' };

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['USER', 'HOSPITAL', 'MUNICIPAL_OFFICER', 'SUPER_ADMIN']),
});

export const citizenRegisterSchema = z
  .object({
    name: z.string().trim().min(2, 'Full name is required'),
    email, phone, password: passwordRule, confirmPassword: z.string().min(1, 'Confirm your password'),
    address: z.string().trim().min(5, 'Address is required'),
  })
  .refine(matchPasswords, mismatch);

export const hospitalRegisterSchema = z
  .object({
    hospitalName: z.string().trim().min(3, 'Hospital name is required'),
    registrationNumber: z.string().trim().min(4, 'Registration number is required'),
    email, phone,
    address: z.string().trim().min(5, 'Address is required'),
    authorizedPerson: z.string().trim().min(2, 'Authorized person is required'),
    password: passwordRule, confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine(matchPasswords, mismatch);

export const otpSchema = z.object({ email, code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') });
export const forgotSchema = z.object({ email });
export const resetSchema = z
  .object({ password: passwordRule, confirmPassword: z.string().min(1, 'Confirm your password') })
  .refine(matchPasswords, mismatch);
export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, 'Current password is required'), newPassword: passwordRule, confirmPassword: z.string().min(1, 'Confirm your password') })
  .refine((d) => d.newPassword === d.confirmPassword, mismatch)
  .refine((d) => d.currentPassword !== d.newPassword, { path: ['newPassword'], message: 'New password must differ from current password' });
export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  phone,
  address: z.string().trim().min(5, 'Address is required'),
});
export const certificateNumberSchema = z
  .string().trim().toUpperCase()
  .regex(/^CERT-\d{4}-\d{6}$/, 'Format must be CERT-YYYY-NNNNNN (e.g. CERT-2026-000001)');
