import ApplicationsList from '../../components/municipal/ApplicationsList';

export default function Rejected() {
  return <ApplicationsList fixedStatus="REJECTED" title="Rejected applications" subtitle="Applications declined, with the reason recorded." />;
}
