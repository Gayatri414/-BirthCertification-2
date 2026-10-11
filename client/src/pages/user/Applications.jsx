import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Select from '../../components/Select';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { applicationService } from '../../services/applicationService';
import { formatDate } from '../../utils/format';
import { STATUS_META, STATUS_OPTIONS } from '../../utils/constants';

const LIMIT = 10;

export default function Applications() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebounce(search);

  const { data, loading, error, reload } = useFetch(
    () => applicationService.list({ page, limit: LIMIT, status: status || undefined, search: q || undefined, sort: '-createdAt' }),
    [page, status, q]
  );

  const columns = [
    { key: 'applicationId', header: 'Application ID', render: (r) => <span className="font-mono text-xs font-semibold">{r.applicationId}</span> },
    { key: 'child', header: 'Child name', render: (r) => r.child?.fullName },
    { key: 'dob', header: 'Date of birth', render: (r) => formatDate(r.child?.dateOfBirth) },
    { key: 'hospital', header: 'Hospital', render: (r) => r.hospital?.name },
    { key: 'submitted', header: 'Submitted', render: (r) => formatDate(r.createdAt) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'view', header: '', render: (r) => <Link className="font-medium text-indigo-600 hover:underline" to={`/user/application/${r._id}`}>View</Link> },
  ];

  return (
    <>
      <PageHeader title="My applications" subtitle="Birth registrations linked to your account." />
      <div className="card">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input className="field pl-9" placeholder="Search by child name or application ID" aria-label="Search applications" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select aria-label="Filter by status" placeholder="All statuses" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_META[s].label }))} />
        </div>
        <DataTable columns={columns} rows={data?.items} loading={loading} error={error} onRetry={reload}
          emptyTitle="No applications found" emptyMessage="Try changing your search or filters." />
        <Pagination pagination={data?.pagination} onChange={setPage} />
      </div>
    </>
  );
}
