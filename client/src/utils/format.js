const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatDate = (v) => (v ? dateFmt.format(new Date(v)) : '—');
export const formatDateTime = (v) => (v ? dateTimeFmt.format(new Date(v)) : '—');
export const titleCase = (s = '') => s.toLowerCase().replace(/(^|_|\s)\w/g, (m) => m.replace('_', ' ').toUpperCase());
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
