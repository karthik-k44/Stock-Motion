import type { AxiosRequestConfig } from 'axios';
import { httpClient } from './api';
import { ToApiError } from './api-error';

type Config = Pick<AxiosRequestConfig, 'params' | 'signal'>;

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
