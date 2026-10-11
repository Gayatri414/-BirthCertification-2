import ErrorPage from './ErrorPage';
export default function ServerError() {
  return <ErrorPage code="500" title="Something went wrong" message="An unexpected error occurred on our side. Please try again in a moment." />;
}
