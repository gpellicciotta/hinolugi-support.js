import * as log from './log.mjs';

// Utility for re-ordering the items in a container by dragging them around
//
// Requires a container with child elements that have a (descendent that has a) 'draggable'
// attribute.
// While dragging, the child element will get a CSS class of 'dragging'.
//

let dragState = {
  item: null,
  nextItem: null,
  dropped: false
}

function startDrag(elem) {
  dragState = {
    item: elem,
    nextItem: elem.nextElementSibling,
    dropped: false
  };
  // Because: https://stackoverflow.com/questions/19639969/html5-dragend-event-firing-immediately
  setTimeout(() => { dragState.item.classList.add("dragging"); }, 0);
  //log.trace("Starting drag of: ", dragState.item);
}

function moveDragOver(overElem) {
  if (overElem === dragState.item) {
    return;
  }
  const order = compareOrder(overElem, dragState.item);
  if (!order) { return; }
  if (order === -1) { // Move before:
    moveBefore(dragState.item.parentElement, dragState.item, overElem);
  }
  else { // Move after:
    moveAfter(dragState.item.parentElement, dragState.item, overElem);
  }
}

function endDrag(cancelled, dropCallBack) {
  if (dragState.item) {
    if (cancelled) { // Cancel: reset to old position
      moveBefore(dragState.item.parentElement, dragState.item, dragState.nextItem);
    }
    dragState.item.classList.remove("dragging");
  }
  if (dropCallBack) {
    dropCallBack(dragState.item);
  } 
  //log.trace("Stopping drag of:", dragState.item);
  dragState = {
    item: null,
    nextItem: null,
    dropped: false
  };
}

const registeredTargetElementListeners = new Map();
let nextTargetElementListenerId = 1;

function addRevertibleEventListener(targetElement, eventType, eventCallback, options) {
  const dataAttributeName = `data-reorder-listeners`;
  let targetElementListenersName = targetElement.getAttribute(dataAttributeName);
  if (!targetElementListenersName) { // First event listener for this target element:
    targetElementListenersName = `listener-${nextTargetElementListenerId++}`;
    registeredTargetElementListeners.set(targetElementListenersName, new Map());
    targetElement.setAttribute(dataAttributeName, targetElementListenersName);
  }
  let eventTypeListeners = registeredTargetElementListeners.get(targetElementListenersName);
  if (!eventTypeListeners) { // No actual event type listeners yet:
    eventTypeListeners = new Map();
    registeredTargetElementListeners.set(targetElementListenersName, eventTypeListeners);    
  }
  let eventTypeListener = eventTypeListeners.get(eventType);
  if (eventTypeListener) { // Unregister if previously registered:
    eventTypeListener.targetElement.removeEventListener(eventTypeListener.eventName, eventTypeListener.eventCallback);
    //log.trace(`Event listener '${targetElementListenersName}' for event type '${eventTypeListener.eventType}' has been removed for:`, eventTypeListener.targetElement);
  }
  eventTypeListener = {
    targetElementListenersName: targetElementListenersName,
    targetElement: targetElement,
    eventType: eventType,
    eventCallback: eventCallback
  };
  eventTypeListeners.set(eventType, eventTypeListener);  
  targetElement.addEventListener(eventTypeListener.eventType, eventTypeListener.eventCallback, options);
  //log.trace(`Event listener '${targetElementListenersName}' for event type '${eventTypeListener.eventType}' has been added for:`, eventTypeListener.targetElement);
  //log.trace(registeredTargetElementListeners);
}

/**
 * Make a container's child elements re-ordable by enabling dragging them into a new position.
 * 
 * @param containerEl The container that is expected to have child elements to be re-ordered by dragging.
 * @param dropCallBack Function to be invoked when an element is dropped. The argument will be the element being dropped.
 */
export function makeReordable(containerEl, dropCallBack) {
  // Container events:
  addRevertibleEventListener(containerEl, "drop", () => { // Record successful drop (to make distinction from 'cancel'):
    //log.trace(`Drag-drop on list: `, containerEl);
    dragState.dropped = true;
  }, { passive: true });
  addRevertibleEventListener(containerEl, "dragover", (ev) => { // Enable as drop-target:
    //log.trace(`Drag-over on list: `, containerEl);
    ev.preventDefault();
  });
  addRevertibleEventListener(containerEl, "dragend", (ev) => { // Finish operation: cancel or finalize
    ev.preventDefault();
    //log.trace(`Drag-end on list: `, containerEl);
    //log.trace("Drag-end due to: ", ev);
    endDrag(!dragState.dropped, dropCallBack);
  });
  // Child item events:
  let childEls = containerEl.children;
  for (let i = 0; i < childEls.length; i++) {
    let el = childEls.item(i);
    addItemDragEventListeners(el);
    addItemTouchEventListeners(el, dropCallBack); 
  }
}

function checkCurrentlyDraggable(elem) {
  let dragElem = elem.closest("[draggable]"); // Look only to element itself and up to parent elements

  if (!dragElem) {
    log.trace("Ignoring touch start on currently non-draggable ", elem.tagName);
    return false;
  }  

  //log.trace("display: ", window.getComputedStyle(dragElem).display);
  //log.trace("visibility: ", window.getComputedStyle(dragElem).visibility);
  return (window.getComputedStyle(dragElem).display !== 'none') &&
           (window.getComputedStyle(dragElem).visibility !== 'hidden');
}

function addItemDragEventListeners(elem) {
  addRevertibleEventListener(elem, "dragstart", (ev) => {
    if (!checkCurrentlyDraggable(ev.target)) {
      log.trace("Ignoring touch start on currently non-draggable ", ev.target);    
      return ;
    }
    ev.dataTransfer.effectAllowed = "move";    
    ev.dataTransfer.setDragImage(elem, -20, -20);
    //log.trace(`Drag-start on: `, elem);
    startDrag(elem);
  }, { passive: true });
  addRevertibleEventListener(elem, "dragover", (ev) => {
    ev.preventDefault();
    //log.trace(`Drag-over on: `, elem);
    moveDragOver(elem);
  });
  return elem;
}

function addItemTouchEventListeners(elem, dropCallBack) {
  let draggablePart = elem;
  if (!draggablePart) {
    log.error("No draggable part found in: ", elem);
    return ;
  }
  addRevertibleEventListener(draggablePart, "touchstart", (ev) => {
    if (!checkCurrentlyDraggable(ev.target)) {
      log.trace("Ignoring touch start on currently non-draggable ", ev.target);
      return ;
    }
    //log.trace('Touch-start on: ', elem);
    startDrag(elem);    
  }, { passive: true });
  addRevertibleEventListener(draggablePart, "touchmove", (ev) => {
    if (!draggablePart.classList.contains("dragging")) {
      return ;
    }
    let elemUnderCursor = document.elementFromPoint(ev.targetTouches[0].clientX, ev.targetTouches[0].clientY);
    if (!elemUnderCursor) {
      return ;
    }
    while (elemUnderCursor.parentElement && (elemUnderCursor.parentElement !== elem.parentElement)) {
      elemUnderCursor = elemUnderCursor.parentElement;
      if (elemUnderCursor === document.body) {
        return ;
      }
    }
    if (!elemUnderCursor) {
      return;
    }
    //log.trace('Touch-move on ', elemUnderCursor);
    moveDragOver(elemUnderCursor);
  }, { passive: true });
  addRevertibleEventListener(draggablePart, "touchcancel", (ev) => {
    if (!draggablePart.classList.contains("dragging")) {
      return;
    }
    ev.preventDefault();
    //log.trace(`Touch-cancel`);
    endDrag(true, dropCallBack);
  });
  addRevertibleEventListener(draggablePart, "touchend", (ev) => {
    if (!draggablePart.classList.contains("dragging")) {
      return ;
    }
    //ev.preventDefault(); Not preventing since then no 'click' event will get generated
    //log.trace(`Touch-end`);
    endDrag(false, dropCallBack);
  }, { passive: true });
}

// Utility methods:

function compareOrder(elem1, elem2) {
  if (elem1.parentElement !== elem2.parentElement) {
    return null;
  }
  if (elem1 === elem2) return 0;
  if (elem1.compareDocumentPosition(elem2) & Node.DOCUMENT_POSITION_FOLLOWING) {
    return -1;
  }
  return 1;
}

function moveBefore(parent, elToMove, elToMoveBefore) {
  if (elToMoveBefore) {
    parent.insertBefore(elToMove, elToMoveBefore);
  }
  else {
    parent.appendChild(elToMove);
  }
}

function moveAfter(parent, elToMove, elToMoveAfter) {
  let nextEl = elToMoveAfter.nextElementSibling;
  if (nextEl) {
    parent.insertBefore(elToMove, nextEl);
  }
  else {
    parent.appendChild(elToMove);
  }
}
