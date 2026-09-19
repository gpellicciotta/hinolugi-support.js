import * as log from './logs.mjs';
import { cancelAnimFrame, onAnimFrame } from './dom.mjs';
import { random, randomElement } from './math.mjs';

/**
 * Falling snowflakes visual animation effect rendered over the document body.
 *
 * @module snowflakes
 */

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
 * @typedef {Object} SnowflakesOptions
 * @property {number} [count=30] Maximum number of snowflakes to display simultaneously.
 * @property {string[]} [symbols] Array of snowflake character symbols (defaults to 4 unicode snowflake glyphs).
 * @property {string[]} [colors] Array of CSS color strings for the snowflakes.
 */

/**
 * Start or resume creating and animating falling snowflakes over the document.
 *
 * Each snowflake is rendered as a `<span class="snowflake">` element appended to
 * the document body or an element with class `.snowflake-container`.
 *
 * @param {SnowflakesOptions} [options] Configuration options for count, symbols, and colors.
 * @returns {void}
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
    animId = onAnimFrame(snowStep, FRAMES_PER_SECOND);
  }
}

/**
 * Stop creating new snowflakes, allowing existing snowflakes to finish falling and fade out.
 *
 * @returns {void}
 */
export function stop() {
  createSnowFlakes = false;
}

/**
 * Stop animating and immediately remove all snowflake elements from the DOM.
 *
 * @returns {void}
 */
export function reset() {
  cancelAnimFrame(animId);
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
    xPos += random(0, 1) * snowFlake.dir;
    yPos += snowFlake.fallSpeed;
    // Check window boundaries: reset
    if (yPos > screenHeight) {
      if (!createSnowFlakes) {
        snowEl.remove();
        snowFlakes.splice(i, 1);
        continue;
      }
      xPos = random(0, screenWidth);
      yPos = 0 - random(10, 20);
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
  const xPos = random(0, screenWidth);
  const yPos = 0 - random(10, screenWidth / 2);
  const size = random(16, 32);
  const zIndex = random(500, 1000);
  const newSnowFlake = {
    id: `snowflake-${snowFlakes.length}`,
    element: newElement,
    xPos: xPos,
    yPos: yPos,
    dir: randomElement([-1, 1]),
    fallSpeed: randomElement([1, 2]),
  };
  snowFlakes.push(newSnowFlake);
  // Style the document el:
  newElement.classList.add('snowflake');
  newElement.style.position = 'fixed';
  newElement.style.top = `${yPos}px`;
  newElement.style.right = `${xPos}px`;
  newElement.style.color = randomElement(snowOptions.colors);
  newElement.style.fontSize = `${size}px`;
  //newElement.style.width = `${size}px`;
  newElement.style.height = `${size}px`;
  newElement.style.zIndex = `${zIndex}`;
  newElement.style.pointerEvents = 'none';
  newElement.innerText = randomElement(snowOptions.symbols); // + `sp:${newSnowFlake.fallSpeed},d:${newSnowFlake.dir}`;
  // Append to document:
  snowFlakeContainer.appendChild(newElement);
  log.trace(`${snowFlakes.length} snowflakes have been created now`);
}
