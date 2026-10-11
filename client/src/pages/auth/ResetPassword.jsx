import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import AuthCard from './AuthCard';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { authService } from '../../services/authService';
import { resetSchema } from '../../validations/auth';
import { applyServerErrors } from '../../utils/forms';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(resetSchema) });
  const onSubmit = async (values) => {
    try {
      await authService.resetPassword({ ...values, token });
      toast.success('Password updated. Please sign in');
      navigate('/login', { replace: true });
    } catch (err) { applyServerErrors(err, setError); }
  };
  if (!token) return <AuthCard title="Invalid link" subtitle="This reset link is missing its token."><Link className="font-semibold text-indigo-600" to="/forgot-password">Request a new link</Link></AuthCard>;
  return (
    <AuthCard title="Set a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" loading={isSubmitting} className="w-full">Reset password</Button>
      </form>
    </AuthCard>
  );
}
