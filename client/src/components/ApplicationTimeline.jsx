import { FiCheck, FiClock, FiX, FiAlertCircle, FiSearch, FiAward } from 'react-icons/fi';
import { STATUS_META } from '../utils/constants';
import { formatDateTime } from '../utils/format';

const ICONS = { PENDING: FiClock, UNDER_REVIEW: FiSearch, APPROVED: FiCheck, REJECTED: FiX, RESUBMISSION_REQUIRED: FiAlertCircle, CERTIFICATE: FiAward };
const RING = { PENDING: 'bg-amber-500', UNDER_REVIEW: 'bg-blue-500', APPROVED: 'bg-emerald-500', REJECTED: 'bg-red-500', RESUBMISSION_REQUIRED: 'bg-orange-500', CERTIFICATE: 'bg-indigo-500' };

// history: [{ status, at, actorName, actorRole, comment }] in chronological order
export default function ApplicationTimeline({ history = [], certificateIssuedAt }) {
  const events = [...history];
  if (certificateIssuedAt) events.push({ status: 'CERTIFICATE', at: certificateIssuedAt, actorName: 'System', comment: 'Digital birth certificate generated' });
  if (!events.length) return <p className="text-sm text-slate-500">No activity recorded yet.</p>;

  return (
    <ol className="relative space-y-6 border-l-2 border-slate-100 pl-6">
      {events.map((e, i) => {
        const Icon = ICONS[e.status] || FiClock;
        const label = e.status === 'CERTIFICATE' ? 'Certificate generated' : STATUS_META[e.status]?.label || e.status;
        const last = i === events.length - 1;
        return (
          <li key={`${e.status}-${i}`} className="relative">
            <span className={`absolute -left-[37px] flex h-7 w-7 items-center justify-center rounded-full text-white ring-4 ring-white ${RING[e.status] || 'bg-slate-400'} ${last ? 'scale-110' : ''}`}>
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">{formatDateTime(e.at)}{e.actorName ? ` · ${e.actorName}` : ''}</p>
            {e.comment && <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{e.comment}</p>}
          </li>
        );
      })}
    </ol>
  );
}
