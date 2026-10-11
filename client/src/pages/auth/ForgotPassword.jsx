import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard from './AuthCard';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { authService } from '../../services/authService';
import { forgotSchema } from '../../validations/auth';
import { applyServerErrors } from '../../utils/forms';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotSchema) });
  const onSubmit = async ({ email }) => {
    try { await authService.forgotPassword(email); setSent(true); } catch (err) { applyServerErrors(err, setError); }
  };
  return (
    <AuthCard title="Forgot password" subtitle="We will email you a reset link" footer={<Link className="font-semibold text-indigo-600 hover:underline" to="/login">Back to sign in</Link>}>
      {sent ? (
        <p role="status" className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">If that email is registered, a reset link has been sent. It is valid for 30 minutes.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Button type="submit" loading={isSubmitting} className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthCard>
  );
}
