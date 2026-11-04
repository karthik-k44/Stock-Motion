import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { AccountForm } from './components/AccountForm';
import { AuthSplitLayout } from './components/AuthSplitLayout';
import { SafeNext } from './lib/safe-next';
import { authService } from './services';

export const Login = () => {
  useDocumentTitle('Sign in');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = SafeNext(params.get('next'));
  const session = authService.useSession();
  const login = authService.useLoginMutation();

  if (session.data) return <Navigate to={next} replace />;

  return (
    <AuthSplitLayout
      title="Welcome back"
      subtitle="Enter your details to pick up where you left off."
      tab={{ active: 'login', search: params.get('next') ? `?next=${encodeURIComponent(next)}` : '' }}
    >
      <AccountForm mode="login" submitLabel="Continue" busy={login.isPending} error={login.error} onSubmit={(input) => login.mutate(input, { onSuccess: () => navigate(next, { replace: true }) })} />
      {import.meta.env.DEV && (
        <p className="auth-hint mt-4">
          Demo login: <span className="mono">demo@stockmotion.local</span> / <span className="mono">stockmotion-demo</span>
        </p>
      )}
    </AuthSplitLayout>
  );
};
