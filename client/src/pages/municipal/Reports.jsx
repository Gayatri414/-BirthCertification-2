import { useState } from 'react';
import { FiPrinter } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import Select from '../../components/Select';
import Button from '../../components/Button';
import ErrorState from '../../components/ErrorState';
import ChartCard from '../../components/charts/ChartCard';
import { BarSeries, StatusPie } from '../../components/charts/Charts';
import useFetch from '../../hooks/useFetch';
import { municipalService } from '../../services/municipalService';

export default function Reports() {
  const [months, setMonths] = useState('6');
  const { data, loading, error, reload } = useFetch(() => municipalService.reports(months), [months]);
  if (error) return <div className="card"><ErrorState error={error} onRetry={reload} /></div>;

  return (
    <>
      <PageHeader title="Reports" subtitle="Registration and decision trends."
        actions={<>
          <Select aria-label="Period" value={months} onChange={(e) => setMonths(e.target.value)} options={[{ value: '3', label: 'Last 3 months' }, { value: '6', label: 'Last 6 months' }, { value: '12', label: 'Last 12 months' }]} />
          <Button variant="secondary" className="no-print" onClick={() => window.print()}><FiPrinter aria-hidden /> Print</Button>
        </>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly registrations" loading={loading} empty={!data?.registrations.some((r) => r.registrations)}>
          <BarSeries data={data?.registrations || []} xKey="month" bars={[{ key: 'registrations', name: 'Registrations', color: '#6366f1' }]} />
        </ChartCard>
        <ChartCard title="Approved vs rejected" subtitle="By decision date" loading={loading} empty={!data?.decisions.some((d) => d.approved || d.rejected)}>
          <BarSeries data={data?.decisions || []} xKey="month" bars={[{ key: 'approved', name: 'Approved', color: '#10b981' }, { key: 'rejected', name: 'Rejected', color: '#ef4444' }]} />
        </ChartCard>
        <ChartCard title="Applications by hospital" subtitle="Top hospitals" loading={loading} empty={!data?.hospitals.length}>
          <BarSeries data={data?.hospitals || []} xKey="hospital" horizontal bars={[{ key: 'applications', name: 'Applications', color: '#3b82f6' }]} />
        </ChartCard>
        <ChartCard title="Status distribution" loading={loading} empty={!data?.statusDistribution.length}>
          <StatusPie data={data?.statusDistribution || []} />
        </ChartCard>
      </div>
    </>
  );
}
