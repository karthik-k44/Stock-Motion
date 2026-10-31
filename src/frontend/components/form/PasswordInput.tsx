import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { Cn } from '@/frontend/lib/utils';

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'>;

/**
 * A password field with an eye button to show or hide what was typed. The button is a toggle (`aria-pressed`) and
 * doesn't take focus from the field, so typing carries on. Edge's own reveal button is hidden so there is only one.
 */
export const PasswordInput = ({ className, ...props }: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={Cn('input pr-10 [&::-ms-reveal]:hidden', className)} />
      <button
        type="button"
        aria-label="Show password"
        aria-pressed={visible}
        aria-controls={props.id}
        title={visible ? 'Hide password' : 'Show password'}
        disabled={props.disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 grid w-10 cursor-pointer place-items-center rounded-r-lg border-0 bg-transparent p-0 text-muted-foreground transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
};
