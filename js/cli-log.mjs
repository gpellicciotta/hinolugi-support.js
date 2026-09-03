import * as fs from 'node:fs';
import * as path from 'node:path';
import * as utils from './utils.mjs';

// CLI logging utilities compliant with dev-guidelines.md's Logging section.
//
// Method and level naming is kept API-similar to `com.hinolugi.support.logging` (`LogLevel`, `Log`) in
// hinolugi-support.java and to `hinolugi_support.logging` (`LogLevel`, `CliLogger`) in
// hinolugi-support.python; the SPI-backed multi-backend/span/context-data machinery of the Java package is
// not mirrored here, since this module targets simple CLI tools rather than long-running services (same
// scoping decision as the Python sibling). This is a Node-only module (uses `node:fs`); the DOM-independent,
// browser-safe event logger in `log.mjs` is a separate, unrelated module.

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
    parts.push(`[${utils.formatDateTime(ts, ' ', false)}]`);
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
    const isWrapped = (origClean.startsWith('<') && origClean.endsWith('>')) || (origClean.startsWith('[') && origClean.endsWith(']'));
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
      fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
    }
  }

  #writeFile(text) {
    if (this.logPath && text) {
      try {
        fs.appendFileSync(this.logPath, text, 'utf-8');
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
        const fileText = formatLogMessage(message, { level: 'DEBUG', origin: effectiveOrigin, timestamp: ts, forFile: true });
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
    const msgParts = [`Starting ${name} v${version}`, 'with following configuration:', `- Full command line given : ${cmdLine}`, ...configLines];
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
