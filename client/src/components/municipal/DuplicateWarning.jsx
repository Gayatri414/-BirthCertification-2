import { FiAlertTriangle } from 'react-icons/fi';

export default function DuplicateWarning({ flags = [] }) {
  if (!flags.length) return null;
  return (
    <div role="alert" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="flex items-center gap-2 font-semibold text-amber-900"><FiAlertTriangle aria-hidden /> Possible duplicate application</p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-amber-900">
        {flags.map((f) => <li key={f.applicationId}><span className="font-mono font-semibold">{f.applicationId}</span>: {f.reason}</li>)}
      </ul>
      <p className="mt-2 text-xs text-amber-800">This is a basic automatic match, not a fraud-detection result. Review both records before deciding.</p>
    </div>
  );
}
