import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '../services';

const ADD = '__add__';

/** Pick which business to work in, or start another one. */
export function BusinessSwitcher() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const business = businessesService.useBusiness();
  const { data: mine = [] } = businessesService.useMyBusinesses();

  return (
    <label className="switcher">
      <span className="switcher-type">{business.template.name}</span>
      <span className="sr-only">Current business</span>
      <select
        className="switcher-select"
        value={business.id}
        onChange={(e) => {
          if (e.target.value === ADD) return navigate(paths.onboarding);
          // Leave the current screen first, so nothing (an open item drawer, an order) re-asks the
          // new business for a record that only existed in the old one.
          navigate(paths.dashboard);
          businessesService.SelectBusiness(qc, e.target.value);
        }}
      >
        {mine.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
        <option value={ADD}>+ Add another business…</option>
      </select>
    </label>
  );
}
