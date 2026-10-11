import { Skeleton } from './LoadingSpinner';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

// columns: [{ key, header, render?(row), primary?: boolean }]
// Desktop (md+) renders a table; mobile renders stacked cards, so nothing overflows at 320px.
export default function DataTable({ columns, rows = [], loading, error, onRetry, emptyTitle, emptyMessage, rowKey = (r) => r._id }) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (loading) {
    return <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }
  if (!rows.length) return <EmptyState title={emptyTitle} message={emptyMessage} />;

  const cell = (c, row) => (c.render ? c.render(row) : row[c.key] ?? '—');
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>{columns.map((c) => <th key={c.key} scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{c.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-slate-50/70">
                {columns.map((c) => <td key={c.key} className="whitespace-nowrap px-4 py-3 text-slate-700">{cell(c, row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-slate-100 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="space-y-2 p-4">
            {columns.map((c) => (
              <div key={c.key} className="flex items-start justify-between gap-3 text-sm">
                <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">{c.header}</span>
                <span className="min-w-0 break-words text-right text-slate-700">{cell(c, row)}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
