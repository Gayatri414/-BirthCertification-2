import { useState } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';
import ApplicationTimeline from '../../components/ApplicationTimeline';
import { applicationService } from '../../services/applicationService';
import { STATUS_HELP } from '../../utils/constants';

export default function TrackApplication() {
  const [id, setId] = useState('');
  const [state, setState] = useState({ loading: false, data: null, error: '' });

  const submit = async (e) => {
    e.preventDefault();
    const value = id.trim().toUpperCase();
    if (!/^APP-\d{4}-\d{6}$/.test(value)) { setState({ loading: false, data: null, error: 'Format must be APP-YYYY-NNNNNN' }); return; }
    setState({ loading: true, data: null, error: '' });
    try { setState({ loading: false, data: await applicationService.track(value), error: '' }); }
    catch (err) { setState({ loading: false, data: null, error: err.status === 404 ? 'No application found with this ID' : err.message }); }
  };

  const { loading, data, error } = state;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <PageHeader title="Track application" subtitle="Enter your Application ID to see the current status." />
      <form onSubmit={submit} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-start" noValidate>
        <Input className="flex-1" aria-label="Application ID" placeholder="APP-2026-000001" value={id} onChange={(e) => setId(e.target.value)} error={error} />
        <Button type="submit" loading={loading}>Track</Button>
      </form>
      {data && (
        <div className="card mt-5 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono font-semibold text-slate-900">{data.applicationId}</p>
            <StatusBadge status={data.status} />
          </div>
          <p className="mb-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{STATUS_HELP[data.status]}</p>
          <ApplicationTimeline history={data.history} />
          <p className="mt-5 text-xs text-slate-400">Only the status is shown here. Sign in to see full details.</p>
        </div>
      )}
    </div>
  );
}
