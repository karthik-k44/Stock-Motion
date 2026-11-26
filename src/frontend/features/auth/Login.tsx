import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { AccountForm } from './components/AccountForm';
import { AuthSplitLayout } from './components/AuthSplitLayout';
import { DemoAccountNote } from './components/DemoAccountNote';
import { DEMO_ACCOUNT } from './lib/demo-account';
import { SafeNext } from './lib/safe-next';
import { authService } from './services';
import type { LoginInput } from './types';

export const Login = () => {
  useDocumentTitle('Sign in');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = SafeNext(params.get('next'));
  const session = authService.useGetSession();
  const login = authService.useLogin();

  if (session.data) return <Navigate to={next} replace />;

  const signIn = (input: LoginInput) => login.mutate(input, { onSuccess: () => navigate(next, { replace: true }) });
  const signingInToDemo = login.isPending && login.variables?.email === DEMO_ACCOUNT.email;

  return (
    <AuthSplitLayout
      title="Welcome back"
      subtitle="Enter your details to pick up where you left off."
      tab={{ active: 'login', search: params.get('next') ? `?next=${encodeURIComponent(next)}` : '' }}
    >
      <AccountForm mode="login" submitLabel="Continue" busy={login.isPending && !signingInToDemo} error={login.error} onSubmit={signIn} />
      <DemoAccountNote busy={signingInToDemo} onUse={() => signIn(DEMO_ACCOUNT)} />
    </AuthSplitLayout>
  );
};
