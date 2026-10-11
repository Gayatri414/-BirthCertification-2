import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiAward, FiAlertTriangle, FiDownload } from 'react-icons/fi';
import Button from '../Button';
import ConfirmDialog from '../ConfirmDialog';
import StatusBadge from '../StatusBadge';
import { municipalService } from '../../services/municipalService';
import { certificateService } from '../../services/certificateService';
import { formatDate } from '../../utils/format';

// Shown to officers once an application is approved: certificate status, download, retry and revoke.
export default function CertificatePanel({ app, onChanged }) {
  const cert = app.certificate;
  const [busy, setBusy] = useState('');
  const [revoking, setRevoking] = useState(false);

  const run = async (key, fn, okMsg) => {
    setBusy(key);
    try { await fn(); if (okMsg) toast.success(okMsg); setRevoking(false); await onChanged(); }
    catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };

  if (!cert) {
    return (
      <section className="card border-amber-300 p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-amber-900"><FiAlertTriangle aria-hidden /> Certificate not generated</h2>
        <p className="text-sm text-slate-600">The application is approved, but no certificate exists yet. Generation can be retried safely; only one certificate is ever created.</p>
        <Button className="mt-4 w-full" loading={busy === 'gen'} onClick={() => run('gen', () => municipalService.generateCertificate(app._id), 'Certificate generated')}>Generate certificate</Button>
      </section>
    );
  }

  const valid = cert.status === 'VALID';
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><FiAward aria-hidden /> Certificate</h2>
        <StatusBadge status={cert.status} />
      </div>
      <p className="break-all font-mono text-sm font-bold text-indigo-700">{cert.certificateNumber}</p>
      <p className="mt-1 text-xs text-slate-500">Issued {formatDate(cert.issuedAt)}</p>
      <div className="mt-4 space-y-2">
        <Button variant="secondary" className="w-full" disabled={!valid} loading={busy === 'dl'}
          onClick={() => run('dl', () => certificateService.download(cert._id, `${cert.certificateNumber}.pdf`))}><FiDownload aria-hidden /> Download PDF</Button>
        {valid && <Button variant="danger" className="w-full" onClick={() => setRevoking(true)}>Revoke certificate</Button>}
        {!valid && <p className="text-xs text-red-700">Revoked certificates fail public verification.</p>}
      </div>
      <ConfirmDialog open={revoking} title="Revoke certificate?" variant="danger" confirmLabel="Revoke" requireReason reasonLabel="Reason for revocation" loading={busy === 'revoke'}
        message={`${cert.certificateNumber} will immediately fail public verification and can no longer be downloaded. The family and hospital are notified.`}
        onCancel={() => setRevoking(false)} onConfirm={(reason) => run('revoke', () => certificateService.revoke(cert._id, reason), 'Certificate revoked')} />
    </section>
  );
}
