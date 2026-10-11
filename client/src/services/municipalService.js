import api, { unwrap } from './api';

export const municipalService = {
  stats: () => unwrap(api.get('/municipal/stats')),
  reports: (months) => unwrap(api.get('/municipal/reports', { params: { months } })),
  hospitals: () => unwrap(api.get('/municipal/hospitals')),
  list: (params) => unwrap(api.get('/municipal/applications', { params })),
  get: (id) => unwrap(api.get(`/municipal/applications/${id}`)),
  review: (id, checklist) => unwrap(api.patch(`/municipal/applications/${id}/review`, checklist ? { checklist } : {})),
  approve: (id, comment) => unwrap(api.patch(`/municipal/applications/${id}/approve`, comment ? { comment } : {})),
  reject: (id, reason) => unwrap(api.patch(`/municipal/applications/${id}/reject`, { reason })),
  requestResubmission: (id, comments) => unwrap(api.patch(`/municipal/applications/${id}/request-resubmission`, { comments })),
  generateCertificate: (id) => unwrap(api.post(`/municipal/applications/${id}/certificate`)),
  auditLogs: (params) => unwrap(api.get('/municipal/audit-logs', { params })),
};
