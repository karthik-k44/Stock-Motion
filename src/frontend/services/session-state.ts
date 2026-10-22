/**
 * Which business this browser is working in. Read synchronously by the request helpers (every
 * business-scoped URL starts with it) and by the realtime socket. Remembered per browser.
 */
const STORAGE_KEY = 'stockmotion:business';

const read = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

let businessId = read();
const listeners = new Set<() => void>();

export const sessionState = {
  GetBusinessId: () => businessId,
  SetBusinessId: (id: string | null) => {
    if (id === businessId) return;
    businessId = id;
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode — keep it in memory */
    }
    listeners.forEach((l) => l());
  },
  Subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

/** `/businesses/:id/<path>` for the current business. */
export const BusinessPath = (path: string): string => {
  if (!businessId) throw new Error('No business selected');
  return `/businesses/${businessId}${path}`;
};
