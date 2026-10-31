import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { AccountForm } from './components/AccountForm';
import { AuthLayout } from './components/AuthLayout';
import { SafeNext } from './lib/safe-next';
import { authService } from './services';

export const Signup = () => {
  useDocumentTitle('Create an account');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const session = authService.useSession();
  const register = authService.useRegisterMutation();
  // A brand-new account has no business yet: set one up, unless they came from an invite link.
  const next = params.get('next') ? SafeNext(params.get('next')) : paths.onboarding;

  if (session.data) return <Navigate to={paths.home} replace />;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Then pick your kind of business — retail, café or trades — and you're set up in a minute."
      back={{ to: paths.landing, label: 'Back to home' }}
    >
      <AccountForm
        mode="register"
        initialEmail={params.get('email') ?? ''}
        submitLabel="Create account"
        busy={register.isPending}
        error={register.error}
        onSubmit={(input) => register.mutate(input, { onSuccess: () => navigate(next, { replace: true }) })}
      />
      <p className="auth-switch">
        Already have an account? <Link className="link" to={`${paths.login}${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}>Sign in</Link>
      </p>
    </AuthLayout>
  );
};
