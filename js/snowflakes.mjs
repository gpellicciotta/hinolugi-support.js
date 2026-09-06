import * as log from './log.mjs';
import * as utils from './utils.mjs';
import * as domutils from './domutils.mjs';

// Falling-snowflakes animation effect, rendered as absolutely-positioned <span> elements over the document.

// Constants

const FRAMES_PER_SECOND = 60;
const DEFAULT_SNOW_FLAKE_COUNT = 30;
const DEFAULT_SNOW_FLAKE_SYMBOLS = ['*', '❆', '❅', '❄'];
const DEFAULT_SNOW_FLAKE_COLORS = [
  'rgba(220,220,220,0.2)',
  'rgba(220,220,220,0.4)',
  'rgba(220,220,220,0.6)',
  'rgba(220,220,220,0.8)',
  'rgba(220,220,220,1.0)',
];

// Global state

// Keep track of all snow flakes
let animId = 0;
let snowFlakes = [];
let snowOptions = {
  count: DEFAULT_SNOW_FLAKE_COUNT,
  symbols: DEFAULT_SNOW_FLAKE_SYMBOLS,
  colors: DEFAULT_SNOW_FLAKE_COLORS,
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

  if (!started) {
    // First time only:
    started = true;

    // Default options:
    snowOptions = options || {};
    if (!snowOptions.count) {
      snowOptions.count = DEFAULT_SNOW_FLAKE_COUNT;
    }
    if (!snowOptions.symbols) {
      snowOptions.symbols = DEFAULT_SNOW_FLAKE_SYMBOLS;
    }
    if (!snowOptions.colors) {
      snowOptions.colors = DEFAULT_SNOW_FLAKE_COLORS;
    }

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
  document.querySelectorAll('span.snowflake').forEach((el) => {
    el.remove();
  });
  snowFlakes = [];
  started = false;
}

function snowStep() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Optionally create additional snowflake:
  if (createSnowFlakes && snowFlakes.length < snowOptions.count) {
    createSnowFlake();
  }

  // Move all existing flakes:
  for (let i = snowFlakes.length - 1; i >= 0; i--) {
    // Backwards to allow removal of elements
    const snowFlake = snowFlakes[i];
    const snowEl = snowFlake.element;
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
        continue;
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
  const snowFlakeContainer = document.querySelector('.snowflake-container') || document.body;

  // Create new object with meta-data and document element:
  const newElement = document.createElement('span');
  const xPos = utils.random(0, screenWidth);
  const yPos = 0 - utils.random(10, screenWidth / 2);
  const size = utils.random(16, 32);
  const zIndex = utils.random(500, 1000);
  const newSnowFlake = {
    id: `snowflake-${snowFlakes.length}`,
    element: newElement,
    xPos: xPos,
    yPos: yPos,
    dir: utils.randomElement([-1, 1]),
    fallSpeed: utils.randomElement([1, 2]),
  };
  snowFlakes.push(newSnowFlake);
  // Style the document el:
  newElement.classList.add('snowflake');
  newElement.style.position = 'fixed';
  newElement.style.top = `${yPos}px`;
  newElement.style.right = `${xPos}px`;
  newElement.style.color = utils.randomElement(snowOptions.colors);
  newElement.style.fontSize = `${size}px`;
  //newElement.style.width = `${size}px`;
  newElement.style.height = `${size}px`;
  newElement.style.zIndex = `${zIndex}`;
  newElement.style.pointerEvents = 'none';
  newElement.innerText = utils.randomElement(snowOptions.symbols); // + `sp:${newSnowFlake.fallSpeed},d:${newSnowFlake.dir}`;
  // Append to document:
  snowFlakeContainer.appendChild(newElement);
  log.trace(`${snowFlakes.length} snowflakes have been created now`);
}
