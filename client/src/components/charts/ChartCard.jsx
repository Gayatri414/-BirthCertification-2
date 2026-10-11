import EmptyState from '../EmptyState';
import { Skeleton } from '../LoadingSpinner';

export default function ChartCard({ title, subtitle, loading, empty, children, className = '' }) {
  return (
    <section className={`card p-5 ${className}`}>
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4 h-72 w-full min-w-0">
        {loading ? <Skeleton className="h-full w-full" /> : empty ? <EmptyState title="No data yet" /> : children}
      </div>
    </section>
  );
}
