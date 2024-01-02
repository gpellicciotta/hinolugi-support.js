import * as log from './log.js';
import * as utils from './utils.js';
import * as domutils from './domutils.js';
import * as canvas from './canvas.js';
import {Vector, vectorFromPolar, vectorFromCartesian} from './vector.js';

// Constants

const FRAMES_PER_SECOND = 60;
const DEFAULT_SNOW_FLAKE_COUNT = 30;
const DEFAULT_SNOW_FLAKE_SYMBOLS = [ "*","❆","❅","❄" ];
const DEFAULT_SNOW_FLAKE_COLORS = [ "rgba(220,220,220,0.2)", "rgba(220,220,220,0.4)", "rgba(220,220,220,0.6)", "rgba(220,220,220,0.8)", "rgba(220,220,220,1.0)" ];

// Global state

// Keep track of all snow flakes
let animId = 0;
let snowFlakes = [];
let snowOptions = { 
  count: DEFAULT_SNOW_FLAKE_COUNT,
  symbols: DEFAULT_SNOW_FLAKE_SYMBOLS,
  colors: DEFAULT_SNOW_FLAKE_COLORS
};
let started = false;
let createSnowFlakes = false;

// Snowflake functions

/**
 *  Start or resume creating showing snowflakes on the document.
 *  Each snow flake will be created as a <span class="snowflake">${snowflake symbol}</span> and append to the end of the document,
 *  or under an element with class 'snowflake-container', if such element exists.
 *
 *  @param options Following options are available to tweak how the snowflakes will show:
 *                  'count':   max. number of snowflakes to create. Defaults to 30.
 *                  'symbols': array of symbols to use for the snow flakes. Defaults to 4 different symbols.
 *                  'colors':  array of CSS-colors for snow flakes.
 */
export function start(options) {
  createSnowFlakes = true;

  if (!started) { // First time only:
    started = true;

    // Default options:
    snowOptions = options || { }
    if (!snowOptions.count) { snowOptions.count = DEFAULT_SNOW_FLAKE_COUNT; }
    if (!snowOptions.symbols) { snowOptions.symbols = DEFAULT_SNOW_FLAKE_SYMBOLS; }
    if (!snowOptions.colors) { snowOptions.colors = DEFAULT_SNOW_FLAKE_COLORS; }    

    // Start new animation:
    animId = domutils.onAnimFrame(snowStep, FRAMES_PER_SECOND);
  }
}

/**
 *  Stop creating new snowflakes, hence having the effect for fading out.
 */
export function stop() {
  createSnowFlakes = false;  
}

/**
 *  Stop creating and showing snowflakes immediately.
 */
export function reset() {
  domutils.cancelAnimFrame(animId);
  document.querySelectorAll("span.snowflake").forEach((el) => { el.remove(); });
  snowFlakes = [];    
  started = false;
}

function snowStep() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Optionally create additional snowflake:
  if (createSnowFlakes && (snowFlakes.length < snowOptions.count)) {
    createSnowFlake();
  }

  // Move all existing flakes:
  for (let i = snowFlakes.length - 1; i >= 0; i--) { // Backwards to allow removal of elements
    let snowFlake = snowFlakes[i];
    let snowEl = snowFlake.element;
    // Check current position
    let xPos = snowFlake.xPos;
    let yPos = snowFlake.yPos;
    // Calculate new position
    xPos += utils.random(0, 1) * snowFlake.dir;
    yPos += snowFlake.fallSpeed;
    // Check window boundaries: reset
    if (yPos > screenHeight) {
      if (!createSnowFlakes) {
        snowEl.remove();
        snowFlakes.splice(i, 1);
        continue ;
      }
      xPos = utils.random(0, screenWidth);
      yPos = 0 - utils.random(10, 20);
    }
    // Set position (= move the snowflake)
    snowFlake.xPos = xPos;
    snowFlake.yPos = yPos;
    snowEl.style.top = `${yPos}px`;
    snowEl.style.right = `${xPos}px`;
  }
}

function createSnowFlake() {
  const screenWidth = window.innerWidth;
  const snowFlakeContainer = document.querySelector(".snowflake-container") || document.body;

  // Create new object with meta-data and document element:
  let newElement = document.createElement("span");    
  let xPos = utils.random(0, screenWidth);
  let yPos = 0 - utils.random(10, screenWidth / 2);
  let size = utils.random(16, 32);
  let zIndex = utils.random(500, 1000);
  let newSnowFlake = { 
    id: `snowflake-${snowFlakes.length}`,
    element: newElement,
    xPos: xPos,
    yPos: yPos,
    dir: utils.randomElement([-1, 1]),
    fallSpeed: utils.randomElement([1, 2])
  };
  snowFlakes.push(newSnowFlake);
  // Style the document el:
  newElement.classList.add("snowflake");
  newElement.style.position = "fixed";
  newElement.style.top = `${yPos}px`;
  newElement.style.right = `${xPos}px`;
  newElement.style.color = utils.randomElement(snowOptions.colors);
  newElement.style.fontSize = `${size}px`;
  //newElement.style.width = `${size}px`;
  newElement.style.height = `${size}px`;
  newElement.style.zIndex = `${zIndex}`;
  newElement.style.pointerEvents = "none";
  newElement.innerText = utils.randomElement(snowOptions.symbols); // + `sp:${newSnowFlake.fallSpeed},d:${newSnowFlake.dir}`;
  // Append to document:
  snowFlakeContainer.appendChild(newElement);
  log.trace(`${snowFlakes.length} snowflakes have been created now`);
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