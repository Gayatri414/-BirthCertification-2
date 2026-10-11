import { FiAward } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import CertificateCard from '../../components/CertificateCard';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingSpinner from '../../components/LoadingSpinner';
import useFetch from '../../hooks/useFetch';
import { certificateService } from '../../services/certificateService';

export default function Certificates() {
  const { data, loading, error, reload } = useFetch(certificateService.list, []);
  return (
    <>
      <PageHeader title="My certificates" subtitle="Approved birth certificates are available to download." />
      {loading ? <LoadingSpinner /> : error ? <div className="card"><ErrorState error={error} onRetry={reload} /></div> : !data?.items?.length ? (
        <div className="card"><EmptyState icon={FiAward} title="No certificates yet" message="A certificate appears here once a municipal officer approves your application." /></div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">{data.items.map((c) => <CertificateCard key={c._id} certificate={c} />)}</div>
      )}
    </>
  );
}
