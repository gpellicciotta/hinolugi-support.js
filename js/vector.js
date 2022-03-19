// Vector class

export function vectorFromPolar(angle, magnitude = 1) {
  let x = magnitude * Math.cos(angle);
  let y = magnitude * Math.sin(angle);
  return new Vector(x, y);
}

export function vectorFromCartesian(x, y) {
  return new Vector(x, y);
}

export class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vector(this.x, this.y);
  }

  checkVector(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error("Vector expected but received " + typeof(vector));
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
    return (this.x * other.x) + (this.y * other.y);
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
    return Math.sqrt((this.x * this.x) + (this.y * this.y));
  }

  withMagnitude(m) {
    return vectorFromPolar(this.angle, m);
  }

  get angle() {
    return Math.atan2(this.y, this.x);
  }

  withAngle(a) {
    return vectorFromPolar(a, this.magnitude);
  }

  normalized() {
    let m = this.magnitude;
    if (m != 0) {
      return this.divide(m);
    }
    return this;
  }

  equal(other) {
    return other && (this.x === other.x) && (this.y === other.y);
  }

  toString() {
    return "(x:" + this.x + ", y:" + this.y + ")=(m:" + this.magnitude + ", a:" + this.angle + ")";
  }
}