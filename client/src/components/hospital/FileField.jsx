import { useId } from 'react';
import { FiUploadCloud, FiX } from 'react-icons/fi';

export default function FileField({ label, required, file, error, onChange }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label} {required && <span className="text-red-500">*</span>}</label>
      {file ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm">
          <span className="min-w-0 truncate">{file.name}</span>
          <button type="button" onClick={() => onChange(null)} className="shrink-0 text-slate-400 hover:text-red-600" aria-label={`Remove ${label}`}><FiX /></button>
        </div>
      ) : (
        <label htmlFor={id} className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50 ${error ? 'border-red-400' : 'border-slate-300'}`}>
          <FiUploadCloud aria-hidden /> Choose PDF / JPG / PNG (max 5 MB)
        </label>
      )}
      <input id={id} type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" onChange={(e) => { onChange(e.target.files?.[0] || null); e.target.value = ''; }} />
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
