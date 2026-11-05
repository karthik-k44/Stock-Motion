import { z } from 'zod';
import { CONTACT } from './landing-content';

export const COUNTRY_CODES = [
  { code: 'US', dial: '+1' },
  { code: 'CA', dial: '+1' },
  { code: 'GB', dial: '+44' },
  { code: 'AU', dial: '+61' },
  { code: 'IN', dial: '+91' },
  { code: 'DE', dial: '+49' },
  { code: 'FR', dial: '+33' },
  { code: 'AE', dial: '+971' },
  { code: 'SG', dial: '+65' },
];

export const DialCode = (country: string) => COUNTRY_CODES.find((c) => c.code === country)?.dial ?? '';

export const ContactSchema = z.object({
  firstName: z.string().trim().min(1, 'Tell us your first name').max(80),
  email: z.string().trim().email('Enter a valid email address'),
  country: z.string(),
  phone: z.string().trim().max(30).regex(/^[\d\s()+.-]*$/, 'Use digits, spaces and dashes'),
  // Mail apps cut long mailto links short, so the message stays well under that.
  message: z.string().trim().min(1, 'Write your message').max(1500, 'Keep it under 1,500 characters'),
  consent: z.literal(true, { errorMap: () => ({ message: 'Tick this so we can reply to you' }) }),
});
export type ContactInput = z.infer<typeof ContactSchema>;

/** The form has no server behind it: it opens the visitor's own email app with the message ready to send. */
export const ContactMailto = ({ firstName, email, country, phone, message }: ContactInput): string => {
  const from = [firstName, email, phone && `${DialCode(country)} ${phone}`].filter(Boolean).join('\n');
  const params = [`subject=${encodeURIComponent(`StockMotion enquiry from ${firstName}`)}`, `body=${encodeURIComponent(`${message}\n\n${from}`)}`];
  return `mailto:${CONTACT.email}?${params.join('&')}`;
};
