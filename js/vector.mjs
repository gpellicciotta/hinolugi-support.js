/**
 * 2D vector mathematics and polar/cartesian construction utilities.
 *
 * Provides the immutable-by-convention Vector class supporting common
 * arithmetic, geometric projections, magnitudes, and normalizations.
 *
 * @module vector
 */

/**
 * Construct a Vector from a polar angle and magnitude.
 *
 * @param {number} angle The angle in radians.
 * @param {number} [magnitude=1] The length or magnitude of the vector.
 * @returns {Vector} The newly constructed vector instance.
 */
export function vectorFromPolar(angle, magnitude = 1) {
  const x = magnitude * Math.cos(angle);
  const y = magnitude * Math.sin(angle);
  return new Vector(x, y);
}

/**
 * Construct a Vector from cartesian x and y coordinates.
 *
 * @param {number} x The horizontal x coordinate.
 * @param {number} y The vertical y coordinate.
 * @returns {Vector} The newly constructed vector instance.
 */
export function vectorFromCartesian(x, y) {
  return new Vector(x, y);
}

/**
 * An immutable-by-convention 2D vector; all arithmetic methods return a new Vector instance.
 */
export class Vector {
  /**
   * Create a 2D vector instance.
   *
   * @param {number} x The horizontal x coordinate.
   * @param {number} y The vertical y coordinate.
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Create an identical clone of this vector.
   *
   * @returns {Vector} A new Vector instance with identical x and y coordinates.
   */
  clone() {
    return new Vector(this.x, this.y);
  }

  /**
   * Validate that the argument is a Vector instance.
   *
   * @param {*} vector The candidate value to check.
   * @throws {Error} If `vector` is not a Vector instance.
   * @returns {void}
   */
  checkVector(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error(`Vector expected but received ${typeof vector}`);
    }
  }

  /**
   * Compute the dot product of this and another vector.
   *
   * The geometric interpretation of the dot product X . Y is
   * the length of the projection of X onto the unit vector Y
   * when the two vectors are placed so that their tails coincide.
   *
   * @param {Vector} other The vector to dot with.
   * @returns {number} The scalar dot product.
   */
  dot(other) {
    this.checkVector(other);
    return this.x * other.x + this.y * other.y;
  }

  /**
   * Add another vector to this vector.
   *
   * @param {Vector} other The vector to add.
   * @returns {Vector} A new Vector containing the sum.
   */
  plus(other) {
    return new Vector(this.x + other.x, this.y + other.y);
  }

  /**
   * Subtract another vector from this vector.
   *
   * @param {Vector} other The vector to subtract.
   * @returns {Vector} A new Vector containing the difference.
   */
  minus(other) {
    return new Vector(this.x - other.x, this.y - other.y);
  }

  /**
   * Multiply this vector by a scalar factor.
   *
   * @param {number} factor The scalar factor.
   * @returns {Vector} A new Vector scaled by the factor.
   */
  multiply(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }

  /**
   * Divide this vector by a scalar divisor.
   *
   * @param {number} divisor The scalar divisor.
   * @returns {Vector} A new Vector divided by the divisor.
   */
  divide(divisor) {
    return new Vector(this.x / divisor, this.y / divisor);
  }

  /**
   * The magnitude (Euclidean length) of the vector.
   *
   * @type {number}
   */
  get magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Return a new Vector with the same angle as this one but specified magnitude.
   *
   * @param {number} m The target magnitude.
   * @returns {Vector} A new Vector with magnitude `m`.
   */
  withMagnitude(m) {
    return vectorFromPolar(this.angle, m);
  }

  /**
   * The polar angle (in radians) of the vector from the positive x-axis.
   *
   * @type {number}
   */
  get angle() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Return a new Vector with the same magnitude as this one but specified angle.
   *
   * @param {number} a The target angle in radians.
   * @returns {Vector} A new Vector with angle `a`.
   */
  withAngle(a) {
    return vectorFromPolar(a, this.magnitude);
  }

  /**
   * Return a unit-length copy of this vector, or this vector itself if its magnitude is zero.
   *
   * @returns {Vector} The normalized unit vector.
   */
  normalized() {
    const m = this.magnitude;
    if (m !== 0) {
      return this.divide(m);
    }
    return this;
  }

  /**
   * Check whether this vector is equal in coordinates to another vector.
   *
   * @param {Vector|*} other The other vector to compare with.
   * @returns {boolean} True if coordinates match, false otherwise.
   */
  equal(other) {
    return other && this.x === other.x && this.y === other.y;
  }

  /**
   * Return a string representation of the vector coordinates, magnitude, and angle.
   *
   * @returns {string} Human-readable vector representation.
   */
  toString() {
    return `(x:${this.x}, y:${this.y})=(m:${this.magnitude}, a:${this.angle})`;
  }
}
