import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPaperclip } from 'react-icons/fi';
import StatusBadge from './StatusBadge';
import Button from './Button';
import { InfoGrid, Section } from './InfoGrid';
import { applicationService } from '../services/applicationService';
import { formatDate, titleCase } from '../utils/format';

const DOC_LABELS = { HOSPITAL_DOCUMENT: 'Hospital document', PARENT_ID: 'Parent identification', SUPPORTING: 'Supporting document' };
const kb = (n) => `${Math.max(1, Math.round(n / 1024))} KB`;

// Read-only sections of an application, shared by citizen, hospital and officer screens.
export default function ApplicationInfo({ app }) {
  const [busy, setBusy] = useState(false);
  const { child = {}, parents = {}, hospital = {}, documents = [] } = app;
  const download = async (d) => {
    setBusy(true);
    try { await applicationService.downloadDocument(app._id, d._id, d.originalName); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-6">
      <Section title="Child information">
        <InfoGrid items={[['Full name', child.fullName], ['Date of birth', formatDate(child.dateOfBirth)], ['Time of birth', child.timeOfBirth], ['Gender', titleCase(child.gender)], ['Birth weight', child.birthWeightKg ? `${child.birthWeightKg} kg` : ''], ['Birth place', child.birthPlace]]} />
      </Section>
      <Section title="Parent information">
        <InfoGrid items={[["Father's name", parents.fatherName], ["Mother's name", parents.motherName], ['Guardian', parents.guardianName], ['Guardian mobile', parents.guardianPhone], ['Address', parents.address]]} />
      </Section>
      <Section title="Hospital">
        <InfoGrid items={[['Hospital', hospital.name], ['Registration no.', hospital.registrationNumber], ['Doctor / authorised person', app.doctorName], ['Registration date', formatDate(app.registrationDate)]]} />
      </Section>
      <Section title="Verification (DEMO)">
        <InfoGrid items={[
          ['Municipal status', <StatusBadge key="s" status={app.status} />], ['Reviewed on', formatDate(app.reviewedAt)],
          ['Biometric check (simulated)', titleCase(app.biometricVerification?.status)], ['Identity check (simulated)', titleCase(app.identityVerification?.status)],
          ['Identity reference (masked)', app.identityVerification?.maskedReference],
        ]} />
      </Section>
      {documents.length > 0 && (
        <Section title="Documents">
          <ul className="divide-y divide-slate-100">
            {documents.map((d) => (
              <li key={d._id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <FiPaperclip className="shrink-0 text-slate-400" aria-hidden />
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{d.originalName}</p><p className="text-xs text-slate-500">{DOC_LABELS[d.kind]} · {kb(d.size)}</p></div>
                </div>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => download(d)}>Download</Button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
