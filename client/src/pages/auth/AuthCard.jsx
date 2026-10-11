export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">{footer}</div>}
    </div>
  );
}
