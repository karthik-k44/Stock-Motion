/**
 * Which warehouse user the browser is acting as. Read synchronously by the
 * axios client (it becomes the `x-user-id` header) and by the UI.
 */
const STORAGE_KEY = 'stockmotion:acting-user';
export const DEFAULT_USER_ID = 'u-jordan';

function read(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_USER_ID;
  } catch {
    return DEFAULT_USER_ID;
  }
}

let actingUserId = read();
const listeners = new Set<() => void>();

export const sessionState = {
  GetActingUserId: () => actingUserId,
  ReplaceActingUser(id: string) {
    actingUserId = id;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* private mode — keep it in memory */
    }
    listeners.forEach((l) => l());
  },
  Subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
