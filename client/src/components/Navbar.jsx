import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import Logo from './Logo';
import Button from './Button';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/constants';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/verify-certificate', label: 'Verify Certificate' },
  { to: '/track-application', label: 'Track Application' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const linkCls = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`;
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {LINKS.map((l) => <NavLink key={l.to} {...l} className={linkCls}>{l.label}</NavLink>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Link to={ROLE_HOME[user.role]}><Button size="sm">Go to dashboard</Button></Link>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link to="/register"><Button size="sm">Register</Button></Link>
            </>
          )}
        </div>
        <button className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {LINKS.map((l) => <NavLink key={l.to} {...l} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-3 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}>{l.label}</NavLink>)}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {user ? (
              <Link to={ROLE_HOME[user.role]} className="col-span-2" onClick={() => setOpen(false)}><Button className="w-full">Go to dashboard</Button></Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}><Button variant="secondary" className="w-full">Login</Button></Link>
                <Link to="/register" onClick={() => setOpen(false)}><Button className="w-full">Register</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
