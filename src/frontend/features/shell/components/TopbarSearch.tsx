import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { SearchInput } from '@/frontend/components/form';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';

/** Search from any screen: Enter opens the item list filtered to the query. */
export const TopbarSearch = () => {
  const navigate = useNavigate();
  const { labels } = businessesService.useBusiness().template;
  const [query, setQuery] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const search = query.trim();
    if (!search) return;
    navigate(paths.inventoryWith({ search }));
    setQuery('');
  };

  const label = `Search ${labels.items.toLowerCase()}`;
  return (
    <form role="search" className="topbar-search" onSubmit={submit}>
      <SearchInput label={label} placeholder={`${label}…`} value={query} onChange={setQuery} />
    </form>
  );
};
