// General logging functions that don't rely on any global objects or the DOM

export const ERROR_LEVEL = 1000;
export const WARNING_LEVEL = 900;
export const INFO_LEVEL = 800;
export const TRACE_LEVEL = 300;

let logLevel = INFO_LEVEL;

export function setLevel(l) {
  logLevel = l;
}

export function error() {
  if (logLevel > ERROR_LEVEL) {
    return;
  }
  log(...arguments);
}

export function warn() {
  if (logLevel > WARNING_LEVEL) {
    return;
  }
  log(...arguments);
}

export function info() {
  if (logLevel > INFO_LEVEL) {
    return;
  }
  log(...arguments);
}

export function trace() {
  if (logLevel > TRACE_LEVEL) {
    return;
  }
  log(...arguments);
}

export function log() {
  let o = arguments[0];
  if (o['log']) {
    let restArgs = Array.prototype.slice.call(arguments, 1);
    o.log(...restArgs);
  }
  else {
    console.log(...arguments);
  }
}
