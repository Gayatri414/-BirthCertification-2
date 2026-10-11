import api, { unwrap } from './api';

export const authService = {
  me: () => unwrap(api.get('/users/me')),
  updateProfile: (data) => unwrap(api.patch('/users/me', data)),
  login: (data) => unwrap(api.post('/auth/login', data)),
  register: (data) => unwrap(api.post('/auth/register', data)),
  verifyOtp: (data) => unwrap(api.post('/auth/verify-otp', data)),
  resendOtp: (email) => unwrap(api.post('/auth/resend-otp', { email })),
  forgotPassword: (email) => unwrap(api.post('/auth/forgot-password', { email })),
  resetPassword: (data) => unwrap(api.post('/auth/reset-password', data)),
  changePassword: (data) => unwrap(api.post('/auth/change-password', data)),
  logout: () => unwrap(api.post('/auth/logout')),
};
