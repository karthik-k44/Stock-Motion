import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { IsManagementRole, type BusinessResponseType } from '@/frontend/features/businesses/types';

const Row = ({ business }: { business: BusinessResponseType }) => {
  const rename = businessesService.useRenameBusiness();
  const [name, setName] = useState(business.name);
  const trimmed = name.trim();
  const id = `inv-rename-${business.id}`;
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed && trimmed !== business.name) rename.mutate({ id: business.id, name: trimmed });
      }}
    >
      <label htmlFor={id} className="sr-only">
        Name of {business.name}
      </label>
      <input id={id} className="input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      <Button type="submit" size="sm" loading={rename.isPending} disabled={!trimmed || trimmed === business.name}>
        Rename
      </Button>
    </form>
  );
};

/** Every inventory this account manages, each renamable here without switching to it. */
export const InventoriesCard = () => {
  const mine = businessesService.useGetMyBusinesses();
  const managed = (mine.data ?? []).filter((b) => IsManagementRole(b.role));
  if (managed.length < 2) return null;
  return (
    <Card
      title="Your inventories"
      subtitle="Rename any of them here."
      actions={
        <Link to={paths.plans} className="text-sm font-semibold text-ink underline underline-offset-2">
          Add inventories
        </Link>
      }
    >
      <div className="grid gap-3">
        {managed.map((b) => (
          <Row key={b.id} business={b} />
        ))}
      </div>
    </Card>
  );
};
