import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import PageHeader from '../../components/PageHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { profileSchema } from '../../validations/auth';
import { applyServerErrors } from '../../utils/forms';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(profileSchema), defaultValues: { name: user.name, phone: user.phone || '', address: user.address || '' },
  });
  const onSubmit = async (values) => {
    try { const d = await authService.updateProfile(values); setUser(d.user); toast.success('Profile updated'); }
    catch (err) { applyServerErrors(err, setError); }
  };
  return (
    <>
      <PageHeader title="Profile" subtitle="Keep your contact details up to date." />
      <form onSubmit={handleSubmit(onSubmit)} className="card grid max-w-2xl grid-cols-1 gap-4 p-5 sm:grid-cols-2" noValidate>
        <Input className="sm:col-span-2" label="Full name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" value={user.email} disabled readOnly hint="Email cannot be changed" />
        <Input label="Mobile number" inputMode="numeric" maxLength={10} error={errors.phone?.message} {...register('phone')} />
        <Input className="sm:col-span-2" label="Address" error={errors.address?.message} {...register('address')} />
        <div className="sm:col-span-2"><Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button></div>
      </form>
    </>
  );
}
