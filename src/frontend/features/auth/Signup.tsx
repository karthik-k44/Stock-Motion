import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { AccountForm } from './components/AccountForm';
import { AuthSplitLayout } from './components/AuthSplitLayout';
import { SafeNext } from './lib/safe-next';
import { authService } from './services';

export const Signup = () => {
  useDocumentTitle('Create an account');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const session = authService.useGetSession();
  const register = authService.useRegister();
  // A brand-new account chooses its plan first, unless they came from an invite link or a plan on the pricing page.
  const next = params.get('next') ? SafeNext(params.get('next')) : paths.plans;

  // Already signed in when they arrived. (Not after registering here: that session goes to `next` instead.)
  if (session.data && register.isIdle) return <Navigate to={paths.home} replace />;

  return (
    <AuthSplitLayout
      title="Create your account"
      subtitle="Then choose your plan — or start a 14-day free trial — and set up your inventories in a minute."
      tab={{ active: 'signup', search: params.get('next') ? `?next=${encodeURIComponent(next)}` : '' }}
    >
      <AccountForm
        mode="register"
        initialEmail={params.get('email') ?? ''}
        submitLabel="Continue"
        busy={register.isPending}
        error={register.error}
        onSubmit={(input) => register.mutate(input, { onSuccess: () => navigate(next, { replace: true }) })}
      />
    </AuthSplitLayout>
  );
};
