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
import { businessesService } from '../services';

const ADD = '__add__';

/** Pick which business to work in, or start another one. Sits on the orange sidebar, so the trigger is dark-on-orange. */
export const BusinessSwitcher = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const typeId = useId();
  const business = businessesService.useBusiness();
  const { data: mine = [] } = businessesService.useMyBusinesses();

  const pick = (id: string) => {
    if (id === ADD) return navigate(paths.onboarding);
    if (id === business.id) return;
    // Leave the current screen first, so nothing (an open item drawer, an order) re-asks the
    // new business for a record that only existed in the old one.
    navigate(paths.dashboard);
    businessesService.SelectBusiness(qc, id);
  };

  return (
    <div className="switcher">
      <span id={typeId} className="switcher-type">
        {business.template.name}
      </span>
      <Select value={business.id} onValueChange={pick}>
        <SelectTrigger
          aria-label="Current business"
          aria-describedby={typeId}
          className="h-[34px] w-full rounded-lg border-[#111]/25 bg-white/35 px-2 text-sm font-semibold text-[#111] shadow-none hover:bg-white/50 focus-visible:border-[#111] focus-visible:ring-[#111]/25 [&_svg:not([class*='text-'])]:text-[#111]"
        >
          <SelectValue />
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
    </div>
  );
};
