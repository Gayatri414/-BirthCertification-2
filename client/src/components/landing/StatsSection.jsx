import { FiFileText, FiAward } from 'react-icons/fi';
import { MdOutlineLocalHospital, MdAccountBalance } from 'react-icons/md';
import StatCard from '../StatCard';
import Section from './Section';
import useFetch from '../../hooks/useFetch';
import { publicService } from '../../services/publicService';

export default function StatsSection() {
  const { data, loading, error } = useFetch(publicService.stats, []);
  const v = (k) => (error ? '—' : data?.[k]?.toLocaleString('en-IN'));
  return (
    <Section tone="muted">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total registrations" value={v('registrations')} icon={FiFileText} loading={loading} />
        <StatCard label="Approved certificates" value={v('approved')} icon={FiAward} tone="emerald" loading={loading} />
        <StatCard label="Registered hospitals" value={v('hospitals')} icon={MdOutlineLocalHospital} tone="blue" loading={loading} />
        <StatCard label="Municipal offices" value={v('offices')} icon={MdAccountBalance} tone="amber" loading={loading} />
      </div>
    </Section>
  );
}
