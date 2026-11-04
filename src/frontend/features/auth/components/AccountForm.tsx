import { Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { describedBy, PasswordInput } from '@/frontend/components/form';
import { FieldErrors } from '@/frontend/lib/form';
import type { ApiError } from '@/frontend/services/api-error';
import { LoginSchema, RegisterSchema, type LoginInput, type RegisterInput } from '../types';
import { AUTH_INPUT, AuthField } from './AuthField';

/** `initialEmail` pre-fills the email (sign-up started from the landing page footer). */
type Props = { initialEmail?: string } & (
  | { mode: 'login'; submitLabel: string; busy: boolean; error: ApiError | null; onSubmit: (input: LoginInput) => void }
  | { mode: 'register'; submitLabel: string; busy: boolean; error: ApiError | null; onSubmit: (input: RegisterInput) => void }
);

/** Email + password (and name when signing up), validated before it is sent. */
export const AccountForm = (props: Props) => {
  const [values, setValues] = useState({ name: '', email: props.initialEmail ?? '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const serverErrors: Record<string, string> = props.error ? { form: props.error.message, ...props.error.fieldErrors() } : {};
  const shown: Record<string, string> = { ...serverErrors, ...errors };
  const emailValid = !shown.email && LoginSchema.shape.email.safeParse(values.email).success;
  const passwordHint = props.mode === 'register' ? 'At least 8 characters' : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (props.mode === 'login') {
      const parsed = LoginSchema.safeParse(values);
      if (!parsed.success) return setErrors(FieldErrors(parsed.error));
      setErrors({});
      return props.onSubmit(parsed.data);
    }
    const parsed = RegisterSchema.safeParse(values);
    if (!parsed.success) return setErrors(FieldErrors(parsed.error));
    setErrors({});
    props.onSubmit(parsed.data);
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      {shown.form && <p className="form-error" role="alert">{shown.form}</p>}
      {props.mode === 'register' && (
        <AuthField id="acc-name" label="Your name" icon={User} error={shown.name}>
          <input id="acc-name" className={AUTH_INPUT} autoComplete="name" value={values.name} onChange={set('name')} aria-invalid={Boolean(shown.name)} aria-describedby={describedBy('acc-name', shown.name)} />
        </AuthField>
      )}
      <AuthField id="acc-email" label="Email address" icon={Mail} error={shown.email} valid={emailValid}>
        <input id="acc-email" className={AUTH_INPUT} type="email" autoComplete="email" value={values.email} onChange={set('email')} aria-invalid={Boolean(shown.email)} aria-describedby={describedBy('acc-email', shown.email)} />
      </AuthField>
      <AuthField id="acc-password" label="Password" icon={Lock} error={shown.password} hint={passwordHint}>
        <PasswordInput
          id="acc-password"
          wrapperClassName="static"
          className={`${AUTH_INPUT} h-auto rounded-none focus-visible:outline-none`}
          autoComplete={props.mode === 'register' ? 'new-password' : 'current-password'}
          value={values.password}
          onChange={set('password')}
          aria-invalid={Boolean(shown.password)}
          aria-describedby={describedBy('acc-password', shown.password, passwordHint)}
        />
      </AuthField>
      <Button type="submit" variant="primary" loading={props.busy} className="btn-block h-12 rounded-xl text-[15px]">
        {props.submitLabel}
      </Button>
    </form>
  );
};
