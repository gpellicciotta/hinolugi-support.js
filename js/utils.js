// General utility functions that don't rely on any global objects or the DOM

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
    console.error("Columns of m1 must match rows of m2");
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
  return Math.floor((Math.random() * (max + 1 - min)) + min);
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
  //console.log("val " + val + " constrained to [" + min + ", " + max + "]");
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
  console.log("decstr(0, 0) = [" + utils.decimalString(0, 0) + "]");
  console.log("decstr(0, 1) = [" + utils.decimalString(0, 1) + "]");
  console.log("decstr(0, 2) = [" + utils.decimalString(0, 2) + "]");
  console.log("decstr(0.1, 2) = [" + utils.decimalString(0.1, 2) + "]");
  console.log("decstr(0.12, 2) = [" + utils.decimalString(0.12, 2) + "]");
  console.log("decstr(12.3456, 3) = [" + utils.decimalString(12.3456, 3) + "]");
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
  console.log(stringToRgba('#000'));
  console.log(stringToRgba('green'));
  console.log(stringToRgba('#ff00cc'));
  console.log(stringToRgba('rgba(12, 35, 365, 2.0)'));
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
