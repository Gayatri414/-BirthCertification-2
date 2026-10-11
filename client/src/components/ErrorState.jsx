import { FiAlertTriangle } from 'react-icons/fi';
import Button from './Button';

export default function ErrorState({ error, onRetry }) {
  const message = typeof error === 'string' ? error : error?.message || 'Something went wrong';
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500"><FiAlertTriangle className="h-7 w-7" aria-hidden /></div>
      <h3 className="text-base font-semibold text-slate-800">Unable to load data</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
