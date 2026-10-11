import { Skeleton } from './LoadingSpinner';

const TONES = {
  indigo: 'bg-indigo-50 text-indigo-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
};

export default function StatCard({ label, value, icon: Icon, tone = 'indigo', loading = false, hint }) {
  return (
    <div className="card flex items-center gap-4 p-4 sm:p-5">
      {Icon && <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}><Icon className="h-6 w-6" aria-hidden /></div>}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-500">{label}</p>
        {loading ? <Skeleton className="mt-1 h-7 w-16" /> : <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>}
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}
