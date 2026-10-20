/**
 * The access token lives in memory only, never in localStorage, so an injected script can't read
 * it off disk. Reloads restore the session through the httpOnly refresh cookie instead.
 */
let accessToken: string | null = null;
let sessionVersion = 0;

export const tokenStore = {
  Get: (): string | null => accessToken,
  Set: (token: string | null) => {
    accessToken = token;
  },
  /** Bumped on sign-in, sign-out and business switch: requests started before it are stale. */
  Version: (): number => sessionVersion,
  Advance: () => {
    sessionVersion += 1;
  },
};
