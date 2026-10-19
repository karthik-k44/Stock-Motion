import type { AxiosRequestConfig } from 'axios';
import { httpClient } from './api';
import { ToApiError } from './api-error';
import { BusinessPath } from './session-state';

type Config = Pick<AxiosRequestConfig, 'params' | 'signal' | 'skipAuthRefresh'>;

async function run<T>(fn: () => Promise<{ data: T }>): Promise<T> {
  try {
    return (await fn()).data;
  } catch (err) {
    throw ToApiError(err);
  }
}

export const Get = <T>(url: string, config?: Config) => run<T>(() => httpClient.get<T>(url, config));
export const Post = <T>(url: string, body?: unknown, config?: Config) => run<T>(() => httpClient.post<T>(url, body ?? {}, config));
export const Put = <T>(url: string, body?: unknown, config?: Config) => run<T>(() => httpClient.put<T>(url, body ?? {}, config));
export const Patch = <T>(url: string, body?: unknown, config?: Config) => run<T>(() => httpClient.patch<T>(url, body ?? {}, config));
export const Delete = <T>(url: string, config?: Config) => run<T>(() => httpClient.delete<T>(url, config));

/** The same verbs against `/businesses/:currentBusiness/<path>`. */
export const Biz = {
  Get: <T>(path: string, config?: Config) => Get<T>(BusinessPath(path), config),
  Post: <T>(path: string, body?: unknown, config?: Config) => Post<T>(BusinessPath(path), body, config),
  Put: <T>(path: string, body?: unknown, config?: Config) => Put<T>(BusinessPath(path), body, config),
  Patch: <T>(path: string, body?: unknown, config?: Config) => Patch<T>(BusinessPath(path), body, config),
  Delete: <T>(path: string, config?: Config) => Delete<T>(BusinessPath(path), config),
};
