import { distance } from './math.mjs';
import { Vector } from './vector.mjs';

/**
 * 2D geometric collision detection, orientation, and line intersection algorithms.
 *
 * Provides functions for bounding box, circle-to-rect, line-to-line,
 * and point-to-segment proximity and collision evaluations.
 *
 * @module collisions
 */

/**
 * @typedef {Object} Point2D
 * @property {number} x Horizontal coordinate.
 * @property {number} y Vertical coordinate.
 */

/**
 * Clamp a value within a minimum and maximum range.
 *
 * Works on numeric scalars and Vector instances (clamping x and y independently).
 *
 * @param {number|Vector} val The value or vector to restrict.
 * @param {number|Vector} min The minimum bound.
 * @param {number|Vector} max The maximum bound.
 * @returns {number|Vector} The clamped scalar or vector.
 */
export function clamp(val, min, max) {
  if (val instanceof Vector) {
    const newX = _scalarClamp(val.x, min.x, max.x);
    const newY = _scalarClamp(val.y, min.y, max.y);
    return new Vector(newX, newY);
  } else {
    return _scalarClamp(val, min, max);
  }
}

function _scalarClamp(val, min, max) {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
}

/**
 * Determine whether a point `p` lies on the line segment between points `a` and `b`.
 *
 * Evaluation holds true if distance `|pa| + |pb| === |ab|`.
 *
 * @param {Point2D} p Point to check.
 * @param {Point2D} a Start point of segment.
 * @param {Point2D} b End point of segment.
 * @returns {boolean} True if point lies on segment, false otherwise.
 */
export function pointOnLineSegment(p, a, b) {
  return distance(p, a) + distance(p, b) === distance(a, b);
}

/**
 * Determine the orientation of three ordered points in 2D space.
 *
 * @param {Point2D} p1 First point.
 * @param {Point2D} p2 Second point.
 * @param {Point2D} p3 Third point.
 * @returns {'clockwise'|'counterclockwise'|'collinear'} The orientation classification.
 * @see {@link https://www.geeksforgeeks.org/orientation-3-ordered-points/}
 */
export function pointOrientation(p1, p2, p3) {
  const slope12 = (p2.y - p1.y) / (p2.x - p1.x);
  const slope23 = (p3.y - p2.y) / (p3.x - p2.x);
  if (slope12 > slope23) {
    return 'clockwise';
  } else if (slope12 < slope23) {
    return 'counterclockwise';
  }
  return 'collinear';
}

// Given three collinear points p, q, r, the function checks if point q lies on line segment |pr|
function onSegment(p, q, r) {
  if (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  ) {
    return true;
  }
  return false;
}

/**
 * Determine whether two line segments |p1 q1| and |p2 q2| intersect.
 *
 * @param {Point2D} p1 Start point of first line segment.
 * @param {Point2D} p2 End point of first line segment.
 * @param {Point2D} q1 Start point of second line segment.
 * @param {Point2D} q2 End point of second line segment.
 * @returns {boolean} True if line segments intersect, false otherwise.
 */
export function lineSegmentsIntersect(p1, p2, q1, q2) {
  // Find the four orientations needed for general and special cases
  const o1 = pointOrientation(p1, p2, q1);
  const o2 = pointOrientation(p1, p2, q2);
  const o3 = pointOrientation(q1, q2, p1);
  const o4 = pointOrientation(q1, q2, p2);
  // General case
  if (o1 !== o2 && o3 !== o4) {
    return true;
  }
  // Special cases
  // p1, q1 and p2 are collinear and p2 lies on segment p1q1
  if (o1 === 'collinear' && onSegment(p1, q1, p2)) {
    return true;
  }
  // p1, q1 and q2 are collinear and q2 lies on segment p1q1
  if (o2 === 'collinear' && onSegment(p1, q2, p2)) {
    return true;
  }
  // p2, q2 and p1 are collinear and p1 lies on segment p2q2
  if (o3 === 'collinear' && onSegment(q1, p1, q2)) {
    return true;
  }
  // p2, q2 and q1 are collinear and q1 lies on segment p2q2
  if (o4 === 'collinear' && onSegment(q1, p2, q2)) {
    return true;
  }
  return false;
}

/**
 * Determine whether two infinite lines passing through |p1 p2| and |q1 q2| are parallel.
 *
 * @param {Point2D} p1 First point on line 1.
 * @param {Point2D} p2 Second point on line 1.
 * @param {Point2D} q1 First point on line 2.
 * @param {Point2D} q2 Second point on line 2.
 * @returns {boolean} True if lines are parallel, false otherwise.
 */
export function linesAreParallel(p1, p2, q1, q2) {
  const dpx = p2.x - p1.x;
  const dpy = p2.y - p1.y;
  const dqx = q2.x - q1.x;
  const dqy = q2.y - q1.y;
  const denom = dqy * dpx - dqx * dpy;
  return denom === 0;
}

/**
 * Determine the intersection point of two infinite lines passing through |p1 p2| and |q1 q2|.
 *
 * @param {Point2D} p1 First point on line 1.
 * @param {Point2D} p2 Second point on line 1.
 * @param {Point2D} q1 First point on line 2.
 * @param {Point2D} q2 Second point on line 2.
 * @returns {Point2D|null} The intersection point, or null if lines are parallel.
 * @see {@link http://paulbourke.net/geometry/pointlineplane/javascript.txt}
 */
export function intersectionPointOfLines(p1, p2, q1, q2) {
  const dpx = p2.x - p1.x;
  const dpy = p2.y - p1.y;
  const dqx = q2.x - q1.x;
  const dqy = q2.y - q1.y;
  const denom = dqy * dpx - dqx * dpy;
  if (denom === 0) {
    // Parallel lines (or coincident)
    return null;
  }
  const ua = (dqx * (p1.y - q1.y) - dqy * (p1.x - q1.x)) / denom;
  return {
    x: p1.x + ua * dpx,
    y: p1.y + ua * dpy,
  };
}

/**
 * Determine the intersection point of two line segments |p1 p2| and |q1 q2|.
 *
 * @param {Point2D} p1 Start point of segment 1.
 * @param {Point2D} p2 End point of segment 1.
 * @param {Point2D} q1 Start point of segment 2.
 * @param {Point2D} q2 End point of segment 2.
 * @returns {Point2D|null} The intersection point, or null if line segments do not intersect.
 * @see {@link http://paulbourke.net/geometry/pointlineplane/javascript.txt}
 */
export function intersectionPointOfLineSegments(p1, p2, q1, q2) {
  const dpx = p2.x - p1.x;
  const dpy = p2.y - p1.y;
  const dqx = q2.x - q1.x;
  const dqy = q2.y - q1.y;
  const denom = dqy * dpx - dqx * dpy;
  if (denom === 0) {
    // Parallel lines (or coincident)
    return null;
  }
  const ua = (dqx * (p1.y - q1.y) - dqy * (p1.x - q1.x)) / denom;
  const ub = (dpx * (p1.y - q1.y) - dpy * (p1.x - q1.x)) / denom;
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return null;
  }
  return {
    x: p1.x + ua * dpx,
    y: p1.y + ua * dpy,
  };
}

/**
 * Determine the shortest distance from a point `p` to the line segment bounded by points `a` and `b`.
 *
 * @param {Point2D} p The point to measure distance from.
 * @param {Point2D} a First point of the line segment.
 * @param {Point2D} b Second point of the line segment.
 * @returns {number} The shortest Euclidean distance to the line segment.
 * @see {@link http://paulbourke.net/geometry/pointlineplane/}
 */
export function shortestDistanceToLineSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) {
    // Points a and b coincide so this is a simple point-to-point distance calculation
    return distance(p, a);
  }
  const u = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  let closestPoint;
  if (u < 0) {
    closestPoint = a;
  } else if (u > 1) {
    closestPoint = b;
  } else {
    closestPoint = {
      x: a.x + u * dx,
      y: b.y + u * dy,
    };
  }
  return distance(p, closestPoint);
}

/**
 * Determine whether a circular object collides with an axis-aligned rectangular object.
 *
 * @param {{x: number, y: number, radius: number}} circle Circular object with center coordinates (x, y) and radius.
 * @param {{x: number, y: number, width: number, height: number}} rect Rectangular object with top-left (x, y), width, and height.
 * @returns {boolean} True if both objects collide or overlap, false otherwise.
 * @see {@link https://learnopengl.com/In-Practice/2D-Game/Collisions/Collision-detection}
 */
export function circleRectCollision(circle, rect) {
  // See https://learnopengl.com/In-Practice/2D-Game/Collisions/Collision-detection for a good explanation
  const circleCenter = new Vector(circle.x, circle.y);
  const rectCenter = new Vector(rect.x + rect.width / 2, rect.y + rect.height / 2);
  const halfRectExtents = new Vector(rect.width / 2, rect.height / 2);
  const diagonal = circleCenter.minus(rectCenter);
  const clampedDiff = clamp(diagonal, halfRectExtents.multiply(-1), halfRectExtents);
  const closestPoint = rectCenter.plus(clampedDiff);
  const diff = closestPoint.minus(circleCenter);
  return diff.magnitude <= circle.radius; // If the distance to the closest point is smaller than the circle radius
}

/**
 * Determine whether two axis-aligned rectangular objects overlap.
 *
 * @param {{x: number, y: number, width: number, height: number}} rect1 First rectangle with top-left (x, y), width, and height.
 * @param {{x: number, y: number, width: number, height: number}} rect2 Second rectangle with top-left (x, y), width, and height.
 * @returns {boolean} True if rectangles collide on both axes, false otherwise.
 */
export function rectRectCollision(rect1, rect2) {
  // See https://learnopengl.com/In-Practice/2D-Game/Collisions/Collision-detection for a good explanation
  const xCollision = rect1.x + rect1.width >= rect2.x && rect2.x + rect2.width >= rect1.x;
  const yCollision = rect1.y + rect1.height >= rect2.y && rect2.y + rect2.height >= rect1.y;
  // Collision only if on both axes
  return xCollision && yCollision;
}

/**
 * Determine the direction label whose unit vector maximally aligns with a given direction vector.
 *
 * @param {Vector} objectDirection The direction of an object as a Vector.
 * @param {Map<string, Vector>} [possibleDirections] Map of direction labels to unit Vectors (magnitude 1). Defaults to compass directions: north (0, -1), south (0, +1), east (+1, 0), west (-1, 0).
 * @returns {string|null} The key in `possibleDirections` that maximally coincides with `objectDirection`.
 */
export function maxCollisionDirection(objectDirection, possibleDirections) {
  const normDir = objectDirection.normalized();
  if (!possibleDirections) {
    possibleDirections = new Map();
    possibleDirections.set('north', new Vector(0, -1));
    possibleDirections.set('south', new Vector(0, +1));
    possibleDirections.set('east', new Vector(+1, 0));
    possibleDirections.set('west', new Vector(-1, 0));
  }
  let bestMatch = 0.0;
  let bestDir = null;
  // Dot product will be maximal if both vectors align perfectly
  for (const key of possibleDirections.keys()) {
    const possibleDir = possibleDirections.get(key);
    const dotProduct = possibleDir.dot(normDir);
    if (dotProduct > bestMatch) {
      bestMatch = dotProduct;
      bestDir = key;
    }
  }
  return bestDir;
}
