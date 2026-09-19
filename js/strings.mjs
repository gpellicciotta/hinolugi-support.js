/**
 * String manipulation, sanitization, and escaping utilities.
 */

/**
 * Escapes a string's HTML-significant characters so it is safe to interpolate into markup.
 *
 * @param {*} str The value or string to escape.
 * @returns {string} The escaped string safe for HTML interpolation.
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) {
    return '';
  }
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Capitalizes the first character of a string.
 *
 * @param {string} str The string to capitalize.
 * @returns {string} The capitalized string.
 */
export function capitalize(str) {
  if (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  return str;
}

/**
 * Lowercases the first character of a string.
 *
 * @param {string} str The string whose first character should be lowercased.
 * @returns {string} The uncapitalized string.
 */
export function uncapitalize(str) {
  if (str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
  return str;
}

/**
 * Escapes a string value so that it can be used literally inside a regular expression.
 *
 * @param {string} string The literal string to escape.
 * @returns {string} The escaped regular expression pattern.
 */
export function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
