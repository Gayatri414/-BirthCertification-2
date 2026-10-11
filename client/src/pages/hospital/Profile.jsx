import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import PageHeader from '../../components/PageHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import StatusBadge from '../../components/StatusBadge';
import useFetch from '../../hooks/useFetch';
import { authService } from '../../services/authService';
import { hospitalService } from '../../services/hospitalService';
import { hospitalProfileSchema } from '../../validations/registration';
import { applyServerErrors } from '../../utils/forms';

function ProfileForm({ hospital, onSaved }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(hospitalProfileSchema),
    defaultValues: { authorizedPerson: hospital.authorizedPerson, phone: hospital.phone, address: hospital.address },
  });
  const onSubmit = async (values) => {
    try { await hospitalService.updateProfile(values); toast.success('Hospital profile updated'); onSaved(); }
    catch (err) { applyServerErrors(err, setError); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card grid max-w-3xl grid-cols-1 gap-4 p-5 sm:grid-cols-2" noValidate>
      <Input label="Hospital name" value={hospital.name} disabled readOnly />
      <Input label="Registration number" value={hospital.registrationNumber} disabled readOnly />
      <Input label="Email" value={hospital.email} disabled readOnly hint="Contact an administrator to change these" />
      <div className="flex items-end pb-1"><StatusBadge status={hospital.isActive ? 'VALID' : 'REVOKED'} /><span className="ml-2 text-sm text-slate-500">{hospital.isActive ? 'Active' : 'Deactivated'}</span></div>
      <Input label="Authorized person" error={errors.authorizedPerson?.message} {...register('authorizedPerson')} />
      <Input label="Phone" inputMode="numeric" maxLength={10} error={errors.phone?.message} {...register('phone')} />
      <Input className="sm:col-span-2" label="Address" error={errors.address?.message} {...register('address')} />
      <div className="sm:col-span-2"><Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button></div>
    </form>
  );
}

export default function Profile() {
  const { data, loading, error, reload } = useFetch(authService.me, []);
  return (
    <>
      <PageHeader title="Hospital profile" />
      {loading ? <LoadingSpinner /> : error ? <div className="card"><ErrorState error={error} onRetry={reload} /></div> : <ProfileForm key={data.hospital._id} hospital={data.hospital} onSaved={reload} />}
    </>
  );
}
