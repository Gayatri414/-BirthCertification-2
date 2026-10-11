import ApplicationDetailPage from '../shared/ApplicationDetailPage';

export default function RegistrationDetail() {
  return <ApplicationDetailPage backTo="/hospital/registrations" backLabel="Back to registrations" editTo={(id) => `/hospital/registrations/${id}/edit`} />;
}
