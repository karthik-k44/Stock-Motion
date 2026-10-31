import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { describedBy, Field, PasswordInput } from '@/frontend/components/form';
import { FieldErrors } from '@/frontend/lib/form';
import type { ApiError } from '@/frontend/services/api-error';
import { LoginSchema, RegisterSchema, type LoginInput, type RegisterInput } from '../types';

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
        <Field id="acc-name" label="Your name" error={shown.name}>
          <input id="acc-name" className="input" autoComplete="name" value={values.name} onChange={set('name')} aria-invalid={Boolean(shown.name)} aria-describedby={describedBy('acc-name', shown.name)} />
        </Field>
      )}
      <Field id="acc-email" label="Email" error={shown.email}>
        <input id="acc-email" className="input" type="email" autoComplete="email" value={values.email} onChange={set('email')} aria-invalid={Boolean(shown.email)} aria-describedby={describedBy('acc-email', shown.email)} />
      </Field>
      <Field id="acc-password" label="Password" error={shown.password} hint={props.mode === 'register' ? 'At least 8 characters' : undefined}>
        <PasswordInput
          id="acc-password"
          autoComplete={props.mode === 'register' ? 'new-password' : 'current-password'}
          value={values.password}
          onChange={set('password')}
          aria-invalid={Boolean(shown.password)}
          aria-describedby={describedBy('acc-password', shown.password, props.mode === 'register')}
        />
      </Field>
      <Button type="submit" variant="primary" loading={props.busy} className="btn-block">
        {props.submitLabel}
      </Button>
    </form>
  );
};
