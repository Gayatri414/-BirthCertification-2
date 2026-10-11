const { z } = require('zod');

const phone = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');
const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/\d/, 'Password needs a number')
  .regex(/[^A-Za-z0-9]/, 'Password needs a special character');

const registerCitizen = z
  .object({
    name: z.string().trim().min(2, 'Full name is required').max(120),
    email,
    phone,
    password,
    confirmPassword: z.string(),
    address: z.string().trim().min(5, 'Address is required').max(400),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

const registerHospital = z
  .object({
    hospitalName: z.string().trim().min(3, 'Hospital name is required').max(160),
    registrationNumber: z.string().trim().min(4, 'Registration number is required').max(40),
    email,
    phone,
    address: z.string().trim().min(5, 'Address is required').max(400),
    authorizedPerson: z.string().trim().min(2, 'Authorized person is required').max(120),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

const login = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['USER', 'HOSPITAL', 'MUNICIPAL_OFFICER', 'SUPER_ADMIN']),
});

const verifyOtp = z.object({ email, code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits') });
const resendOtp = z.object({ email });
const forgotPassword = z.object({ email });
const resetPassword = z
  .object({ token: z.string().min(20), password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
const changePassword = z
  .object({ currentPassword: z.string().min(1, 'Current password is required'), newPassword: password })
  .refine((d) => d.currentPassword !== d.newPassword, { path: ['newPassword'], message: 'New password must differ from current password' });

const updateProfile = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: phone.optional(),
  address: z.string().trim().min(5).max(400).optional(),
}).strict();

module.exports = {
  registerCitizen, registerHospital, login, verifyOtp, resendOtp,
  forgotPassword, resetPassword, changePassword, updateProfile,
};
