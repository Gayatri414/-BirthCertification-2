import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import AuthCard from './AuthCard';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { otpSchema } from '../../validations/auth';
import { applyServerErrors } from '../../utils/forms';
import { ROLE_HOME } from '../../utils/constants';

export default function VerifyOtp() {
  const { state } = useLocation();
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const { register, handleSubmit, setError, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(otpSchema), defaultValues: { email: state?.email || '', code: '' },
  });

  const onSubmit = async (values) => {
    try {
      const user = await verifyOtp(values);
      toast.success('Account verified');
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (err) { applyServerErrors(err, setError); }
  };
  const resend = async () => {
    setResending(true);
    try { await authService.resendOtp(getValues('email')); toast.success('If the account exists, a new code was sent'); }
    catch (err) { toast.error(err.message); } finally { setResending(false); }
  };

  return (
    <AuthCard title="Verify your account" subtitle="Enter the 6-digit code sent to your email">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="OTP code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" error={errors.code?.message} hint="DEMO mode: the code is 123456" {...register('code')} />
        <Button type="submit" loading={isSubmitting} className="w-full">Verify</Button>
        <Button variant="ghost" loading={resending} onClick={resend} className="w-full">Resend code</Button>
      </form>
    </AuthCard>
  );
}
