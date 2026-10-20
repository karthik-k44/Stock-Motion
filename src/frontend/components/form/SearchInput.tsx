import { Icon } from '@/frontend/components/icon';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  busy?: boolean;
};

export const SearchInput = ({ value, onChange, placeholder, label, busy }: SearchInputProps) => {
  return (
    <div className="search">
      <Icon name="search" size={16} className="search-icon" />
      <input
        type="search"
        className="input search-input"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && value && onChange('')}
      />
      {busy && <span className="spinner search-spinner" aria-label="Searching" />}
    </div>
  );
};
