/** An error that is safe to show to API clients. */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest = (message: string, details?: unknown) => new AppError(400, 'BAD_REQUEST', message, details);
export const Unauthorized = (message = 'Choose who you are acting as') => new AppError(401, 'UNAUTHORIZED', message);
export const NotFound = (what: string, id: string) => new AppError(404, 'NOT_FOUND', `${what} ${id} was not found`);
export const Conflict = (message: string, details?: unknown) => new AppError(409, 'CONFLICT', message, details);
export const TooManyRequests = () => new AppError(429, 'RATE_LIMITED', 'Too many requests — slow down a little');
