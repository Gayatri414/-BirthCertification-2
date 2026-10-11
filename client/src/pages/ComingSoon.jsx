import { FiTool } from 'react-icons/fi';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { ROLE_LABELS } from '../utils/constants';

export default function ComingSoon({ role }) {
  return (
    <>
      <PageHeader title={`${ROLE_LABELS[role]} workspace`} />
      <div className="card"><EmptyState icon={FiTool} title="This section is built in a later phase" message="Your account and role-based access are working. This screen is added in an upcoming build phase." /></div>
    </>
  );
}
