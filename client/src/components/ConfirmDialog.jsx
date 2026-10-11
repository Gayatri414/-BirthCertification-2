import { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';

// requireReason: forces a non-empty comment (used for rejection / resubmission requests).
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', variant = 'primary', requireReason = false, reasonLabel = 'Reason', loading = false, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (open) { setReason(''); setTouched(false); } }, [open]);

  const invalid = requireReason && reason.trim().length < 5;
  const submit = () => { setTouched(true); if (!invalid) onConfirm(requireReason ? reason.trim() : undefined); };

  return (
    <Modal open={open} onClose={onCancel} title={title}
      footer={<>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant={variant} loading={loading} onClick={submit}>{confirmLabel}</Button>
      </>}>
      <p className="text-sm text-slate-600">{message}</p>
      {requireReason && (
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{reasonLabel} <span className="text-red-500">*</span></label>
          <textarea rows={3} className="field" value={reason} onChange={(e) => setReason(e.target.value)} />
          {touched && invalid && <p role="alert" className="mt-1 text-xs font-medium text-red-600">Please enter at least 5 characters.</p>}
        </div>
      )}
    </Modal>
  );
}
