import ApplicationsList from '../../components/municipal/ApplicationsList';

export default function Approved() {
  return <ApplicationsList fixedStatus="APPROVED" title="Approved applications" subtitle="Applications that passed verification." />;
}
