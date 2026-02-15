/**
 * Application-wide error codes for consistent error handling and tracking
 */

export enum ErrorCode {
  // Tire Code Errors
  TIRE_CODE_NOT_FOUND = 'TIRE_CODE_NOT_FOUND',
  TIRE_CODE_ALREADY_EXISTS = 'TIRE_CODE_ALREADY_EXISTS',

  // Tire Size Errors
  TIRE_SIZE_NOT_FOUND = 'TIRE_SIZE_NOT_FOUND',
  TIRE_SIZE_ALREADY_EXISTS = 'TIRE_SIZE_ALREADY_EXISTS',
  TIRE_SIZE_ALREADY_MAPPED = 'TIRE_SIZE_ALREADY_MAPPED',
  INVALID_TIRE_SIZE_FORMAT = 'INVALID_TIRE_SIZE_FORMAT',

  // Variant Errors
  VARIANT_NOT_FOUND = 'VARIANT_NOT_FOUND',
  INVALID_VARIANT_FORMAT = 'INVALID_VARIANT_FORMAT',

  // Validation Errors
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT = 'INVALID_INPUT',
  INCOMPLETE_PARAMETERS = 'INCOMPLETE_PARAMETERS',

  // Request Errors
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',

  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

/**
 * Error message mapping for user-friendly error responses
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.TIRE_CODE_NOT_FOUND]: 'Tire code not found',
  [ErrorCode.TIRE_CODE_ALREADY_EXISTS]: 'Tire code already exists',
  [ErrorCode.TIRE_SIZE_NOT_FOUND]: 'Tire size not found',
  [ErrorCode.TIRE_SIZE_ALREADY_EXISTS]: 'Tire size already exists',
  [ErrorCode.TIRE_SIZE_ALREADY_MAPPED]: 'Tire size already has a mapping',
  [ErrorCode.INVALID_TIRE_SIZE_FORMAT]:
    'Invalid tire size format. Expected: XXX/XXRXX (e.g., 205/55R16)',
  [ErrorCode.VARIANT_NOT_FOUND]: 'Variant not found',
  [ErrorCode.INVALID_VARIANT_FORMAT]:
    'Invalid variant format. Expected: XXV (e.g., 91V)',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Missing required field',
  [ErrorCode.INVALID_INPUT]: 'Invalid input',
  [ErrorCode.INCOMPLETE_PARAMETERS]: 'Incomplete parameters',
  [ErrorCode.BAD_REQUEST]: 'Bad request',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.CONFLICT]: 'Resource conflict',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
};
