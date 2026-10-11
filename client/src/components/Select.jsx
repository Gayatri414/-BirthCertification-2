import { forwardRef, useId } from 'react';

const Select = forwardRef(function Select({ label, error, options = [], placeholder, className = '', ...props }, ref) {
  const id = useId();
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <select id={id} ref={ref} aria-invalid={!!error} className={`field ${error ? 'border-red-400' : ''}`} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
});
export default Select;
