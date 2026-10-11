import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { notificationService } from '../services/notificationService';
import { formatDateTime } from '../utils/format';
import { applicationPathFor } from '../utils/navigation';
import { useAuth } from '../context/AuthContext';

export default function NotificationDropdown({ allPath }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unreadCount: 0 });
  const ref = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(() => {
    notificationService.list({ limit: 5 }).then(setData).catch(() => {}); // header widget fails silently
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const open_ = async (n) => {
    setOpen(false);
    if (!n.isRead) { try { await notificationService.markRead(n._id); load(); } catch { /* ignore */ } }
    const to = n.application ? applicationPathFor(user.role, n.application) : null;
    if (to) navigate(to);
  };

  const readAll = async () => { try { await notificationService.markAllRead(); load(); } catch { /* ignore */ } };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen((o) => !o); if (!open) load(); }} className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications" aria-expanded={open}>
        <FiBell className="h-5 w-5" />
        {data.unreadCount > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{data.unreadCount > 9 ? '9+' : data.unreadCount}</span>}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-50 rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {data.unreadCount > 0 && <button onClick={readAll} className="text-xs font-medium text-indigo-600 hover:underline">Mark all read</button>}
          </div>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {data.items.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up</li>}
            {data.items.map((n) => (
              <li key={n._id} className={n.isRead ? '' : 'bg-indigo-50/50'}>
                <button type="button" onClick={() => open_(n)} className="block w-full px-4 py-3 text-left hover:bg-slate-50">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-slate-500">{n.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
          <Link to={allPath} onClick={() => setOpen(false)} className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-indigo-600 hover:bg-slate-50">View all</Link>
        </div>
      )}
    </div>
  );
}
