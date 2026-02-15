/**
 * Validation patterns and constants for tire size and variant parsing
 */

/** Pattern for tire size validation: XXX/XXRXX format */
export const TIRE_SIZE_STRICT_PATTERN = /^(\d{3})\/(\d{2})R(\d{2})$/;

/** Pattern for flexible tire size input allowing spaces */
export const TIRE_SIZE_FLEXIBLE_PATTERN = /^\s*\d{3}\s*\/\s*\d{2}\s*[Rr]\s*\d{2}\s*$/;

/** Example tire size format for error messages */
export const TIRE_SIZE_FORMAT_EXAMPLE = '205/55R16';

/** Pattern for variant parsing: number + single uppercase letter (e.g., "91V") */
export const VARIANT_PATTERN = /^(\d+)([A-Z])$/;

/** Example variant format for error messages */
export const VARIANT_FORMAT_EXAMPLE = '91V';

/**
 * Error messages
 */
export const TIRE_SIZE_ERROR_MESSAGE = `Invalid tire size format. Expected: ${TIRE_SIZE_FORMAT_EXAMPLE}`;
export const TIRE_SIZE_DTO_ERROR_MESSAGE = `sizeRaw must match XXX/XXRXX, e.g. ${TIRE_SIZE_FORMAT_EXAMPLE}`;
export const VARIANT_ERROR_MESSAGE = `Invalid variant format. Expected: ${VARIANT_FORMAT_EXAMPLE} (number + single letter)`;

/**
 * Response messages
 */
export const VARIANT_NOT_FOUND_WARNING = 'variant_not_found';

/**
 * Validation error codes
 */
export const VALIDATION_ERROR_CODES = {
  MISSING_CODE_AND_SIZE: 'Either "code" or "size" parameter is required',
  BOTH_CODE_AND_SIZE: 'Please provide either "code" or "size", not both',
  MISSING_REQUIRED_FIELDS: 'Both "codePublic" and "sizeRaw" are required',
  MISSING_UPDATE_FIELDS: 'Provide "codePublic" or "sizeRaw" to update',
  INCOMPLETE_VARIANT_PARAMS: 'Both "li" and "si" are required',
  INVALID_CODE_INPUT: '"code" is required',
  INVALID_SIZE_INPUT: '"size" is required',
};
