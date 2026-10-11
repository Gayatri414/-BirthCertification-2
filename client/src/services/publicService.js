import api, { unwrap } from './api';

// stats -> { registrations, approved, hospitals, offices }
export const publicService = { stats: () => unwrap(api.get('/public/stats')) };
