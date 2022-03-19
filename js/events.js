// General event registration and firing

let eventListeners = {};

/**
 *  Register a callback for a custom event.
 *
 *  @param eventType The event to register for.
 *  @param callback The function to invoke when the event occurs.
 */
export function addEventListener(eventType, callback) {
  if (typeof callback !== "function") {
    throw new TypeError("callback for addEventListener(eventType, callback) must be a function");
  }
  if (!(eventType in eventListeners)) {
    eventListeners[eventType] = [];
  }
  eventListeners[eventType].push(callback);
}

/**
 *  Unregister a callback for a custom event.
 *
 *  @param eventType The event to unregister for.
 *  @param callback The previously registered function to now unregister.
 *
 *  @return True when a callback was actually removed, false if not.
 */
export function removeEventListener(eventType, callback) {
  if (typeof callback !== "function") {
    throw new TypeError("callback for removeEventListener(eventType, callback) must be a function");
  }
  if (!(eventType in eventListeners)) {
    return false;
  }
  let typedSpecificCallbacks = listeners[eventType];
  for (let i = 0; i < typedSpecificCallbacks.length; i++) {
    if (typedSpecificCallbacks[i] === callback){
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
 *  @return The number of callbacks invoked.
 */
export function dispatchEvent(event, thisObject = null) {
  if (!(event.type in eventListeners)) {
    return 0;
  }
  let calls = 0;
  let typedSpecificCallbacks = eventListeners[event.type].slice(); // Take a copy
  for (let i = 0; i < typedSpecificCallbacks.length; i++) {
    typedSpecificCallbacks[i].call(thisObject, event);
    calls += 1;
  }
  return calls;
}
