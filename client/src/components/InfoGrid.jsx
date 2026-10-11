export function InfoGrid({ items, cols = 2 }) {
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-slate-800">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Section({ title, children, className = '' }) {
  return (
    <section className={`card p-5 ${className}`}>
      {title && <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>}
      {children}
    </section>
  );
}
