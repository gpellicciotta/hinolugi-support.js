import * as log from './log.mjs';

// General event registration and firing

/**
 *  A class with objects capable of keeping track of and firing typed events.
 */
export class EventEmitter 
{
  constructor() {
    this.eventListeners = {};
  }

  /**
   *  Register a callback for a custom event.
   *
   *  @param eventType The event to register for.
   *  @param callback The function to invoke when the event occurs.
   */
  addEventListener(eventType, callback) {
    if (typeof eventType !== 'string') {
      throw new TypeError("eventType for addEventListener(eventType, callback) must be a string");
    }
    if (typeof callback !== 'function') {
      throw new TypeError("callback for addEventListener(eventType, callback) must be a function");
    }
    if (!(eventType in this.eventListeners)) {
      this.eventListeners[eventType] = [];
    }
    this.eventListeners[eventType].push(callback);
  }

  /**
   *  Unregister a callback for a custom event.
   *
   *  @param eventType The event to unregister for.
   *  @param callback The previously registered function to now unregister.
   *
   *  @return True when a callback was actually removed, false if not.
   */
  removeEventListener(eventType, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError("callback for removeEventListener(eventType, callback) must be a function");
    }
    if (!(eventType in this.eventListeners)) {
      return false;
    }
    let typedSpecificCallbacks = this.eventListeners[eventType];
    for (let i = 0; i < typedSpecificCallbacks.length; i++) {
      if (typedSpecificCallbacks[i] === callback) {
        typedSpecificCallbacks.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  /**
   *  Dispatch an event of a specific type to all registered callbacks.
   *
   *  @param event The event to dispatch. Must minimally have a 'type' property.
   *  @param thisObject The object to call the callback on.
   *
   *  @return The number of callbacks invoked successfully.
   */
  dispatchEvent(event, thisObject = null) {
    if (!(event.type in this.eventListeners)) {
      return 0;
    }
    let calls = 0;
    let typedSpecificCallbacks = this.eventListeners[event.type].slice(); // Take a copy
    for (let i = 0; i < typedSpecificCallbacks.length; i++) {
      try {
        typedSpecificCallbacks[i].call(thisObject, event);
        calls += 1;
      }
      catch (err) {
        log.trace("Callback failed for event: %O: %O", event, err);
      }
    }
    return calls;
  }
}

const globalEventEmitter = new EventEmitter();

/**
 *  Register a global callback for a custom event.
 *
 *  @param eventType The event to register for.
 *  @param callback The function to invoke when the event occurs.
 */
export function addEventListener(eventType, callback) {
  return globalEventEmitter.addEventListener(eventType, callback);
}

/**
 *  Unregister a global callback for a custom event.
 *
 *  @param eventType The event to unregister for.
 *  @param callback The previously registered function to now unregister.
 *
 *  @return True when a callback was actually removed, false if not.
 */
export function removeEventListener(eventType, callback) {
  return globalEventEmitter.removeEventListener(eventType, callback);
}

/**
 *  Dispatch an event of a specific type to all globally registered callbacks.
 *
 *  @param event The event to dispatch. Must minimally have a 'type' property.
 *  @param thisObject The object to call the callback on.
 *
 *  @return The number of callbacks invoked.
 */
export function dispatchEvent(event, thisObject = null) {
  return globalEventEmitter.dispatchEvent(event, thisObject);
}
