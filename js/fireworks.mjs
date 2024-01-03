import * as log from './log.mjs';
import * as utils from './utils.mjs';
import * as domutils from './domutils.mjs';
import * as canvas from './canvas.mjs';
import {Vector, vectorFromPolar, vectorFromCartesian} from './vector.mjs';

// Dev Notes

// - Resizing doesn't work properly
// - Unclear whether the fading trail actually works property
// - The calculation of initial speed is unproven


// Constants

const FRAMES_PER_SECOND = 60;
const GRAVITY = new Vector(0, 0.07);
const MAX_PARTICLE_TRAIL = 3;

// Global state

// Keep track of all fireworks managed, together with their canvas
let fireworksIdGenerator = 0;
const fireworksById = new Map();

// Fireworks functions

/**
 *  Start showing fireworks on the canvas.
 *
 *  @param canvasEl The canvas to draw the fireworks on.
 *  @param options Following options are available to tweak how the fireworks will show:
 *                  'frequency': number of fireworks explosions per second. Between 1 and 10 with 5 being the default.
 *                  'shape': one of the following: 'normal' (this is the default), 'circles', 'hearts', 'donuts', 'roses' or 'random'.
 */
export function start(canvasEl, options) {
  // Reset any previous:
  if (canvasEl.dataset.fireworksId) {
    stop(canvasEl);
  }

  // Default options:
  options = options || { }
  if (!options.frequency) { options.frequency = 5; }
  if (!options.shape) { options.shape = 'normal'; }

  // Start new:
  const fireworksId = ++fireworksIdGenerator;
  const fireworksInfo = { };
  canvasEl.dataset.fireworksId = fireworksId;   
  fireworksById.set(fireworksId, fireworksInfo);  

  // Setup canvas:
  fireworksInfo.canvas = canvasEl;
  let { canvasWidth, canvasHeight } = setCanvasSizes(canvasEl);
  fireworksInfo.canvasWidth = canvasWidth;
  fireworksInfo.canvasHeight = canvasHeight;
  fireworksInfo.mainCtx = canvasEl.getContext('2d');
  fireworksInfo.mainCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

  // Ensure this aspect ratio is kept despite resize operations:
  const rescale = domutils.moderatedEventCallback(() => {
      let { canvasWidth, canvasHeight } = setCanvasSizes(canvasEl);
      fireworksInfo.canvasWidth = canvasWidth;
      fireworksInfo.canvasHeight = canvasHeight;
      fireworksInfo.mainCtx = canvasEl.getContext('2d');
      fireworksInfo.mainCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
      fireworksInfo.mainCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      fireworksInfo.fireworksBox = new FireworkBox(canvasWidth, canvasHeight, GRAVITY, options.shape);
      fireworksInfo.frequency = +options.frequency;
      fireworksInfo.lastIgniteTime = 0;
      
    });
  fireworksInfo.rescale = rescale;
  window.addEventListener('resize', rescale);
  
  // Reset canvas: 
  fireworksInfo.mainCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  fireworksInfo.fireworksBox = new FireworkBox(canvasWidth, canvasHeight, GRAVITY, options.shape);
  fireworksInfo.frequency = +options.frequency;
  fireworksInfo.lastIgniteTime = 0;
  
  // Start animation:
  fireworksInfo.animFrameId = domutils.onAnimFrame(() => { step(fireworksInfo); }, FRAMES_PER_SECOND);
}

/**
 *  Stop showing fireworks on the canvas.
 *
 *  @param canvasEl The canvas to stop draing the fireworks on.
 */
export function stop(canvasEl) {
  let fireworksId = +(canvasEl.dataset.fireworksId || 0);  
  if (fireworksId) {
    delete canvasEl.dataset.fireworksId;    
    let fireworksInfo = fireworksById.get(fireworksId); 
    if (fireworksInfo) {    
      window.removeEventListener(fireworksInfo.rescale);
      domutils.cancelAnimFrame(fireworksInfo.animFrameId);      
    }
  }
}

function setCanvasSizes(canvasEl) {
  // Determine CSS width and height:
  let canvasWidth = +getComputedStyle(canvasEl).getPropertyValue('width').slice(0, -2);
  let canvasHeight = +getComputedStyle(canvasEl).getPropertyValue('height').slice(0, -2);
  //log.info("Determined css pixel bounds to have width: " + canvasWidth + " and height: " + canvasHeight);

  // Set logical bounds
  //canvasEl.style.width = canvasWidth + 'px';
  //canvasEl.style.height = canvasHeight + 'px';

  // Set physical bounds based on CSS bounds:
  canvasEl.width = canvasWidth * window.devicePixelRatio;
  canvasEl.height = canvasHeight * window.devicePixelRatio;
  //log.info("Determined physical bounds to have width: " + canvas.width + " and height: " + canvas.height + ", since pixel-ratio: " + window.devicePixelRatio);

  return { canvasWidth, canvasHeight };
}

function step(fireworksInfo) {
  // Time for new ignition?
  let now = new Date().getTime();
  let interval = 1000 / fireworksInfo.frequency;
  if (now - fireworksInfo.lastIgniteTime > interval) {
    fireworksInfo.lastIgniteTime = now;
    fireworksInfo.fireworksBox.startNewFirework();
  }

  // Draw active fireworks
  fireworksInfo.mainCtx.clearRect(0, 0, fireworksInfo.canvasWidth, fireworksInfo.canvasHeight);
  fireworksInfo.fireworksBox.step();
  fireworksInfo.fireworksBox.render(fireworksInfo.mainCtx);
}

/**
 *  A box capable of creating and managing multiple fireworks.
 */
class FireworkBox {
  constructor(width, height, gravity, shape = 'normal') {
    this._fireworks = [];
    this._width = width;
    this._height = height;
    this._gravity = gravity;
    this._shape = shape;
  }

  get shape() {
    return this._shape;
  }

  set shape(s) {
    this._shape = s;
  }

  startNewFirework(target) {
    let hue = utils.random(0, 360);
    let xOrig = Math.floor(this._width / 2);
    let origin = new Vector(xOrig, this._height);
    
    let xTarget = target ? target.x : utils.random(this._width * 0.1, this._width * 0.9); // between 20-80% of width
    let yTarget = target ? target.y : utils.random(this._height * 0.2, this._height * 0.4); // between 60-80% of height

    let t = 2 * FRAMES_PER_SECOND; // 2s to reach target

    let xVel = (xTarget - xOrig) / t;
    let yVel = -Math.sqrt(2 * GRAVITY.y * (this._height - yTarget));

    let initialVelocity = new Vector(xVel, yVel);
    //console.log("Ignited from: " + origin + " with initial velocity: " + initVelocity);
    this._fireworks.push(new Firework(origin, initialVelocity, this._shape, hue));
  }

  step() {
    for (let i = this._fireworks.length-1; i >= 0; i--) {
      let p = this._fireworks[i];
      p.applyForce(this._gravity);
      p.step();
      if (p.dead) {
        this._fireworks.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (let i = this._fireworks.length-1; i >= 0; i--) {
      let p = this._fireworks[i];
      p.render(ctx);
    }
  }
}

/**
 *  A firework is a particle that gets shot upwards and then, on its highest point, explodes into multiple particles that all fall down in a pattern.
 */
class Firework {
  constructor(origin, initialVelocity, shape, hue, target) {
    this._particles = [];
    this._particles.push(new Particle(origin, initialVelocity, hue, 0)); // Start with single particle
    this._exploded = false;
    this._initialVelocity = initialVelocity.normalized();
    this._origin = origin;
    this._target = target;
    this._shape = shape;
    this._hue = hue;
    this._lifespan = 200;
  }

  // Is the particle system still useful?
  get dead() {
    return (this._lifespan <= 0.0) && (this._particles.length === 0);
  }

  // Method to add a force vector to all particles currently in the system
  applyForce(dir) {
    for (let i = this._particles.length-1; i >= 0; i--) {
      let p = this._particles[i];
      p.applyForce(dir);
    }
  }

  step() {
    // If still just a single particle:
    if (!this._exploded) {
      this._particles[0].step();
      // If vertical velocity is zero or target is reached:
      if ((this._particles[0]._vel.y >= 0.0) ||
          (this._target && (utils.distance(this._target, this._particles[0]._pos) < 10))) { // No longer rising
        //console.log("exploding");
        this._exploded = true;
        let explosionCenter = this._particles[0]._pos;
        this._particles.splice(0, 1); // Remove
        this.explode(explosionCenter);
      }
    }
    else { // If already exploded into multiple particles
      for (let i = this._particles.length - 1; i >= 0; i--) {
        let p = this._particles[i];
        p.step();
        if (p.dead) {
          this._particles.splice(i, 1);
        }
      }
      this._lifespan -= 1;
    }
  }

  explode(origin) {
    let shape = this._shape !== 'random' ? this._shape : utils.randomElement(['hearts', 'normal', 'donuts', 'roses', 'circles']);
    switch (shape) {
      case 'hearts':
        this.explodeAsHeart(origin);
        break;
      case 'circles':
        this.explodeAsCircle(origin);
        break;
      case 'donuts':
        this.explodeAsDonut(origin);
        break;
      case 'roses':
        this.explodeAsRose(origin);
        break;
      case 'normal':
      default:
        this.explodeAsNormal(origin);
    }
  }

  explodeAsNormal(origin) {
    let partCount = 360;
    let angleIncr = Math.PI * 2 / partCount;
    for (let i = 0, a = 0; i < partCount; i++, a += angleIncr) {
      let aa = Math.random(a);
      let m = 0.1 + 1.5 * aa;
      let v = vectorFromPolar(a, m).plus(this._initialVelocity);
      let p = new Particle(origin, v , this._hue);
      this._particles.push(p);
    }
  }

  explodeAsHeart(origin) {
    let partCount = 180;
    let angleIncr = Math.PI * 2 / partCount;
    for (let i = 0, a = 0; i < partCount; i++, a += angleIncr) {
      let x = 16 * Math.pow(Math.sin(a), 3);
      let y = 0 - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      let m = 0.05;
      let v = vectorFromCartesian(x, y).multiply(m);
      let p = new Particle(origin, v , this._hue);
      this._particles.push(p);
    }
  }

  explodeAsDonut(origin) {
    let partCount = 180;
    let angleIncr = Math.PI * 2 / partCount;
    for (let i = 0, a = 0; i < partCount; i++, a += angleIncr) {
      let m = 0.8;
      let v = vectorFromPolar(a, m);
      let p1 = new Particle(origin, v , this._hue);
      this._particles.push(p1);
      let p2 = new Particle(origin, v.multiply(0.8), this._hue);
      this._particles.push(p2);
    }
  }

  explodeAsCircle(origin) {
    let partCount = 180;
    let angleIncr = Math.PI * 2 / partCount;
    for (let i = 0, a = 0; i < partCount; i++, a += angleIncr) {
      let m = 0.8;
      let v = vectorFromPolar(a, m);
      let p = new Particle(origin, v , this._hue);
      this._particles.push(p);
    }
  }

  explodeAsRose(origin) {
    const K_VALS = [ [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1],
                     [3, 2], [4, 2], [5, 2], [6, 2], [7, 2],
                     [2, 3], [4, 3], [5, 3], [6, 3], [7, 3],
                     [3, 4], [5, 4], [6, 4], [7, 4],
                     [2, 5], [3, 5], [4, 5], [6, 5], [7, 5],
                     [4, 6], [5, 6], [7, 6],
                     [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
                     [3, 8], [5, 8], [6, 8], [7, 8],
                     [2, 9], [4, 9], [5, 9], [6, 9], [7, 9] ];
    const kVal = utils.randomElement(K_VALS);
    const n = kVal[0];
    const d = kVal[1];
    const k = n / d;
    const maxAngle = Math.PI * 2 * this._reduceDenominator(n, d);
    let step = Math.PI / 180;
    while (maxAngle / step > 180) {
      step *= 2;
    }
    for (let a = 0; a < maxAngle; a += step) {
      let m = 0.8 * Math.cos(k * a);
      let v = vectorFromPolar(a, m);
      let p = new Particle(origin, v , this._hue);
      this._particles.push(p);
    }
  }

  _reduceDenominator(n, d) {
    function rec(a, b) {
      return b ? rec(b, a % b) : a;
    }
    return d / rec(n, d);
  }

  render(ctx) {
    for (let i = this._particles.length-1; i >= 0; i--) {
      let p = this._particles[i];
      p.render(ctx);
    }
  }
}

class Particle {
  constructor(loc, vel, hue, decay = 1) {
    this._acc = new Vector(0, 0);
    this._vel = vel;
    this._pos = loc;
    this._lifespan = 100.0;
    this._decay = decay;
    this._hue = hue;
    this._trails = [ this._pos.clone() ];
  }

  // Is the particle still useful?
  get dead() {
    return this._lifespan <= 0.0;
  }

  applyForce(f) {
    this._acc = this._acc.plus(f);
  }

  // Method to update position
  step() {
    this._trails.unshift( { x: this._pos.x, y: this._pos.y });
    while (this._trails.length > MAX_PARTICLE_TRAIL) {
      this._trails.pop();
    }
    this._vel = this._vel.plus(this._acc);
    this._pos = this._pos.plus(this._vel);
    this._lifespan -= this._decay;
    this._acc = this._acc.multiply(0); // Clear Acceleration
  }

  // Method to display
  render(ctx) {
    //console.log("Rendering at (" + this._pos.x + ", " + this._pos.y + ")");
    let alpha = this._lifespan / 100.0;
    let color = "hsla(" + this._hue + ", 50%, 50%, " + alpha + ")";
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this._pos.x, this._pos.y, 1, 0, Math.PI * 2, false);
    ctx.fill();
    //ctx.strokeStyle = color;
    //ctx.beginPath();
    //ctx.arc(this._pos.x, this._pos.y, 1, 0, Math.PI * 2, false);
    //ctx.stroke();

    for (let i = 0; i < this._trails.length - 1; i++) {
      let trail = this._trails[i];
      alpha = (this._lifespan - (i * 10) - 1) / 100.0;
      color = "hsla(" + this._hue + ", 50%, 50%, " + alpha + ")";      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, 1, 0, Math.PI * 2, false);
      ctx.fill();
    //  ctx.strokeStyle = color;
    //  ctx.beginPath();
    //  ctx.arc(trail.x, trail.y, 1, 0, Math.PI * 2, false);
    //  ctx.stroke();
    }
    let lastTrail = this._trails[this._trails.length - 1];
    ctx.fillStyle = "transparent";
    ctx.beginPath();
    ctx.arc(lastTrail.x, lastTrail.y, 2, 0, Math.PI * 2, false);
    ctx.fill();

    //for (let i = 0; i < this._trails.length; i++) {
    //  let trail = this._trails[i];
    //  alpha = (this._lifespan - i - 1) / 100.0;
    //  color = "hsla(" + this._hue + ", 50%, 50%, " + alpha + ")";      
    //  ctx.fillStyle = color;
    //  ctx.beginPath();
    //  ctx.arc(trail.x, trail.y, 1, 0, Math.PI * 2, false);
    //  ctx.fill();
    //  ctx.strokeStyle = color;
    //  ctx.beginPath();
    //  ctx.arc(trail.x, trail.y, 1, 0, Math.PI * 2, false);
    //  ctx.stroke();
    //}
      //fireworksInfo.mainCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      //fireworksInfo.mainCtx.fillRect(0, 0, fireworksInfo.canvasWidth, fireworksInfo.canvasHeight);
  }
}