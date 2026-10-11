import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import AuthCard from './AuthCard';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { loginSchema } from '../../validations/auth';
import { applyServerErrors } from '../../utils/forms';
import { DEMO_ACCOUNTS, ROLE_HOME, ROLE_LABELS } from '../../utils/constants';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDemo, setShowDemo] = useState(false);
  const { register, handleSubmit, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '', role: 'USER' },
  });

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      const from = location.state?.from?.pathname;
      const base = `/${ROLE_HOME[user.role].split('/')[1]}`;
      navigate(from?.startsWith(base) ? from : ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      if (err.errors?.some((e) => e.message === 'ACCOUNT_NOT_VERIFIED')) {
        toast.info('Please verify your account with the OTP first');
        navigate('/verify-otp', { state: { email: values.email } });
        return;
      }
      applyServerErrors(err, setError);
    }
  };

  const fillDemo = (acc) => { setValue('email', acc.email); setValue('password', acc.password); setValue('role', acc.role); };

  return (
    <AuthCard title="Sign in" subtitle="Access your SmartBirth account" footer={<>New here? <Link className="font-semibold text-indigo-600 hover:underline" to="/register">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Select label="Login as" options={ROLE_OPTIONS} error={errors.role?.message} {...register('role')} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:underline">Forgot password?</Link></div>
        <Button type="submit" loading={isSubmitting} className="w-full">Sign in</Button>
      </form>

      <div className="mt-5 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3">
        <button type="button" onClick={() => setShowDemo((s) => !s)} className="w-full text-left text-xs font-semibold text-amber-900">DEMO accounts (fill the form) {showDemo ? '−' : '+'}</button>
        {showDemo && (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((a) => <button key={a.role} type="button" onClick={() => fillDemo(a)} className="rounded-md bg-white px-2 py-1.5 text-left text-xs text-slate-700 ring-1 ring-amber-200 hover:bg-amber-100">{ROLE_LABELS[a.role]}</button>)}
          </div>
        )}
      </div>
    </AuthCard>
  );
}
