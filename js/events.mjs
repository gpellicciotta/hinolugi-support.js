import * as log from './logs.mjs';

/**
 * Event emission, listener registration, and dispatching infrastructure.
 *
 * Provides the EventEmitter class and corresponding global convenience functions
 * for subscribing to and dispatching custom application events.
 *
 * @module events
 */

/**
 * Event emitter supporting typed listener registration and event dispatching.
 */
export class EventEmitter {
  /**
   * Create an EventEmitter instance.
   */
  constructor() {
    this.eventListeners = {};
  }

  /**
   * Register a callback for a custom event type.
   *
   * @param {string} eventType The event type or name to register for.
   * @param {Function} callback The callback function to invoke when the event occurs.
   * @throws {TypeError} If eventType is not a string or callback is not a function.
   * @returns {void}
   */
  addEventListener(eventType, callback) {
    if (typeof eventType !== 'string') {
      throw new TypeError('eventType for addEventListener(eventType, callback) must be a string');
    }
    if (typeof callback !== 'function') {
      throw new TypeError('callback for addEventListener(eventType, callback) must be a function');
    }
    if (!(eventType in this.eventListeners)) {
      this.eventListeners[eventType] = [];
    }
    this.eventListeners[eventType].push(callback);
  }

  /**
   * Unregister a callback for a custom event type.
   *
   * @param {string} eventType The event type or name to unregister from.
   * @param {Function} callback The previously registered callback function.
   * @throws {TypeError} If callback is not a function.
   * @returns {boolean} True when a callback was actually removed, false if not.
   */
  removeEventListener(eventType, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback for removeEventListener(eventType, callback) must be a function');
    }
    if (!(eventType in this.eventListeners)) {
      return false;
    }
    const typedSpecificCallbacks = this.eventListeners[eventType];
    for (let i = 0; i < typedSpecificCallbacks.length; i++) {
      if (typedSpecificCallbacks[i] === callback) {
        typedSpecificCallbacks.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Dispatch an event of a specific type to all registered callbacks.
   *
   * @param {{type: string, [key: string]: *}} event The event object containing minimally a 'type' property.
   * @param {Object|null} [thisObject=null] Context object to bind as `this` when invoking callbacks.
   * @returns {number} The number of callbacks invoked successfully.
   */
  dispatchEvent(event, thisObject = null) {
    if (!(event.type in this.eventListeners)) {
      return 0;
    }
    let calls = 0;
    const typedSpecificCallbacks = this.eventListeners[event.type].slice(); // Take a copy
    for (let i = 0; i < typedSpecificCallbacks.length; i++) {
      try {
        typedSpecificCallbacks[i].call(thisObject, event);
        calls += 1;
      } catch (err) {
        log.trace('Callback failed for event: %O: %O', event, err);
      }
    }
    return calls;
  }
}

const globalEventEmitter = new EventEmitter();

/**
 * Register a global callback for a custom event.
 *
 * @param {string} eventType The event type to register for.
 * @param {Function} callback The callback function to invoke when the event occurs.
 * @returns {void}
 */
export function addEventListener(eventType, callback) {
  return globalEventEmitter.addEventListener(eventType, callback);
}

/**
 * Unregister a global callback for a custom event.
 *
 * @param {string} eventType The event type to unregister from.
 * @param {Function} callback The previously registered callback function.
 * @returns {boolean} True when a callback was actually removed, false if not.
 */
export function removeEventListener(eventType, callback) {
  return globalEventEmitter.removeEventListener(eventType, callback);
}

/**
 * Dispatch an event of a specific type to all globally registered callbacks.
 *
 * @param {{type: string, [key: string]: *}} event The event object containing minimally a 'type' property.
 * @param {Object|null} [thisObject=null] Context object to bind as `this`.
 * @returns {number} The number of callbacks invoked.
 */
export function dispatchEvent(event, thisObject = null) {
  return globalEventEmitter.dispatchEvent(event, thisObject);
}
