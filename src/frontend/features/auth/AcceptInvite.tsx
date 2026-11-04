import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@/frontend/components/button';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { ToastManager } from '@/frontend/components/toast';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { AccountForm } from './components/AccountForm';
import { AuthSplitLayout } from './components/AuthSplitLayout';
import { authService } from './services';

/** `/invite/:token` — join a team as a new person, or with the account you're signed in to. */
export const AcceptInvite = () => {
  useDocumentTitle('Join a team');
  const { token = '' } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const preview = authService.useInvitePreview(token);
  const session = authService.useSession();
  const accept = authService.useAcceptInviteMutation();
  const register = authService.useRegisterFromInviteMutation();

  const enter = async (businessId: string) => {
    businessesService.SelectBusiness(qc, businessId);
    await qc.invalidateQueries({ queryKey: businessesService.keys.mine });
    navigate(paths.dashboard, { replace: true });
  };

  if (preview.isPending || session.isPending) {
    return (
      <AuthSplitLayout title="Opening your invite…">
        <SkeletonRows rows={3} />
      </AuthSplitLayout>
    );
  }
  if (preview.isError) {
    return (
      <AuthSplitLayout title="This invite can't be used">
        <ErrorState message={preview.error.message} />
        <p className="auth-switch mt-4">
          <Link className="link" to={paths.login}>Go to sign in</Link>
        </p>
      </AuthSplitLayout>
    );
  }

  const invite = preview.data;
  return (
    <AuthSplitLayout
      title={`Join ${invite.businessName}`}
      subtitle={<>You've been invited as <strong>{invite.roleLabel}</strong>.</>}
    >
      {session.data ? (
        <div className="form">
          <p>
            Signed in as <strong>{session.data.email}</strong>.
          </p>
          {accept.error && <p className="form-error" role="alert">{accept.error.message}</p>}
          <Button
            variant="primary"
            className="btn-block"
            loading={accept.isPending}
            onClick={() =>
              accept.mutate(token, {
                onSuccess: (b) => {
                  ToastManager.Success(`Welcome to ${invite.businessName}`);
                  void enter(b.id);
                },
              })
            }
          >
            Join as {invite.roleLabel}
          </Button>
        </div>
      ) : (
        <>
          <AccountForm
            mode="register"
            submitLabel={`Create account & join`}
            busy={register.isPending}
            error={register.error}
            onSubmit={(input) =>
              register.mutate({ token, input }, { onSuccess: () => void qc.fetchQuery({ queryKey: businessesService.keys.mine, queryFn: businessesService.ListMine }).then((mine) => enter(mine[mine.length - 1].id)) })
            }
          />
          <p className="auth-switch mt-4">
            Already have an account? <Link className="link" to={`${paths.login}?next=${encodeURIComponent(paths.invite(token))}`}>Sign in to join</Link>
          </p>
        </>
      )}
    </AuthSplitLayout>
  );
};
