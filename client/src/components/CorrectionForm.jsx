import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import Button from './Button';
import FormSection from './hospital/FormSection';
import FileField from './hospital/FileField';
import { ChildSection, ParentSection, RegistrationSection } from './hospital/RegistrationFields';
import { applicationService } from '../services/applicationService';
import { hospitalCorrectionSchema, citizenCorrectionSchema, validateFile } from '../validations/registration';
import { applyServerErrors } from '../utils/forms';

const FILES = {
  HOSPITAL: [{ name: 'hospitalDocument', label: 'Replace hospital document' }, { name: 'parentId', label: 'Replace parent identification' }, { name: 'supportingDocument', label: 'Replace supporting document' }],
  USER: [{ name: 'parentId', label: 'Replace parent identification' }, { name: 'supportingDocument', label: 'Replace supporting document' }],
};
const KIND_OF = { hospitalDocument: 'HOSPITAL_DOCUMENT', parentId: 'PARENT_ID', supportingDocument: 'SUPPORTING' };

const defaultsFrom = (app, role) => {
  const parent = { fatherName: app.parents.fatherName, motherName: app.parents.motherName, guardianName: app.parents.guardianName || '', guardianPhone: app.parents.guardianPhone, parentAddress: app.parents.address, note: '' };
  if (role === 'USER') return parent;
  const c = app.child;
  return { ...parent, firstName: c.firstName, middleName: c.middleName || '', lastName: c.lastName, dateOfBirth: String(c.dateOfBirth).slice(0, 10), timeOfBirth: c.timeOfBirth, gender: c.gender, birthWeightKg: c.birthWeightKg, birthPlace: c.birthPlace, doctorName: app.doctorName };
};

// Lets a hospital (all fields) or the linked citizen (parent details only) correct a flagged application.
export default function CorrectionForm({ app, role, detailPath }) {
  const navigate = useNavigate();
  const isHospital = role === 'HOSPITAL';
  const [files, setFiles] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [mode, setMode] = useState('');
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(isHospital ? hospitalCorrectionSchema : citizenCorrectionSchema), defaultValues: defaultsFrom(app, role),
  });

  const setFile = (name, file) => { setFiles((f) => ({ ...f, [name]: file })); setFileErrors((e) => ({ ...e, [name]: validateFile(file) })); };

  const send = (submit) => handleSubmit(async (values) => {
    if (Object.values(fileErrors).some(Boolean)) { toast.error('Please fix the highlighted documents'); return; }
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v); });
    Object.entries(files).forEach(([k, f]) => f && fd.append(k, f));
    setMode(submit ? 'submit' : 'draft');
    try {
      await (submit ? applicationService.resubmit : applicationService.saveCorrections)(app._id, fd);
      toast.success(submit ? 'Resubmitted for review' : 'Draft saved');
      navigate(detailPath);
    } catch (err) {
      applyServerErrors(err, setError);
      const fe = err.errors?.find((e) => FILES[role].some((f) => f.name === e.field));
      if (fe) setFileErrors((e) => ({ ...e, [fe.field]: fe.message }));
    } finally { setMode(''); }
  });

  const currentDoc = (field) => app.documents?.find((d) => d.kind === KIND_OF[field]);

  return (
    <form className="space-y-6" noValidate onSubmit={send(true)}>
      <div role="alert" className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
        <p className="font-semibold">The municipal officer asked for corrections</p>
        <p className="mt-1">{app.resubmissionReason}</p>
      </div>

      {isHospital && <ChildSection register={register} errors={errors} hospitalName={app.hospital?.name} />}
      <ParentSection register={register} errors={errors} description={isHospital ? undefined : 'You can correct parent details. Child and hospital details can only be changed by the hospital.'} />
      {isHospital && <RegistrationSection register={register} errors={errors} showNumber={false} />}

      <FormSection title="Documents" description="Leave empty to keep the current document. PDF, JPG or PNG, max 5 MB.">
        {FILES[role].map(({ name, label }) => (
          <div key={name}>
            <FileField label={label} file={files[name]} error={fileErrors[name]} onChange={(file) => setFile(name, file)} />
            {currentDoc(name) && !files[name] && <p className="mt-1 truncate text-xs text-slate-500">Current: {currentDoc(name).originalName}</p>}
          </div>
        ))}
      </FormSection>

      <section className="card p-5 sm:p-6">
        <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-slate-700">Note to the municipal officer (optional)</label>
        <textarea id="note" rows={3} maxLength={500} className="field" placeholder="Describe what you corrected" {...register('note')} />
        {errors.note && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.note.message}</p>}
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => navigate(detailPath)}>Cancel</Button>
        <Button variant="secondary" loading={mode === 'draft'} disabled={!!mode} onClick={send(false)}>Save draft</Button>
        <Button type="submit" size="lg" loading={mode === 'submit'} disabled={!!mode}>Resubmit for review</Button>
      </div>
    </form>
  );
}
