import Input from '../Input';
import Select from '../Select';
import FormSection from './FormSection';

const GENDERS = [{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }];
const today = () => new Date().toISOString().slice(0, 10);

const field = (register, errors) => (name, label, props = {}) =>
  <Input label={label} error={errors[name]?.message} {...props} {...register(name)} />;

export function ChildSection({ register, errors, hospitalName }) {
  const f = field(register, errors);
  return (
    <FormSection title="Child information">
      {f('firstName', 'First name')}
      {f('middleName', 'Middle name (optional)')}
      {f('lastName', 'Last name')}
      {f('dateOfBirth', 'Date of birth', { type: 'date', max: today() })}
      {f('timeOfBirth', 'Time of birth', { type: 'time' })}
      <Select label="Gender" placeholder="Select" options={GENDERS} error={errors.gender?.message} {...register('gender')} />
      {f('birthWeightKg', 'Birth weight (kg)', { type: 'number', step: '0.01', inputMode: 'decimal' })}
      {f('birthPlace', 'Birth place')}
      <Input label="Hospital name" value={hospitalName} readOnly disabled />
    </FormSection>
  );
}

// includeEmail: only when creating (links or creates the citizen account).
export function ParentSection({ register, errors, includeEmail = false, description }) {
  const f = field(register, errors);
  return (
    <FormSection title="Parent information" description={description}>
      {f('fatherName', "Father's name")}
      {f('motherName', "Mother's name")}
      {f('guardianName', 'Guardian name (optional)')}
      {f('guardianPhone', 'Guardian mobile', { type: 'tel', inputMode: 'numeric', maxLength: 10 })}
      {includeEmail && f('parentEmail', 'Parent email (recommended)', { type: 'email' })}
      <div className="sm:col-span-2 lg:col-span-3">{f('parentAddress', 'Parent address')}</div>
    </FormSection>
  );
}

export function RegistrationSection({ register, errors, showNumber = true }) {
  const f = field(register, errors);
  return (
    <FormSection title="Registration information">
      <Input label="Registration date" value={new Date().toLocaleDateString('en-IN')} readOnly disabled />
      {f('doctorName', 'Doctor / authorized person')}
      {showNumber && f('hospitalRegistrationNumber', 'Hospital registration number')}
    </FormSection>
  );
}
