/**
 * Repository / activity-service errors with stable codes for UI mapping.
 */

export type ActivityErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "VALIDATION"
  | "INVALID_STATE"
  | "CONFIG";

export class ActivityError extends Error {
  readonly code: ActivityErrorCode;
  readonly details?: unknown;

  constructor(code: ActivityErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ActivityError";
    this.code = code;
    this.details = details;
  }
}

export function isActivityError(error: unknown): error is ActivityError {
  return error instanceof ActivityError;
}
