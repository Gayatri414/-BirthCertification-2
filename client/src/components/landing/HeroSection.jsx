import { Link } from 'react-router-dom';
import { FiShield, FiCheckCircle } from 'react-icons/fi';
import Button from '../Button';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 text-white">
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><FiShield aria-hidden /> Secure digital government service (demo)</span>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">Online Birth Registration &amp; Digital Certificate</h1>
          <p className="mt-4 max-w-xl text-base text-indigo-100 sm:text-lg">Hospitals register newborns, municipal officers verify them, and families download an official, QR-verifiable birth certificate without visiting an office.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register"><Button size="lg" className="w-full !bg-white !text-indigo-700 hover:!bg-indigo-50 sm:w-auto">Register Birth</Button></Link>
            <Link to="/track-application"><Button size="lg" variant="secondary" className="w-full !border-white/40 !bg-transparent !text-white hover:!bg-white/10 sm:w-auto">Track Application</Button></Link>
            <Link to="/verify-certificate"><Button size="lg" variant="ghost" className="w-full !text-white hover:!bg-white/10 sm:w-auto">Verify Certificate</Button></Link>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Birth Certificate</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"><FiCheckCircle aria-hidden /> Valid</span>
            </div>
            <p className="mt-3 font-mono text-lg font-bold text-indigo-700">CERT-2026-000001</p>
            <div className="mt-4 space-y-2 text-sm">
              {[['Child', 'Aarav Sharma'], ['Date of birth', '14 Mar 2026'], ['Hospital', 'City Care Hospital']].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">{k}</span><span className="font-medium">{v}</span></div>
              ))}
            </div>
            <p className="mt-4 text-center text-[11px] text-slate-400">Sample preview. Demo data.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
