import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm text-slate-400">A digital birth registration workflow connecting hospitals, municipal offices and families.</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Quick links</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/verify-certificate">Verify a certificate</Link></li>
            <li><Link className="hover:text-white" to="/track-application">Track an application</Link></li>
            <li><Link className="hover:text-white" to="/how-it-works">How it works</Link></li>
            <li><Link className="hover:text-white" to="/login">Login</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Important</h3>
          <p className="mt-3 text-sm text-slate-400">SmartBirth is an academic / portfolio demo. Aadhaar and biometric steps are simulated and no real government service is contacted. Do not enter real personal data.</p>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">© {new Date().getFullYear()} SmartBirth. Demo project.</div>
    </footer>
  );
}
