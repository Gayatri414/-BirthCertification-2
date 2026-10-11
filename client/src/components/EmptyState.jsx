import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ title = 'Nothing here yet', message, action, icon: Icon = FiInbox }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Icon className="h-7 w-7" aria-hidden /></div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
