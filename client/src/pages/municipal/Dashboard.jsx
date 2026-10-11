import { Link } from 'react-router-dom';
import { FiFileText, FiClock, FiCheckCircle, FiXCircle, FiSun } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import ErrorState from '../../components/ErrorState';
import ChartCard from '../../components/charts/ChartCard';
import { BarSeries, StatusPie } from '../../components/charts/Charts';
import useFetch from '../../hooks/useFetch';
import { municipalService } from '../../services/municipalService';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const stats = useFetch(municipalService.stats, []);
  const queue = useFetch(() => municipalService.list({ status: 'PENDING', sort: 'createdAt', limit: 5 }), []);
  const c = stats.data?.counts || {};

  const columns = [
    { key: 'applicationId', header: 'Application ID', render: (r) => <span className="font-mono text-xs font-semibold">{r.applicationId}</span> },
    { key: 'child', header: 'Child', render: (r) => r.child?.fullName },
    { key: 'hospital', header: 'Hospital', render: (r) => r.hospital?.name },
    { key: 'submitted', header: 'Submitted', render: (r) => formatDate(r.createdAt) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'go', header: '', render: (r) => <Link className="font-medium text-indigo-600 hover:underline" to={`/municipal/applications/${r._id}`}>Review</Link> },
  ];

  return (
    <>
      <PageHeader title="Municipal dashboard" subtitle={`Welcome, ${user.name}`} actions={<Link to="/municipal/applications"><Button>All applications</Button></Link>} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total applications" value={c.total} icon={FiFileText} loading={stats.loading} />
        <StatCard label="Pending verification" value={c.pendingVerification} icon={FiClock} tone="amber" loading={stats.loading} />
        <StatCard label="Approved" value={c.approved} icon={FiCheckCircle} tone="emerald" loading={stats.loading} />
        <StatCard label="Rejected" value={c.rejected} icon={FiXCircle} tone="red" loading={stats.loading} />
        <StatCard label="Today's applications" value={c.today} icon={FiSun} tone="blue" loading={stats.loading} />
      </div>
      {stats.error && <div className="card mt-6"><ErrorState error={stats.error} onRetry={stats.reload} /></div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Monthly registrations" subtitle="Last 12 months" loading={stats.loading} empty={!stats.data?.monthly?.some((m) => m.registrations)}>
          <BarSeries data={stats.data?.monthly || []} xKey="month" bars={[{ key: 'registrations', name: 'Registrations', color: '#6366f1' }]} />
        </ChartCard>
        <ChartCard title="Status distribution" loading={stats.loading} empty={!stats.data?.statusDistribution?.length}>
          <StatusPie data={stats.data?.statusDistribution || []} />
        </ChartCard>
      </div>

      <section className="card mt-6">
        <div className="px-5 py-4"><h2 className="font-semibold text-slate-900">Oldest pending applications</h2></div>
        <DataTable columns={columns} rows={queue.data?.items} loading={queue.loading} error={queue.error} onRetry={queue.reload} emptyTitle="Queue is clear" emptyMessage="No applications are waiting for review." />
      </section>
    </>
  );
}
