import { FiLock, FiUsers, FiMapPin, FiAward, FiCheckSquare, FiBell } from 'react-icons/fi';
import Section from './Section';

const FEATURES = [
  { icon: FiLock, title: 'Secure registration', text: 'Hashed passwords, httpOnly sessions, validated input and masked identity references only.' },
  { icon: FiUsers, title: 'Role-based verification', text: 'Citizens, hospitals, officers and admins each see only what they are allowed to.' },
  { icon: FiMapPin, title: 'Application tracking', text: 'A clear status timeline from submission to decision.' },
  { icon: FiAward, title: 'Digital certificate', text: 'Professional PDF issued only after municipal approval.' },
  { icon: FiCheckSquare, title: 'Certificate verification', text: 'Anyone can check authenticity with the certificate number or QR code.' },
  { icon: FiBell, title: 'Notifications', text: 'In-app and email updates at every step of the workflow.' },
];

export default function FeaturesSection() {
  return (
    <Section tone="muted" title="Built for trust" subtitle="Everything needed for a transparent, auditable registration process.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-6">
            <Icon className="h-6 w-6 text-indigo-600" aria-hidden />
            <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-600">{text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
