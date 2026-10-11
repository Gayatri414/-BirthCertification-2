import { STATUS_META } from '../utils/constants';

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, badge: 'bg-slate-100 text-slate-700 ring-slate-500/20', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}
