import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Avatar } from '@/frontend/components/avatar';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { Select } from '@/frontend/components/form';
import { PageHeader } from '@/frontend/components/layout';
import { ConfirmManager } from '@/frontend/components/modal';
import { paths } from '@/frontend/config/paths';
import { authService } from '@/frontend/features/auth/services';
import { businessesService } from '@/frontend/features/businesses/services';
import { BaseRoleTypeEnum, IsManagementRole } from '@/frontend/features/businesses/types';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { FormatDate } from '@/frontend/utils/format';
import { InvitePanel } from './components/InvitePanel';
import { teamService } from './services';

export const Team = () => {
  useDocumentTitle('Team');
  const qc = useQueryClient();
  const navigate = useNavigate();
  const business = businessesService.useBusiness();
  const { data: me } = authService.useGetSession();
  const { data, isPending, isError, error, refetch } = teamService.useGetMembers();
  const updateRole = teamService.useUpdateMemberRole();
  const remove = teamService.useRemoveMember();
  const owner = business.role === BaseRoleTypeEnum.OWNER;
  const roleLabel = (code: string) => business.template.roles.find((r) => r.code === code)?.label ?? code;

  const removeMember = async (accountId: string, name: string) => {
    const leaving = accountId === me?.id;
    const ok = await ConfirmManager.Ask({
      title: leaving ? `Leave ${business.name}?` : `Remove ${name}?`,
      message: leaving ? 'You lose access until someone invites you again.' : 'They lose access straight away. Their history stays.',
      confirmLabel: leaving ? 'Leave' : 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    remove.mutate(accountId, {
      onSuccess: async () => {
        if (!leaving) return;
        businessesService.SelectBusiness(qc, null);
        await qc.invalidateQueries({ queryKey: businessesService.businessesKeys.mine() });
        navigate(paths.home);
      },
    });
  };

  return (
    <div className="page">
      <PageHeader title="Team" description={`Everyone working in ${business.name} and what they can do. Owners and managers run the catalogue and settings; everyone works ${business.template.labels.orders.toLowerCase()} and stock.`} />
      <div className="grid-2">
        <Card title="Members" flush>
          {isPending ? (
            <SkeletonRows rows={4} label="Loading team" />
          ) : isError ? (
            <ErrorState message={error.message} onRetry={() => refetch()} />
          ) : (
            <ul className="mini-list member-list">
              {data.map((m) => (
                <li key={m.accountId} className="member-row">
                  <Avatar initials={m.initials} color={m.color} name={m.name} />
                  <span className="member-text">
                    <span className="strong">{m.name}{m.accountId === me?.id && ' (you)'}</span>
                    <span className="muted small block">{m.email} · joined {FormatDate(m.joinedAt)}</span>
                  </span>
                  {owner ? (
                    <Select aria-label={`Role of ${m.name}`} value={m.role} options={business.template.roles.map((r) => ({ value: r.code, label: r.label }))} onChange={(role) => updateRole.mutate({ accountId: m.accountId, role })} />
                  ) : (
                    <span className="tag">{roleLabel(m.role)}</span>
                  )}
                  {(owner || m.accountId === me?.id) && (
                    <Button size="sm" variant="danger-ghost" icon={m.accountId === me?.id ? 'logout' : 'trash'} aria-label={m.accountId === me?.id ? 'Leave this business' : `Remove ${m.name}`} onClick={() => void removeMember(m.accountId, m.name)} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        {IsManagementRole(business.role) && <InvitePanel />}
      </div>
    </div>
  );
};
