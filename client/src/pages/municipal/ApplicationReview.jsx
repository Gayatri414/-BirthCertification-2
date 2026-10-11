import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ApplicationInfo from '../../components/ApplicationInfo';
import ApplicationTimeline from '../../components/ApplicationTimeline';
import DuplicateWarning from '../../components/municipal/DuplicateWarning';
import ReviewPanel from '../../components/municipal/ReviewPanel';
import { Section } from '../../components/InfoGrid';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import useFetch from '../../hooks/useFetch';
import { municipalService } from '../../services/municipalService';

export default function ApplicationReview() {
  const { id } = useParams();
  const { data: app, loading, error, reload } = useFetch(() => municipalService.get(id), [id]);
  if (loading && !app) return <LoadingSpinner />;
  if (error) return <div className="card"><ErrorState error={error} onRetry={reload} /></div>;

  return (
    <>
      <Link to="/municipal/applications" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"><FiArrowLeft aria-hidden /> Back to applications</Link>
      <PageHeader title={app.child?.fullName} subtitle={<span className="font-mono">{app.applicationId}</span>} actions={<StatusBadge status={app.status} />} />
      {app.rejectionReason && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800"><b>Rejection reason:</b> {app.rejectionReason}</p>}
      {app.resubmissionReason && app.status === 'RESUBMISSION_REQUIRED' && <p role="alert" className="mb-4 rounded-lg bg-orange-50 p-4 text-sm text-orange-800"><b>Corrections requested:</b> {app.resubmissionReason}</p>}
      {app.resubmissionCount > 0 && <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">Resubmitted {app.resubmissionCount} time{app.resubmissionCount > 1 ? 's' : ''} after corrections. The checklist was reset; see the timeline for what changed.</p>}
      <DuplicateWarning flags={app.duplicateFlags} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="order-2 lg:order-1 lg:col-span-2"><ApplicationInfo app={app} /></div>
        <div className="order-1 space-y-6 lg:order-2">
          <ReviewPanel app={app} onChanged={reload} />
          <Section title="Application timeline"><ApplicationTimeline history={app.history} /></Section>
        </div>
      </div>
    </>
  );
}
