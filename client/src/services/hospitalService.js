import api, { unwrap } from './api';

export const hospitalService = {
  list: (params) => unwrap(api.get('/hospital/registrations', { params })),
  get: (id) => unwrap(api.get(`/hospital/registrations/${id}`)),
  create: (formData) => unwrap(api.post('/hospital/registrations', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })),
  mockBiometric: () => unwrap(api.post('/hospital/mock/biometric')),
  mockAadhaar: (maskedReference) => unwrap(api.post('/hospital/mock/aadhaar', { maskedReference })),
  updateProfile: (data) => unwrap(api.patch('/hospital/profile', data)),
};
