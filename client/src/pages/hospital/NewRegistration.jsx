import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import FormSection from '../../components/hospital/FormSection';
import FileField from '../../components/hospital/FileField';
import VerificationSection from '../../components/hospital/VerificationSection';
import { ChildSection, ParentSection, RegistrationSection } from '../../components/hospital/RegistrationFields';
import useFetch from '../../hooks/useFetch';
import { authService } from '../../services/authService';
import { hospitalService } from '../../services/hospitalService';
import { registrationSchema, validateFile } from '../../validations/registration';
import { applyServerErrors } from '../../utils/forms';

const FILE_FIELDS = [
  { name: 'hospitalDocument', label: 'Hospital document', required: true },
  { name: 'parentId', label: 'Parent identification document' },
  { name: 'supportingDocument', label: 'Supporting document' },
];

function RegistrationForm({ hospital }) {
  const navigate = useNavigate();
  const [files, setFiles] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [proofs, setProofs] = useState({});
  const { register, handleSubmit, getValues, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: { birthPlace: hospital.name, hospitalRegistrationNumber: hospital.registrationNumber, doctorName: hospital.authorizedPerson, gender: '' },
  });

  const setFile = (name, file) => {
    setFiles((f) => ({ ...f, [name]: file }));
    setFileErrors((e) => ({ ...e, [name]: validateFile(file) }));
  };

  const onSubmit = async (values) => {
    const errs = {};
    FILE_FIELDS.forEach(({ name, required }) => {
      errs[name] = files[name] ? validateFile(files[name]) : required ? 'Hospital document is required' : '';
    });
    setFileErrors(errs);
    if (Object.values(errs).some(Boolean)) { toast.error('Please fix the highlighted documents'); return; }

    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v); });
    Object.entries(files).forEach(([k, f]) => f && fd.append(k, f));
    if (proofs.biometric?.status === 'VERIFIED') fd.append('biometricProof', proofs.biometric.proof);
    if (proofs.identity?.status === 'VERIFIED') fd.append('identityProof', proofs.identity.proof);

    try {
      const { application, parentLinked } = await hospitalService.create(fd);
      toast.success(`Submitted. Application ID ${application.applicationId}`);
      if (!parentLinked) toast.info('No parent email given, so no citizen account was linked', { autoClose: 7000 });
      navigate(`/hospital/registrations/${application._id}`);
    } catch (err) {
      applyServerErrors(err, setError);
      const fileErr = err.errors?.find((e) => FILE_FIELDS.some((f) => f.name === e.field));
      if (fileErr) setFileErrors((e) => ({ ...e, [fileErr.field]: fileErr.message }));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <ChildSection register={register} errors={errors} hospitalName={hospital.name} />
      <ParentSection register={register} errors={errors} includeEmail description="A citizen account is created or linked using the parent email so the family can track the application." />
      <RegistrationSection register={register} errors={errors} />

      <VerificationSection register={register} errors={errors} getValues={getValues} setError={setError} proofs={proofs} setProofs={setProofs} />

      <FormSection title="Documents" description="PDF, JPG or PNG. Maximum 5 MB each.">
        {FILE_FIELDS.map(({ name, label, required }) => (
          <FileField key={name} label={label} required={required} file={files[name]} error={fileErrors[name]} onChange={(file) => setFile(name, file)} />
        ))}
      </FormSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => navigate('/hospital/registrations')}>Cancel</Button>
        <Button type="submit" size="lg" loading={isSubmitting}>Submit registration</Button>
      </div>
    </form>
  );
}

export default function NewRegistration() {
  const { data, loading, error, reload } = useFetch(authService.me, []);
  return (
    <>
      <PageHeader title="New birth registration" subtitle="Fields marked in the form are validated before submission." />
      {loading ? <LoadingSpinner /> : error ? <div className="card"><ErrorState error={error} onRetry={reload} /></div> : <RegistrationForm hospital={data.hospital} />}
    </>
  );
}
