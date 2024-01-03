import * as log from './log.mjs';

// General utility functions that don't rely on any global objects or the DOM

export function areEqual(obj1, obj2) {
  if (obj1 === obj2) {
    return true;
  }
  if (obj1 == null) {
    return (obj2 == null);
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

export function areArraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    let obj1 = arr1[i];
    let obj2 = arr2[i];
    if (!areEqual(obj1, obj2)) {
      return false;
    }
  }
  return true;
}

/** 
 *  Deep clone an object. 
 * 
 *  @param obj The object to clone.
 *  @return The cloned object.
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** 
 *  Check whether a string is a valid email address. 
 * 
 *  @param str The email address to check.
 *  @return True if deemed valid, false otherwise.
 */
export function isValidEmailAddress(email) {
  if (!email) { return false; }
  if (email.indexOf('@') <= 0) { return false; }
  return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email));
}

/** 
 *  Ensure a strings starts with an uppercase letter. 
 * 
 *  @param str The string to capitalize.
 *  @return The result.
 */
export function capitalize(str) {
  if (str) {
    str = str.charAt(0).toUpperCase() + str.slice(1);
  }
  return str;
}

/** 
 *  Ensure a strings starts with a lowercase letter. 
 * 
 *  @param str The string to uncapitalize.
 *  @return The result.
 */
export function uncapitalize(str) {
  if (str) {
    str = str.charAt(0).toLowerCase() + str.slice(1);
  }
  return str;
}

/**
 *  Multiply two matrices.
 *
 *  @param m1 The first matrix to multiply.
 *  @param m2 The second matrix to multiply.
 *
 *  @return The result of matrix multiplication.
 */
export function matrixMultiply(m1, m2) {
  let m1Rows = m1.length;
  let m1Cols = m1[0].length;

  let m2Rows = m2.length;
  let m2Cols = m2[0].length;

  if (m1Cols !== m2Rows) {
    return null;
  }

  let result = [];
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
 *  Give a random integer number between min (inclusive) and max (inclusive).
 *
 *  @param min The min. value to return.
 *  @param max The max. value to return.
 *
 *  @return A random value in the range [min, max].
 */
export function random(min, max) {
  if (max == undefined) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max + 1 - min)) + min;
}

/**
 *  Give a random floating-point number between min (inclusive) and max (inclusive).
 *
 *  @param min The min. value to return.
 *  @param max The max. value to return.
 *
 *  @return A random value in the range [min, max].
 */
export function randomFloat(min, max) {
  let delta = max - min + 0.0001;
  return min + (Math.random() * delta);
}

/**
 *  Give a random boolean value.
 *
 *  @return Either <code>true</code> or <code>false</code>.
 */
export function randomBoolean() {
  return Math.random() <= 0.5;
}

/**
 *  Give a random array element.
 *
 *  @param array Array to pick a random element from.
 *
 *  @return A random array element or <code>null</code> if array is empty.
 */
export function randomElement(array) {
  if (array.length === 0) {
    return null;
  }
  let idx = random(0, array.length - 1);
  return array[idx];
}

/**
 *  Give a random RGB color value.
 *
 *  @param withAlpha Whether to also have a random alpha-component (between 0.1 and 1.0).
 *
 *  @return A random RGB or RGBA value.
 */
export function randomRgbColor(withAlpha = false) {
  let r = random(1, 255);
  let g = random(1, 255);
  let b = random(1, 255);
  if (withAlpha) {
    let a = random(1, 10) / 10;
    return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
  }
  else {
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }
}

/**
 *  Give a random date between two dates.
 *
 *  @param min The min. value to return. If not given, will be the current date/time - 5d.
 *  @param max The max. value to return. If not given, max will be the current date/time.
 *
 *  @return A random date value in the range [min, max].
 */
export function randomDate(min, max) {
  if (max == undefined) {
    max = new Date();
    if (min == undefined) {
      const maxEpocMillis = max.getTime();
      const minEpocMillis = maxEpocMillis - (5 * 24 * 60 * 60 * 1000);
      min = new Date();
      min.setTime(minEpocMillis);
    }
  }
  const minTime = min.getTime();
  const maxTime = max.getTime();
  const rndTime = Math.floor(Math.random() * (maxTime + 1 - minTime)) + minTime;
  const result = new Date();
  result.setTime(rndTime);
  return result;
}

/**
 * Shuffle an array.
 *
 * @param arr The array whose elements should be shuffled into a random order.
 * @param inplace Whether the array should be updated in-place. If false, a new array will be created.
 *
 * @return The shuffled array, which can either be the originally passed-in array or a new array.
 */
export function shuffle(a, inplace=true) {
  let arr = inplace ? a : a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    let tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 *  Calculate the Euclidean distance between two points.
 *
 *  @param point1 The first point, that should have 'x' and 'y' properties.
 *  @param point2 The second point, that should have 'x' and 'y' properties.
 *
 *  @return The distance between both points.
 */
export function distance(point1, point2) {
  let p1 = Math.pow(point2.x - point1.x, 2);
  let p2 = Math.pow(point2.y - point1.y, 2);
  let p3 = p1 + p2;
  return Math.sqrt(p3);
}

/**
 *  Constrain a value within a specific range.
 *
 *  @param val The value to constrain.
 *  @param min The minimum valid value.
 *  @param max The maximum valid value.
 *
 *  @return The value as provided if it is in the range [min, max], min if value < min or max if value > max.
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

/**
 *  Create a percent-string.
 *
 *  @param val The value to represent as a percentage string.
 *  @param decimals The number of decimals to use. By default 0.
 *
 *  @return A string representation of the floating-point number with the desired number of decimals.
 */
export function percentString(val, decimals=0) {
  return decimalString(val * 100, decimals) + '%';
}

export function radiansToDegrees(angle) {
  return (angle * 180) / Math.PI;
}

export function degreesToRadians(angle) {
  return (angle * Math.PI) / 180;
}

/**
 *  Create a decimal string.
 *
 *  @param val The value to represent as a decimal string.
 *  @param decimals The number of decimals to use. By default 2.
 *
 *  @return A string representation of the floating-point number with the desired number of decimals.
 */
export function decimalString(val, decimals=2) {
  decimals = Math.max(0, decimals);
  val = Math.floor(val * Math.pow(10, decimals));
  if (val === 0) { // Edge case for zero value (after rounding)
    switch (decimals) {
      case 0: return '0';
      case 1: return '0.0';
      default: return '0.' + '0'.repeat(decimals);
    }
  }
  let sign = '';
  if (val < 0) {
    sign = '-';
    val = Math.abs(val);
  }
  let decStr = "" + val;
  if (decimals === 0) { // Edge case for zero decimals
    return sign + decStr;
  }
  if (decimals === decStr.length) { // Edge case for only decimals
    return sign + '0.' + decStr;
  }
  if (decStr.length < decimals + 1 /* 0 before decimal-separator */) {
    decStr = '0'.repeat(decimals + 1 - decStr.length) + decStr;
  }
  return sign + decStr.substr(0, decStr.length-decimals) + '.' + decStr.substr(decStr.length-decimals);
}

function decimalStringTest() {
  log.trace("decstr(0, 0) = [" + utils.decimalString(0, 0) + "]");
  log.trace("decstr(0, 1) = [" + utils.decimalString(0, 1) + "]");
  log.trace("decstr(0, 2) = [" + utils.decimalString(0, 2) + "]");
  log.trace("decstr(0.1, 2) = [" + utils.decimalString(0.1, 2) + "]");
  log.trace("decstr(0.12, 2) = [" + utils.decimalString(0.12, 2) + "]");
  log.trace("decstr(12.3456, 3) = [" + utils.decimalString(12.3456, 3) + "]");
}

/**
 *  Map a value that sits in a specific range of integer values, into a value that sits in a newly specified range of integer values.
 *
 *  @param val The value to map
 *  @param origMin The original range's min. value.
 *  @param origMax The original range's max. value.
 *  @param newMin The new range's min. value.
 *  @param newMax The new range's max. value.
 */
export function map(val, origMin, origMax, newMin, newMax) {
  // https://stackoverflow.com/questions/5731863/mapping-a-numeric-range-onto-another

  let origRange = origMax - origMin;
  let newRange = newMax - newMin;
  let factor = newRange / origRange;
  return newMin + (factor * (val - origMin));
}

/**
 * Convert an HSL color value to RGB.
 *
 * Conversion formula adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * and https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
 *
 * @param h The hue: a float value in the range [0, 1]
 * @param s The saturation: a float value in the range [0, 1]
 * @param l The lightness: a float value in the range [0, 1]
 * @return An object with 'r', 'g' and 'b' properties, all integers in the range [0, 255].
 */
export function hslToRgb(h, s, l){
  let r = 0;
  let g = 0;
  let b = 0;

  if (s == 0.0) {
    r = g = b = l; // achromatic
  }
  else {
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hueToRgb(p, q, h + 1.0/3.0);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1.0/3.0);
  }
  return { r: to255(r), g: to255(g), b: to255(b) };
}

function to255(v) {
  return Math.floor(Math.min(255, 256 * v));
}

function hueToRgb(p, q, t) {
  if (t < 0.0) {
    t += 1.0;
  }
  if (t > 1.0) {
    t -= 1.0;
  }
  if (t < 1.0/6.0) {
    return p + (q - p) * 6.0 * t;
  }
  if (t < 1.0/2.0) {
    return q;
  }
  if (t < 2.0/3.0) {
    return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  }
  return p;
}

/**
 * Convert an RGB color value to HSL.
 *
 * Conversion formula adapted from http://en.wikipedia.org/wiki/HSL_color_space
 * and https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
 *
 * @param r The red color component: an integer in the range [0, 255].
 * @param g The green color component: an integer in the range [0, 255].
 * @param b The blue color component: an integer in the range [0, 255].
 *
 * @return An object with 'h' (hue), 's' (saturation) and 'l' (light) properties: float values in the range [0, 1].
 */
export function rgbToHsl(r, g, b) {
  r = r / 255.0;
  g = g / 255.0;
  b = b / 255.0;

  let max = (r > g && r > b) ? r : (g > b) ? g : b;
  let min = (r < g && r < b) ? r : (g < b) ? g : b;

  let h = 0.0;
  let s = 0.0;
  let l = (max + min) / 2.0;

  if (max === min) {
    h = 0.0;
    s = 0.0;
  }
  else {
    let d = max - min;
    s = (l > 0.5) ? d / (2.0 - max - min) : d / (max + min);
    if (r > g && r > b) {
      h = (g - b) / d + (g < b ? 6.0 : 0.0);
    }
    else if (g > b) {
      h = (b - r) / d + 2.0;
    }
    else {
      h = (r - g) / d + 4.0;
    }
    h /= 6.0;
  }

  return { h: h, s: s, l: l };
}

export function hslToString(h) {
  let hslStr = 'hsl(';
  hslStr += Math.ceil(255 * h.h);
  hslStr += ',';
  hslStr += Math.ceil(100 * h.s);
  hslStr += '%,';
  hslStr += Math.ceil(100 * h.l);
  hslStr += '%)';
  return hslStr;
}

function colorNameToRgba(n) {
  switch (n.trim().toLowerCase()) {
    case 'aliceblue': return { r: 240, g: 248, b: 255, a: 1.0 };
    case 'antiquewhite': return { r: 250, g: 235, b: 215, a: 1.0 };
    case 'aqua': return { r: 0, g: 255, b: 255, a: 1.0 };
    case 'aquamarine': return { r: 127, g: 255, b: 212, a: 1.0 };
    case 'azure': return { r: 240, g: 255, b: 255, a: 1.0 };
    case 'beige': return { r: 245, g: 245, b: 220, a: 1.0 };
    case 'bisque': return { r: 255, g: 228, b: 196, a: 1.0 };
    case 'black': return { r: 0, g: 0, b: 0, a: 1.0 };
    case 'blanchedalmond': return { r: 255, g: 235, b: 205, a: 1.0 };
    case 'blue': return { r: 0, g: 0, b: 255, a: 1.0 };
    case 'blueviolet': return { r: 138, g: 43, b: 226, a: 1.0 };
    case 'brown': return { r: 165, g: 42, b: 42, a: 1.0 };
    case 'burlywood': return { r: 222, g: 184, b: 135, a: 1.0 };
    case 'cadetblue': return { r: 95, g: 158, b: 160, a: 1.0 };
    case 'chartreuse': return { r: 127, g: 255, b: 0, a: 1.0 };
    case 'chocolate': return { r: 210, g: 105, b: 30, a: 1.0 };
    case 'coral': return { r: 255, g: 127, b: 80, a: 1.0 };
    case 'cornflowerblue': return { r: 100, g: 149, b: 237, a: 1.0 };
    case 'cornsilk': return { r: 255, g: 248, b: 220, a: 1.0 };
    case 'crimson': return { r: 220, g: 20, b: 60, a: 1.0 };
    case 'cyan': return { r: 0, g: 255, b: 255, a: 1.0 };
    case 'darkblue': return { r: 0, g: 0, b: 139, a: 1.0 };
    case 'darkcyan': return { r: 0, g: 139, b: 139, a: 1.0 };
    case 'darkgoldenrod': return { r: 184, g: 134, b: 11, a: 1.0 };
    case 'darkgray': return { r: 169, g: 169, b: 169, a: 1.0 };
    case 'darkgreen': return { r: 0, g: 100, b: 0, a: 1.0 };
    case 'darkgrey': return { r: 169, g: 169, b: 169, a: 1.0 };
    case 'darkkhaki': return { r: 189, g: 183, b: 107, a: 1.0 };
    case 'darkmagenta': return { r: 139, g: 0, b: 139, a: 1.0 };
    case 'darkolivegreen': return {r: 85, g: 107, b: 47, a: 1.0 };
    case 'darkorange': return { r: 255, g: 140, b: 0, a: 1.0 };
    case 'darkorchid': return { r: 153, g: 50, b: 204, a: 1.0 };
    case 'darkred': return { r: 139, g: 0, b: 0, a: 1.0 };
    case 'darksalmon': return { r: 233, g: 150, b: 122, a: 1.0 };
    case 'darkseagreen': return { r: 143, g: 188, b: 143, a: 1.0 };
    case 'darkslateblue': return { r: 72, g: 61, b: 139, a: 1.0 };
    case 'darkslategray': return { r: 47, g: 79, b: 79, a: 1.0 };
    case 'darkslategrey': return { r: 47, g: 79, b: 79, a: 1.0 };
    case 'darkturquoise': return { r: 0, g: 206, b: 209, a: 1.0 };
    case 'darkviolet': return { r: 148, g: 0, b: 211, a: 1.0 };
    case 'deeppink': return { r: 255, g: 20, b: 147, a: 1.0 };
    case 'deepskyblue': return { r: 0, g: 191, b: 255, a: 1.0 };
    case 'dimgray': return { r: 105, g: 105, b: 105, a: 1.0 };
    case 'dimgrey': return { r: 105, g: 105, b: 105, a: 1.0 };
    case 'dodgerblue': return { r: 30, g: 144, b: 255, a: 1.0 };
    case 'firebrick': return { r: 178, g: 34, b: 34, a: 1.0 };
    case 'floralwhite': return { r: 255, g: 250, b: 240, a: 1.0 };
    case 'forestgreen': return { r: 34, g: 139, b: 34, a: 1.0 };
    case 'fuchsia': return { r: 255, g: 0, b: 255, a: 1.0 };
    case 'gainsboro': return { r: 220, g: 220, b: 220, a: 1.0 };
    case 'ghostwhite': return { r: 248, g: 248, b: 255, a: 1.0 };
    case 'gold': return { r: 255, g: 215, b: 0, a: 1.0 };
    case 'goldenrod': return { r: 218, g: 165, b: 32, a: 1.0 };
    case 'gray': return { r: 128, g: 128, b: 128, a: 1.0 };
    case 'green': return { r: 0, g: 128, b: 0, a: 1.0 };
    case 'greenyellow': return { r: 173, g: 255, b: 47, a: 1.0 };
    case 'grey': return { r: 128, g: 128, b: 128, a: 1.0 };
    case 'honeydew': return { r: 240, g: 255, b: 240, a: 1.0 };
    case 'hotpink': return { r: 255, g: 105, b: 180, a: 1.0 };
    case 'indianred': return { r: 205, g: 92, b: 92, a: 1.0 };
    case 'indigo': return { r: 75, g: 0, b: 130, a: 1.0 };
    case 'ivory': return { r: 255, g: 255, b: 240, a: 1.0 };
    case 'khaki': return { r: 240, g: 230, b: 140, a: 1.0 };
    case 'lavender': return { r: 230, g: 230, b: 250, a: 1.0 };
    case 'lavenderblush': return { r: 255, g: 240, b: 245, a: 1.0 };
    case 'lawngreen': return { r: 124, g: 252, b: 0, a: 1.0 };
    case 'lemonchiffon': return { r: 255, g: 250, b: 205, a: 1.0 };
    case 'lightblue': return { r: 173, g: 216, b: 230, a: 1.0 };
    case 'lightcoral': return { r: 240, g: 128, b: 128, a: 1.0 };
    case 'lightcyan': return { r: 224, g: 255, b: 255, a: 1.0 };
    case 'lightgoldenrodyellow': return { r: 250, g: 250, b: 210, a: 1.0 };
    case 'lightgray': return { r: 211, g: 211, b: 211, a: 1.0 };
    case 'lightgreen': return { r: 144, g: 238, b: 144, a: 1.0 };
    case 'lightgrey': return { r: 211, g: 211, b: 211, a: 1.0 };
    case 'lightpink': return { r: 255, g: 182, b: 193, a: 1.0 };
    case 'lightsalmon': return { r: 255, g: 160, b: 122, a: 1.0 };
    case 'lightseagreen': return { r: 32, g: 178, b: 170, a: 1.0 };
    case 'lightskyblue': return { r: 135, g: 206, b: 250, a: 1.0 };
    case 'lightslategray': return { r: 119, g: 136, b: 153, a: 1.0 };
    case 'lightslategrey': return { r: 119, g: 136, b: 153, a: 1.0 };
    case 'lightsteelblue': return { r: 176, g: 196, b: 222, a: 1.0 };
    case 'lightyellow': return { r: 255, g: 255, b: 224, a: 1.0 };
    case 'lime': return { r: 0, g: 255, b: 0, a: 1.0 };
    case 'limegreen': return { r: 50, g: 205, b: 50, a: 1.0 };
    case 'linen': return { r: 250, g: 240, b: 230, a: 1.0 };
    case 'magenta': return { r: 255, g: 0, b: 255, a: 1.0 };
    case 'maroon': return { r: 128, g: 0, b: 0, a: 1.0 };
    case 'mediumaquamarine': return { r: 102, g: 205, b: 170, a: 1.0 };
    case 'mediumblue': return { r: 0, g: 0, b: 205, a: 1.0 };
    case 'mediumorchid': return { r: 186, g: 85, b: 211, a: 1.0 };
    case 'mediumpurple': return { r: 147, g: 112, b: 219, a: 1.0 };
    case 'mediumseagreen': return { r: 60, g: 179, b: 113, a: 1.0 };
    case 'mediumslateblue': return { r: 123, g: 104, b: 238, a: 1.0 };
    case 'mediumspringgreen': return { r: 0, g: 250, b: 154, a: 1.0 };
    case 'mediumturquoise': return { r: 72, g: 209, b: 204, a: 1.0 };
    case 'mediumvioletred': return { r: 199, g: 21, b: 133, a: 1.0 };
    case 'midnightblue': return { r: 25, g: 25, b: 112, a: 1.0 };
    case 'mintcream': return { r: 245, g: 255, b: 250, a: 1.0 };
    case 'mistyrose': return { r: 255, g: 228, b: 225, a: 1.0 };
    case 'moccasin': return { r: 255, g: 228, b: 181, a: 1.0 };
    case 'navajowhite': return { r: 255, g: 222, b: 173, a: 1.0 };
    case 'navy': return { r: 0, g: 0, b: 128, a: 1.0 };
    case 'oldlace': return { r: 253, g: 245, b: 230, a: 1.0 };
    case 'olive': return { r: 128, g: 128, b: 0, a: 1.0 };
    case 'olivedrab': return { r: 107, g: 142, b: 35, a: 1.0 };
    case 'orange': return { r: 255, g: 165, b: 0, a: 1.0 };
    case 'orangered': return { r: 255, g: 69, b: 0, a: 1.0 };
    case 'orchid': return { r: 218, g: 112, b: 214, a: 1.0 };
    case 'palegoldenrod': return { r: 238, g: 232, b: 170, a: 1.0 };
    case 'palegreen': return { r: 152, g: 251, b: 152, a: 1.0 };
    case 'paleturquoise': return { r: 175, g: 238, b: 238, a: 1.0 };
    case 'palevioletred': return { r: 219, g: 112, b: 147, a: 1.0 };
    case 'papayawhip': return { r: 255, g: 239, b: 213, a: 1.0 };
    case 'peachpuff': return { r: 255, g: 218, b: 185, a: 1.0 };
    case 'peru': return { r: 205, g: 133, b: 63, a: 1.0 };
    case 'pink': return { r: 255, g: 192, b: 203, a: 1.0 };
    case 'plum': return { r: 221, g: 160, b: 221, a: 1.0 };
    case 'powderblue': return { r: 176, g: 224, b: 230, a: 1.0 };
    case 'purple': return { r: 128, g: 0, b: 128, a: 1.0 };
    case 'red': return { r: 255, g: 0, b: 0, a: 1.0 };
    case 'rosybrown': return { r: 188, g: 143, b: 143, a: 1.0 };
    case 'royalblue': return { r: 65, g: 105, b: 225, a: 1.0 };
    case 'saddlebrown': return { r: 139, g: 69, b: 19, a: 1.0 };
    case 'salmon': return { r: 250, g: 128, b: 114, a: 1.0 };
    case 'sandybrown': return { r: 244, g: 164, b: 96, a: 1.0 };
    case 'seagreen': return { r: 46, g: 139, b: 87, a: 1.0 };
    case 'seashell': return { r: 255, g: 245, b: 238, a: 1.0 };
    case 'sienna': return { r: 160, g: 82, b: 45, a: 1.0 };
    case 'silver': return { r: 192, g: 192, b: 192, a: 1.0 };
    case 'skyblue': return { r: 135, g: 206, b: 235, a: 1.0 };
    case 'slateblue': return { r: 106, g: 90, b: 205, a: 1.0 };
    case 'slategray': return { r: 112, g: 128, b: 144, a: 1.0 };
    case 'slategrey': return { r: 112, g: 128, b: 144, a: 1.0 };
    case 'snow': return { r: 255, g: 250, b: 250, a: 1.0 };
    case 'springgreen': return { r: 0, g: 255, b: 127, a: 1.0 };
    case 'steelblue': return { r: 70, g: 130, b: 180, a: 1.0 };
    case 'tan': return { r: 210, g: 180, b: 140, a: 1.0 };
    case 'teal': return { r: 0, g: 128, b: 128, a: 1.0 };
    case 'thistle': return { r: 216, g: 191, b: 216, a: 1.0 };
    case 'tomato': return { r: 255, g: 99, b: 71, a: 1.0 };
    case 'transparent': return { r: 0, g: 0, b: 0, a: 0.0 };
    case 'turquoise': return { r: 64, g: 224, b: 208, a: 1.0 };
    case 'violet': return { r: 238, g: 130, b: 238, a: 1.0 };
    case 'wheat': return { r: 245, g: 222, b: 179, a: 1.0 };
    case 'white': return { r: 255, g: 255, b: 255, a: 1.0 };
    case 'whitesmoke': return { r: 245, g: 245, b: 245, a: 1.0 };
    case 'yellow': return { r: 255, g: 255, b: 0, a: 1.0 };
    case 'yellowgreen': return { r: 154, g: 205, b: 50, a: 1.0 };
    default: return { r: 0, g: 0, b: 0, a: 1.0 };
  }
}

function colorComponentValue(v) {
  if (v.endsWith('%')) {
    return Math.floor(constrain(parseInt(v.substr(0, v.length - 1), 10), 0, 100) * 2.55);
  }
  else {
    return constrain(parseInt(v, 10), 0, 255);
  }
}

function alphaComponentValue(v) {
  if (v.endsWith('%')) {
    return constrain(parseInt(v.substr(0, v.length - 1), 10), 0, 100) / 100;
  }
  else {
    let a = parseFloat(v);
    if (a <= 0.0) {
      return 0.0;
    }
    if (a >= 1.0) {
      return 1.0;
    }
    return a;
  }
}

/**
 * Convert a string into an RGB color value.
 *
 * @param v The value string, which should be of the form 'rgb(r,g,b)', 'rgb(r%,g%,b%)', 'rgba(r,g,b,a)', '#rrggbb', '#rgb', '#rgba', '#rrggbb' or '#rrggbbaa'.
 *
 * @return An object with 'r', 'g', 'b' and 'a' properties, the first three are integers in the range [0, 255], the latter 'a' a float in the range [0, 1].
 */
export function stringToRgba(v) {
  v = (v || "").trim();
  // Edge case: empty string is black
  if (v.length == 0) {
    return { r: 0, g: 0, b: 0, a: 1.0 };
  }
  // Check for #rgb:
  let m = v.match(/^#([0-9a-f]{3})$/i);
  if (m) {
    // In three-character format, each value is multiplied by 0x11 to give an even scale from 0x00 to 0xff
    let r = parseInt(m[1].charAt(0), 16) * 0x11;
    let g = parseInt(m[1].charAt(1), 16) * 0x11;
    let b = parseInt(m[1].charAt(2), 16) * 0x11;
    return { r: r, g: g, b: b, a: 1.0 };
  }
  // Check for #rgba:
  m = v.match(/^#([0-9a-f]{4})$/i);
  if (m) {
    let r = parseInt(m[1].charAt(0), 16) * 0x11;
    let g = parseInt(m[1].charAt(1), 16) * 0x11;
    let b = parseInt(m[1].charAt(2), 16) * 0x11;
    let a = (parseInt(m[1].charAt(3), 16) * 0x11) / 255;
    return { r: r, g: g, b: b, a: a };
  }
  // Check for #rrggbb:
  m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    let r = (parseInt(m[1].charAt(0), 16) * 0x10) + parseInt(m[1].charAt(1), 16);
    let g = (parseInt(m[1].charAt(2), 16) * 0x10) + parseInt(m[1].charAt(3), 16);
    let b = (parseInt(m[1].charAt(4), 16) * 0x10) + parseInt(m[1].charAt(5), 16);
    return { r: r, g: g, b: b, a: 1.0 };
  }
  // Check for #rrggbbaa:
  m = v.match(/^#([0-9a-f]{8})$/i);
  if (m) {
    let r = (parseInt(m[1].charAt(0), 16) * 0x10) + parseInt(m[1].charAt(1), 16);
    let g = (parseInt(m[1].charAt(2), 16) * 0x10) + parseInt(m[1].charAt(3), 16);
    let b = (parseInt(m[1].charAt(4), 16) * 0x10) + parseInt(m[1].charAt(5), 16);
    let a = ((parseInt(m[1].charAt(6), 16) * 0x10) + parseInt(m[1].charAt(6), 16)) / 255;
    return { r: r, g: g, b: b, a: a };
  }
  // Check for rgb(r,g,b):
  m = v.match(/^rgb[(] *([0-9%]+) *[,] *([0-9%]+) *[,] *([0-9%]+) *[)]$/i);
  if (m) {
    let r = colorComponentValue(m[1]);
    let g = colorComponentValue(m[2]);
    let b = colorComponentValue(m[3]);
    return { r: r, g: g, b: b, a: 1.0 };
  }
  // Check for rgba(r,g,b,a):
  m = v.match(/^rgba[(] *([0-9%]+) *[,] *([0-9%]+) *[,] *([0-9%]+) *[,] *([0-9.%]+) *[)]$/i);
  if (m) {
    let r = colorComponentValue(m[1]);
    let g = colorComponentValue(m[2]);
    let b = colorComponentValue(m[3]);
    let a = alphaComponentValue(m[4]);
    return { r: r, g: g, b: b, a: a };
  }
  return colorNameToRgba(v);
}

export function rgbaToString(v) {
  let rgbaStr = 'rgba(';
  rgbaStr += v.r;
  rgbaStr += ',';
  rgbaStr += v.g;
  rgbaStr += ',';
  rgbaStr += v.b;
  rgbaStr += ',';
  rgbaStr += v.a;
  rgbaStr += ')';
  return rgbaStr;
}

export function testStringToRgba() {
  log.trace(stringToRgba('#000'));
  log.trace(stringToRgba('green'));
  log.trace(stringToRgba('#ff00cc'));
  log.trace(stringToRgba('rgba(12, 35, 365, 2.0)'));
}

/**
 *  Best text color (white or black) for a specific RGB-background color.
 *
 *  @param r Red component in range [0-1]
 *  @param g Green component in range [0-1]
 *  @param b Blue component in range [0-1]
 *
 *  @return The string 'white' or 'black'.
 */
export function textContrastColor(r, g, b) {
  // Based on answer in https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color

  //if c <= 0.03928 then c = c/12.92 else c = ((c+0.055)/1.055) ^ 2.4
  //L = 0.2126 * r + 0.7152 * g + 0.0722 * b

  if (r <= 0.03928) { r = r / 12.92; } else { r = Math.pow((r + 0.055) / 1.055, 2.4); }
  if (g <= 0.03928) { g = g / 12.92; } else { g = Math.pow((g + 0.055) / 1.055, 2.4); }
  if (b <= 0.03928) { b = b / 12.92; } else { b = Math.pow((b + 0.055) / 1.055, 2.4); }
  let l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (l > 0.179) {
    return 'black';
  }
  else {
    return 'white';
  }
}
/**
 *  Escape a string value to be useable inside a regex, so that the literal string will be matched.
 * 
 *  @param string The string to be matched literal and hence get escaped to be useable inside a regex.
 *  @return The escaped version of string, which might be equal to string if no escaping was needed.   
 */
export function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
const datePattern = '(?<year>\\d\\d\\d\\d)[-]?(?<month>[01]\\d)[-]?(?<day>\\d\\d)';
/**
 *  Create a date.
 *  
 *  Either:
 *  @param iso8601 ISO8601 date representation: yyyy-mm-dd or yyyymmdd.
 *  Or
 *  @param millisSinceEpoc UNIX timestamp.
 *  Or:
 *  @param date Already a Date object. A copy is returned.
 *  Or:
 *  @param year The year.
 *  @param month The month: 1=January, ... 12=December.
 *  @param dayInMonth In range [1, 31]
 */
export function date() {
  if (arguments.length === 3) {
    let year = arguments[0];
    let month = arguments[1];
    let dayInMonth = arguments[2];
    return new Date(year, month - 1, dayInMonth);
  }
  else if (arguments.length === 1) {
    let d = new Date();
    let arg = arguments[0];
    if (typeof arg === 'number') {
      d.setTime(arg);
      return d;
    }
    else if (typeof arg === 'string') {
      let t = Date.parse(arg);
      if (isNaN(t)) {
        let dateRegex = new RegExp('^\\s*' + datePattern + '\\s*$');
        let m = dateRegex.exec(arg);
        if (m) {
          t = Date.parse(`${m.groups.year}-${m.groups.month}-${m.groups.day}`);
        }
      }
      if (isNaN(t)) {
        throw new Error("Argument '" + arg + "' cannot be interpreted as a valid date");
      }
      d.setTime(t);
      return d;
    }
    else if ((arg instanceof Date) || (Object.prototype.toString.call(arg) === '[object Date]')) {
      return new Date(arg.getTime());
    }
  }
  throw new Error(`Arguments ${JSON.stringify(arguments)} cannot be interpreted as a valid date`);
}


/**
 *  Determine the number of years between two dates.
 * 
 *  @param date1 First date, inclusive.
 *  @param date2 Second date, exclusive.
 *  @return The amount of years between date1 and date2. Will be negative if date2 < date1. 
 *          Will be 0 if date1 and date2 fall within the same year.
 *          This doesn't take actual days into account, e.g. yearsBetween('1999-12-31', '2000-01-01') will return 1, even if
 *          these dates only differ by 1 day. 
 */
export function yearsDiff(date1, date2) {
  let y1 = date(date1).getFullYear();
  let y2 = date(date2).getFullYear();
  return (y2 - y1);
}

/**
 *  Determine the number of months between two dates.
 * 
 *  @param date1 First date, inclusive.
 *  @param date2 Second date, exclusive.
 *  @return The amount of months between date1 and date2. Will be negative if date2 < date1. 
 *          Will be 0 if date1 and date2 fall within the same year and same month.
 *          This doesn't take actual days into account, e.g. monthsBetween('1999-12-31', '2000-01-01') will return 1, even if
 *          these dates only differ by 1 day. 
 */
export function monthsDiff(date1, date2) {
  let d1 = date(date1);
  let d2 = date(date2);
  let factor = 1;
  if (d2 < d1) {
    factor = -1;
    let t = d1;
    d1 = d2;
    d2 = t;
  }
  let y1 = d1.getFullYear();
  let y2 = d2.getFullYear();
  let m1 = d1.getMonth() + 1;
  let m2 = d2.getMonth() + 1;
  // Within same year:
  if (y1 === y2) {
    return factor * (m2 - m1); // E.g. 3 (March) - 1 (January) = 2;   1 (January) - 3 (March) = -2
  }
  // Otherwise:
  let restMonthsInFirstYear = 13 - m1;
  let restMonthsInLastYear = m2 - 1;
  let monthsInBetweenYears = (y2 - y1 - 1 /* Since we only want in-between years*/) * 12;
  return factor * (restMonthsInFirstYear + monthsInBetweenYears + restMonthsInLastYear);
}

/**
 *  Determine the number of weeks between two dates.
 * 
 *  @param date1 First date, inclusive.
 *  @param date2 Second date, exclusive.
 *  @return The amount of weeks between date1 and date2. Will be negative if date2 < date1. 
 */
export function weeksDiff(date1, date2) {
  return Math.floor(daysDiff(date1, date2) / 7);
}

/**
 *  Determine the number of days between two dates.
 * 
 *  @param date1 First date, inclusive.
 *  @param date2 Second date, exclusive.
 *  @return The amount of days between date1 and date2. Will be negative if date2 < date1. 
 */
export function daysDiff(date1, date2) {
  date1 = date(date1);
  date2 = date(date2);
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / MILLIS_PER_DAY);
}

/**
 *  Return a date that corresponds to tomorrow.
 * 
 *  @return A date that represents the start of tomorrow.
 */
export function tomorrow() {
  return dateAfterDays(today(), +1);
}

/**
 *  Return a date that corresponds to today, start of the day.
 * 
 *  @return A date that represents the start of today.
 */
export function today() {
  return startOfDay(new Date());
}

/**
 *  Return a date that corresponds to yesterday.
 * 
 *  @return A date that represents the start of yesterday.
 */
export function yesterday() {
  return dateAfterDays(today(), -1);
}

/**
 *  Return a date that is some amount of days in the future (if deltaDays is positive) or in the past (if deltaDays is negative) from another date.
 * 
 *  @param refDate The reference date.
 *  @param deltaDays The number of days to add or subtract from the reference date.
 *  @return A new date that is deltaDays earlier or later than reference date or that is referenceDate if deltaDays is zero. 
 */
export function dateAfterDays(refDate, deltaDays) {
  refDate = date(refDate);
  if (!deltaDays) {
    return refDate;
  }
  const deltaMillis = (deltaDays * 24 * 3600 * 1000);
  return new Date(refDate.getTime() + deltaMillis);
}

/**
 *  Return the days between two dates.
 * 
 *  @param date1 First date, inclusive.
 *  @param date2 Second date, exclusive.
 *  @return An array of days. Will be empty if date2 == date1. 
 */
export function daysBetween(date1, date2) {
  date1 = date(date1);
  date2 = date(date2);
  let reversed = false;
  if (date2.getTime() < date1.getTime()) {
    let t = date1;
    date1 = date2;
    date2 = t;
    reversed = true;
  }
  let days = [];
  for (var d = date1; d < date2; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  if (reversed) {
    return days.reverse();
  }
  return days;
}

/**
 * Get a date object representing midnight on the provided date.
 * 
 * @param date A date object.
 * @return The date (with time component defaulting to 00:00:00.000).
 * 
 * @see https://www.irt.org/articles/js052/index.htm
 */
export function startOfDay() {
  let targetDate = date.apply(null, arguments);
  targetDate.setHours(0);
  targetDate.setMinutes(0);
  targetDate.setSeconds(0);
  targetDate.setMilliseconds(0);
  return targetDate;
}

/**
 * Get a date object representing just before (i.e. one millisecond before) midnight on the provided date.
 * 
 * @param date A date object.
 * @return The date (with time component defaulting to 23:59:59.999).
 * 
 * @see https://www.irt.org/articles/js052/index.htm
 */
export function endOfDay() {
  let targetDate = date.apply(null, arguments);
  targetDate.setHours(23);
  targetDate.setMinutes(59);
  targetDate.setSeconds(59);
  targetDate.setMilliseconds(999);
  return targetDate;
}

/**
 * Calculate the easter day/date in a given year.
 * 
 * @param year The year to calculate easter for.
 * @return The date (with time component defaulting to zero, i.e. just after midnight) of easter in the given year.
 * 
 * @see https://www.irt.org/articles/js052/index.htm
 */
export function easterDay(year) {
  const C = Math.floor(year / 100);
  const N = year - 19 * Math.floor(year / 19);
  const K = Math.floor((C - 17) / 25);
  let I = C - Math.floor(C / 4) - Math.floor((C - K) / 3) + 19 * N + 15;
  I = I - 30 * Math.floor((I / 30));
  I = I - Math.floor(I / 28) * (1 - Math.floor(I / 28) * Math.floor(29 / (I + 1)) * Math.floor((21 - N) / 11));
  let J = year + Math.floor(year / 4) + I + 2 - C + Math.floor(C / 4);
  J = J - 7 * Math.floor(J / 7);
  const L = I - J;
  const M = 3 + Math.floor((L + 40) / 44);
  const D = L + 28 - 31 * Math.floor(M / 4);
  return startOfDay(year, M, D);
}

/**
 *  Format the date/time into a real {@link Date} object.
 *
 *  @param dateTime The date-time value, either as a number (representin millis since epoch), a string or a {@link Date} object.
 *
 *  @return A {@link Date} object or <code>null</code>.
 */
export function toDateTime(dateTime) {
  if (!dateTime) { return null; }
  if (dateTime instanceof Date) {
    return dateTime;
  }
  if (Number.isInteger(dateTime)) {
    let d = new Date();
    d.setTime(dateTime);
    return d;
  }
  return new Date(Date.parse(dateTime));
}

/**
 *  Format the date/time into a normalized string.
 *
 *  @param dateTime The exact date-time value.
 *  @param dateAndTimeSeparator The separator to use between the date and time parts. A single space by default.
 *  @param toUTC Whether to report the UTC date and time.
 *  @return A string with following form: <code>yyyy-mm-dd hh:mm:ss</code> or with an adjusted separator between the date and time parts.
 */
export function formatDateTime(dateTime, dateAndTimeSeparator = ' ', toUTC = false) {
  dateTime = toDateTime(dateTime);
  const year = toUTC ? dateTime.getUTCFullYear() : dateTime.getFullYear();
  const month = (toUTC ? dateTime.getUTCMonth() : dateTime.getMonth()) + 1;
  const dayOfMonth = toUTC ? dateTime.getUTCDate() : dateTime.getDate();
  const hours = toUTC ? dateTime.getUTCHours() : dateTime.getHours();
  const minutes = toUTC ? dateTime.getUTCMinutes() : dateTime.getMinutes();
  const seconds = toUTC ? dateTime.getUTCSeconds() : dateTime.getSeconds();
  let formattedDateTime = '' + year + '-';
  if (month < 10) {
    formattedDateTime += '0';
  }
  formattedDateTime += month;
  formattedDateTime += '-';
  if (dayOfMonth < 10) {
    formattedDateTime += '0';
  }
  formattedDateTime += dayOfMonth;
  formattedDateTime += dateAndTimeSeparator;
  if (hours < 10) {
    formattedDateTime += '0';
  }
  formattedDateTime += hours;
  formattedDateTime += ':';
  if (minutes < 10) {
    formattedDateTime += '0';
  }
  formattedDateTime += minutes;
  formattedDateTime += ':';
  if (seconds < 10) {
    formattedDateTime += '0';
  }
  formattedDateTime += seconds;
  return formattedDateTime;
}

/**
 *  Check whether a value is a number.
 *
 *  @param numOrNumStr A number or string containing a numeric value.
 *
 *  @return True if the argument represents a valid number.
 */
export function isNumeric(numOrNumStr) {
  // See: https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number
  return !isNaN(+numOrNumStr) && // But empty strings would be converted to zero
         !isNaN(parseFloat(numOrNumStr)) // Ensure strings of whitespace fail
}

/**
 *  Format the date/time into a date-only string.
 *
 *  @param dateTime The exact date-time value.
 *
 *  @return A string with following form: <code>yyyy-mm-dd</code>
 */
export function formatDate(dateTime) {
  dateTime = toDateTime(dateTime);
  const year = dateTime.getFullYear();
  const month = dateTime.getMonth() + 1;
  const dayOfMonth = dateTime.getDate();
  let formattedDate = '' + year + '-';
  if (month < 10) {
    formattedDate += '0';
  }
  formattedDate += month;
  formattedDate += '-';
  if (dayOfMonth < 10) {
    formattedDate += '0';
  }
  formattedDate += dayOfMonth;
  return formattedDate;
}

/**
 *  Format the date/time into a time-only string.
 *
 *  @param dateTime The exact date-time value.
 *
 *  @return A string with following form: <code>hh:mm:ss</code>
 */
export function formatTime(dateTime) {
  dateTime = toDateTime(dateTime);
  const hours = dateTime.getHours();
  const minutes = dateTime.getMinutes();
  const seconds = dateTime.getSeconds();
  let formattedTime = '';
  if (hours < 10) {
    formattedTime += '0';
  }
  formattedTime += hours;
  formattedTime += ':';
  if (minutes < 10) {
    formattedTime += '0';
  }
  formattedTime += minutes;
  formattedTime += ':';
  if (seconds < 10) {
    formattedTime += '0';
  }
  formattedTime += seconds;
  return formattedTime;
}

/**
 *  Give a human-friendly indication of how far in the past a certain date-time lays.
 *
 *  @param dateTime The exact date-time value.
 *
 *  @return The first that applies:<ol>
 *            <li>The form 'now' when less than 2s ago/in the future.</li>
 *            <li>The form 'in s seconds' when less than 51s in the future</li>
 *            <li>The form 's seconds ago' when less than 51s ago</li>
 *            <li>The form 'one minute ago' when less than 121s ago</li> 
 *            <li>The form 'in one minute' when less than 121s in the future</li>
 *            <li>The form 'in m minutes' when less than 1h in the future</li>
 *            <li>The form 'm minutes ago' when less than 1h ago</li>
 *            <li>The time in the form <code>hh:mm</code> if today</li>
 *            <li>The date in the form <code>yyyy-mm-dd hh:mm</code></li>
 *          </ol>
 */
export function formatRelativeDateTime(dateTime) {
  if (!(dateTime instanceof Date)) {
    dateTime = toDateTime(dateTime);
  }
  else { // Ensure UTC
    dateTime.setTime(Date.parse(dateTime.toISOString()));
  }
  const SECONDS_IN_HOUR = 60 * 60;
  const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24;  
  const nowMillis = Date.now();
  const now = new Date();
  now.setTime(nowMillis);
  const actualMillis = dateTime.getTime();
  const diffSeconds = Math.floor(Math.abs(nowMillis - actualMillis) / 1000);
  const diffDays = Math.floor(diffSeconds / SECONDS_IN_DAY);
  if (nowMillis >= actualMillis) { // In past
    if (diffSeconds < 2) {
      return 'now';
    } 
    else if (diffSeconds < 51) {
      return `${diffSeconds} seconds ago`;
    }
    else if (diffSeconds < 121) {
      return `1 minute ago`;
    }
    else if (diffSeconds < SECONDS_IN_HOUR) {
      const diffMinutes = Math.floor(diffSeconds / 60);
      return `${diffMinutes} minutes ago`;
    }
    else if ((diffSeconds < SECONDS_IN_DAY) && (dateTime.getDay() === now.getDay())) {
      return formatTime(dateTime);
    }
    else if ((diffSeconds < 2 * SECONDS_IN_DAY) && (diffDays < 2)) {
      return 'yesterday';
    }
    else {
      return formatDate(dateTime);
    }
  }
  else { // In future
    if (diffSeconds < 2) {
      return 'now';
    }
    else if (diffSeconds < 51) {
      return `in ${diffSeconds} seconds`;
    }
    else if (diffSeconds < 121) {
      return `in 1 minute`;
    }
    else if (diffSeconds < SECONDS_IN_HOUR) {
      const diffMinutes = Math.floor(diffSeconds / 60);
      return `in ${diffMinutes} minutes`;
    }
    else if ((diffSeconds < SECONDS_IN_DAY) && (dateTime.getDay() === now.getDay())) {
      return formatTime(dateTime);
    }
    else if ((diffSeconds < 2 * SECONDS_IN_DAY) && (diffDays < 2)) {
      return 'tomorrow';
    }
    else {
      return formatDate(dateTime);
    }
  }
}

/**
 *  Give a human-friendly indication of an elapsed time.
 *
 *  @param elapsedTime The exact elapsed time, expressed in milliseconds.
 *
 *  @return The form {ddd}d {hh}h {mm}m {ss}s
 */
export function formatTimespan(elapsedTime) {
  const SECONDS_IN_HOUR = 60 * 60;
  const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24;
  const SECONDS_IN_MINUTE = 60;

  let seconds = Math.floor(elapsedTime / 1000);
  const days = Math.floor(seconds / SECONDS_IN_DAY);
  seconds -= (days * SECONDS_IN_DAY);
  const hours = Math.floor(seconds / SECONDS_IN_HOUR);
  seconds -= (hours * SECONDS_IN_HOUR); 
  const minutes = Math.floor(seconds / SECONDS_IN_MINUTE);
  seconds -= (minutes * SECONDS_IN_MINUTE);
  
  let formattedTimespan = '';
  formattedTimespan += days;
  formattedTimespan += 'd ';
  if ((hours < 10) && (days > 0)) {
    formattedTimespan += '0';
  }
  formattedTimespan += hours;
  formattedTimespan += 'h ';
  if (minutes < 10) {
    formattedTimespan += '0';
  }
  formattedTimespan += minutes;
  formattedTimespan += 'm ';
  if (seconds < 10) {
    formattedTimespan += '0';
  }
  formattedTimespan += seconds;
  formattedTimespan += 's';
  return formattedTimespan;
}

/**
 *  Give a human-friendly represntation of a number.
 *
 *  @param numVal The number value to format.
 *  @param fractionDigits The number of digits after the decimal point.
 *  @param minimumIntegerDigits The minimum number of digits before the decimal point.
 *  @param useGrouping Whether to use the thousands separator.
 *
 *  @return A correctly formatted number.
 */
export function formatNumber(numVal, fractionDigits = 2, minimumIntegerDigits = 1, useGrouping = false) {
  return numVal.toLocaleString(undefined, { useGrouping: useGrouping, minimumIntegerDigits: minimumIntegerDigits, maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits });
}