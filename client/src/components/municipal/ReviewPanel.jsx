import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiPlay } from 'react-icons/fi';
import Button from '../Button';
import ConfirmDialog from '../ConfirmDialog';
import CertificatePanel from './CertificatePanel';
import { municipalService } from '../../services/municipalService';
import { CHECKLIST } from '../../utils/constants';

const hint = (app, key) => {
  if (key === 'biometric') return `Applicant check: ${(app.biometricVerification?.status || 'NOT_VERIFIED').replace('_', ' ').toLowerCase()} (demo)`;
  if (key === 'identity') return `Applicant check: ${(app.identityVerification?.status || 'NOT_VERIFIED').replace('_', ' ').toLowerCase()} (demo)`;
  if (key === 'noDuplicate' && app.duplicateFlags?.length) return `${app.duplicateFlags.length} possible match(es) flagged`;
  return '';
};

export default function ReviewPanel({ app, onChanged }) {
  const [checks, setChecks] = useState(app.checklist || {});
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null); // 'approve' | 'reject' | 'resubmit'
  useEffect(() => setChecks(app.checklist || {}), [app.checklist]);

  const editable = app.status === 'UNDER_REVIEW';
  const allTicked = CHECKLIST.every((c) => checks[c.key]);
  const dirty = CHECKLIST.some((c) => !!checks[c.key] !== !!app.checklist?.[c.key]);

  const run = async (fn, successMsg) => {
    setBusy(true);
    try { await fn(); toast.success(successMsg); setDialog(null); await onChanged(); }
    catch (e) { toast.error(e.errors?.length ? e.errors.map((x) => x.message).join('. ') : e.message); }
    finally { setBusy(false); }
  };
  const persist = () => (dirty ? municipalService.review(app._id, checks) : Promise.resolve());

  if (app.status === 'APPROVED') return <CertificatePanel app={app} onChanged={onChanged} />;

  if (app.status !== 'PENDING' && app.status !== 'UNDER_REVIEW') {
    return (
      <section className="card p-5">
        <h2 className="mb-2 font-semibold text-slate-900">Decision recorded</h2>
        <p className="text-sm text-slate-600">This application is {app.status.replace('_', ' ').toLowerCase()}. {app.status === 'RESUBMISSION_REQUIRED' ? 'It returns to your queue when the hospital resubmits.' : 'No further action is possible.'}</p>
      </section>
    );
  }

  return (
    <section className="card p-5">
      <h2 className="mb-1 font-semibold text-slate-900">Verification checklist</h2>
      <p className="mb-4 text-xs text-slate-500">{editable ? 'Tick every item to enable approval.' : 'Start the review to unlock the checklist and decisions.'}</p>

      <ul className="space-y-3">
        {CHECKLIST.map(({ key, label }) => (
          <li key={key}>
            <label className={`flex items-start gap-3 text-sm ${editable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600" disabled={!editable || busy}
                checked={!!checks[key]} onChange={(e) => setChecks((c) => ({ ...c, [key]: e.target.checked }))} />
              <span><span className="font-medium text-slate-800">{label}</span>{hint(app, key) && <span className="block text-xs text-slate-500">{hint(app, key)}</span>}</span>
            </label>
          </li>
        ))}
      </ul>

      {app.status === 'PENDING' ? (
        <Button className="mt-5 w-full" loading={busy} onClick={() => run(() => municipalService.review(app._id), 'Review started')}><FiPlay aria-hidden /> Start review</Button>
      ) : (
        <div className="mt-5 space-y-2">
          {dirty && <Button variant="secondary" className="w-full" loading={busy} onClick={() => run(persist, 'Checklist saved')}>Save checklist</Button>}
          <Button variant="success" className="w-full" disabled={!allTicked || busy} onClick={() => setDialog('approve')}><FiCheck aria-hidden /> Approve</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" disabled={busy} onClick={() => setDialog('resubmit')}>Request resubmission</Button>
            <Button variant="danger" disabled={busy} onClick={() => setDialog('reject')}>Reject</Button>
          </div>
          {!allTicked && <p className="text-xs text-slate-500">Approval is disabled until the full checklist is ticked.</p>}
        </div>
      )}

      <ConfirmDialog open={dialog === 'approve'} title="Approve application?" variant="success" confirmLabel="Approve" loading={busy}
        message={`Approving ${app.applicationId} issues the birth record and notifies the family and hospital. This cannot be undone.`}
        onCancel={() => setDialog(null)} onConfirm={() => run(async () => { await persist(); await municipalService.approve(app._id); }, 'Application approved')} />
      <ConfirmDialog open={dialog === 'reject'} title="Reject application" variant="danger" confirmLabel="Reject" requireReason reasonLabel="Rejection reason" loading={busy}
        message="The reason is shown to the family and hospital and recorded in the audit log."
        onCancel={() => setDialog(null)} onConfirm={(reason) => run(() => municipalService.reject(app._id, reason), 'Application rejected')} />
      <ConfirmDialog open={dialog === 'resubmit'} title="Request resubmission" confirmLabel="Send request" requireReason reasonLabel="What needs correcting?" loading={busy}
        message="The hospital can correct the information and submit again."
        onCancel={() => setDialog(null)} onConfirm={(comments) => run(() => municipalService.requestResubmission(app._id, comments), 'Resubmission requested')} />
    </section>
  );
}
