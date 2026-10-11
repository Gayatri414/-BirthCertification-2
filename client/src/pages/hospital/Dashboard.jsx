import { Link } from 'react-router-dom';
import { FiFileText, FiClock, FiCheckCircle, FiXCircle, FiSun, FiPlusCircle } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import ErrorState from '../../components/ErrorState';
import useFetch from '../../hooks/useFetch';
import { applicationService } from '../../services/applicationService';
import { hospitalService } from '../../services/hospitalService';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const stats = useFetch(applicationService.stats, []);
  const recent = useFetch(() => hospitalService.list({ page: 1, limit: 5, sort: '-createdAt' }), []);
  const s = stats.data || {};

  const columns = [
    { key: 'applicationId', header: 'Application ID', render: (r) => <span className="font-mono text-xs font-semibold">{r.applicationId}</span> },
    { key: 'child', header: 'Child', render: (r) => r.child?.fullName },
    { key: 'submitted', header: 'Submitted', render: (r) => formatDate(r.createdAt) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'view', header: '', render: (r) => <Link className="font-medium text-indigo-600 hover:underline" to={`/hospital/registrations/${r._id}`}>View</Link> },
  ];

  return (
    <>
      <PageHeader title="Hospital dashboard" subtitle={`Signed in as ${user.name}`}
        actions={<Link to="/hospital/registrations/new"><Button><FiPlusCircle aria-hidden /> New registration</Button></Link>} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total registrations" value={s.total} icon={FiFileText} loading={stats.loading} />
        <StatCard label="Pending" value={(s.pending || 0) + (s.underReview || 0) + (s.resubmission || 0)} icon={FiClock} tone="amber" loading={stats.loading} />
        <StatCard label="Approved" value={s.approved} icon={FiCheckCircle} tone="emerald" loading={stats.loading} />
        <StatCard label="Rejected" value={s.rejected} icon={FiXCircle} tone="red" loading={stats.loading} />
        <StatCard label="Today" value={s.today} icon={FiSun} tone="blue" loading={stats.loading} />
      </div>
      {stats.error && <div className="card mt-6"><ErrorState error={stats.error} onRetry={stats.reload} /></div>}
      <section className="card mt-6">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent registrations</h2>
          <Link to="/hospital/registrations"><Button variant="ghost" size="sm">View all</Button></Link>
        </div>
        <DataTable columns={columns} rows={recent.data?.items} loading={recent.loading} error={recent.error} onRetry={recent.reload}
          emptyTitle="No registrations yet" emptyMessage="Register the first newborn to get started." />
      </section>
    </>
  );
}
