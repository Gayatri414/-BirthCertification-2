import ErrorPage from './ErrorPage';
export default function Forbidden() {
  return <ErrorPage code="403" title="Access denied" message="You do not have permission to view this page with your current role." />;
}
