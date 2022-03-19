// DOM related utility functions. These often rely on the global 'document' and 'window' objects.

// ASPECT RATIO

/**
 *  Get the CSS pixel size of a canvas element.
 *
 *  @param canvasElement The dom <canvas> element to get the current CSS pixel size for.
 *
 *  @return A size object with properties "width" and "height".
 */
export function getCssPixelSize(canvasElement) {
  // The + prefix casts it to an integer; the slice method gets rid of "px"
  let css_height = +getComputedStyle(canvasElement).getPropertyValue("height").slice(0, -2);
  let css_width = +getComputedStyle(canvasElement).getPropertyValue("width").slice(0, -2);
  return { width: css_width, height: css_height };
}

/**
 *  Ensure the sizes for the provided (typically: canvas) element are re-set initially and after each resize event.
 *  In other words: the physical canvas size will track its CSS size changes.
 *
 *  Works by initially asking the desired CSS pixel size of the canvas and settings its
 *  physical 'width' and 'height' properties in accordance with the pixelScale, while also
 *  scaling the canvas context with the same pixelScale: this is needed to ensure a crisp display.
 *
 *  Subsequent window resize events will then re-trigger all of the above.
 *
 *  Relies on following global objects: window
 *
 *  @param canvasElement The dom <canvas> element to ensure a correct aspect ratio for.
 *                       This element will be adapted to always return a context that will be scaled with the pixelScale.
 *  @param determineCssSizeCallback A callback function that should return an object with 'width' and 'height' properties
 *                                  indicating the desired CSS pixel size of the canvas element that is passed as argument.
 *                                  This callback function will be called initially and after each window resize event.
 *                                  If undefined, the actual CSS pixel sizes as returned from getCssPixelSize will be used.
 *  @param pixelScale The ratio of the resolution in physical pixels to the resolution in CSS pixels for the current display device.
 *                    This value could also be interpreted as the ratio of pixel sizes: the size of one CSS pixel to the size of one physical pixel.
 *                    If undefined, window.devicePixelRatio will be used.
  */
export function ensureTrackingCanvasSize(canvasElement, determineCssSizeCallback, pixelScale) {
  determineCssSizeCallback = determineCssSizeCallback || getCssPixelSize;
  pixelScale = pixelScale || window.devicePixelRatio;

  // Ensure a correctly scaled context will be returned, always
  canvasElement.getContext = (function() {
    var origGetContext = canvasElement.getContext;
    return function (type) {
      let ctx = origGetContext.apply(canvasElement, [type]);
      ctx.scale(pixelScale, pixelScale);
      return ctx;
    };
  })();

  //console.log("Ensuring to trace canvas size for " + canvasElement);
  // Determine actual CSS canvas size:
  let css_size = determineCssSizeCallback(canvasElement);
  // Update physical canvas size:
  canvasElement.height = css_size.height * pixelScale;
  canvasElement.width = css_size.width * pixelScale;
  //console.log("Determined physical bounds to have width: " + canvasElement.width + " and height: " + canvasElement.height + ", since pixel-ratio: " + window.devicePixelRatio);

  // Now also ensure this aspect ratio is kept despite resize operations
  window.addEventListener('resize', moderatedEventCallback(function () {
    // Determine actual CSS canvas size:
    let css_size = determineCssSizeCallback(canvasElement);
    // Update physical canvas size:
    canvasElement.height = css_size.height * pixelScale;
    canvasElement.width = css_size.width * pixelScale;
    //console.log("Determined physical bounds to have width: " + canvasElement.width + " and height: " + canvasElement.height + ", since pixel-ratio: " + window.devicePixelRatio);
  }));
}

// TIMING RELATED

/**
 *  Execute a callback as result of an event, but ensure
 *  that, if the event triggers in quick succession, the callback
 *  is only called every ms.
 *
 *  @param callback The callback function to be called.
 *  @param afterMs The minimum number of milliseconds to expire before calling the callback.
 *                 Any intermediate invocations due to the event triggering, will not lead to callback being invoked.
 */
export function moderatedEventCallback(callback, ms) {
  if (typeof callback !== "function") {
    throw new TypeError("callback for moderatedEventCallback(callback, afterMs) must be a function");
  }
  ms = ms || 100;
  let timer;
  return function(event) {
    if (timer) {  // If already and still set: clear
      clearTimeout(timer);
    }
    // Set to run after ms
    timer = setTimeout(callback, ms, event)
  };
}

// DOM READY

// Credits: https://stackoverflow.com/questions/9899372/pure-javascript-equivalent-of-jquerys-ready-how-to-call-a-function-when-t

let domReadyHasFired = false;
let domReadyCallbacks = [];
let globalDomReadyEventHandlerInstalled = false;

/**
 *  Register a callback function to be invoked when the HTML DOM is ready.
 *  Multiple callbacks can get registered.
 *
 *  If the DOM is already ready when this function is invoked, the callback will be
 *  called immediately, yet asynchronously.
 *
 *  Relies on following global objects: document, window
 *
 *  @param callback The callback function to be invoked.
 */
export function onDomReady(callback) {
  if (typeof callback !== "function") {
    throw new TypeError("callback for onDomReady(callback) must be a function");
  }
  if (domReadyHasFired) { // If ready has already fired, then just schedule the callback to fire asynchronously, but right away
    setTimeout(function() { callback(); }, 1);
    return;
  }
  // Register callback
  domReadyCallbacks.push(callback);
  // Check status of DOM:
  //   if document already ready to go, schedule the ready function to run
  if (document.readyState === "complete") {
    setTimeout(fireDomReady, 1);
  }
  else if (!globalDomReadyEventHandlerInstalled) {
    // otherwise if we don't have event handlers installed, install them
    if (document.addEventListener) {
      // Use window load event (since DOMContentLoaded doesn't guarantee that all CSS or other resources have been fully loaded)
      window.addEventListener("load", fireDomReady, false);
    } else {
      // must be IE
      document.attachEvent("onreadystatechange", onReadyStateChange);
      window.attachEvent("onload", fireDomReady);
    }
    globalDomReadyEventHandlerInstalled = true;
  }
}

/**
 *  Invoked from window or document event.
 */
function onReadyStateChange() {
  if (document.readyState === "complete") {
    fireDomReady();
  }
}

/**
 *  Invoked when DOM is determined to be ready: will invoke all registered callbacks.
 */
function fireDomReady() {
  if (domReadyHasFired) { // Don't call more than once
    return ;
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

let animFrameCallbacks = [];
let globalAnimFrameEventHandlerInstalled = false;

/**
 *  Cancel an animation function that was previously registered via onAnimFrame.
 *
 *  @param id The function ID returned from onAnimFrame.
 */
export function cancelAnimFrame(id) {
  if ((id >= 0) && (id < animFrameCallbacks.length)) {
    animFrameCallbacks[id] = null;
  }
}

/**
 *  Request a callback to be called once whenever the browser is next ready to render a frame.
 *
 *  Similar to <c>window.requestAnimationFrame</c> but ensures to emulate
 *  this function if it doesn't exist yet (as can be case in older browsers).
 *
 *  @param callback The function to invoke whenever the browser is ready.
 */
export function requestAnimationFrame(callback) {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function () {
      return window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function (cb) {
            return window.setTimeout(cb, 1000 / 60);
          };
    })();
  }
  return window.requestAnimationFrame(callback);
}

/**
 *  Call an animation function a number of times per second.
 *
 *  @param callback The function to invoke repeatedly.
 *  @param fps The number of times per second the callback should get invoked.
 *
 *  @return An ID for the callback that can be used in cancelAnimFrame.
 */
export function onAnimFrame(callback, fps) {
  if (typeof callback !== "function") {
    throw new TypeError("callback for onAnimFrame(callback, fps) must be a function");
  }
  // Register callback
  let millisBetweenFrames = 1000 / (fps || 60);
  let idx = -1 + animFrameCallbacks.push({
    fn: callback,
    fps: fps,
    millisBetweenFrames: millisBetweenFrames,
    lastFireTime: 0
  });
  if (!globalAnimFrameEventHandlerInstalled) {
    // Ensure the requestAnimFrame function is available on all browsers
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (function () {
        return window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame ||
               function (callback) {
                 window.setTimeout(callback, 1000 / 60);
               };
        })();
    }
    globalAnimFrameEventHandlerInstalled = true;
    // Ensure the animation starts rolling
    window.requestAnimationFrame(fireAnimFrame);
  }
  return idx;
}

/**
 *  Invoked when another animation frame should be prepared.
 */
function fireAnimFrame(fireTime) {
  for (let i = 0; i < animFrameCallbacks.length; i++) {
    let cb = animFrameCallbacks[i];
    if (cb && (fireTime >= cb.lastFireTime + cb.millisBetweenFrames)) {
      window.setTimeout(function() { // Asynchronously so all callbacks can work in parallel
        cb.lastFireTime = fireTime;
        cb.fn.call(window);
      }, 1);
    }
  }
  window.requestAnimationFrame(fireAnimFrame); // Keep rolling
}

// PLAY

/**
 *  Run a setup function once and then, fps times per second,
 *  invoke the animate callback, with as argument whatever setup returned.
 *
 *  @param setup One-time setup function. Can return an argument for animate.
 *  @param animate The animate function that will be invoked repeatedly.
 *                 Will have the 'window' object as 'this' and the return
 *                 value of setup as argument.
 *  @param fps Frames-per-second. The number of time per second, animate should be invoked.
 *             Defaults to 60 if not specified.
 */
export function play(setup, animate, fps) {
  if (typeof setup !== "function") {
    throw new TypeError("setup for play(setup, animate, fps) must be a function");
  }
  if (typeof animate !== "function") {
    throw new TypeError("animate for play(setup, animate, fps) must be a function");
  }
  onDomReady(function() {
    let ctx = setup.call(window);
    onAnimFrame(function() {
      animate.call(window, ctx);
    }, fps);
  });
}


// SWIPE GESTURE

/**
 *  Register a callback function to be invoked when a double-tap has occurred
 *  on the target element.
 *
 *  Relies on following global objects: document, window
 *
 *  @param targetElement The element that is to be monitored for swipe gestures.
 *  @param dblTapCallback The callback function to be invoked whenever the double-tap has happened.
 */
export function onDoubleTap(targetElement, dblTapCallback) {
  if (typeof dblTapCallback !== "function") {
    throw new TypeError("callback for onDoubleTap(dblTapCallback) must be a function");
  }
  let tapTimer = null;
  targetElement.addEventListener('touchstart', function (e) { // Double-tap
    //e.preventDefault(); // Don't zoom
    if (tapTimer == null) { // No tap yet
      tapTimer = setTimeout(function () {
        tapTimer = null;
      }, 500); // Set timer, but erase after .5s
    } else { // Already one tap (and not auto-erased so within .5s of first tap)
      clearTimeout(tapTimer);
      tapTimer = null;
      dblTapCallback.call(/* this: */ window);
    }
    return false;
  });
}

/**
 *  Register a callback function to be invoked when a swipe has occurred on the target element.
 *
 *  Relies on following global objects: document, window
 *
 *  @param targetElement The element that is to be monitored for swipe gestures.
 *  @param swipeCallback The callback function to be invoked whenever a swipe has finished.
 *                       Will get an object as argument with properties:
 *                        'dir': the swipe direction: 'up', 'down', 'left' or 'right'.
 *                        'dist': the absolute distance, in pixels, in the swipe direction
 *  @param dblTapCallback The callback function to be invoked whenever a double-tap has been detected.
 */
export function onSwipe(targetElement, swipeCallback, dblTapCallback = null) {
  if (typeof swipeCallback !== "function") {
    throw new TypeError("swipeCallback for onSwipe(targetElement, swipeCallback, dblTapCallback) must be a function");
  }

  const MAX_SWIPE_TIME = 700; // ms
  const MIN_DIST = 25; // px
  const MAX_PERPENDICULAR_DIST = 25; // px
  let touchStart = null;
  let touchEnd = null;

  const MAX_DBLTAP_TIME = 500; // ms
  let tapTimer = null;

  let handleGesture = function() {
    // Check gesture didn't take too long
    let elapsed = touchEnd.time - touchStart.time;
    if (elapsed > MAX_SWIPE_TIME) {
      touchStart = null;
      touchEnd = null;
      return ;
    }
    // Check x and y distance
    let swipeDir = null;
    let distX = touchEnd.x - touchStart.x;
    let distY = touchEnd.y - touchStart.y;
    let dist;
    if ((Math.abs(distX) > MIN_DIST) && (Math.abs(distY) < MAX_PERPENDICULAR_DIST)) { // horizontal gesture
      swipeDir = (distX < 0) ? 'left' : 'right'; // if dist traveled is negative, it indicates left swipe
      dist = Math.abs(distX);
    }
    else if ((Math.abs(distY) > MIN_DIST) && (Math.abs(distX) < MAX_PERPENDICULAR_DIST)) { // vertical gesture
      swipeDir = (distY < 0) ? 'up' : 'down'; // if dist traveled is negative, it indicates up swipe
      dist = Math.abs(distY);
    }
    // Invoke callback
    if (dist) {
      let arg = {
        dir: swipeDir,
        dist: dist,
        start: touchStart,
        end: touchEnd
      };
      swipeCallback.call(/* this: */ window, arg);
    }
    // Reset
    touchStart = null;
    touchEnd = null;
  };

  targetElement.addEventListener('touchstart', function(e) {
    if (tapTimer == null) { // No tap yet
      tapTimer = setTimeout(function () { tapTimer = null; }, MAX_DBLTAP_TIME); // Set timer, but erase after ...
      // But also treat as possible start of swipe gesture:
      let touchObj = e.touches[0];
      touchStart = { x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime() };
    } else { // Already one tap (and not auto-erased so within .5s of first tap)
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

  targetElement.addEventListener('mousedown', function(e) {
    touchStart = { x: e.pageX, y: e.pageY, time: new Date().getTime() };
    return false;
  });

  targetElement.addEventListener('touchend', function(e) {
    if (touchStart) {
      let touchObj = e.changedTouches[0];
      if (touchObj) {
        touchEnd = {x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime()};
      }
      handleGesture();
      return false;
    }
  });

  targetElement.addEventListener('mouseup', function(e) {
    if (touchStart) {
      touchEnd = { x: e.pageX, y: e.pageY, time: new Date().getTime()};
      handleGesture();
      return false;
    }
  });

  targetElement.addEventListener('touchleave', function(e) {
    touchStart = null;
    touchEnd = null;
    return false;
  });

  targetElement.addEventListener('touchmove', function(e){
    //e.preventDefault(); // Prevent scrolling when inside element
    let touchObj = e.touches[0];
    if (touchObj) {
      touchEnd = {x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime()};
    }
    return false;
  });

  targetElement.addEventListener('touchcancel', function(e) {
    touchStart = null;
    touchEnd = null;
    return false;
  });

  targetElement.addEventListener('mouseleave', function(e) {
    touchStart = null;
    touchEnd = null;
    return false;
  });
}

/**
 *  Register a callback function to be invoked when a swipe/move of a min. distance has occurred on the target element.
 *
 *  Relies on following global objects: document, window
 *
 *  Will start tracking move distance on mouse down or touchstart, and then re-calculate 'move distance'
 *  on subsequent mousemove or touchmove events. Whenever the travelled distance is larger than minDist,
 *  the callback be invoked. If the distance travelled is smaller than minDist on mouseup or touchend, no
 *  callback will be invoked.
 *
 *  @param targetElement The element that is to be monitored for swipe gestures.
 *  @param minDist The minimum distance move for which the callback should be called.
 *  @param moveCallback The callback function to be invoked whenever the distance moved has become larger than minDist.
 *                       Will get an object as argument with properties:
 *                        'dir': the move direction: 'up', 'down', 'left' or 'right'. Or 'start' or 'stop' when just starting/stopping.
 *                        'dist': the absolute distance, in pixels, in the move direction. Will be 'null' when 'dir' is 'start' or 'stop'.
 */
export function onMove(targetElement, minDist, moveCallback) {
  const MIN_DIST = 25; // px

  if (typeof moveCallback !== "function") {
    throw new TypeError("moveCallback for onMove(targetElement, minDist, moveCallback) must be a function");
  }
  minDist = minDist || MIN_DIST;

  let moveStart = null;
  let moved = false;
  let moveEnd = null;

  let handleMove = function() {
    // Check x and y distance
    let swipeDir = null;
    let horDist = Math.abs(moveEnd.x - moveStart.x);
    let vertDist = Math.abs(moveEnd.y - moveStart.y);
    let dist = null;
    let dir = null;
    if (horDist > vertDist) { // Horizontal move dominates
      if (horDist >= minDist) {
        dist = horDist;
        if (moveEnd.x > moveStart.x) {
          dir = 'right';
        }
        else {
          dir = 'left';
        }
      }
    }
    else { // Vertical move dominates
      if (vertDist >= minDist) {
        dist = vertDist;
        if (moveEnd.y > moveStart.y) {
          dir = 'down';
        }
        else {
          dir = 'up';
        }
      }
    }
    // Invoke callback
    if (dist) {
      if (!moved) { // First real move, so also invoke callback with 'start'
        handleStartOrStop('start');
      }
      // Invoke callback
      let arg = {
        dir: dir,
        dist: dist,
        start: moveStart,
        end: moveEnd
      };
      // Prepare for next move:
      moveStart = moveEnd;
      moveEnd = null;
      moved = true;
      moveCallback.call(/* this: */ window, arg);
    }
  };

  let handleStartOrStop = function(startOrStop) {
    // Invoke callback
    let arg = {
      dir: startOrStop,
      dist: null,
      start: startOrStop === 'start' ? moveStart : moveEnd,
      end: startOrStop === 'start' ? moveStart : moveEnd
    };
    moveCallback.call(/* this: */ window, arg);
  };

  // Start on 'mousedown' and then check minDist on each 'mousemove' and on 'mouseup'

  targetElement.addEventListener('mousedown', function(e) {
    moveStart = { x: e.pageX, y: e.pageY, time: new Date().getTime() };
    return false;
  });

  targetElement.addEventListener('mousemove', function(e){
    if (moveStart) {
      moveEnd = { x: e.pageX, y: e.pageY, time: new Date().getTime() };
      handleMove();
      return false;
    }
  });

  targetElement.addEventListener('mouseup', function(e) {
    if (moveStart) {
      if (moved) {
        moveEnd = {x: e.pageX, y: e.pageY, time: new Date().getTime()};
        handleMove();
        console.log("mouse up move");
        handleStartOrStop('end');
      }
      moveStart = null;
      moveEnd = null;
      moved = false;
      return false;
    }
  });

  targetElement.addEventListener('mouseleave', function(e) {
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

  targetElement.addEventListener('touchstart', function(e) {
    let touchObj = e.touches[0];
    if (touchObj) {
      moveStart = {x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime()};
    }
    return false;
  });

  targetElement.addEventListener('touchmove', function(e){
    if (moveStart) {
      //e.preventDefault(); // Prevent scrolling when inside element
      let touchObj = e.touches[0];
      if (touchObj) {
        moveEnd = {x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime()};
        handleMove();
      }
      return false;
    }
  });

  targetElement.addEventListener('touchend', function(e) {
    if (moveStart) {
      if (moved) {
        let touchObj = e.changedTouches[0];
        if (touchObj) {
          moveEnd = {x: touchObj.pageX, y: touchObj.pageY, time: new Date().getTime()};
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

  targetElement.addEventListener('touchleave', function(e) {
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

  targetElement.addEventListener('touchcancel', function(e) {
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
