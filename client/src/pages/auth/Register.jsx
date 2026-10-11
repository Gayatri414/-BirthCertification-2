import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import AuthCard from './AuthCard';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { authService } from '../../services/authService';
import { citizenRegisterSchema, hospitalRegisterSchema } from '../../validations/auth';
import { applyServerErrors } from '../../utils/forms';

const CITIZEN_FIELDS = [
  { name: 'name', label: 'Full name', full: true, autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Mobile number', type: 'tel', autoComplete: 'tel', inputMode: 'numeric', maxLength: 10 },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', hint: '8+ chars with upper, lower, number & symbol' },
  { name: 'confirmPassword', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
  { name: 'address', label: 'Address', full: true, autoComplete: 'street-address' },
];
const HOSPITAL_FIELDS = [
  { name: 'hospitalName', label: 'Hospital name', full: true },
  { name: 'registrationNumber', label: 'Registration number' },
  { name: 'authorizedPerson', label: 'Authorized person' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', inputMode: 'numeric', maxLength: 10 },
  { name: 'address', label: 'Address', full: true },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', hint: '8+ chars with upper, lower, number & symbol' },
  { name: 'confirmPassword', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
];

function RegisterForm({ role, schema, fields }) {
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const onSubmit = async (values) => {
    try {
      const data = await authService.register({ ...values, role });
      toast.success(data.demoOtpHint || 'Registered. Check your email for the OTP');
      navigate('/verify-otp', { state: { email: values.email.toLowerCase() } });
    } catch (err) { applyServerErrors(err, setError); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
      {fields.map(({ name, full, ...rest }) => (
        <Input key={name} className={full ? 'sm:col-span-2' : ''} error={errors[name]?.message} {...rest} {...register(name)} />
      ))}
      <Button type="submit" loading={isSubmitting} className="w-full sm:col-span-2">Create account</Button>
    </form>
  );
}

export default function Register() {
  const [role, setRole] = useState('USER');
  const tab = (value, label) => (
    <button type="button" role="tab" aria-selected={role === value} onClick={() => setRole(value)}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${role === value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
  );
  return (
    <AuthCard title="Create your account" subtitle="Citizens track applications; hospitals submit registrations" footer={<>Already registered? <Link className="font-semibold text-indigo-600 hover:underline" to="/login">Sign in</Link></>}>
      <div role="tablist" className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">{tab('USER', 'Citizen / Parent')}{tab('HOSPITAL', 'Hospital')}</div>
      {role === 'USER'
        ? <RegisterForm key="u" role="USER" schema={citizenRegisterSchema} fields={CITIZEN_FIELDS} />
        : <RegisterForm key="h" role="HOSPITAL" schema={hospitalRegisterSchema} fields={HOSPITAL_FIELDS} />}
      <p className="mt-4 text-xs text-slate-400">Municipal officers and admins are created by an administrator.</p>
    </AuthCard>
  );
}
