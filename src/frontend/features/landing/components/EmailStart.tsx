import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/frontend/components/ui/button';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';

/**
 * The reference's email capture: a field and the orange button side by side. It starts sign-up with the address
 * filled in (there is no mailing list to subscribe to).
 */
export const EmailStart = ({ className }: { className?: string }) => {
  const id = useId();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`${paths.signup}?email=${encodeURIComponent(email.trim())}`);
  };
  return (
    <form onSubmit={submit} className={Cn('flex w-full max-w-md flex-col gap-2 sm:flex-row', className)}>
      <label htmlFor={id} className="sr-only">
        Work email
      </label>
      <input
        id={id}
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Work email"
        className="h-12 w-full min-w-0 rounded-xl border border-line-strong bg-white px-4 text-[15px] tracking-[-0.01em] text-ink outline-none placeholder:text-steel focus-visible:border-primary-600 focus-visible:ring-[3px] focus-visible:ring-primary-200 sm:w-auto sm:flex-1"
      />
      <Button type="submit" className="h-12 rounded-xl px-5 text-[15px] font-semibold">
        Get started
      </Button>
    </form>
  );
};
