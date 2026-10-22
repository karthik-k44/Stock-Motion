import axios, { CanceledError, type AxiosError } from 'axios';
import { tokenStore } from './token-store';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Auth endpoints themselves skip the refresh-and-retry step, to avoid loops. */
    skipAuthRefresh?: boolean;
    _retried?: boolean;
    _sessionVersion?: number;
  }
}

type RefreshResultType = { accessToken: string; account: { id: string; email: string; name: string; createdAt: string } };

/** The one axios instance. Features never use it directly — see `request.ts`. */
export const httpClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  config._sessionVersion ??= tokenStore.Version();
  const token = tokenStore.Get();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

let refreshInFlight: Promise<RefreshResultType> | null = null;
const signedOutListeners = new Set<() => void>();

/** Exchange the refresh cookie for a new access token. Concurrent callers share one request. */
export const RefreshAccessToken = (): Promise<RefreshResultType> => {
  refreshInFlight ??= httpClient
    .post<RefreshResultType>('/auth/refresh', undefined, { skipAuthRefresh: true })
    .then(({ data }) => {
      tokenStore.Set(data.accessToken);
      return data;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
};

/** Called when the session can't be renewed (signed out elsewhere, cookie expired). */
export const OnSignedOut = (fn: () => void) => {
  signedOutListeners.add(fn);
  return () => {
    signedOutListeners.delete(fn);
  };
};

httpClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config;
    if (config && config._sessionVersion !== tokenStore.Version()) throw new CanceledError('Session changed');
    if (error.response?.status !== 401 || !config || config.skipAuthRefresh || config._retried) throw error;
    try {
      await RefreshAccessToken();
    } catch {
      tokenStore.Set(null);
      signedOutListeners.forEach((l) => l());
      throw error;
    }
    config._retried = true;
    return httpClient(config);
  },
);
