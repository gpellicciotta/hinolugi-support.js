// 2D vector class and construction helpers.

/** Construct a Vector from a polar angle (radians) and magnitude (default 1). */
export function vectorFromPolar(angle, magnitude = 1) {
  const x = magnitude * Math.cos(angle);
  const y = magnitude * Math.sin(angle);
  return new Vector(x, y);
}

/** Construct a Vector from cartesian x/y coordinates. */
export function vectorFromCartesian(x, y) {
  return new Vector(x, y);
}

/** An immutable-by-convention 2D vector; all arithmetic methods return a new Vector. */
export class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vector(this.x, this.y);
  }

  /** @throws {Error} If `vector` is not a Vector instance. */
  checkVector(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error(`Vector expected but received ${typeof vector}`);
    }
  }

  /**
   * The dot product of this and the other vector.
   *
   * The geometric interpretation of the dot product X . Y is
   * the length of the projection of X onto the unit vector Y
   * when the two vectors are placed so that their tails coincide.
   */
  dot(other) {
    this.checkVector(other);
    return this.x * other.x + this.y * other.y;
  }

  plus(other) {
    return new Vector(this.x + other.x, this.y + other.y);
  }

  minus(other) {
    return new Vector(this.x - other.x, this.y - other.y);
  }

  multiply(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }

  divide(divisor) {
    return new Vector(this.x / divisor, this.y / divisor);
  }

  get magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** Returns a new Vector with the same angle as this one but magnitude `m`. */
  withMagnitude(m) {
    return vectorFromPolar(this.angle, m);
  }

  get angle() {
    return Math.atan2(this.y, this.x);
  }

  /** Returns a new Vector with the same magnitude as this one but angle `a` (radians). */
  withAngle(a) {
    return vectorFromPolar(a, this.magnitude);
  }

  /** Returns a unit-length copy of this vector, or this vector itself if its magnitude is zero. */
  normalized() {
    const m = this.magnitude;
    if (m !== 0) {
      return this.divide(m);
    }
    return this;
  }

  equal(other) {
    return other && this.x === other.x && this.y === other.y;
  }

  toString() {
    return `(x:${this.x}, y:${this.y})=(m:${this.magnitude}, a:${this.angle})`;
  }
}
