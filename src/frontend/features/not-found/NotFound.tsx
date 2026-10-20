import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { EmptyState } from '@/frontend/components/feedback';
import { paths } from '@/frontend/config/paths';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';

export const NotFound = () => {
  useDocumentTitle('Not found');
  return (
    <div className="page">
      <EmptyState icon="search" title="That page doesn’t exist" action={<Link className="btn btn-primary" to={paths.home}>Back to the start</Link>}>
        The address may be mistyped or the record may no longer exist.
      </EmptyState>
    </div>
  );
};

/** Route-level error boundary (failed lazy chunk, render crash). */
export const RouteError = () => {
  const err = useRouteError();
  const message = isRouteErrorResponse(err) ? `${err.status} ${err.statusText}` : err instanceof Error ? err.message : 'Unknown error';
  return (
    <div className="page">
      <EmptyState icon="alert" title="Something went wrong" action={<button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>}>
        {message}
      </EmptyState>
    </div>
  );
};
