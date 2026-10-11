import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiLogOut } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import NotificationDropdown from '../components/NotificationDropdown';
import { useAuth } from '../context/AuthContext';
import { NOTIFICATIONS_PATH } from '../utils/navigation';
import { ROLE_LABELS } from '../utils/constants';
import { initials } from '../utils/format';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [pathname]);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={user.role} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><FiMenu className="h-6 w-6" /></button>
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <NotificationDropdown allPath={NOTIFICATIONS_PATH[user.role]} />
            <div className="flex items-center gap-3 border-l border-slate-200 pl-2 sm:pl-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700" aria-hidden>{initials(user.name)}</span>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-[160px] truncate text-sm font-semibold leading-tight text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <button onClick={handleLogout} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600" aria-label="Log out"><FiLogOut className="h-5 w-5" /></button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8"><div className="mx-auto w-full max-w-7xl"><Outlet /></div></main>
      </div>
    </div>
  );
}
