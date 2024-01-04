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
const MAX_CONCURRENT_FIREWORKS = 15;
const MAX_PARTICLE_TRAIL = 10;

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
 *                  'shape': one of the following: 'normal' (this is the default), 'circle', 'heart', 'donut', 'rose', 'star', 'eagle', 'skull', 'rabbit', 'twinkle', 'umbrella', 'svg-path' or 'random'.
 *                  'svg-path-id': only relevant if 'shape' = 'svg-path': the ID of the HTML document element that represents and SVG <path> element.
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
  if (options['svg-path-id']) { options.svgPathId = options['svg-path-id']; }

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
      fireworksInfo.fireworksBox = new FireworkBox(canvasWidth, canvasHeight, GRAVITY, options.shape, options.svgPathId);
      fireworksInfo.frequency = +options.frequency;
      fireworksInfo.lastIgniteTime = 0;
      
    });
  fireworksInfo.rescale = rescale;
  window.addEventListener('resize', rescale);
  
  // Reset canvas: 
  fireworksInfo.mainCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  fireworksInfo.fireworksBox = new FireworkBox(canvasWidth, canvasHeight, GRAVITY, options.shape, options.svgPathId);
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
  if ((now - fireworksInfo.lastIgniteTime > interval) && (fireworksInfo.fireworksBox.count < MAX_CONCURRENT_FIREWORKS)) {
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
  constructor(width, height, gravity, shape = 'normal', svgPathId = null) {
    this._fireworks = [];
    this._width = width;
    this._height = height;
    this._gravity = gravity;
    this._shape = shape;
    this._maxFireworks = 0;
    this._svgPathId = svgPathId;
  }

  get count() {
    return this._fireworks.length;
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
    this._fireworks.push(new Firework(origin, initialVelocity, this._shape, hue, null, this._svgPathId));
    if (this._fireworks.length > this._maxFireworks) {
      this._maxFireworks = this._fireworks.length;
      log.trace("Reach record number of fireworks: ", this._maxFireworks);
    }
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
  constructor(origin, initialVelocity, shape, hue, target, svgPathId) {
    this._particles = [];
    this._particles.push(new Particle(origin, initialVelocity, hue, 0)); // Start with single particle
    this._exploded = false;
    this._initialVelocity = initialVelocity.normalized();
    this._origin = origin;
    this._target = target;
    this._shape = shape;
    this._hue = hue;
    this._lifespan = 200;
    this._svgPathId = svgPathId;
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
    let shape = this._shape !== 'random' ? this._shape : utils.randomElement(['hearts', 'normal', 'donuts', 'roses', 'circles', 'stars', 'svg-path']);
    switch (shape) {
      case 'hearts':
      case 'heart':
        this.explodeAsHeart(origin);
        break;
      case 'circles':
      case 'circle':
        this.explodeAsCircle(origin);
        break;
      case 'donuts':
      case 'donut':
        this.explodeAsDonut(origin);
        break;
      case 'roses':
      case 'rose':  
        this.explodeAsRose(origin);
        break;
      case 'twinkles':  
      case 'twinkle':  
        this.explodeAsTwinkle(origin);
        break;
      case 'umbrellas':
      case 'umbrella': {
        const UMBRELLA_SVG_PATH = "m-6.79448,-92.33207l0,17.47059c-44.40085,2.4636 -79.37252,28.46603 -79.37254,60.17647c0,-5.71484 9.66276,-10.35294 21.56863,-10.35294c11.90587,0 21.56863,4.63809 21.56863,10.35294c0,-5.71484 9.66276,-10.35294 21.56863,-10.35294c5.67004,0 10.81554,1.08472 14.66666,2.80392l0,85.19607c0,3.80992 -3.09207,6.90197 -6.90195,6.90197c-3.80987,0 -6.90196,-3.09205 -6.90196,-6.90197l0,-3.45098l-13.80392,0l0,3.45098c0,11.42964 9.27622,20.70589 20.70588,20.70589c11.42964,0 20.70589,-9.27625 20.70589,-20.70589l0,-85.19607c3.85112,-1.7192 8.99663,-2.80392 14.66666,-2.80392c11.90587,0 21.56863,4.63809 21.56863,10.35294c0,-5.71484 9.66276,-10.35294 21.56863,-10.35294c11.90587,0 21.56863,4.63809 21.56863,10.35294c0,-31.71046 -34.97166,-57.71287 -79.37254,-60.17647l0,-17.47059l-13.80393,0z";
        const svgPathEl = this.createSvgPath(UMBRELLA_SVG_PATH); 
        this.explodeAsSvgPath(origin, svgPathEl);
        break;
      }
      case 'star':
      case 'stars': {
        const STAR_SVG_PATH = "m92.01591,-64.30286l-40.05686,64.68039l46.72933,60.03727l-73.89295,-18.10898l-42.65866,62.99478l-5.61151,-75.87238l-73.09385,-21.10436l70.42485,-28.7827l-2.5158,-76.03799l49.13646,58.08368l71.539,-25.88971l-40.05686,64.68039z";
        const svgPathEl = this.createSvgPath(STAR_SVG_PATH); 
        this.explodeAsSvgPath(origin, svgPathEl);
        break;
      }
      case 'skulls':
      case 'skull': {
        const SKULL_SVG_PATH = "m-46.85771,-58.94755c-1.88184,10.65545 -6.68873,20.83897 -7.01241,31.8268c0.43068,6.36193 -3.83741,9.77922 -9.68029,9.65891c-6.28421,6.51404 0.77566,16.80877 7.88609,19.43829c7.25659,4.87092 16.2589,-0.57182 23.44722,3.7976c9.54488,7.46135 13.52966,20.69049 10.23668,32.28827c-3.2741,9.57399 13.48583,6.09202 7.18185,-1.56122c-4.8688,-7.48044 9.17804,-5.00726 5.58197,2.09473c-0.67952,5.70093 4.20515,7.54617 2.03131,13.06933c5.66321,3.2473 -0.47473,5.06552 -3.92416,5.67866c-8.07777,4.02674 1.46111,-7.21327 -4.93809,-10.53785c-5.86006,1.27358 -1.88927,11.08668 -3.90071,9.95328c-4.14089,-3.24252 -4.13784,-15.3654 -11.08765,-7.45537c-2.30658,-9.74656 1.90197,-19.89721 -1.34005,-29.58719c1.32806,-7.2366 -10.09759,-9.7327 -8.65245,-1.33946c0.5761,12.80987 -3.31375,25.59422 -1.08126,38.34097c3.07478,7.86209 11.67446,11.40387 17.07187,17.47082c4.43274,4.67797 10.17939,9.67947 17.0787,8.20668c7.82526,-0.3392 15.66494,-1.0619 23.45489,0.18049c9.79817,0.30903 17.27786,-7.43584 25.63961,-11.4142c9.82988,-7.80536 8.2822,-21.74736 7.30228,-32.85284c-1.20156,-6.85642 1.43512,-13.71595 0.94375,-20.50819c-7.08681,-8.67113 -12.90122,6.57011 -10.88244,13.11826c-0.0005,8.23707 1.58134,18.84782 -6.27616,24.21352c-6.48455,-0.16351 -12.65597,2.19187 -19.19054,0.96033c-5.30243,3.1488 -13.89106,3.06795 -15.64129,-4.42788c-0.69876,-6.65679 2.31751,-13.63575 -1.78077,-19.84838c3.60083,3.10129 9.88317,-2.67848 6.38197,4.2744c-4.27046,5.65963 3.61606,14.38075 6.58497,6.02705c0.985,-5.60485 -4.26068,-13.0437 4.36211,-11.84289c1.75849,1.977 -6.00508,15.80606 4.60722,12.31131c7.566,-1.6573 -1.34605,-13.52576 8.89978,-13.567c4.95861,-5.83769 3.62351,-16.7797 11.20841,-21.20835c8.45712,-5.72336 21.66153,-1.59132 27.69771,-11.2838c5.145,-4.96 2.72378,-18.70747 -6.14948,-14.15226c-11.08872,1.08098 -2.28827,-15.01872 -2.59767,-21.05145c2.61269,-5.2543 -3.17292,-16.31458 -1.18067,-17.48803c3.7644,5.75949 5.11266,12.49584 4.30308,19.22675c-0.06957,5.70803 -2.49027,21.17755 5.44529,11.64131c2.6864,-6.64592 1.90508,-14.17362 3.81901,-21.08794c3.69145,-14.92782 -2.91817,-29.86394 -10.28666,-42.50771c-6.27562,-6.80674 -14.2427,-12.23283 -21.7244,-17.57527c-12.58448,-4.73301 -26.47969,-5.58091 -39.77083,-4.3947c-11.75654,2.0378 -24.18904,4.18622 -33.55462,12.20202c-9.12756,5.37816 -17.86911,12.52117 -21.47761,22.85525c-3.14465,8.32513 -8.65134,16.80325 -6.14861,26.05128c2.39354,7.70926 1.12406,15.7156 1.5116,23.59525c4.08026,9.00566 7.93253,-4.60825 7.55069,-9.11128c0.22588,-8.5392 4.73108,-16.09763 8.05077,-23.67826l-0.00001,-0.00001zm74.94339,18.31972c8.39078,0.60126 19.01479,5.27382 19.24377,15.0152c1.27586,9.77573 -6.62312,19.25154 -16.74587,18.29287c-9.1947,-0.75526 -15.07524,-8.69754 -14.46469,-17.62693c-3.07836,-6.40246 1.71211,-13.25958 8.14137,-14.7314c1.24676,-0.41923 2.52829,-0.73304 3.82543,-0.94975l0,0.00001zm-56.62367,0.83264c9.73393,-1.73112 20.80866,4.30735 20.84116,15.08194c0.91421,10.41618 -10.14457,12.45692 -17.68839,15.06633c-5.21998,3.37047 -10.6423,0.23231 -14.97969,-3.16354c-5.62755,-5.89032 -3.97348,-17.76021 1.96864,-23.13707c2.88145,-2.13251 6.44844,-2.97081 9.85828,-3.84766zm33.30807,27.47879c4.71231,6.47681 10.36947,16.35351 4.27544,23.70445c-5.40984,4.33862 -6.09187,-6.17122 -11.77002,-1.22152c-5.32676,-4.66515 -0.41384,-14.15828 3.32373,-18.8975c1.23188,-1.36472 2.64157,-2.56619 4.17085,-3.58543z";
        const svgPathEl = this.createSvgPath(SKULL_SVG_PATH); 
        this.explodeAsSvgPath(origin, svgPathEl);
        break;
      }
      case 'rabbits':
      case 'rabbit': {
        const RABBIT_SVG_PATH = "m-18.36611,64.65913c-6.32984,-2.2862 1.93011,-6.85709 5.05727,-8.87904c2.10641,-1.55716 -12.07198,0.21844 -6.08599,-5.1871c6.56751,-4.41603 4.08665,-11.88697 -2.47801,-15.35974c-9.03435,-4.88571 -20.62599,-9.0672 -23.96361,-18.19016c-3.37483,-5.68229 4.62864,-11.66689 -0.51915,-16.79814c-4.1435,-6.66239 0.69729,-13.60986 3.70619,-19.78153c1.38372,-8.53725 -7.09269,-15.28859 -11.7542,-22.30241c-5.772,-6.70257 -9.09925,-14.5126 -9.57736,-22.65159c-1.25526,-3.47406 0.13389,-8.86919 5.14637,-4.18545c10.49688,6.73188 22.02069,13.11962 29.36728,22.33394c1.39063,3.32829 6.95899,12.97461 7.26993,4.23931c0.14563,-12.00606 4.724,-25.10046 16.45573,-33.14604c7.97971,-5.82359 12.28314,4.37328 12.65547,9.55494c2.07697,10.19534 -1.36586,20.30567 -5.20237,29.93655c-1.40842,4.47578 -5.07631,16.74105 5.38456,12.21864c24.0981,-7.45161 53.29473,0.37459 68.99119,16.38222c7.21553,7.7507 10.37546,17.70854 10.30412,27.26976c-3.71543,5.61717 10.08939,-0.10523 5.08719,6.37529c-2.94474,7.17887 -11.26479,11.07421 -17.09274,16.49278c-5.93042,4.34197 -1.53023,13.6253 -11.33742,14.99319c-14.30988,3.53318 -29.33643,5.08084 -44.23352,5.98169c-8.33637,1.36789 -12.38205,-6.26685 -4.39194,-9.4408c3.83068,-4.7297 14.79014,-5.06115 18.04641,-5.81042c-7.78143,0.60979 -17.37787,-1.93397 -23.93487,1.92582c-3.971,5.16309 -7.15142,11.95884 -15.47866,13.43254c-3.74224,0.83244 -7.58993,1.5 -11.42188,0.59576l-0.00001,0z";
        const svgPathEl = this.createSvgPath(RABBIT_SVG_PATH); 
        this.explodeAsSvgPath(origin, svgPathEl);
        break;
      }
      case 'eagles':
      case 'eagle': {
        const EAGLE_SVG_PATH = "m-36.21797,27.65923c5.63548,-4.39217 17.91854,2.71573 17.47809,-8.73904c5.58221,-3.93354 9.88157,-12.55413 0.85543,-15.43992c-5.14351,-2.4673 -7.55769,5.45669 -9.34783,5.95634c-3.7149,-5.17639 -1.6188,-13.61405 -0.15662,-19.08298c4.67226,-2.90675 12.33331,-6.22397 6.92675,-12.70066c-1.12018,-7.06942 -1.80589,-15.31597 -8.48329,-19.58907c-4.98356,-2.99327 -12.02043,-5.8469 -9.57479,-12.87373c-3.21741,-4.85295 -6.94299,-11.48738 -4.80718,-17.47927c4.87125,-0.86326 4.2992,11.44788 5.22783,8.84634c-1.82972,-3.9586 4.37357,-13.07312 4.01864,-4.66941c-0.37445,3.01474 -0.13195,9.12314 1.52431,3.07294c4.48998,-6.67021 0.08628,11.5627 4.49346,4.32704c3.10906,-1.00642 2.16172,4.45587 5.16236,1.75508c3.28501,2.50962 5.69069,3.07073 5.67954,7.24136c4.37746,1.58249 7.6432,4.20016 6.77598,8.36082c8.54305,-2.0613 1.23937,8.59353 7.31963,11.56475c3.27749,5.19584 4.75078,10.40137 4.51459,16.57183c6.74608,-1.86434 11.19522,-9.53698 18.16244,-11.92428c7.82221,-3.62508 10.62481,-12.63719 12.32369,-20.42156c0.75851,-3.75592 5.51978,-3.57203 4.05718,0.64702c5.47902,-5.90489 3.19222,-14.50187 4.73948,-21.68264c0.49608,-4.0164 -1.11395,-12.87051 2.26781,-13.69732c5.04578,4.52914 -1.12072,14.54204 3.79782,17.54752c3.46729,-6.46955 2.2383,-14.20778 2.42607,-21.26883c-0.08475,-4.07577 3.95947,-6.77392 3.76396,-0.95612c1.69605,5.02176 -0.1934,15.38916 0.78789,17.21673c3.85537,-5.96089 3.03127,-13.98834 7.11907,-19.58784c5.62416,2.10968 -1.59398,11.57726 -1.41135,16.59259c0.7539,3.8516 6.26613,-11.27964 6.54368,-2.93733c-2.53963,2.20484 -2.11465,8.27565 0.72296,3.38561c1.09605,-4.0158 8.59331,-2.66928 3.75488,0.99603c-3.59288,3.1206 6.30362,2.90119 1.9711,6.33193c2.89058,4.77402 -4.97399,7.59721 -0.47387,11.0383c-0.25883,1.38592 3.59176,4.08389 1.88972,7.41168c1.69681,3.06451 -6.041,5.05415 -0.99198,7.15078c0.29205,7.14662 -8.73985,12.07484 -6.76073,18.74704c-0.5834,8.04089 -6.65042,14.78869 -13.14326,19.03858c-5.9983,1.13743 -10.65112,3.54652 -15.80693,6.87049c-3.39497,0.05836 -4.60022,0.04247 -6.37559,2.49277c-2.79434,-2.16772 -7.40205,-5.44354 -6.61234,1.12139c1.19588,8.15283 11.53929,8.96331 17.04077,13.30052c5.86767,2.07111 13.54206,8.95504 7.18756,14.34408c-0.61482,7.66047 -10.8086,3.07215 -13.45606,5.72232c-3.79849,0.56785 -3.40274,3.24908 -6.77738,0.0519c-3.28669,4.40485 -10.63873,-0.36303 -14.14401,-2.27344c-5.68574,2.71291 -8.28521,-10.92295 -9.3307,-1.378c-2.30971,6.48773 -11.69048,-0.48471 -11.64436,7.81054c-4.29183,-0.88185 -4.49381,5.82605 -9.09708,5.15221c2.89527,-1.34431 4.86457,-9.0315 -0.33285,-5.32558c-4.25062,-3.22893 -1.79607,7.94572 -5.30098,2.12736c-0.77098,-7.55385 7.80799,-7.70291 12.64235,-9.05993c1.7362,-4.39026 3.93431,-10.16171 3.47373,-14.39559c-4.56962,1.83681 -8.57695,5.77452 -13.90821,6.10899c0.33188,3.99021 -2.75965,10.43769 -7.51297,6.72519c6.83371,2.66429 3.8142,-11.96688 -0.31553,-4.73676c-1.61885,4.77024 -1.41827,-6.89173 -6.10039,-3.49714c-2.45403,1.78487 -0.78789,5.91793 -3.22585,1.12356c-0.47416,-0.9666 -0.54839,-2.33921 0.44334,-3.03522l0,0.00001z m139.39672,83.27228c0.09533,-0.0743 0.30312,0.04594 0.29567,-0.14784c0.09443,-0.06654 0.16716,-0.21238 0.01447,-0.26119c-0.08701,-0.04174 -0.12785,0.09231 -0.15814,0.10076c-0.06284,-0.08757 -0.02739,-0.23031 -0.00265,-0.32282c0.07904,-0.04917 0.20864,-0.10529 0.11718,-0.21485c-0.01895,-0.11959 -0.03055,-0.2591 -0.14351,-0.33138c-0.08431,-0.05064 -0.20335,-0.09891 -0.16197,-0.21778c-0.05443,-0.0821 -0.11745,-0.19433 -0.08132,-0.29569c0.08241,-0.0146 0.07273,0.19366 0.08844,0.14965c-0.03095,-0.06697 0.07399,-0.22116 0.06798,-0.07899c-0.00633,0.051 -0.00223,0.15433 0.02579,0.05198c0.07596,-0.11284 0.00146,0.1956 0.07602,0.0732c0.0526,-0.01703 0.03657,0.07538 0.08733,0.02969c0.05557,0.04245 0.09627,0.05195 0.09608,0.1225c0.07405,0.02677 0.1293,0.07105 0.11463,0.14144c0.14452,-0.03487 0.02097,0.14538 0.12382,0.19564c0.05544,0.0879 0.08037,0.17596 0.07637,0.28034c0.11412,-0.03154 0.18939,-0.16134 0.30725,-0.20172c0.13233,-0.06132 0.17974,-0.21378 0.20848,-0.34547c0.01283,-0.06354 0.09338,-0.06043 0.06863,0.01095c0.09269,-0.09989 0.054,-0.24533 0.08018,-0.3668c0.00839,-0.06794 -0.01884,-0.21773 0.03836,-0.23172c0.08536,0.07662 -0.01896,0.24601 0.06425,0.29685c0.05866,-0.10944 0.03786,-0.24035 0.04104,-0.3598c-0.00143,-0.06895 0.06698,-0.11459 0.06367,-0.01617c0.02869,0.08495 -0.00327,0.26034 0.01333,0.29125c0.06522,-0.10084 0.05128,-0.23664 0.12043,-0.33136c0.09514,0.03569 -0.02697,0.19585 -0.02388,0.28069c0.01275,0.06516 0.106,-0.19082 0.1107,-0.04969c-0.04296,0.0373 -0.03577,0.14 0.01223,0.05727c0.01854,-0.06793 0.14537,-0.04516 0.06352,0.01685c-0.06078,0.05279 0.10664,0.04908 0.03334,0.10712c0.0489,0.08076 -0.08414,0.12852 -0.00802,0.18673c-0.00438,0.02345 0.06076,0.06909 0.03197,0.12538c0.0287,0.05184 -0.10219,0.0855 -0.01678,0.12097c0.00494,0.1209 -0.14785,0.20427 -0.11437,0.31714c-0.00987,0.13603 -0.1125,0.25018 -0.22234,0.32207c-0.10147,0.01924 -0.18018,0.06 -0.2674,0.11623c-0.05743,0.00099 -0.07782,0.00072 -0.10785,0.04217c-0.04727,-0.03667 -0.12522,-0.09209 -0.11186,0.01897c0.02023,0.13792 0.19521,0.15163 0.28828,0.225c0.09926,0.03504 0.22909,0.15149 0.12159,0.24266c-0.0104,0.12959 -0.18285,0.05197 -0.22763,0.0968c-0.06426,0.00961 -0.05756,0.05496 -0.11465,0.00088c-0.0556,0.07452 -0.17997,-0.00614 -0.23927,-0.03846c-0.09618,0.04589 -0.14016,-0.18478 -0.15785,-0.02331c-0.03907,0.10975 -0.19777,-0.0082 -0.19699,0.13213c-0.0726,-0.01492 -0.07602,0.09856 -0.15389,0.08716c0.04898,-0.02274 0.08229,-0.15278 -0.00563,-0.09009c-0.07191,-0.05462 -0.03038,0.13442 -0.08968,0.03599c-0.01304,-0.12779 0.13209,-0.13031 0.21387,-0.15327c0.02937,-0.07427 0.06656,-0.1719 0.05876,-0.24353c-0.0773,0.03107 -0.14509,0.09769 -0.23528,0.10334c0.00561,0.0675 -0.04668,0.17657 -0.1271,0.11377c0.1156,0.04507 0.06452,-0.20244 -0.00534,-0.08013c-0.02739,0.0807 -0.02399,-0.11659 -0.1032,-0.05916c-0.04151,0.03019 -0.01333,0.10011 -0.05457,0.01901c-0.00802,-0.01635 -0.00928,-0.03957 0.0075,-0.05135l0,0z";
        const svgPathEl = this.createSvgPath(EAGLE_SVG_PATH); 
        this.explodeAsSvgPath(origin, svgPathEl);
        break;
      }
      case 'svg-path': {
        let svgPathEl = document.getElementById(this._svgPathId);  
        if (svgPathEl) {
          this.explodeAsSvgPath(origin, svgPathEl);
          break;
        }
      }
      case 'normal':
      default:
        this.explodeAsNormal(origin);
    }
  }

  createSvgPath(pathSyntax) {
    const svgPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");        
    svgPathEl.setAttribute("d", pathSyntax);
    return svgPathEl;
  }

  explodeAsNormal(origin) {
    let partCount = 180;
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

  explodeAsTwinkle(origin) {
    const arms = utils.random(4, 7);
    const radiuses = [ 4, 3, 1 ];
    const angle = Math.PI / arms;
    for (let i = 0; i < 3 * arms; i++) {
      let r = radiuses[i % 3];
      let v = vectorFromPolar(i * angle, r);
      let p = new Particle(origin, v, this._hue);
      this._particles.push(p);
    }
  }

  explodeAsSvgPath(origin, svgPathEl) {
    let partCount = 180;
    let pathLength = Math.floor(svgPathEl.getTotalLength());
    let max = 0;
    let vectors = [];
    for (let i = 0; i < partCount; i++) {
      let pt = svgPathEl.getPointAtLength((pathLength * i) / partCount);
      let v = new Vector(pt.x, pt.y);
      if (v.magnitude > max) {
        max = v.magnitude;
      }
      vectors.push(v);
    }
    for (let v of vectors) {
      v = v.divide(max);
      let p = new Particle(origin, v, this._hue);
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
