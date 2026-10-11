import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import CorrectionForm from '../../components/CorrectionForm';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import useFetch from '../../hooks/useFetch';
import { applicationService } from '../../services/applicationService';

export default function CorrectionPage({ role, detailPath }) {
  const { id } = useParams();
  const { data: app, loading, error, reload } = useFetch(() => applicationService.get(id), [id]);
  const back = detailPath(id);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card"><ErrorState error={error} onRetry={reload} /></div>;

  return (
    <>
      <Link to={back} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"><FiArrowLeft aria-hidden /> Back to application</Link>
      <PageHeader title="Correct and resubmit" subtitle={<span className="font-mono">{app.applicationId}</span>} />
      {app.status !== 'RESUBMISSION_REQUIRED'
        ? <div className="card"><EmptyState title="Nothing to correct" message="This application is not waiting for corrections." action={<Link className="font-medium text-indigo-600" to={back}>View application</Link>} /></div>
        : <CorrectionForm app={app} role={role} detailPath={back} />}
    </>
  );
}
