import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiPlusCircle } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Select from '../../components/Select';
import Button from '../../components/Button';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { hospitalService } from '../../services/hospitalService';
import { formatDate } from '../../utils/format';
import { STATUS_META, STATUS_OPTIONS } from '../../utils/constants';

export default function Registrations() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebounce(search);

  const { data, loading, error, reload } = useFetch(
    () => hospitalService.list({ page, limit: 10, status: status || undefined, search: q || undefined, from: from || undefined, to: to || undefined, sort: '-createdAt' }),
    [page, status, q, from, to]
  );
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  const columns = [
    { key: 'applicationId', header: 'Application ID', render: (r) => <span className="font-mono text-xs font-semibold">{r.applicationId}</span> },
    { key: 'child', header: 'Child name', render: (r) => r.child?.fullName },
    { key: 'dob', header: 'Date of birth', render: (r) => formatDate(r.child?.dateOfBirth) },
    { key: 'parent', header: 'Parent / guardian', render: (r) => r.parents?.guardianName || r.parents?.motherName },
    { key: 'submitted', header: 'Submitted', render: (r) => formatDate(r.createdAt) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'view', header: '', render: (r) => <Link className="font-medium text-indigo-600 hover:underline" to={`/hospital/registrations/${r._id}`}>View</Link> },
  ];

  return (
    <>
      <PageHeader title="Birth registrations" subtitle="All registrations submitted by your hospital."
        actions={<Link to="/hospital/registrations/new"><Button><FiPlusCircle aria-hidden /> New registration</Button></Link>} />
      <div className="card">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input className="field pl-9" placeholder="Search name / ID / parent" aria-label="Search registrations" value={search} onChange={reset(setSearch)} />
          </div>
          <Select aria-label="Filter by status" placeholder="All statuses" value={status} onChange={reset(setStatus)} options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_META[s].label }))} />
          <input type="date" className="field" aria-label="Submitted from" value={from} max={to || undefined} onChange={reset(setFrom)} />
          <input type="date" className="field" aria-label="Submitted to" value={to} min={from || undefined} onChange={reset(setTo)} />
        </div>
        <DataTable columns={columns} rows={data?.items} loading={loading} error={error} onRetry={reload}
          emptyTitle="No registrations found" emptyMessage="Submit a new registration or adjust your filters." />
        <Pagination pagination={data?.pagination} onChange={setPage} />
      </div>
    </>
  );
}
