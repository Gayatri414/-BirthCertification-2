import { toast } from 'react-toastify';

// Maps API validation errors ({field,message}[]) onto react-hook-form fields.
export function applyServerErrors(err, setError) {
  let mapped = false;
  (err?.errors || []).forEach((e) => {
    if (e.field) { setError(e.field, { type: 'server', message: e.message }); mapped = true; }
  });
  if (!mapped || err?.status !== 422) toast.error(err?.message || 'Something went wrong');
}
