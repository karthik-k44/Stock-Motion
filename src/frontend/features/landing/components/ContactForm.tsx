import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/frontend/components/button';
import { describedBy, Field, Select } from '@/frontend/components/form';
import { Text } from '@/frontend/components/text';
import { FieldErrors } from '@/frontend/lib/form';
import { ContactMailto, ContactSchema, COUNTRY_CODES, DialCode } from '../lib/contact-form';
import { CONTACT } from '../lib/landing-content';

const INPUT = 'h-10 rounded-lg border-line-strong';

type TextField = 'firstName' | 'email' | 'phone' | 'message';

/** First name, email, optional phone and a message, checked here and then handed to the visitor's email app. */
export const ContactForm = () => {
  const [values, setValues] = useState({ firstName: '', email: '', country: 'US', phone: '', message: '', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [opened, setOpened] = useState(false);
  const set = (key: TextField) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const input = (key: TextField) => ({
    id: `contact-${key}`,
    value: values[key],
    onChange: set(key),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': describedBy(`contact-${key}`, errors[key]),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = ContactSchema.safeParse(values);
    if (!parsed.success) {
      setOpened(false);
      return setErrors(FieldErrors(parsed.error));
    }
    setErrors({});
    setOpened(true);
    window.location.href = ContactMailto(parsed.data);
  };

  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <Field id="contact-firstName" label="First name" error={errors.firstName}>
        <input className={`input ${INPUT}`} autoComplete="given-name" placeholder="First name" {...input('firstName')} />
      </Field>
      <Field id="contact-email" label="Email" error={errors.email}>
        <input className={`input ${INPUT}`} type="email" autoComplete="email" placeholder="you@company.com" {...input('email')} />
      </Field>
      <Field id="contact-phone" label="Phone number (optional)" error={errors.phone}>
        <div className="input flex h-10 items-center gap-0 rounded-lg border-line-strong p-0 focus-within:border-(--focus) focus-within:outline-2 focus-within:outline-(--focus)">
          <Select
            aria-label="Country code"
            className="h-full w-[72px] flex-none rounded-lg border-0 bg-transparent px-2.5 shadow-none focus-visible:ring-0"
            value={values.country}
            options={COUNTRY_CODES.map((c) => ({ value: c.code, label: c.code }))}
            onChange={(country) => setValues((v) => ({ ...v, country }))}
          />
          <input className="h-full min-w-0 flex-1 border-0 bg-transparent px-1.5 outline-none" type="tel" autoComplete="tel-national" placeholder={`${DialCode(values.country)} (555) 000-0000`} {...input('phone')} />
        </div>
      </Field>
      <Field id="contact-message" label="Message" error={errors.message}>
        <textarea className="input rounded-lg border-line-strong" rows={4} placeholder="Leave us a message…" {...input('message')} />
      </Field>
      <div>
        <label className="check text-ink-2">
          <input
            type="checkbox"
            checked={values.consent}
            onChange={(e) => setValues((v) => ({ ...v, consent: e.target.checked }))}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? 'contact-consent-error' : undefined}
          />
          I’m happy for the team to reply to me about this message.
        </label>
        {errors.consent && <p id="contact-consent-error" className="field-error mt-1" role="alert">{errors.consent}</p>}
      </div>
      <Button type="submit" variant="primary" className="h-11 w-full rounded-lg text-[15px]">Send message</Button>
      <Text variant="small" tone="muted" role="status" className="text-center">
        {opened ? `Your email app should now be open with this message ready to send. If it isn’t, write to ${CONTACT.email}.` : 'This opens your email app with your message ready to send.'}
      </Text>
    </form>
  );
};
