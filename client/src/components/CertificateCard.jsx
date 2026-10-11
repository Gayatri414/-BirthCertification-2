import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiDownload, FiPrinter, FiCheckCircle } from 'react-icons/fi';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { InfoGrid } from './InfoGrid';
import { certificateService } from '../services/certificateService';
import { formatDate } from '../utils/format';

export default function CertificateCard({ certificate }) {
  const [busy, setBusy] = useState(false);
  const app = certificate.application || {};
  const download = async () => {
    setBusy(true);
    try { await certificateService.download(certificate._id, `${certificate.certificateNumber}.pdf`); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };
  return (
    <article className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 text-white">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-indigo-100">Birth Certificate</p>
          <p className="truncate font-mono text-lg font-bold">{certificate.certificateNumber}</p>
        </div>
        <StatusBadge status={certificate.status} />
      </div>
      <div className="p-5">
        {certificate.status === 'REVOKED' && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">This certificate has been revoked and is no longer valid.</p>}
        <InfoGrid items={[
          ['Child name', app.child?.fullName],
          ['Date of birth', formatDate(app.child?.dateOfBirth)],
          ['Gender', app.child?.gender],
          ['Application ID', app.applicationId],
          ['Parents', [app.parents?.fatherName, app.parents?.motherName].filter(Boolean).join(' & ')],
          ['Hospital', app.hospital?.name],
          ['Issue date', formatDate(certificate.issuedAt)],
        ]} />
        <div className="no-print mt-5 flex flex-col gap-2 sm:flex-row">
          <Button onClick={download} loading={busy} disabled={certificate.status === 'REVOKED'}><FiDownload aria-hidden /> Download PDF</Button>
          <Link to={`/user/verify-certificate?number=${certificate.certificateNumber}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <FiCheckCircle aria-hidden /> Verify
          </Link>
          <Button variant="ghost" onClick={() => window.print()}><FiPrinter aria-hidden /> Print</Button>
        </div>
      </div>
    </article>
  );
}
