import * as utils from './utils.mjs';

// General logging functions that don't rely on any global objects or the DOM

export const ERROR_LEVEL = 1000;
export const WARNING_LEVEL = 900;
export const INFO_LEVEL = 800;
export const TRACE_LEVEL = 300;

const logHandlers = [];

/**
 *  Register a log event handler.
 *
 *  @param callback The function to invoke when a log event occurs.
 */
export function addLogHandler(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError("callback for addLogEventListener(callback) must be a function");
  }
  logHandlers.push(callback);
}

/**
 *  Unregister a log event handler.
 *
 *  @param callback The previously registered function to now unregister.
 *
 *  @return True when a callback was actually removed, false if not.
 */
export function removeLogHandler(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError("callback for removeLogHandler(callback) must be a function");
    }
    for (let i = 0; i < logHandlers.length; i++) {
      if (logHandlers[i] === callback) {
        logHandlers.splice(i, 1);
        return true;
      }
    }
    return false;
}

/**
 *  A default log event handler that will emit all log events to the console.
 *  Will be used whenever there are no other registered handlers.
 * 
 *  @param logEvent The log event to be handled.
 */
export function defaultHandler(logEvent) {
  let logPrefix = '';
  if (logEvent.name) {
    logPrefix = `${utils.formatDateTime(logEvent.time, 'T', true)}Z <${logEvent.name}>: `;
  }
  let logFn = console.log;
  if (logEvent.level >= ERROR_LEVEL) {
    logPrefix = `${logPrefix}[error] `;
    logFn = console.error;
  }
  else if (logEvent.level >= WARNING_LEVEL) {
    logPrefix = `${logPrefix}[warning] `;
    logFn = console.warn;
  }
  else if (logEvent.level <= TRACE_LEVEL) {
    logPrefix = `${logPrefix}[trace] `;
    logFn = console.debug;
  }
  if (!logEvent.args) {
    logEvent.args = [];
  }
  logFn(logPrefix + logEvent.message, ...logEvent.args);
}

export function levelToLevelName(level) {
  let levelName = 'info';
  if (level >= ERROR_LEVEL) {
    levelName = 'error';
  }
  else if (level >= WARNING_LEVEL) {
    levelName = 'warning';
  }
  else if (level <= TRACE_LEVEL) {
    levelName = 'trace';
  }
  return levelName;
}

export function levelNameToLevel(name) {
  switch (name.toLowerCase().trim()) {
    case 'error':   return ERROR_LEVEL;
    case 'warning': return WARNING_LEVEL;
    case 'info':    return INFO_LEVEL;
    case 'trace':   return TRACE_LEVEL;
  }
  return 0;
}

let logEventId = 0;

/**
 *  Dispatch a log even to all registered handlers, or - if none are registered - the default handler.
 */
function fireLogEvent(logEvent) {
  let calls = 0;
  let callbacks = logHandlers.slice(); // Take a copy
  if (callbacks.length === 0) {
    defaultHandler(logEvent);
  }
  else {
    for (let i = 0; i < callbacks.length; i++) {
      try {
        callbacks[i].call(null, logEvent);
        calls += 1;
      }
      catch (err) {
        const errLogEvent = {
          id: ++logEventId,
          time: new Date(),
          name: logEvent.name,
          level: ERROR_LEVEL,
          message: 'Log event handler failed for event %O: %O',
          args: [logEvent, err]
        };
        defaultHandler(err);        
      }
    }
  }
  return calls;
}

export class Logger {
  constructor(name, minLevel) {
    this.name = name || '';
    this.minLevel = minLevel;
  }

  config(props) {
    if (!props) {
      return {
        'name': this.name,
        'min-level': this.minLevel
      };
    }
    if (props.hasOwnProperty('name')) {
      this.name = props['name'];
    }
    if (props.hasOwnProperty('min-level')) {
      if (props['min-level']) {
        this.minLevel = +props['min-level'];
      }
      else {
        this.minLevel = null;
      }
    }
    else if (props.hasOwnProperty('minLevel')) {
      if (props['minLevel']) {
        this.minLevel = +props['minLevel'];
      }
      else {
        this.minLevel = null;
      }      
    }    
  }

  error(logMsgFormat, ...logMsgArgs) {
    this.log(ERROR_LEVEL, logMsgFormat, ...logMsgArgs);
  }

  warn(logMsgFormat, ...logMsgArgs) {
    this.log(WARNING_LEVEL, logMsgFormat, ...logMsgArgs);
  }

  info(logMsgFormat, ...logMsgArgs) {
    this.log(INFO_LEVEL, logMsgFormat, ...logMsgArgs);
  }

  trace(logMsgFormat, ...logMsgArgs) {
    this.log(TRACE_LEVEL, logMsgFormat, ...logMsgArgs);
  }

  log(logLevel, logMsgFormat, ...logMsgArgs) {
    const actualMinLevel = this.minLevel || globalLogger.minLevel || INFO_LEVEL
    if (actualMinLevel > logLevel) {
      return;
    }
    let logEvent = {
      id: ++logEventId,
      time: new Date(),
      name: this.name,
      level: logLevel, 
      message: logMsgFormat,
      args: logMsgArgs
    };
    fireLogEvent(logEvent);
  }
}

let globalLogger = new Logger('', INFO_LEVEL);

export function config(props) {
  return globalLogger.config(props);
}

export function error(logMsgFormat, ...logMsgArgs) {
  globalLogger.log(ERROR_LEVEL, logMsgFormat, ...logMsgArgs);
}

export function warn(logMsgFormat, ...logMsgArgs) {
  globalLogger.log(WARNING_LEVEL, logMsgFormat, ...logMsgArgs);
}

export function info(logMsgFormat, ...logMsgArgs) {
  globalLogger.log(INFO_LEVEL, logMsgFormat, ...logMsgArgs);
}

export function trace(logMsgFormat, ...logMsgArgs) {
  globalLogger.log(TRACE_LEVEL, logMsgFormat, ...logMsgArgs);
}

export function log(logLevel, logMsgFormat, ...logMsgArgs) {
  globalLogger.log(logLevel, logMsgFormat, ...logMsgArgs);
}
