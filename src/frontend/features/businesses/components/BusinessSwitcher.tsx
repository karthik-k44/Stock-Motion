import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useId } from 'react';
import { useNavigate } from 'react-router';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/frontend/components/ui/select';
import { paths } from '@/frontend/config/paths';
import { BusinessInitials } from '../lib/business-initials';
import { businessesService } from '../services';

const ADD = '__add__';

/** Pick which business to work in, or start another one: a card at the top of the sidebar. */
export const BusinessSwitcher = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const typeId = useId();
  const business = businessesService.useBusiness();
  const { data: mine = [] } = businessesService.useGetMyBusinesses();

  const pick = (id: string) => {
    if (id === ADD) return navigate(paths.onboarding);
    if (id === business.id) return;
    // Leave the current screen first, so nothing (an open item drawer, an order) re-asks the
    // new business for a record that only existed in the old one.
    navigate(paths.dashboard);
    businessesService.SelectBusiness(qc, id);
  };

  return (
    <Select value={business.id} onValueChange={pick}>
      <SelectTrigger
        aria-label="Current business"
        aria-describedby={typeId}
        className="h-auto w-full gap-2.5 rounded-xl border-transparent bg-sunken px-2.5 py-2 shadow-none hover:bg-line"
      >
        <span className="switcher-avatar" aria-hidden>
          {BusinessInitials(business.name)}
        </span>
        <span className="switcher-text">
          <span className="switcher-name">
            <SelectValue />
          </span>
          <span id={typeId} className="switcher-type">
            {business.template.name}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent position="popper" className="z-300 max-h-80">
        <SelectGroup>
          <SelectLabel>Your businesses</SelectLabel>
          {mine.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value={ADD}>
          <Plus aria-hidden />
          Add another business…
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
