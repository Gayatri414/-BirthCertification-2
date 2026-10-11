import { MdOutlineLocalHospital } from 'react-icons/md';
import { FiSearch, FiCheckCircle, FiDownload } from 'react-icons/fi';
import Section from './Section';

export const STEPS = [
  { icon: MdOutlineLocalHospital, title: 'Hospital registration', text: 'A registered hospital submits the newborn and parent details with supporting documents.' },
  { icon: FiSearch, title: 'Municipal verification', text: 'A municipal officer reviews the checklist, flags duplicates and verifies documents.' },
  { icon: FiCheckCircle, title: 'Certificate approval', text: 'On approval a unique certificate number and digital certificate are generated.' },
  { icon: FiDownload, title: 'Digital download', text: 'Parents track progress, get notified and download a QR-verifiable PDF.' },
];

export default function StepsSection({ tone = 'white' }) {
  return (
    <Section id="how" tone={tone} title="How it works" subtitle="Four simple steps from hospital bed to digital certificate.">
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="card relative p-6">
            <span className="absolute right-4 top-4 text-4xl font-black text-slate-100">{i + 1}</span>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-6 w-6" aria-hidden /></div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
