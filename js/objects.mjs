/**
 * Pure object and array comparison and manipulation utilities.
 */

/**
 * Deeply compares two values for equality.
 *
 * @param {*} obj1 First value or object to compare.
 * @param {*} obj2 Second value or object to compare.
 * @returns {boolean} True if both objects are deeply equal.
 */
export function areEqual(obj1, obj2) {
  if (obj1 === obj2) {
    return true;
  }
  if (obj1 == null) {
    return obj2 == null;
  }
  if (obj2 == null) {
    return false;
  }
  if (Array.isArray(obj1)) {
    if (!Array.isArray(obj2)) {
      return false;
    }
    return areArraysEqual(obj1, obj2);
  }
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Deeply compares two arrays for element-by-element equality.
 *
 * @param {Array<*>} arr1 First array to compare.
 * @param {Array<*>} arr2 Second array to compare.
 * @returns {boolean} True if arr1 and arr2 have identical elements at every index.
 */
export function areArraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    const obj1 = arr1[i];
    const obj2 = arr2[i];
    if (!areEqual(obj1, obj2)) {
      return false;
    }
  }
  return true;
}

/**
 * Creates a deep clone of a JSON-serializable object.
 *
 * @param {*} obj The object to clone.
 * @returns {*} The cloned object.
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
