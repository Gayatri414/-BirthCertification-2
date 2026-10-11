import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import PageHeader from '../../components/PageHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { authService } from '../../services/authService';
import { changePasswordSchema } from '../../validations/auth';
import { applyServerErrors } from '../../utils/forms';

export default function ChangePassword() {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(changePasswordSchema) });
  const onSubmit = async ({ currentPassword, newPassword }) => {
    try { await authService.changePassword({ currentPassword, newPassword }); toast.success('Password changed'); reset(); }
    catch (err) { applyServerErrors(err, setError); }
  };
  return (
    <>
      <PageHeader title="Change password" />
      <form onSubmit={handleSubmit(onSubmit)} className="card max-w-md space-y-4 p-5" noValidate>
        <Input label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <Input label="New password" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" loading={isSubmitting}>Update password</Button>
      </form>
    </>
  );
}
