/**
 * Safely stringifies an object to JSON for use within an HTML <script> tag.
 * Replaces < with \u003c to prevent XSS.
 *
 * @param {any} obj - The object to stringify.
 * @returns {string} The safe JSON string.
 */
export function safeJsonStringify(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
