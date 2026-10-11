import { Link } from 'react-router-dom';
import { FiFileText, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ErrorState from '../../components/ErrorState';
import Button from '../../components/Button';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { applicationService } from '../../services/applicationService';
import { formatDate } from '../../utils/format';

const COLORS = { Pending: '#f59e0b', 'Under review': '#3b82f6', Approved: '#10b981', Rejected: '#ef4444', Resubmission: '#f97316' };

export default function Dashboard() {
  const { user } = useAuth();
  const stats = useFetch(applicationService.stats, []);
  const recent = useFetch(() => applicationService.list({ page: 1, limit: 5, sort: '-createdAt' }), []);
  const s = stats.data || {};

  const chartData = [
    { name: 'Pending', value: s.pending }, { name: 'Under review', value: s.underReview },
    { name: 'Approved', value: s.approved }, { name: 'Rejected', value: s.rejected }, { name: 'Resubmission', value: s.resubmission },
  ].filter((d) => d.value > 0);

  const columns = [
    { key: 'applicationId', header: 'Application ID', render: (r) => <span className="font-mono text-xs font-semibold">{r.applicationId}</span> },
    { key: 'child', header: 'Child', render: (r) => r.child?.fullName },
    { key: 'dob', header: 'Date of birth', render: (r) => formatDate(r.child?.dateOfBirth) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'view', header: '', render: (r) => <Link className="font-medium text-indigo-600 hover:underline" to={`/user/application/${r._id}`}>View</Link> },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(' ')[0]}`} subtitle="Here is the latest on your child's birth registration." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={s.total} icon={FiFileText} loading={stats.loading} />
        <StatCard label="Pending" value={(s.pending || 0) + (s.underReview || 0)} icon={FiClock} tone="amber" loading={stats.loading} />
        <StatCard label="Approved" value={s.approved} icon={FiCheckCircle} tone="emerald" loading={stats.loading} />
        <StatCard label="Rejected" value={s.rejected} icon={FiXCircle} tone="red" loading={stats.loading} />
      </div>
      {stats.error && <div className="card mt-6"><ErrorState error={stats.error} onRetry={stats.reload} /></div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent applications</h2>
            <Link to="/user/applications"><Button variant="ghost" size="sm">View all</Button></Link>
          </div>
          <DataTable columns={columns} rows={recent.data?.items} loading={recent.loading} error={recent.error} onRetry={recent.reload}
            emptyTitle="No applications yet" emptyMessage="When a hospital registers your child's birth, it will appear here." />
        </section>
        <section className="card p-5">
          <h2 className="mb-2 font-semibold text-slate-900">Status overview</h2>
          {chartData.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No data to chart yet.</p> : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {chartData.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)}
                  </Pie>
                  <Tooltip /><Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
