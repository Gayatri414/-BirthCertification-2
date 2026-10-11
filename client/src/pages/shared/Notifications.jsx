import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiBell } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { formatDateTime } from '../../utils/format';
import { applicationPathFor } from '../../utils/navigation';
import { NOTIFICATION_META } from '../../utils/constants';

// Shared by every role: citizens, hospitals and officers.
export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, loading, error, reload } = useFetch(
    () => notificationService.list({ page, limit: 10, unread: unreadOnly ? 'true' : undefined }), [page, unreadOnly]);

  const act = async (fn) => { try { await fn(); reload(); } catch (e) { toast.error(e.message); } };
  const open = async (n) => {
    if (!n.isRead) { try { await notificationService.markRead(n._id); } catch { /* ignore */ } }
    const to = n.application ? applicationPathFor(user.role, n.application) : null;
    if (to) navigate(to); else reload();
  };
  const tab = (value, label) => (
    <button type="button" onClick={() => { setUnreadOnly(value); setPage(1); }} aria-pressed={unreadOnly === value}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${unreadOnly === value ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{label}</button>
  );

  return (
    <>
      <PageHeader title="Notifications" subtitle={data ? `${data.unreadCount} unread` : undefined}
        actions={data?.unreadCount > 0 && <Button variant="secondary" size="sm" onClick={() => act(notificationService.markAllRead)}>Mark all as read</Button>} />
      <div className="mb-4 flex gap-2">{tab(false, 'All')}{tab(true, 'Unread')}</div>
      <div className="card">
        {loading ? <LoadingSpinner /> : error ? <ErrorState error={error} onRetry={reload} /> : data.items.length === 0 ? (
          <EmptyState icon={FiBell} title={unreadOnly ? 'No unread notifications' : 'No notifications'} message="Updates about applications will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.items.map((n) => {
              const meta = NOTIFICATION_META[n.type] || NOTIFICATION_META.GENERAL;
              const linked = n.application && applicationPathFor(user.role, n.application);
              return (
                <li key={n._id} className={n.isRead ? '' : 'bg-indigo-50/40'}>
                  <div className="flex items-start gap-3 p-4">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.isRead ? 'bg-slate-300' : 'bg-indigo-500'}`} role="img" aria-label={n.isRead ? 'Read' : 'Unread'} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{n.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>{meta.label}</span>
                      </div>
                      <p className="mt-0.5 break-words text-sm text-slate-600">{n.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                      <div className="mt-2 flex gap-3 text-sm font-medium">
                        {linked && <button type="button" onClick={() => open(n)} className="text-indigo-600 hover:underline">View application</button>}
                        {!n.isRead && <button type="button" onClick={() => act(() => notificationService.markRead(n._id))} className="text-slate-500 hover:underline">Mark read</button>}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination pagination={data?.pagination} onChange={setPage} />
      </div>
    </>
  );
}
