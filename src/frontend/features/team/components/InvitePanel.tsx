import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { Field, Select } from '@/frontend/components/form';
import { ToastManager } from '@/frontend/components/toast';
import { businessesService } from '@/frontend/features/businesses/services';
import { BaseRoleTypeEnum } from '@/frontend/features/businesses/types';
import { FormatDate } from '@/frontend/utils/format';
import { invitesService } from '../services';

/** Create a one-time invite link for a role, copy it, and revoke ones not used yet. */
export const InvitePanel = () => {
  const business = businessesService.useBusiness();
  const roles = business.template.roles.filter((r) => r.code !== BaseRoleTypeEnum.OWNER || business.role === BaseRoleTypeEnum.OWNER);
  const [role, setRole] = useState(roles.find((r) => r.code !== BaseRoleTypeEnum.OWNER && r.code !== BaseRoleTypeEnum.MANAGER)?.code ?? roles[0].code);
  const [link, setLink] = useState<string | null>(null);
  const invites = invitesService.useGetInvites(true);
  const create = invitesService.useCreateInvite();
  const revoke = invitesService.useRevokeInvite();
  const label = (code: string) => business.template.roles.find((r) => r.code === code)?.label ?? code;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      ToastManager.Success('Invite link copied', 'Send it to your teammate — it works once, for 7 days.');
    } catch {
      ToastManager.Info('Copy the link from the box', 'Your browser blocked clipboard access.');
    }
  };

  return (
    <Card title="Invite someone" subtitle="They sign up (or sign in) from the link and join with the role you pick.">
      <div className="invite-row">
        <Field id="invite-role" label="Role">
          <Select id="invite-role" value={role} options={roles.map((r) => ({ value: r.code, label: r.label }))} onChange={setRole} />
        </Field>
        <Button variant="primary" icon="plus" loading={create.isPending} onClick={() => create.mutate(role, { onSuccess: (i) => setLink(invitesService.InviteLink(i.token)) })}>
          Create invite link
        </Button>
      </div>
      {link && (
        <div className="invite-link">
          <input className="input mono" readOnly value={link} aria-label="Invite link" onFocus={(e) => e.target.select()} />
          <Button icon="copy" onClick={() => void copy(link)}>Copy</Button>
        </div>
      )}
      {invites.data && invites.data.length > 0 && (
        <>
          <h3 className="section-title">Waiting to be used</h3>
          <ul className="mini-list">
            {invites.data.map((i) => (
              <li key={i.id} className="mini-row">
                <span>
                  {label(i.role)} <span className="muted small">· created {FormatDate(i.createdAt)} · expires {FormatDate(i.expiresAt)}</span>
                </span>
                <Button size="sm" variant="ghost" onClick={() => revoke.mutate(i.id)}>Revoke</Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
};
