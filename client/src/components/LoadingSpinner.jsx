import { FiLoader } from 'react-icons/fi';

export default function LoadingSpinner({ label = 'Loading…', fullPage = false }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-2 text-slate-500 ${fullPage ? 'min-h-screen' : 'py-12'}`}>
      <FiLoader className="h-7 w-7 animate-spin text-indigo-600" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} aria-hidden />;
