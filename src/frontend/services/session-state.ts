/**
 * What this browser remembers between visits: which business it works in (read synchronously by the request helpers,
 * since every business-scoped URL starts with it, and by the realtime socket), and whether it was signed in.
 */
const BUSINESS_KEY = 'stockmotion:business';
/** A hint only — never a credential. The session itself lives in the httpOnly refresh cookie. */
const SIGNED_IN_KEY = 'stockmotion:signed-in';

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* private mode — keep it in memory */
  }
};

let businessId = read(BUSINESS_KEY);
let signedIn = read(SIGNED_IN_KEY) === '1';
const listeners = new Set<() => void>();

export const sessionState = {
  GetBusinessId: () => businessId,
  SetBusinessId: (id: string | null) => {
    if (id === businessId) return;
    businessId = id;
    write(BUSINESS_KEY, id);
    listeners.forEach((l) => l());
  },
  Subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  /** Whether this browser was signed in when last seen: worth checking the session before showing a public page. */
  WasSignedIn: () => signedIn,
  SetSignedIn: (value: boolean) => {
    signedIn = value;
    write(SIGNED_IN_KEY, value ? '1' : null);
  },
};

/** `/businesses/:id/<path>` for the current business. */
export const BusinessPath = (path: string): string => {
  if (!businessId) throw new Error('No business selected');
  return `/businesses/${businessId}${path}`;
};
