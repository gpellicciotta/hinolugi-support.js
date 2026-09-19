/**
 * Math, numeric utilities, angle conversions, and random value generators.
 */

/**
 * Multiplies two 2D numerical matrices.
 *
 * @param {number[][]} m1
 * @param {number[][]} m2
 * @returns {number[][]|null} Result of matrix multiplication or null if dimensions are incompatible.
 */
export function matrixMultiply(m1, m2) {
  const m1Rows = m1.length;
  const m1Cols = m1[0].length;
  const m2Rows = m2.length;
  const m2Cols = m2[0].length;

  if (m1Cols !== m2Rows) {
    return null;
  }

  const result = [];
  for (let j = 0; j < m1Rows; j++) {
    result[j] = [];
    for (let i = 0; i < m2Cols; i++) {
      let sum = 0;
      for (let n = 0; n < m1Cols; n++) {
        sum += m1[j][n] * m2[n][i];
      }
      result[j][i] = sum;
    }
  }
  return result;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 *
 * @param {number} min
 * @param {number} [max] Defaults to min with min=0 if omitted.
 * @returns {number}
 */
export function random(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max + 1 - min)) + min;
}

/**
 * Returns a random floating-point number between min (inclusive) and max (inclusive).
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomFloat(min, max) {
  const delta = max - min + 0.0001;
  return min + Math.random() * delta;
}

/**
 * Returns a random boolean value.
 *
 * @returns {boolean}
 */
export function randomBoolean() {
  return Math.random() <= 0.5;
}

/**
 * Returns a random element from an array.
 *
 * @template T
 * @param {Array<T>} array
 * @returns {T|null} A random array element or null if empty.
 */
export function randomElement(array) {
  if (array.length === 0) {
    return null;
  }
  const idx = random(0, array.length - 1);
  return array[idx];
}

/**
 * Shuffles array elements in-place or into a new array.
 *
 * @template T
 * @param {Array<T>} a
 * @param {boolean} [inplace=true]
 * @returns {Array<T>}
 */
export function shuffle(a, inplace = true) {
  const arr = inplace ? a : a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Calculates Euclidean distance between two points with x and y coordinates.
 *
 * @param {{x: number, y: number}} point1
 * @param {{x: number, y: number}} point2
 * @returns {number}
 */
export function distance(point1, point2) {
  const p1 = Math.pow(point2.x - point1.x, 2);
  const p2 = Math.pow(point2.y - point1.y, 2);
  return Math.sqrt(p1 + p2);
}

/**
 * Constrains a value within a specific range [min, max].
 *
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function constrain(val, min, max) {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
}

/** Alias for constrain. */
export const clamp = constrain;

/**
 * Converts an angle in radians to degrees.
 *
 * @param {number} angle
 * @returns {number}
 */
export function radiansToDegrees(angle) {
  return (angle * 180) / Math.PI;
}

/**
 * Converts an angle in degrees to radians.
 *
 * @param {number} angle
 * @returns {number}
 */
export function degreesToRadians(angle) {
  return (angle * Math.PI) / 180;
}

/**
 * Formats a value as a decimal string with fixed decimal places.
 *
 * @param {number} val
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function decimalString(val, decimals = 2) {
  decimals = Math.max(0, decimals);
  val = Math.floor(val * Math.pow(10, decimals));
  if (val === 0) {
    switch (decimals) {
      case 0:
        return '0';
      case 1:
        return '0.0';
      default:
        return '0.' + '0'.repeat(decimals);
    }
  }
  let sign = '';
  if (val < 0) {
    sign = '-';
    val = Math.abs(val);
  }
  let decStr = '' + val;
  if (decimals === 0) {
    return sign + decStr;
  }
  if (decimals === decStr.length) {
    return sign + '0.' + decStr;
  }
  if (decStr.length < decimals + 1) {
    decStr = '0'.repeat(decimals + 1 - decStr.length) + decStr;
  }
  return sign + decStr.substr(0, decStr.length - decimals) + '.' + decStr.substr(decStr.length - decimals);
}

/**
 * Formats a ratio value (0.0 to 1.0) as a percentage string.
 *
 * @param {number} val
 * @param {number} [decimals=0]
 * @returns {string}
 */
export function percentString(val, decimals = 0) {
  return decimalString(val * 100, decimals) + '%';
}

/**
 * Maps a value from an original range into a new range.
 *
 * @param {number} val
 * @param {number} origMin
 * @param {number} origMax
 * @param {number} newMin
 * @param {number} newMax
 * @returns {number}
 */
export function map(val, origMin, origMax, newMin, newMax) {
  return ((val - origMin) * (newMax - newMin)) / (origMax - origMin) + newMin;
}

/**
 * Checks whether an input value represents a valid finite number.
 *
 * @param {*} numOrNumStr
 * @returns {boolean}
 */
export function isNumeric(numOrNumStr) {
  return !isNaN(+numOrNumStr) && !isNaN(parseFloat(numOrNumStr));
}

/**
 * Formats a number with specified fraction digits and optional thousands grouping.
 *
 * @param {number} numVal
 * @param {number} [fractionDigits=2]
 * @param {number} [minimumIntegerDigits=1]
 * @param {boolean} [useGrouping=false]
 * @returns {string}
 */
export function formatNumber(numVal, fractionDigits = 2, minimumIntegerDigits = 1, useGrouping = false) {
  return numVal.toLocaleString(undefined, {
    useGrouping,
    minimumIntegerDigits,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}
