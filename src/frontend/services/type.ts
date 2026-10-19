/** Error body returned by the API for every non-2xx response. */
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
