import ErrorPage from './ErrorPage';
export default function NotFound({ embedded }) {
  return <ErrorPage embedded={embedded} code="404" title="Page not found" message="The page you are looking for does not exist or has been moved." />;
}
