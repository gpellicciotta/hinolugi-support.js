/**
 * Unified logging module providing browser-safe event logging (Logger)
 * and guideline-compliant CLI console/file logging (CliLogger, LogLevel).
 */
import { formatDateTime } from './dates.mjs';

function getFs() {
  if (typeof process !== 'undefined' && typeof process.getBuiltinModule === 'function') {
    return process.getBuiltinModule('node:fs');
  }
  return null;
}

function getPath() {
  if (typeof process !== 'undefined' && typeof process.getBuiltinModule === 'function') {
    return process.getBuiltinModule('node:path');
  }
  return null;
}

// General, DOM-independent, browser-safe event logging functions. This is a separate, unrelated
// module from the Node-only `cli-log.mjs`, which targets simple CLI tools rather than event handlers.

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
    throw new TypeError('callback for addLogEventListener(callback) must be a function');
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
    throw new TypeError('callback for removeLogHandler(callback) must be a function');
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
    logPrefix = `${formatDateTime(logEvent.time, 'T', true)}Z <${logEvent.name}>: `;
  }
  let logFn = console.log;
  if (logEvent.level >= ERROR_LEVEL) {
    logPrefix = `${logPrefix}[error] `;
    logFn = console.error;
  } else if (logEvent.level >= WARNING_LEVEL) {
    logPrefix = `${logPrefix}[warning] `;
    logFn = console.warn;
  } else if (logEvent.level <= TRACE_LEVEL) {
    logPrefix = `${logPrefix}[trace] `;
    logFn = console.debug;
  }
  if (!logEvent.args) {
    logEvent.args = [];
  }
  logFn(logPrefix + logEvent.message, ...logEvent.args);
}

/** @return The lowercase level name ('error', 'warning', 'trace', or 'info' as the default) for a numeric `level`. */
export function levelToLevelName(level) {
  let levelName = 'info';
  if (level >= ERROR_LEVEL) {
    levelName = 'error';
  } else if (level >= WARNING_LEVEL) {
    levelName = 'warning';
  } else if (level <= TRACE_LEVEL) {
    levelName = 'trace';
  }
  return levelName;
}

/** @return The numeric level for a level `name` ('error', 'warning', 'info', or 'trace'), or 0 if unrecognized. */
export function levelNameToLevel(name) {
  switch (name.toLowerCase().trim()) {
    case 'error':
      return ERROR_LEVEL;
    case 'warning':
      return WARNING_LEVEL;
    case 'info':
      return INFO_LEVEL;
    case 'trace':
      return TRACE_LEVEL;
  }
  return 0;
}

let logEventId = 0;

/**
 *  Dispatch a log even to all registered handlers, or - if none are registered - the default handler.
 */
function fireLogEvent(logEvent) {
  let calls = 0;
  const callbacks = logHandlers.slice(); // Take a copy
  if (callbacks.length === 0) {
    defaultHandler(logEvent);
  } else {
    for (let i = 0; i < callbacks.length; i++) {
      try {
        callbacks[i].call(null, logEvent);
        calls += 1;
      } catch (err) {
        const errLogEvent = {
          id: ++logEventId,
          time: new Date(),
          name: logEvent.name,
          level: ERROR_LEVEL,
          message: 'Log event handler failed for event %O: %O',
          args: [logEvent, err],
        };
        defaultHandler(errLogEvent);
      }
    }
  }
  return calls;
}

/** A named logger that dispatches log events to registered handlers (or `defaultHandler` if none). */
export class Logger {
  constructor(name, minLevel) {
    this.name = name || '';
    this.minLevel = minLevel;
  }

  /**
   *  Get or update this logger's configuration.
   *
   *  @param props If omitted, returns the current config. Otherwise, an object optionally
   *               containing 'name' and 'min-level' (or 'minLevel') to update.
   *  @return The current `{ name, 'min-level' }` config when called without arguments.
   */
  config(props) {
    if (!props) {
      return {
        name: this.name,
        'min-level': this.minLevel,
      };
    }
    if (props.hasOwnProperty('name')) {
      this.name = props['name'];
    }
    if (props.hasOwnProperty('min-level')) {
      if (props['min-level']) {
        this.minLevel = +props['min-level'];
      } else {
        this.minLevel = null;
      }
    } else if (props.hasOwnProperty('minLevel')) {
      if (props['minLevel']) {
        this.minLevel = +props['minLevel'];
      } else {
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

  /** Log a message at `logLevel`, if at or above this logger's (or the global logger's) minimum level. */
  log(logLevel, logMsgFormat, ...logMsgArgs) {
    const actualMinLevel = this.minLevel || globalLogger.minLevel || INFO_LEVEL;
    if (actualMinLevel > logLevel) {
      return;
    }
    const logEvent = {
      id: ++logEventId,
      time: new Date(),
      name: this.name,
      level: logLevel,
      message: logMsgFormat,
      args: logMsgArgs,
    };
    fireLogEvent(logEvent);
  }
}

const globalLogger = new Logger('', INFO_LEVEL);

// Module-level convenience functions delegating to a shared, unnamed global Logger instance.

/** Get or update the global logger's configuration. See `Logger.config`. */
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

/** Log a message at `logLevel` via the global logger. See `Logger.log`. */
export function log(logLevel, logMsgFormat, ...logMsgArgs) {
  globalLogger.log(logLevel, logMsgFormat, ...logMsgArgs);
}

// CLI logging utilities compliant with dev-guidelines.md's Logging section.
//
// Method and level naming is kept API-similar to `com.hinolugi.support.logging` (`LogLevel`, `Log`) in
// hinolugi-support.java and to `hinolugi_support.logging` (`LogLevel`, `CliLogger`) in
// hinolugi-support.python; the SPI-backed multi-backend/span/context-data machinery of the Java package is
// not mirrored here, since this module targets simple CLI tools rather than long-running services (same
// scoping decision as the Python sibling). This is a Node-only module (uses `node:fs`); the DOM-independent,
// browser-safe event logger in `log.mjs` is a separate, unrelated module.

/** Named severity levels for `CliLogger`, ordered from most (NONE) to least (ALL) restrictive. */
export class LogLevel {
  static NONE = Infinity;
  static ERROR = 1000;
  static WARNING = 900;
  static INFO = 800;
  static DEBUG = 500;
  static ALL = -Infinity;

  static #NAMES = [
    [LogLevel.NONE, 'NONE'],
    [LogLevel.ERROR, 'ERROR'],
    [LogLevel.WARNING, 'WARNING'],
    [LogLevel.INFO, 'INFO'],
    [LogLevel.DEBUG, 'DEBUG'],
    [LogLevel.ALL, 'ALL'],
  ];

  /** Format a level value as its predefined name, or its number if it has none. */
  static toString(level) {
    for (const [value, name] of LogLevel.#NAMES) {
      if (level === value) {
        return name;
      }
    }
    return '' + level;
  }

  /** Parse a level name (case-insensitive) or numeric string into a level value. */
  static parse(levelStr) {
    const cleaned = levelStr.trim().toUpperCase();
    for (const [value, name] of LogLevel.#NAMES) {
      if (name === cleaned) {
        return value;
      }
    }
    const parsed = Number(cleaned);
    if (Number.isNaN(parsed)) {
      throw new Error(`Value '${levelStr}' cannot be parsed as a valid level`);
    }
    return parsed;
  }
}

/** Format severity tag with 5-character uppercase padding per dev-guidelines.md; always 11 characters wide. */
export function formatSeverityIndicator(level) {
  if (!level) {
    return '';
  }
  const clean = level.trim().toUpperCase();
  if (clean === 'WARN' || clean === 'WARNING') {
    return '**[WARN]** ';
  }
  if (clean === 'INFO') {
    return '**[INFO]** ';
  }
  if (clean === 'ERROR') {
    return '**[ERROR]**';
  }
  if (clean === 'DEBUG') {
    return '**[DEBUG]**';
  }
  return `**[${clean.padEnd(5)}]**`;
}

/**
 *  Format a single or multi-line log message adhering to dev-guidelines.md.
 *
 *  In file mode:    `[YYYY-MM-DD HH:MM:SS] **[LEVEL]** <origin> First line`
 *                    `                                          Subsequent lines aligned vertically`
 *  In stdout/stderr mode (only ERROR/WARN keep a severity indicator; timestamp is always stripped):
 *                    `**[LEVEL]** <origin> First line`
 *                    `                     Subsequent lines aligned vertically`
 */
export function formatLogMessage(message, { level, origin, timestamp, forFile = true } = {}) {
  if (!message && !level && !origin) {
    return '';
  }

  const ts = timestamp || new Date();
  const parts = [];
  if (forFile) {
    parts.push(`[${formatDateTime(ts, ' ', false)}]`);
  }

  if (level) {
    const lvlClean = level.trim().toUpperCase();
    if (forFile) {
      parts.push(formatSeverityIndicator(lvlClean));
    } else if (lvlClean === 'WARN' || lvlClean === 'WARNING' || lvlClean === 'ERROR') {
      // On stdout/stderr, only emit ERROR and WARN indicators; strip other severity indicators
      parts.push(formatSeverityIndicator(lvlClean));
    }
  }

  if (origin) {
    let origClean = origin.trim();
    const isWrapped =
      (origClean.startsWith('<') && origClean.endsWith('>')) || (origClean.startsWith('[') && origClean.endsWith(']'));
    if (!isWrapped) {
      origClean = `<${origClean}>`;
    }
    parts.push(origClean);
  }

  const prefix = parts.length > 0 ? parts.join(' ') + ' ' : '';
  const prefixLen = prefix.length;

  const rawLines = message.split(/\r\n|\r|\n/);
  const nonEmptyLines = rawLines.filter((line) => line.trim() !== '');
  if (nonEmptyLines.length === 0) {
    return '';
  }

  const indent = ' '.repeat(prefixLen);
  const formattedLines = [prefix + nonEmptyLines[0], ...nonEmptyLines.slice(1).map((line) => indent + line)];

  return formattedLines.join('\n') + '\n';
}

/** Logger handling file output, stdout/stderr, verbose progress, and debug filtering. */
export class CliLogger {
  constructor({ logPath, verbose = false, debug = false, origin } = {}) {
    this.logPath = logPath || null;
    this.verbose = verbose;
    this.debugEnabled = debug;
    this.origin = origin;
    this.startTime = process.hrtime.bigint();
    if (this.logPath) {
      const fs = getFs();
      const path = getPath();
      if (fs && path) {
        fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
      }
    }
  }

  #writeFile(text) {
    if (this.logPath && text) {
      try {
        const fs = getFs();
        if (fs) {
          fs.appendFileSync(this.logPath, text, 'utf-8');
        }
      } catch {
        // Best-effort file logging; swallow to not let logging itself crash the CLI
      }
    }
  }

  log(message, { level, origin, timestamp, toStdout = true, toStderr = false } = {}) {
    const ts = timestamp || new Date();
    const effectiveOrigin = origin !== undefined ? origin : this.origin;

    // Debug level filtering: only written to file when debugEnabled is true; never to stdout/stderr
    if (level && level.trim().toUpperCase() === 'DEBUG') {
      if (this.debugEnabled) {
        const fileText = formatLogMessage(message, {
          level: 'DEBUG',
          origin: effectiveOrigin,
          timestamp: ts,
          forFile: true,
        });
        this.#writeFile(fileText);
      }
      return;
    }

    // Write to log file if configured
    const fileText = formatLogMessage(message, { level, origin: effectiveOrigin, timestamp: ts, forFile: true });
    this.#writeFile(fileText);

    // Output to stdout/stderr
    const stdText = formatLogMessage(message, { level, origin: effectiveOrigin, timestamp: ts, forFile: false });
    if (toStderr) {
      process.stderr.write(stdText);
    } else if (toStdout) {
      process.stdout.write(stdText);
    }
  }

  info(message, { origin, toStdout = true } = {}) {
    this.log(message, { level: 'INFO', origin, toStdout });
  }

  /** Log operational progress to file, and to stdout only when verbose is true. */
  progress(message, { origin } = {}) {
    this.log(message, { level: 'INFO', origin, toStdout: this.verbose });
  }

  warning(message, { origin } = {}) {
    this.log(message, { level: 'WARN', origin, toStdout: false, toStderr: true });
  }

  error(message, { origin } = {}) {
    this.log(message, { level: 'ERROR', origin, toStdout: false, toStderr: true });
  }

  debug(message, { origin } = {}) {
    this.log(message, { level: 'DEBUG', origin, toStdout: false });
  }

  /** Logs the required start-of-software multi-line message per dev-guidelines.md. */
  logStart(name, version, argv, config, { origin } = {}) {
    const configLines = Object.entries(config || {}).map(([k, v]) => `- ${k.padEnd(24)}: ${v}`);
    const cmdLine = argv.join(' ');
    const msgParts = [
      `Starting ${name} v${version}`,
      'with following configuration:',
      `- Full command line given : ${cmdLine}`,
      ...configLines,
    ];
    this.log(msgParts.join('\n'), { level: 'INFO', origin, toStdout: this.verbose });
  }

  /** Logs the required end-of-software conclusion message per dev-guidelines.md. */
  logEnd(summary, { origin } = {}) {
    const durationSec = Number(process.hrtime.bigint() - this.startTime) / 1e9;
    let durationStr = `${durationSec.toFixed(2)}s`;
    if (durationSec >= 60) {
      const mins = Math.floor(durationSec / 60);
      const secs = durationSec % 60;
      durationStr = `${mins}m ${secs.toFixed(1)}s (${durationSec.toFixed(2)}s)`;
    }
    const summaryText = summary ? ` - ${summary}` : '';
    this.log(`Completed execution in ${durationStr}${summaryText}`, { level: 'INFO', origin, toStdout: this.verbose });
  }
}

// `warn` is an alias for `warning`, matching the naming already used by `log.mjs` in this repo.
CliLogger.prototype.warn = CliLogger.prototype.warning;
