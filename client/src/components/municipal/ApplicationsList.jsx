import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import PageHeader from '../PageHeader';
import DataTable from '../DataTable';
import Pagination from '../Pagination';
import StatusBadge from '../StatusBadge';
import Select from '../Select';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { municipalService } from '../../services/municipalService';
import { formatDate } from '../../utils/format';
import { STATUS_META, STATUS_OPTIONS } from '../../utils/constants';

const SORTS = [
  { value: '-createdAt', label: 'Newest first' }, { value: 'createdAt', label: 'Oldest first' },
  { value: 'child.fullName', label: 'Child name A–Z' }, { value: '-child.dateOfBirth', label: 'Date of birth (latest)' },
];

// fixedStatus pins the status (used by the Approved / Rejected pages).
export default function ApplicationsList({ title, subtitle, fixedStatus }) {
  const [page, setPage] = useState(1);
  const [f, setF] = useState({ search: '', status: '', from: '', to: '', hospital: '', sort: '-createdAt' });
  const [hospitals, setHospitals] = useState([]);
  const q = useDebounce(f.search);
  useEffect(() => { municipalService.hospitals().then((d) => setHospitals(d.items)).catch(() => {}); }, []);

  const status = fixedStatus || f.status;
  const { data, loading, error, reload } = useFetch(
    () => municipalService.list({ page, limit: 10, status: status || undefined, search: q || undefined, from: f.from || undefined, to: f.to || undefined, hospital: f.hospital || undefined, sort: f.sort }),
    [page, status, q, f.from, f.to, f.hospital, f.sort]
  );
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setPage(1); };

  const columns = [
    { key: 'applicationId', header: 'Application ID', render: (r) => <span className="font-mono text-xs font-semibold">{r.applicationId}</span> },
    { key: 'child', header: 'Child name', render: (r) => r.child?.fullName },
    { key: 'dob', header: 'Date of birth', render: (r) => formatDate(r.child?.dateOfBirth) },
    { key: 'hospital', header: 'Hospital', render: (r) => r.hospital?.name },
    { key: 'parent', header: 'Parent / guardian', render: (r) => r.parents?.guardianName || r.parents?.motherName },
    { key: 'submitted', header: 'Submitted', render: (r) => formatDate(r.createdAt) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: 'Actions', render: (r) => <Link className="font-medium text-indigo-600 hover:underline" to={`/municipal/applications/${r._id}`}>{['PENDING', 'UNDER_REVIEW'].includes(r.status) ? 'Review' : 'View'}</Link> },
  ];

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="card">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input className="field pl-9" placeholder="Search name / ID / parent" aria-label="Search applications" value={f.search} onChange={set('search')} />
          </div>
          {!fixedStatus && <Select aria-label="Filter by status" placeholder="All statuses" value={f.status} onChange={set('status')} options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_META[s].label }))} />}
          <Select aria-label="Filter by hospital" placeholder="All hospitals" value={f.hospital} onChange={set('hospital')} options={hospitals.map((h) => ({ value: h._id, label: h.name }))} />
          <input type="date" className="field" aria-label="Submitted from" value={f.from} max={f.to || undefined} onChange={set('from')} />
          <input type="date" className="field" aria-label="Submitted to" value={f.to} min={f.from || undefined} onChange={set('to')} />
          <Select aria-label="Sort" value={f.sort} onChange={set('sort')} options={SORTS} />
        </div>
        <DataTable columns={columns} rows={data?.items} loading={loading} error={error} onRetry={reload} emptyTitle="No applications found" emptyMessage="Try changing your search or filters." />
        <Pagination pagination={data?.pagination} onChange={setPage} />
      </div>
    </>
  );
}
