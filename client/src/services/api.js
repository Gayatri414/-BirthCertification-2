import axios from 'axios';

// Auth token lives in an httpOnly cookie set by the server; nothing sensitive is kept in localStorage.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', withCredentials: true, timeout: 20000 });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const body = err.response?.data;
    if (status === 401 && !err.config?.url?.startsWith('/auth/')) window.dispatchEvent(new Event('auth:unauthorized'));
    return Promise.reject({
      status,
      message: body?.message || (err.code === 'ECONNABORTED' ? 'Request timed out' : 'Cannot reach the server. Check your connection'),
      errors: body?.errors || [],
    });
  }
);

export const unwrap = (promise) => promise.then((r) => r.data.data);
export default api;
