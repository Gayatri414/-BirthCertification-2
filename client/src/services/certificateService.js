import api, { unwrap } from './api';

export const certificateService = {
  list: () => unwrap(api.get('/certificates')),
  get: (id) => unwrap(api.get(`/certificates/${id}`)),
  verify: (number) => unwrap(api.get(`/certificates/verify/${encodeURIComponent(number)}`)),
  revoke: (id, reason) => unwrap(api.patch(`/certificates/${id}/revoke`, { reason })),
  async download(id, filename = 'birth-certificate.pdf') {
    const res = await api.get(`/certificates/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
};
