// Game utility functions w.r.t. collisions between shapes.
import {Vector} from './vector.js';
import * as utils from './utils.js';

/**
 *  Clamp a value within a certain range.
 *  Works both for scalars and Vectors.
 *  When working on vectors, both the x and y parts will be clamped separately.
 *
 *  @param val The value to restrict.
 *  @param min The min. value. If val < min, min will be returned.
 *  @param max The max. value. If val > max, max will be returned.
 *
 *  @return Number|Vector: the clamped value.
 */
export function clamp(val, min, max) {
  if (val instanceof Vector) {
    let newX = _scalarClamp(val.x, min.x, max.x);
    let newY = _scalarClamp(val.y, min.y, max.y);
    return new Vector(newX, newY);
  }
  else {
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

// Given three colinear points p, q, r, the function checks if
// point q lies on line segment 'pr'

/**
 *  Calculate the square of the Euclidean distance between two points.
 *
 *  @param point1 The first point, that should have 'x' and 'y' properties.
 *  @param point2 The second point, that should have 'x' and 'y' properties.
 *
 *  @return Number: the square distance between both points.
 */
function _squareDistance(point1, point2) {
  let p1 = (point2.x - point1.x) * (point2.x - point1.x);
  let p2 = (point2.y - point1.y) * (point2.y - point1.y);
  return p1 + p2;
}

/**
 *  Determine whether a point p lies on the line segment between points a and b.
 *  This will be true if the distance |pa| + |pb| == |ab|.
 *
 *  @param p Point to check. Assumed to have 'x' and 'y' properties.
 *  @param a Start-point of the line-segment ab. Assumed to have 'x' and 'y' properties.
 *  @param b End-point of the line-segment ab. Assumed to have 'x' and 'y' properties.
 *
 *  @return Boolean: true if the given point resides on the given line segment, false otherwise.
 */
export function pointOnLineSegment(p, a, b) {
  return utils.distance(p, a) + utils.distance(p, b) === utils.distance(a, b);
}

/**
 *  Determine the orientation of three points.
 *
 *  @param p1 First point. Assumed to have 'x' and 'y' properties.
 *  @param p2 Second point. Assumed to have 'x' and 'y' properties.
 *  @param p3 Third point. Assumed to have 'x' and 'y' properties.
 *
 *  @return String: 'clockwise', 'counterclockwise' or 'collinear'.
 *
 *  See https://www.geeksforgeeks.org/orientation-3-ordered-points/
 */
export function pointOrientation(p1, p2, p3) {
  let slope12 = (p2.y - p1.y)/(p2.x - p1.x);
  let slope23 = (p3.y - p2.y)/(p3.x - p2.x);
  if (slope12 > slope23) {
    return 'clockwise';
  }
  else if (slope12 < slope23) {
    return 'counterclockwise';
  }
  return 'collinear';
}

// Given three collinear points p, q, r, the function checks if point q lies on line segment |pr|
function onSegment(p, q, r) {
  if ((q.x <= Math.max(p.x, r.x)) && (q.x >= Math.min(p.x, r.x)) &&
      (q.y <= Math.max(p.y, r.y)) && (q.y >= Math.min(p.y, r.y))) {
    return true;
  }
  return false;
}

/**
 *  Determine whether two line segments |p1 q1| and |p2 q2| intersect, i.e. share at least one point.
 *
 *  @param p1 The start point of the first segment. Assumed to have 'x' and 'y' properties.
 *  @param q1 The end point of the first segment. Assumed to have 'x' and 'y' properties.
 *  @param p2 The start point of the second segment. Assumed to have 'x' and 'y' properties.
 *  @param q2 The end point of the second segment. Assumed to have 'x' and 'y' properties.
 *
 *  @return Boolean: true if both line segments intersect, false otherwise.
 */
export function lineSegmentsIntersect(p1, p2, q1, q2) {
  // Find the four orientations needed for general and special cases
  let o1 = pointOrientation(p1, p2, q1);
  let o2 = pointOrientation(p1, p2, q2);
  let o3 = pointOrientation(q1, q2, p1);
  let o4 = pointOrientation(q1, q2, p2);
  // General case
  if ((o1 != o2) && (o3 != o4)) {
    return true;
  }
  // Special cases
  // p1, q1 and p2 are collinear and p2 lies on segment p1q1
  if ((o1 === 'collinear') && onSegment(p1, q1, p2)) {
    return true;
  }
  // p1, q1 and q2 are collinear and q2 lies on segment p1q1
  if ((o2 === 'collinear') && onSegment(p1, q2, p2)) {
    return true;
  }
  // p2, q2 and p1 are collinear and p1 lies on segment p2q2
  if ((o3 === 'collinear') && onSegment(q1, p1, q2)) {
    return true;
  }
  // p2, q2 and q1 are collinear and q1 lies on segment p2q2
  if ((o4 === 'collinear') && onSegment(q1, p2, q2)) {
    return true;
  }
  return false;
}

/**
 *  Determine whether two lines |p1 p2| and |q1 q2| are parallel.
 *
 *  @param p1 The start point of the first segment. Assumed to have 'x' and 'y' properties.
 *  @param p2 The end point of the first segment. Assumed to have 'x' and 'y' properties.
 *  @param q1 The start point of the second segment. Assumed to have 'x' and 'y' properties.
 *  @param q2 The end point of the second segment. Assumed to have 'x' and 'y' properties.
 *
 *  @return Boolean: true if parallel, false otherwise.
 */
export function linesAreParallel(p1, p2, q1, q2) {
  let dpx = p2.x - p1.x;
  let dpy = p2.y - p1.y;
  let dqx = q2.x - q1.x;
  let dqy = q2.y - q1.y;
  let denom = (dqy * dpx) - (dqx * dpy);
  return denom === 0;
}

/**
 *  Determine the intersection point of two lines |p1 p2| and |q1 q2|.
 *  Based on: http://paulbourke.net/geometry/pointlineplane/javascript.txt
 *
 *  @param p1 A first point of the first line. Assumed to have 'x' and 'y' properties.
 *  @param p2 Another point of the first line. Assumed to have 'x' and 'y' properties.
 *  @param q1 A first point of the second line. Assumed to have 'x' and 'y' properties.
 *  @param q2 The end point of the second line. Assumed to have 'x' and 'y' properties.
 *
 *  @return Point: the intersection point or null if both lines are parallel.
 */
export function intersectionPointOfLines(p1, p2, q1, q2) {
  let dpx = p2.x - p1.x;
  let dpy = p2.y - p1.y;
  let dqx = q2.x - q1.x;
  let dqy = q2.y - q1.y;
  let denom = (dqy * dpx) - (dqx * dpy);
  if (denom === 0) { // Parallel lines (or coincident)
    return null;
  }
  let ua = ((dqx * (p1.y - q1.y)) - (dqy * (p1.x - q1.x))) / denom;
  return {
    x: p1.x + ua * dpx,
    y: p1.y + ua * dpy
  };
}

/**
 *  Determine the intersection point of two line segments |p1 p2| and |q1 q2|.
 *  Based on: http://paulbourke.net/geometry/pointlineplane/javascript.txt
 *
 *  @param p1 The start point of the first segment. Assumed to have 'x' and 'y' properties.
 *  @param p2 The end point of the first segment. Assumed to have 'x' and 'y' properties.
 *  @param q1 The start point of the second segment. Assumed to have 'x' and 'y' properties.
 *  @param q2 The end point of the second segment. Assumed to have 'x' and 'y' properties.
 *
 *  @return Point: the intersection point or null if both line segments don't intersect.
 */
export function intersectionPointOfLineSegments(p1, p2, q1, q2) {
  let dpx = p2.x - p1.x;
  let dpy = p2.y - p1.y;
  let dqx = q2.x - q1.x;
  let dqy = q2.y - q1.y;
  let denom = (dqy * dpx) - (dqx * dpy);
  if (denom === 0) { // Parallel lines (or coincident)
    return null;
  }
  let ua = ((dqx * (p1.y - q1.y)) - (dqy * (p1.x - q1.x))) / denom;
  let ub = ((dpx * (p1.y - q1.y)) - (dpy * (p1.x - q1.x))) / denom;
  if ((ua < 0) || (ua > 1) || (ub < 0) || (ub > 1)) {
    return null;
  }
  return {
    x: p1.x + ua * dpx,
    y: p1.y + ua * dpy
  };
}

/**
 *  Determine the shortest distance from point p to the line determined by points |a b|.
 *  Based on: http://paulbourke.net/geometry/pointlineplane/
 *
 *  @param p The point to determine the shortest distance from.
 *  @param a A point on the line. Assumed to have 'x' and 'y' properties.
 *  @param b Another point on the line. Assumed to have 'x' and 'y' properties.
 *
 *  @return Number: the shortest distance. Will be zero if p is actually on the line determined by |a b|.
 */
export function shortestDistanceToLineSegment(p, a, b) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  if ((dx === 0) && (dy === 0)) { // Points a and b coincide so this is a simple point-to-point distance calculation
    return utils.distance(p, a);
  }
  let u = (((p.x - a.x) * dx) + ((p.y - a.y) * dy)) / ((dx * dx) + (dy * dy));
  let closestPoint;
  if (u < 0) {
    closestPoint = a;
  }
  else if (u > 1) {
    closestPoint = b;
  }
  else {
    closestPoint = {
      x: a.x + u * dx,
      y: b.y + u * dy
    };
  }
  return utils.distance(p, closestPoint);
}

/**
 *  Determine whether a circular objects collides with a rectangular object.
 *
 *  @param circle Circular object with 'x', 'y' (denoting the center) and 'radius' properties.
 *  @param rect Rectangular object with 'x', 'y' (denoting top left point), 'width' and 'height' properties.
 *
 *  @return Boolean: true if both objects collide, false otherwise.
 */
export function circleRectCollision(circle, rect) {
  // See https://learnopengl.com/In-Practice/2D-Game/Collisions/Collision-detection for a good explanation
  let circleCenter = new Vector(circle.x, circle.y);
  let rectCenter = new Vector(rect.x + rect.width/2, rect.y + rect.height/2);
  let halfRectExtents = new Vector(rect.width/2, rect.height/2);
  let diagonal = circleCenter.minus(rectCenter);
  let clampedDiff = clamp(diagonal, halfRectExtents.multiply(-1), halfRectExtents);
  let closestPoint = rectCenter.plus(clampedDiff);
  let diff = closestPoint.minus(circleCenter);
  return diff.magnitude <= circle.radius; // If the distance to the closest point is smaller than the circle radius
}

/**
 *  Determine whether a rectangular objects collide with one another.
 *
 *  @param rect1 Rectangular object with 'x', 'y' (denoting top left point), 'width' and 'height' properties.
 *  @param rect2 Rectangular object with 'x', 'y' (denoting top left point), 'width' and 'height' properties.
 *
 *  @return Boolean: true if both objects collide, false otherwise.
 */
export function rectRectCollision(rect1, rect2) {
  // See https://learnopengl.com/In-Practice/2D-Game/Collisions/Collision-detection for a good explanation
  let xCollision = (rect1.x + rect1.width >= rect2.x) && (rect2.x + rect2.width >= rect1.x);
  let yCollision = (rect1.y + rect1.height >= rect2.y) && (rect2.y + rect2.height >= rect1.y);
  // Collision only if on both axes
  return xCollision && yCollision;
}

/**
 *  Determine the direction that maximally coincides with a specific object direction.
 *
 *  @param objectDirection The direction of a certain object, as a Vector.
 *  @param possibleDirections A Map with as keys the names of the directions and as value direction Vectors.
 *                            The magnitude of all direction vectors must be 1.
 *                            If undefined, the compass directions 'north' (0, -1), 'west' (-1, 0), 'east' (+1, 0), 'south' (0, +1) will be used.
 *
 *  @return Key: The key in possibleDirection of the direction that max. coincides with the object direction.
 */
export function maxCollisionDirection(objectDirection, possibleDirections) {
  let normDir = objectDirection.normalized();
  console.log("Normalized direction: (" + utils.decimalString(utils.radiansToDegrees(normDir.angle), 1) + "° m:" + normDir.magnitude + ")");
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
  for (let key of possibleDirections.keys()) {
    let possibleDir = possibleDirections.get(key);
    let dotProduct = possibleDir.dot(normDir);
    console.log("Direction '" + key + "' (" + utils.decimalString(utils.radiansToDegrees(possibleDir.angle), 1) + "° m:" + possibleDir.magnitude + "): " + dotProduct);
    if (dotProduct > bestMatch) {
      bestMatch = dotProduct;
      bestDir = key;
    }
  }
  return bestDir;
}
