import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiSearch } from 'react-icons/fi';
import Button from '../../components/Button';
import Input from '../../components/Input';
import StatusBadge from '../../components/StatusBadge';
import { InfoGrid } from '../../components/InfoGrid';
import PageHeader from '../../components/PageHeader';
import { certificateService } from '../../services/certificateService';
import { certificateNumberSchema } from '../../validations/auth';
import { formatDate, formatDateTime } from '../../utils/format';

// Public page, also reused inside the citizen dashboard (embedded).
export default function VerifyCertificate({ embedded = false }) {
  const params = useParams();
  const [search] = useSearchParams();
  const initial = params.certificateNumber || search.get('number') || '';
  const [number, setNumber] = useState(initial);
  const [error, setError] = useState('');
  const [state, setState] = useState({ loading: false, result: null });

  const verify = async (value = number) => {
    const parsed = certificateNumberSchema.safeParse(value);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError('');
    setState({ loading: true, result: null });
    try {
      const result = await certificateService.verify(parsed.data);
      setState({ loading: false, result });
    } catch (e) {
      setState({ loading: false, result: e.status === 404 ? { status: 'NOT_FOUND' } : { failed: e.message } });
    }
  };

  useEffect(() => { if (initial) verify(initial); /* eslint-disable-next-line */ }, []);
  const { loading, result } = state;
  const valid = result?.status === 'VALID';

  return (
    <div className={embedded ? '' : 'mx-auto max-w-2xl px-4 py-12 sm:px-6'}>
      <PageHeader title="Verify certificate" subtitle="Enter the certificate number printed on the document." />
      <div className="card p-5">
        <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
          <Input className="flex-1" aria-label="Certificate number" placeholder="CERT-2026-000001" value={number} onChange={(e) => setNumber(e.target.value)} error={error} />
          <Button type="submit" loading={loading} className="sm:mt-0"><FiSearch aria-hidden /> Verify Certificate</Button>
        </form>
      </div>

      {result && !result.failed && (
        <div className={`card mt-5 overflow-hidden border-2 ${valid ? 'border-emerald-200' : 'border-red-200'}`}>
          <div className={`flex items-center gap-3 px-5 py-4 ${valid ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {valid ? <FiCheckCircle className="h-7 w-7 text-emerald-600" /> : <FiXCircle className="h-7 w-7 text-red-600" />}
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{valid ? 'This certificate is authentic' : result.status === 'REVOKED' ? 'This certificate has been revoked' : 'No certificate found'}</p>
              <StatusBadge status={result.status} />
            </div>
          </div>
          {result.status !== 'NOT_FOUND' && (
            <div className="p-5">
              <InfoGrid items={[
                ['Certificate number', result.certificateNumber], ['Child name', result.childName],
                ['Date of birth', formatDate(result.dateOfBirth)], ['Gender', result.gender],
                ['Birth place', result.birthPlace], ['Hospital', result.hospital],
                ['Registration date', formatDate(result.registrationDate)], ['Issuing authority', result.issuingAuthority],
                ['Verified at', formatDateTime(result.verifiedAt)],
              ]} />
            </div>
          )}
        </div>
      )}
      {result?.failed && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{result.failed}</p>}
    </div>
  );
}
