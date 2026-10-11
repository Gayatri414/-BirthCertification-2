import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const btn = 'inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <nav className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row" aria-label="Pagination">
      <p className="text-sm text-slate-500">Showing <b>{from}</b>–<b>{to}</b> of <b>{total}</b></p>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}><FiChevronLeft aria-hidden /> Prev</button>
        <span className="px-2 text-sm text-slate-600">Page {page} / {totalPages}</span>
        <button className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next <FiChevronRight aria-hidden /></button>
      </div>
    </nav>
  );
}
