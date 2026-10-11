import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import FormSection from './FormSection';
import Input from '../Input';
import Button from '../Button';
import { hospitalService } from '../../services/hospitalService';
import { MASKED_RE } from '../../validations/registration';

// DEMO ONLY. Calls the mock verification endpoints; no real Aadhaar/biometric data is handled.
export default function VerificationSection({ register, errors, getValues, setError, proofs, setProofs }) {
  const [busy, setBusy] = useState('');

  const runBiometric = async () => {
    setBusy('bio');
    try {
      const r = await hospitalService.mockBiometric();
      setProofs((p) => ({ ...p, biometric: { status: r.status, hash: r.sampleHash, proof: r.proof } }));
      toast.success('DEMO biometric check completed');
    } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };

  const runIdentity = async () => {
    const ref = (getValues('maskedReference') || '').trim();
    if (!MASKED_RE.test(ref)) { setError('maskedReference', { message: 'Use the masked format XXXX-XXXX-1234' }); return; }
    setBusy('id');
    try {
      const r = await hospitalService.mockAadhaar(ref);
      setProofs((p) => ({ ...p, identity: { status: r.status, ref, proof: r.proof } }));
      r.status === 'VERIFIED' ? toast.success('DEMO identity check passed') : toast.warn('DEMO identity check failed');
    } catch (e) {
      if (e.errors?.[0]?.field === 'maskedReference') setError('maskedReference', { message: e.errors[0].message }); else toast.error(e.message);
    } finally { setBusy(''); }
  };

  const Result = ({ s }) => !s ? null : s.status === 'VERIFIED'
    ? <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-700"><FiCheckCircle aria-hidden /> Verified (demo)</p>
    : <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-700"><FiXCircle aria-hidden /> Verification failed (demo)</p>;

  return (
    <FormSection title="Biometric &amp; identity verification" badge="Demo / simulated" description="No real Aadhaar number or biometric data is collected, and no government service is contacted. Verification is optional and recorded for the officer.">
      <div className="lg:col-span-1">
        <p className="mb-1.5 text-sm font-medium text-slate-700">Biometric check</p>
        <Button variant="secondary" size="sm" loading={busy === 'bio'} onClick={runBiometric}>Run mock biometric scan</Button>
        <Result s={proofs.biometric} />
        {proofs.biometric?.hash && <p className="mt-1 break-all font-mono text-[11px] text-slate-400">Sample hash: {proofs.biometric.hash.slice(0, 24)}…</p>}
      </div>
      <div className="sm:col-span-1 lg:col-span-2">
        <Input label="Masked Aadhaar / reference (demo)" placeholder="XXXX-XXXX-1234" maxLength={14} autoComplete="off"
          hint="Enter only the masked format. Never type a real Aadhaar number. Ending in 0000 simulates a failure."
          error={errors.maskedReference?.message}
          {...register('maskedReference', { onChange: () => setProofs((p) => ({ ...p, identity: undefined })) })} />
        <div className="mt-2"><Button variant="secondary" size="sm" loading={busy === 'id'} onClick={runIdentity}>Run mock identity check</Button></div>
        <Result s={proofs.identity} />
      </div>
    </FormSection>
  );
}
