import api, { unwrap } from './api';

// list(params: page, limit, unread='true') -> { items: Notification[], unreadCount, pagination }
export const notificationService = {
  list: (params) => unwrap(api.get('/notifications', { params })),
  markRead: (id) => unwrap(api.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(api.patch('/notifications/read-all')),
};
