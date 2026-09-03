import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { LogLevel, formatSeverityIndicator, formatLogMessage, CliLogger } from '../js/cli-log.mjs';

describe('LogLevel', () => {
  test('toString returns predefined names', () => {
    assert.equal(LogLevel.toString(LogLevel.ERROR), 'ERROR');
    assert.equal(LogLevel.toString(LogLevel.WARNING), 'WARNING');
    assert.equal(LogLevel.toString(LogLevel.INFO), 'INFO');
    assert.equal(LogLevel.toString(LogLevel.DEBUG), 'DEBUG');
    assert.equal(LogLevel.toString(LogLevel.NONE), 'NONE');
    assert.equal(LogLevel.toString(LogLevel.ALL), 'ALL');
  });

  test('toString falls back to the number for non-predefined levels', () => {
    assert.equal(LogLevel.toString(650), '650');
  });

  test('parse accepts predefined names case-insensitively', () => {
    assert.equal(LogLevel.parse('error'), LogLevel.ERROR);
    assert.equal(LogLevel.parse(' Warning '), LogLevel.WARNING);
    assert.equal(LogLevel.parse('DEBUG'), LogLevel.DEBUG);
  });

  test('parse accepts numeric strings', () => {
    assert.equal(LogLevel.parse('650'), 650);
  });

  test('parse throws for invalid values', () => {
    assert.throws(() => LogLevel.parse('not-a-level'));
  });
});

describe('formatSeverityIndicator', () => {
  test('pads short names to 11 characters wide', () => {
    assert.equal(formatSeverityIndicator('INFO'), '**[INFO]** ');
    assert.equal(formatSeverityIndicator('WARN'), '**[WARN]** ');
    assert.equal(formatSeverityIndicator('INFO').length, 11);
    assert.equal(formatSeverityIndicator('WARN').length, 11);
  });

  test('does not pad names that already fill 11 characters', () => {
    assert.equal(formatSeverityIndicator('ERROR'), '**[ERROR]**');
    assert.equal(formatSeverityIndicator('DEBUG'), '**[DEBUG]**');
    assert.equal(formatSeverityIndicator('ERROR').length, 11);
  });

  test('returns empty string for falsy level', () => {
    assert.equal(formatSeverityIndicator(null), '');
    assert.equal(formatSeverityIndicator(''), '');
  });
});

describe('formatLogMessage', () => {
  const ts = new Date(2026, 8, 4, 13, 5, 9); // 2026-09-04 13:05:09 local

  test('file mode includes timestamp, level, and bracketed origin', () => {
    const out = formatLogMessage('hello', { level: 'INFO', origin: 'demo', timestamp: ts, forFile: true });
    assert.equal(out, '[2026-09-04 13:05:09] **[INFO]**  <demo> hello\n');
  });

  test('does not double-wrap an origin already in angle brackets', () => {
    const out = formatLogMessage('hello', { level: 'ERROR', origin: '<demo>', timestamp: ts, forFile: true });
    assert.equal(out, '[2026-09-04 13:05:09] **[ERROR]** <demo> hello\n');
  });

  test('stdout mode strips timestamp and non-WARN/ERROR indicators', () => {
    const out = formatLogMessage('hello', { level: 'INFO', origin: 'demo', timestamp: ts, forFile: false });
    assert.equal(out, '<demo> hello\n');
  });

  test('stdout mode keeps WARN and ERROR indicators, both flush to a 12-char-wide prefix column', () => {
    // WARN's indicator self-pads to 11 chars (one trailing space) + 1 join separator = 2 spaces before message.
    const warn = formatLogMessage('careful', { level: 'WARN', timestamp: ts, forFile: false });
    assert.equal(warn, '**[WARN]**  careful\n');
    // ERROR's indicator is already 11 chars flush, so just the 1 join separator remains.
    const err = formatLogMessage('broken', { level: 'ERROR', timestamp: ts, forFile: false });
    assert.equal(err, '**[ERROR]** broken\n');
  });

  test('aligns continuation lines under the first line and drops blank lines', () => {
    const out = formatLogMessage('line one\n\nline two', { level: 'WARN', origin: 'demo', timestamp: ts, forFile: false });
    const lines = out.split('\n');
    const expectedPrefix = '**[WARN]** ' + ' <demo> '; // indicator's own pad + join separator + origin + trailing separator
    assert.equal(lines[0], expectedPrefix + 'line one');
    assert.equal(lines[1], ' '.repeat(expectedPrefix.length) + 'line two');
  });

  test('returns empty string when there is nothing to log', () => {
    assert.equal(formatLogMessage('', {}), '');
    assert.equal(formatLogMessage('   \n  ', { level: 'INFO' }), '');
  });
});

describe('CliLogger', () => {
  function withCapturedStdio(fn) {
    const outChunks = [];
    const errChunks = [];
    const origOut = process.stdout.write;
    const origErr = process.stderr.write;
    process.stdout.write = (chunk) => { outChunks.push(chunk); return true; };
    process.stderr.write = (chunk) => { errChunks.push(chunk); return true; };
    try {
      fn();
    } finally {
      process.stdout.write = origOut;
      process.stderr.write = origErr;
    }
    return { out: outChunks.join(''), err: errChunks.join('') };
  }

  test('info writes to stdout by default', () => {
    const logger = new CliLogger({});
    const { out, err } = withCapturedStdio(() => logger.info('hi there'));
    assert.match(out, /hi there/);
    assert.equal(err, '');
  });

  test('progress only reaches stdout when verbose is true', () => {
    const quiet = new CliLogger({ verbose: false });
    const { out: quietOut } = withCapturedStdio(() => quiet.progress('working'));
    assert.equal(quietOut, '');

    const loud = new CliLogger({ verbose: true });
    const { out: loudOut } = withCapturedStdio(() => loud.progress('working'));
    assert.match(loudOut, /working/);
  });

  test('warning and error go to stderr, not stdout', () => {
    const logger = new CliLogger({});
    const { out, err } = withCapturedStdio(() => {
      logger.warning('careful');
      logger.error('broken');
    });
    assert.equal(out, '');
    assert.match(err, /careful/);
    assert.match(err, /broken/);
  });

  test('warn is an alias for warning', () => {
    assert.equal(CliLogger.prototype.warn, CliLogger.prototype.warning);
  });

  test('debug is discarded entirely unless debug mode is enabled', () => {
    const tmpFile = path.join(os.tmpdir(), `cli-log-test-${process.pid}-${Date.now()}.log`);
    try {
      const quiet = new CliLogger({ logPath: tmpFile, debug: false });
      withCapturedStdio(() => quiet.debug('secret detail'));
      assert.equal(fs.existsSync(tmpFile) ? fs.readFileSync(tmpFile, 'utf-8') : '', '');

      const verboseDebug = new CliLogger({ logPath: tmpFile, debug: true });
      const { out } = withCapturedStdio(() => verboseDebug.debug('secret detail'));
      assert.equal(out, '');
      assert.match(fs.readFileSync(tmpFile, 'utf-8'), /secret detail/);
    } finally {
      fs.rmSync(tmpFile, { force: true });
    }
  });

  test('logs to file when logPath is configured', () => {
    const tmpFile = path.join(os.tmpdir(), `cli-log-test-${process.pid}-${Date.now()}.log`);
    try {
      const logger = new CliLogger({ logPath: tmpFile, origin: 'demo' });
      withCapturedStdio(() => logger.info('recorded'));
      const contents = fs.readFileSync(tmpFile, 'utf-8');
      assert.match(contents, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \*\*\[INFO\]\*\*  <demo> recorded/);
    } finally {
      fs.rmSync(tmpFile, { force: true });
    }
  });

  test('logStart and logEnd emit multi-line messages when verbose', () => {
    const logger = new CliLogger({ verbose: true });
    const { out } = withCapturedStdio(() => {
      logger.logStart('mytool', '1.2.3', ['mytool', '--flag'], { flag: true });
      logger.logEnd('done');
    });
    assert.match(out, /Starting mytool v1\.2\.3/);
    assert.match(out, /Full command line given : mytool --flag/);
    assert.match(out, /Completed execution in/);
  });
});
