/**
 * Base exception for all API errors
 */
export class ApiException extends Error {
  public readonly statusCode?: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiException);
    }
  }

  override toString(): string {
    if (this.statusCode) {
      return `ApiException (${this.statusCode}): ${this.message}`;
    }
    return `ApiException: ${this.message}`;
  }
}

/**
 * Exception for network-related errors (no internet, timeout, etc.)
 */
export class NetworkException extends ApiException {
  constructor(message: string, details?: unknown) {
    super(message, undefined, details);
    this.name = 'NetworkException';
  }

  override toString(): string {
    return `NetworkException: ${this.message}`;
  }
}

/**
 * Exception for authentication errors (401, invalid token, etc.)
 */
export class AuthenticationException extends ApiException {
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message, statusCode, details);
    this.name = 'AuthenticationException';
  }

  override toString(): string {
    return `AuthenticationException: ${this.message}`;
  }
}

/**
 * Exception for authorization errors (403, insufficient permissions)
 */
export class AuthorizationException extends ApiException {
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message, statusCode, details);
    this.name = 'AuthorizationException';
  }

  override toString(): string {
    return `AuthorizationException: ${this.message}`;
  }
}

/**
 * Exception for validation errors (400, invalid input)
 */
export class ValidationException extends ApiException {
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message, statusCode, details);
    this.name = 'ValidationException';
  }

  override toString(): string {
    return `ValidationException: ${this.message}`;
  }
}

/**
 * Exception for not found errors (404)
 */
export class NotFoundException extends ApiException {
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message, statusCode ?? 404, details);
    this.name = 'NotFoundException';
  }

  override toString(): string {
    return `NotFoundException: ${this.message}`;
  }
}

/**
 * Exception for server errors (500+)
 */
export class ServerException extends ApiException {
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message, statusCode ?? 500, details);
    this.name = 'ServerException';
  }

  override toString(): string {
    return `ServerException: ${this.message}`;
  }
}

/**
 * Exception for timeout errors
 */
export class TimeoutException extends ApiException {
  constructor(message: string, details?: unknown) {
    super(message, undefined, details);
    this.name = 'TimeoutException';
  }

  override toString(): string {
    return `TimeoutException: ${this.message}`;
  }
}

/**
 * Exception for parsing/serialization errors
 */
export class ParseException extends ApiException {
  constructor(message: string, details?: unknown) {
    super(message, undefined, details);
    this.name = 'ParseException';
  }

  override toString(): string {
    return `ParseException: ${this.message}`;
  }
}
