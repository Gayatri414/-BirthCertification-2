export const ROLES = { USER: 'USER', HOSPITAL: 'HOSPITAL', MUNICIPAL_OFFICER: 'MUNICIPAL_OFFICER', SUPER_ADMIN: 'SUPER_ADMIN' };

export const ROLE_LABELS = {
  USER: 'Citizen / Parent',
  HOSPITAL: 'Hospital',
  MUNICIPAL_OFFICER: 'Municipal Officer',
  SUPER_ADMIN: 'Super Admin',
};

export const ROLE_HOME = {
  USER: '/user/dashboard',
  HOSPITAL: '/hospital/dashboard',
  MUNICIPAL_OFFICER: '/municipal/dashboard',
  SUPER_ADMIN: '/admin/dashboard',
};

export const STATUS_META = {
  PENDING: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  UNDER_REVIEW: { label: 'Under review', badge: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  APPROVED: { label: 'Approved', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', badge: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
  RESUBMISSION_REQUIRED: { label: 'Resubmission required', badge: 'bg-orange-50 text-orange-700 ring-orange-600/20', dot: 'bg-orange-500' },
  VALID: { label: 'Valid', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  REVOKED: { label: 'Revoked', badge: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
  NOT_FOUND: { label: 'Not found', badge: 'bg-slate-100 text-slate-700 ring-slate-500/20', dot: 'bg-slate-400' },
};

export const STATUS_OPTIONS = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED'];

export const DEMO_ACCOUNTS = [
  { role: 'USER', email: 'citizen@example.com', password: 'Citizen@123' },
  { role: 'HOSPITAL', email: 'hospital@example.com', password: 'Hospital@123' },
  { role: 'MUNICIPAL_OFFICER', email: 'municipal@example.com', password: 'Municipal@123' },
  { role: 'SUPER_ADMIN', email: 'admin@example.com', password: 'Admin@123' },
];

export const STATUS_COLORS = {
  PENDING: '#f59e0b', UNDER_REVIEW: '#3b82f6', APPROVED: '#10b981', REJECTED: '#ef4444', RESUBMISSION_REQUIRED: '#f97316',
};

export const CHECKLIST = [
  { key: 'childInfo', label: 'Child information verified' },
  { key: 'parentInfo', label: 'Parent information verified' },
  { key: 'hospitalInfo', label: 'Hospital information verified' },
  { key: 'documents', label: 'Documents verified' },
  { key: 'biometric', label: 'Mock biometric verification completed' },
  { key: 'identity', label: 'Mock identity verification completed' },
  { key: 'noDuplicate', label: 'No duplicate application found' },
];

export const AUDIT_ACTION_OPTIONS = [
  'APPLICATION_SUBMITTED', 'APPLICATION_REVIEW', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED',
  'APPLICATION_RESUBMISSION_REQUESTED', 'APPLICATION_RESUBMITTED', 'APPLICATION_UPDATED', 'CERTIFICATE_GENERATED', 'CERTIFICATE_DOWNLOADED',
];

export const NOTIFICATION_META = {
  REGISTRATION_SUBMITTED: { label: 'Submitted', tone: 'bg-indigo-100 text-indigo-700' },
  REGISTRATION_SUCCESSFUL: { label: 'Registered', tone: 'bg-indigo-100 text-indigo-700' },
  UNDER_REVIEW: { label: 'Under review', tone: 'bg-blue-100 text-blue-700' },
  APPROVED: { label: 'Approved', tone: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rejected', tone: 'bg-red-100 text-red-700' },
  RESUBMISSION_REQUIRED: { label: 'Action needed', tone: 'bg-orange-100 text-orange-700' },
  RESUBMITTED: { label: 'Resubmitted', tone: 'bg-blue-100 text-blue-700' },
  CERTIFICATE_GENERATED: { label: 'Certificate', tone: 'bg-emerald-100 text-emerald-700' },
  GENERAL: { label: 'Notice', tone: 'bg-slate-100 text-slate-600' },
};

// Plain-language meaning of each status, shown on the public tracking page.
export const STATUS_HELP = {
  PENDING: 'Your hospital has submitted the registration. It is waiting for a municipal officer to pick it up.',
  UNDER_REVIEW: 'A municipal officer is verifying the details and documents.',
  APPROVED: 'The registration is approved. The birth certificate can be downloaded from your account.',
  REJECTED: 'The registration was not approved. The reason is shown below. Contact the hospital for next steps.',
  RESUBMISSION_REQUIRED: 'The officer asked for corrections. The hospital or parent must update the details and resubmit.',
};
