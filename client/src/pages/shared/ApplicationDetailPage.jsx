import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiDownload, FiEdit3 } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ApplicationTimeline from '../../components/ApplicationTimeline';
import ApplicationInfo from '../../components/ApplicationInfo';
import { Section } from '../../components/InfoGrid';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import Button from '../../components/Button';
import useFetch from '../../hooks/useFetch';
import { applicationService } from '../../services/applicationService';
import { certificateService } from '../../services/certificateService';

export default function ApplicationDetailPage({ backTo, backLabel, editTo }) {
  const { id } = useParams();
  const { data: app, loading, error, reload } = useFetch(() => applicationService.get(id), [id]);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card"><ErrorState error={error} onRetry={reload} /></div>;

  const { certificate } = app;
  const download = async () => {
    setBusy(true);
    try { await certificateService.download(certificate._id, `${certificate.certificateNumber}.pdf`); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"><FiArrowLeft aria-hidden /> {backLabel}</Link>
      <PageHeader title={app.child?.fullName} subtitle={<span className="font-mono">{app.applicationId}</span>}
        actions={<><StatusBadge status={app.status} />{app.status === 'RESUBMISSION_REQUIRED' && editTo && <Link to={editTo(app._id)}><Button size="sm"><FiEdit3 aria-hidden /> Correct &amp; resubmit</Button></Link>}{app.status === 'APPROVED' && certificate?.status === 'VALID' && <Button size="sm" loading={busy} onClick={download}><FiDownload aria-hidden /> Download certificate</Button>}</>} />
      {app.status === 'REJECTED' && app.rejectionReason && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800"><b>Rejection reason:</b> {app.rejectionReason}</p>}
      {app.status === 'RESUBMISSION_REQUIRED' && app.resubmissionReason && <p role="alert" className="mb-4 rounded-lg bg-orange-50 p-4 text-sm text-orange-800"><b>Corrections requested:</b> {app.resubmissionReason}</p>}
      {app.status === 'APPROVED' && !certificate && <p role="status" className="mb-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">Your application is approved. The certificate is being prepared and will appear here shortly.</p>}
      {certificate?.status === 'REVOKED' && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">Certificate {certificate.certificateNumber} has been revoked and can no longer be downloaded or verified as valid.</p>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><ApplicationInfo app={app} /></div>
        <Section title="Application timeline" className="h-fit"><ApplicationTimeline history={app.history} certificateIssuedAt={certificate?.issuedAt} /></Section>
      </div>
    </>
  );
}
