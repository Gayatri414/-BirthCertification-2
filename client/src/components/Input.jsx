import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input({ label, error, hint, className = '', ...props }, ref) {
  const id = useId();
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <input id={id} ref={ref} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined}
        className={`field ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : ''}`} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p id={`${id}-e`} role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
});
export default Input;
