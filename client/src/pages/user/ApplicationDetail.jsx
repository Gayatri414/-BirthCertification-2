import ApplicationDetailPage from '../shared/ApplicationDetailPage';

export default function ApplicationDetail() {
  return <ApplicationDetailPage backTo="/user/applications" backLabel="Back to applications" editTo={(id) => `/user/application/${id}/edit`} />;
}
