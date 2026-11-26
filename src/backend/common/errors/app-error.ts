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
export const Unauthorized = (message = 'Please sign in') => new AppError(401, 'UNAUTHORIZED', message);
export const Forbidden = (message = 'You do not have access to this') => new AppError(403, 'FORBIDDEN', message);
export const NotFound = (what: string, id: string) => new AppError(404, 'NOT_FOUND', `${what} ${id} was not found`);
export const Conflict = (message: string, details?: unknown) => new AppError(409, 'CONFLICT', message, details);
export const TooManyRequests = () => new AppError(429, 'RATE_LIMITED', 'Too many requests — slow down a little');
/** The business's plan has ended (trial over, payment failed): it is read-only until someone subscribes. */
export const SubscriptionRequired = (message: string) => new AppError(402, 'SUBSCRIPTION_REQUIRED', message);
/** The plan doesn't include this, or this would go over one of its limits. */
export const PlanLimit = (message: string, details?: unknown) => new AppError(403, 'PLAN_LIMIT', message, details);
/** The payment provider failed or refused; the message says what to do. */
export const PaymentProviderError = (message: string) => new AppError(502, 'PAYMENT_PROVIDER', message);
/** A feature that needs configuration the server doesn't have. */
export const Unavailable = (message: string) => new AppError(503, 'UNAVAILABLE', message);
