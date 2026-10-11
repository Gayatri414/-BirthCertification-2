import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import Section from './Section';

const FAQS = [
  ['Who can register a birth?', 'Registered hospitals submit the newborn registration. Parents then use their account to track it and download the certificate.'],
  ['How long does verification take?', 'Applications are reviewed by a municipal officer. You are notified at each status change, and can ask for corrections if something is missing.'],
  ['What if my application is rejected?', 'You will see the rejection reason. If the officer requests resubmission, the information can be corrected and submitted again.'],
  ['How do I verify a certificate?', 'Enter the certificate number on the Verify Certificate page, or scan the QR code printed on the certificate.'],
  ['Is my Aadhaar or biometric data stored?', 'No. This demo only simulates those checks and stores masked references such as XXXX-XXXX-1234.'],
];

export default function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <Section id="faq" tone="muted" title="Frequently asked questions">
      <div className="mx-auto max-w-3xl space-y-3">
        {FAQS.map(([q, a], i) => (
          <div key={q} className="card">
            <button className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              <span className="font-medium text-slate-900">{q}</span>
              <FiChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${open === i ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {open === i && <p className="px-5 pb-4 text-sm text-slate-600">{a}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}
