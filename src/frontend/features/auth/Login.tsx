import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { AccountForm } from './components/AccountForm';
import { AuthLayout } from './components/AuthLayout';
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
    <AuthLayout title="Sign in" subtitle="Your inventory, orders and live business world." back={{ to: paths.landing, label: 'Back to home' }}>
      <AccountForm mode="login" submitLabel="Sign in" busy={login.isPending} error={login.error} onSubmit={(input) => login.mutate(input, { onSuccess: () => navigate(next, { replace: true }) })} />
      {import.meta.env.DEV && (
        <p className="auth-hint">
          Demo login: <span className="mono">demo@stockmotion.local</span> / <span className="mono">stockmotion-demo</span>
        </p>
      )}
      <p className="auth-switch">
        New here? <Link className="link" to={`${paths.signup}${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</Link>
      </p>
    </AuthLayout>
  );
};
