import { NavLink } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { NAV_BY_ROLE } from '../utils/navigation';
import { ROLE_LABELS } from '../utils/constants';
import Logo from './Logo';

export default function Sidebar({ role, open, onClose }) {
  const items = NAV_BY_ROLE[role] || [];
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={onClose} aria-hidden />}
      <aside className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Sidebar">
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Logo />
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={onClose} aria-label="Close menu"><FiX className="h-5 w-5" /></button>
        </div>
        <p className="px-5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{ROLE_LABELS[role]}</p>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to.endsWith('dashboard') || to.endsWith('registrations')}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon className="h-5 w-5 shrink-0" aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4 text-[11px] leading-snug text-slate-400">Demo project. Not connected to any government system.</div>
      </aside>
    </>
  );
}
