import { Link } from 'react-router-dom';
import { FaBaby } from 'react-icons/fa';

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="SmartBirth home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"><FaBaby className="h-5 w-5" aria-hidden /></span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>Smart<span className="text-indigo-500">Birth</span></span>
    </Link>
  );
}
