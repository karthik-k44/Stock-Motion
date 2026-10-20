import { isAxiosError, isCancel } from 'axios';
import type { ApiErrorBody } from './type';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Field errors from a `VALIDATION_FAILED` response, keyed by field name. */
  fieldErrors(): Record<string, string> {
    if (this.code !== 'VALIDATION_FAILED' || !this.details || typeof this.details !== 'object') return {};
    return Object.fromEntries(
      Object.entries(this.details as Record<string, string[]>).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]),
    );
  }
}

export const ToApiError = (err: unknown): ApiError => {
  if (err instanceof ApiError) return err;
  if (isAxiosError<ApiErrorBody>(err)) {
    const body = err.response?.data;
    if (body?.error) return new ApiError(err.response?.status ?? 0, body.error.code, body.error.message, body.error.details);
    if (!err.response) return new ApiError(0, 'NETWORK', 'Can’t reach the server — check that it is running');
    return new ApiError(err.response.status, 'HTTP_ERROR', `Request failed (${err.response.status})`);
  }
  return new ApiError(0, 'UNKNOWN', err instanceof Error ? err.message : 'Something went wrong');
};

export const IsCanceled = (err: unknown): boolean => {
  return isCancel(err);
};
