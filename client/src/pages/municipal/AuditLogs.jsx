import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import Select from '../../components/Select';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { municipalService } from '../../services/municipalService';
import { formatDateTime, titleCase } from '../../utils/format';
import { AUDIT_ACTION_OPTIONS } from '../../utils/constants';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [f, setF] = useState({ search: '', action: '', from: '', to: '' });
  const q = useDebounce(f.search);
  const { data, loading, error, reload } = useFetch(
    () => municipalService.auditLogs({ page, limit: 20, search: q || undefined, action: f.action || undefined, from: f.from || undefined, to: f.to || undefined }),
    [page, q, f.action, f.from, f.to]
  );
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setPage(1); };

  const columns = [
    { key: 'time', header: 'Time', render: (r) => formatDateTime(r.createdAt) },
    { key: 'actor', header: 'Actor', render: (r) => <span>{r.actor?.name || 'System'}<span className="block text-xs text-slate-400">{titleCase(r.actorRole || '')}</span></span> },
    { key: 'action', header: 'Action', render: (r) => <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px]">{r.action}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="block max-w-md whitespace-normal">{r.description}</span> },
    { key: 'ip', header: 'IP address', render: (r) => r.ipAddress },
  ];

  return (
    <>
      <PageHeader title="Audit logs" subtitle="Every review decision and certificate action is recorded." />
      <div className="card">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input className="field pl-9" placeholder="Search description / application ID" aria-label="Search logs" value={f.search} onChange={set('search')} />
          </div>
          <Select aria-label="Action" placeholder="All actions" value={f.action} onChange={set('action')} options={AUDIT_ACTION_OPTIONS.map((a) => ({ value: a, label: titleCase(a) }))} />
          <input type="date" className="field" aria-label="From" value={f.from} max={f.to || undefined} onChange={set('from')} />
          <input type="date" className="field" aria-label="To" value={f.to} min={f.from || undefined} onChange={set('to')} />
        </div>
        <DataTable columns={columns} rows={data?.items} loading={loading} error={error} onRetry={reload} emptyTitle="No log entries" emptyMessage="Nothing matches these filters." />
        <Pagination pagination={data?.pagination} onChange={setPage} />
      </div>
    </>
  );
}
