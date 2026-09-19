/**
 * DOM related utility functions, canvas sizing helpers, animation frame management, and touch gesture handling.
 */
import * as log from './logs.mjs';

// ASPECT RATIO

/**
 * Get the CSS pixel size of a canvas element.
 *
 * @param {HTMLCanvasElement} canvasElement The DOM canvas element to get the current CSS pixel size for.
 * @returns {{width: number, height: number}} A size object with properties "width" and "height".
 */
export function getCssPixelSize(canvasElement) {
  // The + prefix casts it to an integer; the slice method gets rid of "px"
  const cssHeight = +getComputedStyle(canvasElement).getPropertyValue('height').slice(0, -2);
  const cssWidth = +getComputedStyle(canvasElement).getPropertyValue('width').slice(0, -2);
  return { width: cssWidth, height: cssHeight };
}

/**
 * Ensure the sizes for the provided canvas element track CSS size changes.
 *
 * Works by initially asking the desired CSS pixel size of the canvas and settings its
 * physical 'width' and 'height' properties in accordance with the pixelScale, while also
 * scaling the canvas context with the same pixelScale: this is needed to ensure a crisp display.
 *
 * Subsequent window resize events will then re-trigger all of the above.
 *
 * @param {HTMLCanvasElement} canvasElement The DOM canvas element to ensure a correct aspect ratio for.
 * @param {function(HTMLCanvasElement): {width: number, height: number}} [determineCssSizeCallback] Callback returning desired CSS dimensions.
 * @param {number} [pixelScale] Device pixel ratio scale factor.
 * @returns {void}
 */
export function ensureTrackingCanvasSize(canvasElement, determineCssSizeCallback, pixelScale) {
  determineCssSizeCallback = determineCssSizeCallback || getCssPixelSize;
  pixelScale = pixelScale || window.devicePixelRatio;

  // Ensure a correctly scaled context will be returned, always
  canvasElement.getContext = (function () {
    const origGetContext = canvasElement.getContext;
    return function (type) {
      const ctx = origGetContext.apply(canvasElement, [type]);
      ctx.scale(pixelScale, pixelScale);
      return ctx;
    };
  })();

  // Determine actual CSS canvas size:
  const cssSize = determineCssSizeCallback(canvasElement);
  // Update physical canvas size:
  canvasElement.height = cssSize.height * pixelScale;
  canvasElement.width = cssSize.width * pixelScale;

  // Now also ensure this aspect ratio is kept despite resize operations
  window.addEventListener(
    'resize',
    moderatedEventCallback(function () {
      // Determine actual CSS canvas size:
      const cssSize = determineCssSizeCallback(canvasElement);
      // Update physical canvas size:
      canvasElement.height = cssSize.height * pixelScale;
      canvasElement.width = cssSize.width * pixelScale;
    }),
  );
}

// TIMING RELATED

/**
 * Execute a callback as result of an event, but ensure that the callback is only called at most once per time window.
 *
 * @param {function(Event): void} callback The callback function to be called.
 * @param {number} [ms=100] The minimum number of milliseconds to expire before calling the callback.
 * @returns {function(Event): void} Event listener throttling function.
 * @throws {TypeError} When callback is not a function.
 */
export function moderatedEventCallback(callback, ms) {
  if (typeof callback !== 'function') {
    throw new TypeError('callback for moderatedEventCallback(callback, afterMs) must be a function');
  }
  ms = ms || 100;
  let timer;
  return function (event) {
    if (timer) {
      // If already and still set: clear
      clearTimeout(timer);
    }
    // Set to run after ms
    timer = setTimeout(callback, ms, event);
  };
}

// DOCUMENT ACTIVE AGAIN

// Credits: https://stackoverflow.com/questions/9899372/pure-javascript-equivalent-of-jquerys-ready-how-to-call-a-function-when-t

let lastDocumentStatus = null;
let lastDocumentStatusCheck = null;
let documentActivatedTimer = null;
const documentActivatedCallbacks = [];

/**
 * Register a callback function to be invoked when the document is activated.
 *
 * @param {function(): void} callback The callback function to be invoked.
 * @returns {void}
 * @throws {TypeError} When callback is not a function.
 */
export function onDocumentActivated(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('callback for onDomReady(callback) must be a function');
  }
  // Register callback
  documentActivatedCallbacks.push(callback);
  // Check whether already a timer
  if (!documentActivatedTimer) {
    document.addEventListener('visibilitychange', checkDocumentStatus, false);
    window.addEventListener('focus', checkDocumentStatus);
    lastDocumentStatus = document.hidden ? 'hidden' : 'visible';
    lastDocumentStatusCheck = new Date().getTime();
    documentActivatedTimer = setInterval(checkDocumentStatus, 1000);
  }
}

function checkDocumentStatus() {
  const newCheckTime = new Date().getTime();
  if (document.hidden) {
    lastDocumentStatus = 'hidden';
    lastDocumentStatusCheck = newCheckTime;
  } else if (lastDocumentStatus === 'hidden') {
    // Transition detected
    lastDocumentStatus = 'visible';
    lastDocumentStatusCheck = newCheckTime;
    fireDocumentActivated();
  } else if (newCheckTime - lastDocumentStatusCheck > 2000) {
    // We mist 2 check cycles? Assume because tab inactivation
    lastDocumentStatus = 'visible';
    lastDocumentStatusCheck = newCheckTime;
    fireDocumentActivated();
  } else {
    lastDocumentStatusCheck = newCheckTime;
  }
}

function fireDocumentActivated() {
  for (let i = 0; i < documentActivatedCallbacks.length; i++) {
    documentActivatedCallbacks[i].call(window);
  }
}

// DOM READY

// Credits: https://stackoverflow.com/questions/9899372/pure-javascript-equivalent-of-jquerys-ready-how-to-call-a-function-when-t

let domReadyHasFired = false;
let domReadyCallbacks = [];
let globalDomReadyEventHandlerInstalled = false;

/**
 * Register a callback function to be invoked when the HTML DOM is ready.
 * Multiple callbacks can get registered.
 *
 * If the DOM is already ready when this function is invoked, the callback will be
 * called immediately, yet asynchronously.
 *
 * @param {function(): void} callback The callback function to be invoked.
 * @returns {void}
 * @throws {TypeError} When callback is not a function.
 */
export function onDomReady(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('callback for onDomReady(callback) must be a function');
  }
  if (domReadyHasFired) {
    // If ready has already fired, then just schedule the callback to fire asynchronously, but right away
    setTimeout(function () {
      callback();
    }, 1);
    return;
  }
  // Register callback
  domReadyCallbacks.push(callback);
  // Check status of DOM:
  //   if document already ready to go, schedule the ready function to run
  if (document.readyState === 'complete') {
    setTimeout(fireDomReady, 1);
  } else if (!globalDomReadyEventHandlerInstalled) {
    // otherwise if we don't have event handlers installed, install them
    if (document.addEventListener) {
      // Use window load event (since DOMContentLoaded doesn't guarantee that all CSS or other resources have been fully loaded)
      window.addEventListener('load', fireDomReady, false);
    } else {
      // must be IE
      document.attachEvent('onreadystatechange', onReadyStateChange);
      window.attachEvent('onload', fireDomReady);
    }
    globalDomReadyEventHandlerInstalled = true;
  }
}

/**
 *  Invoked from window or document event.
 */
function onReadyStateChange() {
  if (document.readyState === 'complete') {
    fireDomReady();
  }
}

/**
 *  Invoked when DOM is determined to be ready: will invoke all registered callbacks.
 */
function fireDomReady() {
  if (domReadyHasFired) {
    // Don't call more than once
    return;
  }
  domReadyHasFired = true; // Guard against being called more than once
  for (let i = 0; i < domReadyCallbacks.length; i++) {
    // If a callback here happens to add new ready handlers, the onDomReady() function will see that it already fired
    // and will schedule the callback to run right after this event loop finishes so all handlers will still execute
    // in order and no new ones will be added to the domReadyCallbacks while we are processing the list
    domReadyCallbacks[i].call(window);
  }
  // allow any closures held by these functions to free
  domReadyCallbacks = [];
}

// ANIMATION

const animFrameCallbacks = [];
let globalAnimFrameEventHandlerInstalled = false;

/**
 * Cancel an animation function that was previously registered via onAnimFrame.
 *
 * @param {number} id The function ID returned from onAnimFrame.
 * @returns {void}
 */
export function cancelAnimFrame(id) {
  if (id >= 0 && id < animFrameCallbacks.length) {
    animFrameCallbacks[id] = null;
  }
}

/**
 * Request a callback to be called once whenever the browser is next ready to render a frame.
 *
 * Similar to `window.requestAnimationFrame` but ensures to emulate
 * this function if it doesn't exist yet (as can be case in older browsers).
 *
 * @param {FrameRequestCallback} callback The function to invoke whenever the browser is ready.
 * @returns {number} Request ID.
 */
export function requestAnimationFrame(callback) {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function () {
      return (
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (cb) {
          return window.setTimeout(cb, 1000 / 60);
        }
      );
    })();
  }
  return window.requestAnimationFrame(callback);
}

/**
 * Call an animation function a number of times per second.
 *
 * @param {function(number): void} callback The function to invoke repeatedly.
 * @param {number} [fps=60] The number of times per second the callback should get invoked.
 * @returns {number} An ID for the callback that can be used in cancelAnimFrame.
 * @throws {TypeError} When callback is not a function.
 */
export function onAnimFrame(callback, fps) {
  if (typeof callback !== 'function') {
    throw new TypeError('callback for onAnimFrame(callback, fps) must be a function');
  }
  // Register callback
  const millisBetweenFrames = 1000 / (fps || 60);
  const idx =
    -1 +
    animFrameCallbacks.push({
      fn: callback,
      fps: fps,
      millisBetweenFrames: millisBetweenFrames,
      lastFireTime: 0,
    });
  if (!globalAnimFrameEventHandlerInstalled) {
    // Ensure the requestAnimFrame function is available on all browsers
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (function () {
        return (
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function (callback) {
            window.setTimeout(callback, 1000 / 60);
          }
        );
      })();
    }
    globalAnimFrameEventHandlerInstalled = true;
    // Ensure the animation starts rolling
    window.requestAnimationFrame(fireAnimFrame);
  }
  return idx;
}

/**
 * Invoked when another animation frame should be prepared.
 */
function fireAnimFrame(fireTime) {
  for (let i = 0; i < animFrameCallbacks.length; i++) {
    const cb = animFrameCallbacks[i];
    if (cb && fireTime >= cb.lastFireTime + cb.millisBetweenFrames) {
      window.setTimeout(function () {
        // Asynchronously so all callbacks can work in parallel
        cb.lastFireTime = fireTime;
        cb.fn.call(window);
      }, 1);
    }
  }
  window.requestAnimationFrame(fireAnimFrame); // Keep rolling
}

// PLAY

/**
 * Run a setup function once and then, fps times per second,
 * invoke the animate callback, with as argument whatever setup returned.
 *
 * @param {function(): *} setup One-time setup function. Can return an argument for animate.
 * @param {function(*): void} animate The animate function that will be invoked repeatedly.
 * @param {number} [fps=60] Frames-per-second rate.
 * @returns {void}
 * @throws {TypeError} When setup or animate is not a function.
 */
export function play(setup, animate, fps) {
  if (typeof setup !== 'function') {
    throw new TypeError('setup for play(setup, animate, fps) must be a function');
  }
  if (typeof animate !== 'function') {
    throw new TypeError('animate for play(setup, animate, fps) must be a function');
  }
  onDomReady(function () {
    const ctx = setup.call(window);
    onAnimFrame(function () {
      animate.call(window, ctx);
    }, fps);
  });
}

// SWIPE GESTURES

/**
 * Register a callback function to be invoked when a double-tap has occurred on the target element.
 *
 * @param {HTMLElement} targetElement The element that is to be monitored for swipe gestures.
 * @param {function(): void} dblTapCallback The callback function to be invoked whenever double-tap occurs.
 * @returns {void}
 * @throws {TypeError} When dblTapCallback is not a function.
 */
export function onDoubleTap(targetElement, dblTapCallback) {
  if (typeof dblTapCallback !== 'function') {
    throw new TypeError('callback for onDoubleTap(dblTapCallback) must be a function');
  }
  let tapTimer = null;
  targetElement.addEventListener('touchstart', function () {
    // Double-tap
    //e.preventDefault(); // Don't zoom
    if (tapTimer == null) {
      // No tap yet
      tapTimer = setTimeout(function () {
        tapTimer = null;
      }, 500); // Set timer, but erase after .5s
    } else {
      // Already one tap (and not auto-erased so within .5s of first tap)
      clearTimeout(tapTimer);
      tapTimer = null;
      dblTapCallback.call(/* this: */ window);
    }
    return false;
  });
}

/**
 * Register a callback function to be invoked when a swipe has occurred on the target element.
 *
 * @param {HTMLElement} targetElement The element that is to be monitored for swipe gestures.
 * @param {function({dir: string, dist: number, start: Object, end: Object}): void} swipeCallback Callback invoked upon swipe completion.
 * @param {function(string): void} [dblTapCallback=null] Optional callback invoked upon double tap.
 * @returns {void}
 * @throws {TypeError} When swipeCallback is not a function.
 */
export function onSwipe(targetElement, swipeCallback, dblTapCallback = null) {
  if (typeof swipeCallback !== 'function') {
    throw new TypeError('swipeCallback for onSwipe(targetElement, swipeCallback, dblTapCallback) must be a function');
  }

  const MAX_SWIPE_TIME = 700; // ms
  const MIN_DIST = 25; // px
  const MAX_PERPENDICULAR_DIST = 25; // px
  let touchStart = null;
  let touchEnd = null;

  const MAX_DBLTAP_TIME = 500; // ms
  let tapTimer = null;

  const handleGesture = function () {
    // Check gesture didn't take too long
    const elapsed = touchEnd.time - touchStart.time;
    if (elapsed > MAX_SWIPE_TIME) {
      touchStart = null;
      touchEnd = null;
      return;
    }
    // Check x and y distance
    let swipeDir = null;
    const distX = touchEnd.x - touchStart.x;
    const distY = touchEnd.y - touchStart.y;
    let dist;
    if (Math.abs(distX) > MIN_DIST && Math.abs(distY) < MAX_PERPENDICULAR_DIST) {
      // horizontal gesture
      swipeDir = distX < 0 ? 'left' : 'right'; // if dist traveled is negative, it indicates left swipe
      dist = Math.abs(distX);
    } else if (Math.abs(distY) > MIN_DIST && Math.abs(distX) < MAX_PERPENDICULAR_DIST) {
      // vertical gesture
      swipeDir = distY < 0 ? 'up' : 'down'; // if dist traveled is negative, it indicates up swipe
      dist = Math.abs(distY);
    }
    // Invoke callback
    if (dist) {
      const arg = {
        dir: swipeDir,
        dist: dist,
        start: touchStart,
        end: touchEnd,
      };
      swipeCallback.call(/* this: */ window, arg);
    }
    // Reset
    touchStart = null;
    touchEnd = null;
  };

  targetElement.addEventListener('touchstart', function (e) {
    if (tapTimer == null) {
      // No tap yet
      tapTimer = setTimeout(function () {
        tapTimer = null;
      }, MAX_DBLTAP_TIME); // Set timer, but erase after ...
      // But also treat as possible start of swipe gesture:
      const touchObj = e.touches[0];
      touchStart = { x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime() };
    } else {
      // Already one tap (and not auto-erased so within .5s of first tap)
      clearTimeout(tapTimer);
      tapTimer = null;
      touchStart = null;
      touchEnd = null;
      if (dblTapCallback) {
        dblTapCallback.call(/* this: */ window, 'double-tap');
      }
    }
    return false;
  });

  targetElement.addEventListener('mousedown', function (e) {
    touchStart = { x: e.pageX, y: e.pageY, time: new Date().getTime() };
    return false;
  });

  targetElement.addEventListener('touchend', function (e) {
    if (touchStart) {
      const touchObj = e.changedTouches[0];
      if (touchObj) {
        touchEnd = { x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime() };
      }
      handleGesture();
      return false;
    }
  });

  targetElement.addEventListener('mouseup', function (e) {
    if (touchStart) {
      touchEnd = { x: e.pageX, y: e.pageY, time: new Date().getTime() };
      handleGesture();
      return false;
    }
  });

  targetElement.addEventListener('touchleave', function () {
    touchStart = null;
    touchEnd = null;
    return false;
  });

  targetElement.addEventListener('touchmove', function (e) {
    //e.preventDefault(); // Prevent scrolling when inside element
    const touchObj = e.touches[0];
    if (touchObj) {
      touchEnd = { x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime() };
    }
    return false;
  });

  targetElement.addEventListener('touchcancel', function () {
    touchStart = null;
    touchEnd = null;
    return false;
  });

  targetElement.addEventListener('mouseleave', function () {
    touchStart = null;
    touchEnd = null;
    return false;
  });
}

/**
 * Register a callback function to be invoked when a move of a minimum distance occurs on the target element.
 *
 * Will start tracking move distance on mousedown or touchstart, and then re-calculate move distance
 * on subsequent mousemove or touchmove events. Whenever the traveled distance is larger than minDist,
 * the callback will be invoked.
 *
 * @param {HTMLElement} targetElement The element that is to be monitored.
 * @param {number} [minDist=25] The minimum distance moved in pixels before triggering callback.
 * @param {function({dir: string, dist: ?number, start: Object, end: Object}): void} moveCallback Callback invoked upon move updates.
 * @returns {void}
 * @throws {TypeError} When moveCallback is not a function.
 */
export function onMove(targetElement, minDist, moveCallback) {
  const MIN_DIST = 25; // px

  if (typeof moveCallback !== 'function') {
    throw new TypeError('moveCallback for onMove(targetElement, minDist, moveCallback) must be a function');
  }
  minDist = minDist || MIN_DIST;

  let moveStart = null;
  let moved = false;
  let moveEnd = null;

  const handleMove = function () {
    // Check x and y distance
    const horDist = Math.abs(moveEnd.x - moveStart.x);
    const vertDist = Math.abs(moveEnd.y - moveStart.y);
    let dist = null;
    let dir = null;
    if (horDist > vertDist) {
      // Horizontal move dominates
      if (horDist >= minDist) {
        dist = horDist;
        if (moveEnd.x > moveStart.x) {
          dir = 'right';
        } else {
          dir = 'left';
        }
      }
    } else {
      // Vertical move dominates
      if (vertDist >= minDist) {
        dist = vertDist;
        if (moveEnd.y > moveStart.y) {
          dir = 'down';
        } else {
          dir = 'up';
        }
      }
    }
    // Invoke callback
    if (dist) {
      if (!moved) {
        // First real move, so also invoke callback with 'start'
        handleStartOrStop('start');
      }
      // Invoke callback
      const arg = {
        dir: dir,
        dist: dist,
        start: moveStart,
        end: moveEnd,
      };
      // Prepare for next move:
      moveStart = moveEnd;
      moveEnd = null;
      moved = true;
      moveCallback.call(/* this: */ window, arg);
    }
  };

  const handleStartOrStop = function (startOrStop) {
    // Invoke callback
    const arg = {
      dir: startOrStop,
      dist: null,
      start: startOrStop === 'start' ? moveStart : moveEnd,
      end: startOrStop === 'start' ? moveStart : moveEnd,
    };
    moveCallback.call(/* this: */ window, arg);
  };

  // Start on 'mousedown' and then check minDist on each 'mousemove' and on 'mouseup'

  targetElement.addEventListener('mousedown', function (e) {
    moveStart = { x: e.pageX, y: e.pageY, time: new Date().getTime() };
    return false;
  });

  targetElement.addEventListener('mousemove', function (e) {
    if (moveStart) {
      moveEnd = { x: e.pageX, y: e.pageY, time: new Date().getTime() };
      handleMove();
      return false;
    }
  });

  targetElement.addEventListener('mouseup', function (e) {
    if (moveStart) {
      if (moved) {
        moveEnd = { x: e.pageX, y: e.pageY, time: new Date().getTime() };
        handleMove();
        log.trace('mouse up move');
        handleStartOrStop('end');
      }
      moveStart = null;
      moveEnd = null;
      moved = false;
      return false;
    }
  });

  targetElement.addEventListener('mouseleave', function () {
    if (moveStart) {
      if (moved) {
        handleStartOrStop('end');
      }
      moveStart = null;
      moveEnd = null;
      moved = false;
      return false;
    }
  });

  // Start on 'touchstart' and then check minDist on each 'touchmove' and on 'touchend'

  targetElement.addEventListener('touchstart', function (e) {
    const touchObj = e.touches[0];
    if (touchObj) {
      moveStart = { x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime() };
    }
    return false;
  });

  targetElement.addEventListener('touchmove', function (e) {
    if (moveStart) {
      //e.preventDefault(); // Prevent scrolling when inside element
      const touchObj = e.touches[0];
      if (touchObj) {
        moveEnd = { x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime() };
        handleMove();
      }
      return false;
    }
  });

  targetElement.addEventListener('touchend', function (e) {
    if (moveStart) {
      if (moved) {
        const touchObj = e.changedTouches[0];
        if (touchObj) {
          moveEnd = { x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime() };
          handleMove();
          handleStartOrStop('end');
        }
      }
      moveStart = null;
      moveEnd = null;
      moved = false;
      return false;
    }
  });

  targetElement.addEventListener('touchleave', function () {
    if (moveStart) {
      if (moved) {
        handleStartOrStop('end');
      }
      moveStart = null;
      moveEnd = null;
      moved = false;
      return false;
    }
  });

  targetElement.addEventListener('touchcancel', function () {
    if (moveStart) {
      if (moved) {
        handleStartOrStop('end');
      }
      moveStart = null;
      moveEnd = null;
      moved = false;
      return false;
    }
  });
}

/**
 * Turn a string representation of HTML into an HTML element.
 * This relies on the string representation having a single root element.
 *
 * @param {string} htmlText The HTML text to be turned into an element tree.
 * @returns {Element|ChildNode|null} The first element of the element tree created from htmlText.
 */
export function htmlToElement(htmlText) {
  const template = document.createElement('template');
  template.innerHTML = htmlText.trim(); // Ensure the first child won't be whitespace
  return template.content.firstChild;
}

/**
 * Insert an HTML element directly after another HTML element.
 *
 * @param {Element} anchorHtmlEl The element to place a new element after. This element must have a parent.
 * @param {Element} newHtmlEl The new element to be added.
 * @returns {Element|null} The element that was inserted or null.
 */
export function insertAfter(anchorHtmlEl, newHtmlEl) {
  return anchorHtmlEl.insertAdjacentElement('afterend', newHtmlEl);
}
