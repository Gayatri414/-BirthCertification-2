import api, { unwrap } from './api';

// API contract (implemented in Phase 6):
//  list  -> { items: Application[], pagination: { page, limit, total, totalPages } }
//  stats -> { total, pending, underReview, approved, rejected, resubmission }
export const applicationService = {
  list: (params) => unwrap(api.get('/applications', { params })),
  get: (id) => unwrap(api.get(`/applications/${id}`)),
  stats: () => unwrap(api.get('/applications/stats')),
  async downloadDocument(id, docId, filename = 'document') {
    const res = await api.get(`/applications/${id}/documents/${docId}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
  // Corrections: multipart so documents can be replaced. Role limits are enforced by the server.
  saveCorrections: (id, formData) => unwrap(api.patch(`/applications/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })),
  resubmit: (id, formData) => unwrap(api.patch(`/applications/${id}/resubmit`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })),
  track: (applicationId) => unwrap(api.get(`/applications/track/${applicationId}`)),
};
