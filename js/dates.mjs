/**
 * Date and time calculations, formatting, calendar utilities, and wire serialization.
 */
import { randomFloat } from './math.mjs';

const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Give a random date between two dates.
 *
 * @param {Date} [min] The min. value to return. If not given, will be the current date/time - 5d.
 * @param {Date} [max] The max. value to return. If not given, max will be the current date/time.
 * @returns {Date} A random date value in the range [min, max].
 */
export function randomDate(min, max) {
  if (max == undefined) {
    max = new Date();
    if (min == undefined) {
      const maxEpocMillis = max.getTime();
      const minEpocMillis = maxEpocMillis - 5 * 24 * 60 * 60 * 1000;
      min = new Date();
      min.setTime(minEpocMillis);
    }
  }
  const minTime = min.getTime();
  const maxTime = max.getTime();
  const rndTime = Math.floor(Math.random() * (maxTime + 1 - minTime)) + minTime;
  const result = new Date();
  result.setTime(rndTime);
  return result;
}

const datePattern = '(?<year>\\d\\d\\d\\d)[-]?(?<month>[01]\\d)[-]?(?<day>\\d\\d)';
/**
 * Create a Date instance from ISO string, timestamp, year/month/day components, or existing Date.
 *
 * @param {...(string|number|Date)} args Arguments: (iso8601String) or (millisSinceEpoch) or (date) or (year, month, dayInMonth).
 * @returns {Date} Created Date instance.
 */
export function date() {
  if (arguments.length === 3) {
    const year = arguments[0];
    const month = arguments[1];
    const dayInMonth = arguments[2];
    return new Date(year, month - 1, dayInMonth);
  } else if (arguments.length === 1) {
    const d = new Date();
    const arg = arguments[0];
    if (typeof arg === 'number') {
      d.setTime(arg);
      return d;
    } else if (typeof arg === 'string') {
      let t = Date.parse(arg);
      if (isNaN(t)) {
        const dateRegex = new RegExp('^\\s*' + datePattern + '\\s*$');
        const m = dateRegex.exec(arg);
        if (m) {
          t = Date.parse(`${m.groups.year}-${m.groups.month}-${m.groups.day}`);
        }
      }
      if (isNaN(t)) {
        throw new Error("Argument '" + arg + "' cannot be interpreted as a valid date");
      }
      d.setTime(t);
      return d;
    } else if (arg instanceof Date || Object.prototype.toString.call(arg) === '[object Date]') {
      return new Date(arg.getTime());
    }
  }
  throw new Error(`Arguments ${JSON.stringify(arguments)} cannot be interpreted as a valid date`);
}

/**
 * Determine the number of years between two dates.
 *
 * @param {Date|string|number} date1 First date, inclusive.
 * @param {Date|string|number} date2 Second date, exclusive.
 * @returns {number} The amount of years between date1 and date2.
 */
export function yearsDiff(date1, date2) {
  const y1 = date(date1).getFullYear();
  const y2 = date(date2).getFullYear();
  return y2 - y1;
}

/**
 * Determine the number of months between two dates.
 *
 * @param {Date|string|number} date1 First date, inclusive.
 * @param {Date|string|number} date2 Second date, exclusive.
 * @returns {number} The amount of months between date1 and date2.
 */
export function monthsDiff(date1, date2) {
  let d1 = date(date1);
  let d2 = date(date2);
  let factor = 1;
  if (d2 < d1) {
    factor = -1;
    const t = d1;
    d1 = d2;
    d2 = t;
  }
  const y1 = d1.getFullYear();
  const y2 = d2.getFullYear();
  const m1 = d1.getMonth() + 1;
  const m2 = d2.getMonth() + 1;
  // Within same year:
  if (y1 === y2) {
    return factor * (m2 - m1); // E.g. 3 (March) - 1 (January) = 2;   1 (January) - 3 (March) = -2
  }
  // Otherwise:
  const restMonthsInFirstYear = 13 - m1;
  const restMonthsInLastYear = m2 - 1;
  const monthsInBetweenYears = (y2 - y1 - 1) /* Since we only want in-between years*/ * 12;
  return factor * (restMonthsInFirstYear + monthsInBetweenYears + restMonthsInLastYear);
}

/**
 * Determine the number of weeks between two dates.
 *
 * @param {Date|string|number} date1 First date, inclusive.
 * @param {Date|string|number} date2 Second date, exclusive.
 * @returns {number} The amount of weeks between date1 and date2.
 */
export function weeksDiff(date1, date2) {
  return Math.floor(daysDiff(date1, date2) / 7);
}

/**
 * Determine the number of days between two dates.
 *
 * @param {Date|string|number} date1 First date, inclusive.
 * @param {Date|string|number} date2 Second date, exclusive.
 * @returns {number} The amount of days between date1 and date2.
 */
export function daysDiff(date1, date2) {
  date1 = date(date1);
  date2 = date(date2);
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / MILLIS_PER_DAY);
}

/**
 * Return a date that corresponds to tomorrow.
 *
 * @returns {Date} A date that represents the start of tomorrow.
 */
export function tomorrow() {
  return dateAfterDays(today(), +1);
}

/**
 * Return a date that corresponds to today, start of the day.
 *
 * @returns {Date} A date that represents the start of today.
 */
export function today() {
  return startOfDay(new Date());
}

/**
 * Return a date that corresponds to yesterday.
 *
 * @returns {Date} A date that represents the start of yesterday.
 */
export function yesterday() {
  return dateAfterDays(today(), -1);
}

/**
 * Return a date that is some amount of days in the future (if deltaDays is positive) or in the past (if deltaDays is negative) from another date.
 *
 * @param {Date|string|number} refDate The reference date.
 * @param {number} deltaDays The number of days to add or subtract from the reference date.
 * @returns {Date} A new date that is deltaDays earlier or later than reference date or referenceDate if deltaDays is zero.
 */
export function dateAfterDays(refDate, deltaDays) {
  refDate = date(refDate);
  if (!deltaDays) {
    return refDate;
  }
  const deltaMillis = deltaDays * 24 * 3600 * 1000;
  return new Date(refDate.getTime() + deltaMillis);
}

/**
 * Return the days between two dates.
 *
 * @param {Date|string|number} date1 First date, inclusive.
 * @param {Date|string|number} date2 Second date, exclusive.
 * @returns {Date[]} An array of Date objects for each day in the range.
 */
export function daysBetween(date1, date2) {
  date1 = date(date1);
  date2 = date(date2);
  let reversed = false;
  if (date2.getTime() < date1.getTime()) {
    const t = date1;
    date1 = date2;
    date2 = t;
    reversed = true;
  }
  const days = [];
  for (let d = date1; d < date2; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  if (reversed) {
    return days.reverse();
  }
  return days;
}

/**
 * Get a date object representing midnight on the provided date.
 *
 * @param {...(string|number|Date)} args Date arguments forwarded to `date()`.
 * @returns {Date} The date with time component set to 00:00:00.000.
 * @see https://www.irt.org/articles/js052/index.htm
 */
export function startOfDay() {
  const targetDate = date.apply(null, arguments);
  targetDate.setHours(0);
  targetDate.setMinutes(0);
  targetDate.setSeconds(0);
  targetDate.setMilliseconds(0);
  return targetDate;
}

/**
 * Get a date object representing just before midnight on the provided date.
 *
 * @param {...(string|number|Date)} args Date arguments forwarded to `date()`.
 * @returns {Date} The date with time component set to 23:59:59.999.
 * @see https://www.irt.org/articles/js052/index.htm
 */
export function endOfDay() {
  const targetDate = date.apply(null, arguments);
  targetDate.setHours(23);
  targetDate.setMinutes(59);
  targetDate.setSeconds(59);
  targetDate.setMilliseconds(999);
  return targetDate;
}

/**
 * Calculate the easter day/date in a given year.
 *
 * @param {number} year The year to calculate easter for.
 * @returns {Date} The date of Easter in the given year at start of day.
 * @see https://www.irt.org/articles/js052/index.htm
 */
export function easterDay(year) {
  const C = Math.floor(year / 100);
  const N = year - 19 * Math.floor(year / 19);
  const K = Math.floor((C - 17) / 25);
  let I = C - Math.floor(C / 4) - Math.floor((C - K) / 3) + 19 * N + 15;
  I = I - 30 * Math.floor(I / 30);
  I = I - Math.floor(I / 28) * (1 - Math.floor(I / 28) * Math.floor(29 / (I + 1)) * Math.floor((21 - N) / 11));
  let J = year + Math.floor(year / 4) + I + 2 - C + Math.floor(C / 4);
  J = J - 7 * Math.floor(J / 7);
  const L = I - J;
  const M = 3 + Math.floor((L + 40) / 44);
  const D = L + 28 - 31 * Math.floor(M / 4);
  return startOfDay(year, M, D);
}

/**
 * Format the date/time into a real Date object.
 *
 * @param {Date|string|number} dateTime The date-time value, either as a number, a string, or a Date object.
 * @returns {Date|null} A Date object or null if input is falsy.
 */
export function toDateTime(dateTime) {
  if (!dateTime) {
    return null;
  }
  if (dateTime instanceof Date) {
    return dateTime;
  }
  if (Number.isInteger(dateTime)) {
    const d = new Date();
    d.setTime(dateTime);
    return d;
  }
  return new Date(Date.parse(dateTime));
}

/**
 * Format the date/time into a normalized string.
 *
 * @param {Date|string|number} dateTime The exact date-time value.
 * @param {string} [dateAndTimeSeparator=' '] The separator to use between the date and time parts.
 * @param {boolean} [toUTC=false] Whether to report the UTC date and time.
 * @returns {string} Formatted string in the form `yyyy-mm-dd hh:mm:ss` (or with custom separator).
 */
export function formatDateTime(dateTime, dateAndTimeSeparator = ' ', toUTC = false) {
  dateTime = toDateTime(dateTime);
  const year = toUTC ? dateTime.getUTCFullYear() : dateTime.getFullYear();
  const month = (toUTC ? dateTime.getUTCMonth() : dateTime.getMonth()) + 1;
  const dayOfMonth = toUTC ? dateTime.getUTCDate() : dateTime.getDate();
  const hours = toUTC ? dateTime.getUTCHours() : dateTime.getHours();
  const minutes = toUTC ? dateTime.getUTCMinutes() : dateTime.getMinutes();
  const seconds = toUTC ? dateTime.getUTCSeconds() : dateTime.getSeconds();
  let formattedDateTime = '' + year + '-';
  if (month < 10) {
    formattedDateTime += '0';
  }
  formattedDateTime += month;
  formattedDateTime += '-';
  if (dayOfMonth < 10) {
    formattedDateTime += '0';
  }
  formattedDateTime += dayOfMonth;
  formattedDateTime += dateAndTimeSeparator;
  if (hours < 10) {
    formattedDateTime += '0';
  }
  formattedDateTime += hours;
  formattedDateTime += ':';
  if (minutes < 10) {
    formattedDateTime += '0';
  }
  formattedDateTime += minutes;
  formattedDateTime += ':';
  if (seconds < 10) {
    formattedDateTime += '0';
  }
  formattedDateTime += seconds;
  return formattedDateTime;
}

/**
 * Format the date/time into a date-only string.
 *
 * @param {Date|string|number} dateTime The exact date-time value.
 * @returns {string} Formatted date string in the form `yyyy-mm-dd`.
 */
export function formatDate(dateTime) {
  dateTime = toDateTime(dateTime);
  const year = dateTime.getFullYear();
  const month = dateTime.getMonth() + 1;
  const dayOfMonth = dateTime.getDate();
  let formattedDate = '' + year + '-';
  if (month < 10) {
    formattedDate += '0';
  }
  formattedDate += month;
  formattedDate += '-';
  if (dayOfMonth < 10) {
    formattedDate += '0';
  }
  formattedDate += dayOfMonth;
  return formattedDate;
}

/**
 * Format the date/time into a time-only string.
 *
 * @param {Date|string|number} dateTime The exact date-time value.
 * @returns {string} Formatted time string in the form `hh:mm:ss`.
 */
export function formatTime(dateTime) {
  dateTime = toDateTime(dateTime);
  const hours = dateTime.getHours();
  const minutes = dateTime.getMinutes();
  const seconds = dateTime.getSeconds();
  let formattedTime = '';
  if (hours < 10) {
    formattedTime += '0';
  }
  formattedTime += hours;
  formattedTime += ':';
  if (minutes < 10) {
    formattedTime += '0';
  }
  formattedTime += minutes;
  formattedTime += ':';
  if (seconds < 10) {
    formattedTime += '0';
  }
  formattedTime += seconds;
  return formattedTime;
}

/**
 * Give a human-friendly indication of how far in the past or future a date-time lies.
 *
 * @param {Date|string|number} dateTime The exact date-time value.
 * @returns {string} Human-friendly relative date-time string.
 */
export function formatRelativeDateTime(dateTime) {
  if (!(dateTime instanceof Date)) {
    dateTime = toDateTime(dateTime);
  } else {
    // Ensure UTC
    dateTime.setTime(Date.parse(dateTime.toISOString()));
  }
  const SECONDS_IN_HOUR = 60 * 60;
  const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24;
  const nowMillis = Date.now();
  const now = new Date();
  now.setTime(nowMillis);
  const actualMillis = dateTime.getTime();
  const diffSeconds = Math.floor(Math.abs(nowMillis - actualMillis) / 1000);
  const diffDays = Math.floor(diffSeconds / SECONDS_IN_DAY);
  if (nowMillis >= actualMillis) {
    // In past
    if (diffSeconds < 2) {
      return 'now';
    } else if (diffSeconds < 51) {
      return `${diffSeconds} seconds ago`;
    } else if (diffSeconds < 121) {
      return `1 minute ago`;
    } else if (diffSeconds < SECONDS_IN_HOUR) {
      const diffMinutes = Math.floor(diffSeconds / 60);
      return `${diffMinutes} minutes ago`;
    } else if (diffSeconds < SECONDS_IN_DAY && dateTime.getDay() === now.getDay()) {
      return formatTime(dateTime);
    } else if (diffSeconds < 2 * SECONDS_IN_DAY && diffDays < 2) {
      return 'yesterday';
    } else {
      return formatDate(dateTime);
    }
  } else {
    // In future
    if (diffSeconds < 2) {
      return 'now';
    } else if (diffSeconds < 51) {
      return `in ${diffSeconds} seconds`;
    } else if (diffSeconds < 121) {
      return `in 1 minute`;
    } else if (diffSeconds < SECONDS_IN_HOUR) {
      const diffMinutes = Math.floor(diffSeconds / 60);
      return `in ${diffMinutes} minutes`;
    } else if (diffSeconds < SECONDS_IN_DAY && dateTime.getDay() === now.getDay()) {
      return formatTime(dateTime);
    } else if (diffSeconds < 2 * SECONDS_IN_DAY && diffDays < 2) {
      return 'tomorrow';
    } else {
      return formatDate(dateTime);
    }
  }
}

/**
 * Give a human-friendly indication of an elapsed timespan.
 *
 * @param {number} elapsedTime The exact elapsed time in milliseconds.
 * @returns {string} Formatted duration string `{ddd}d {hh}h {mm}m {ss}s`.
 */
export function formatTimespan(elapsedTime) {
  const SECONDS_IN_HOUR = 60 * 60;
  const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24;
  const SECONDS_IN_MINUTE = 60;

  let seconds = Math.floor(elapsedTime / 1000);
  const days = Math.floor(seconds / SECONDS_IN_DAY);
  seconds -= days * SECONDS_IN_DAY;
  const hours = Math.floor(seconds / SECONDS_IN_HOUR);
  seconds -= hours * SECONDS_IN_HOUR;
  const minutes = Math.floor(seconds / SECONDS_IN_MINUTE);
  seconds -= minutes * SECONDS_IN_MINUTE;

  let formattedTimespan = '';
  formattedTimespan += days;
  formattedTimespan += 'd ';
  if (hours < 10 && days > 0) {
    formattedTimespan += '0';
  }
  formattedTimespan += hours;
  formattedTimespan += 'h ';
  if (minutes < 10) {
    formattedTimespan += '0';
  }
  formattedTimespan += minutes;
  formattedTimespan += 'm ';
  if (seconds < 10) {
    formattedTimespan += '0';
  }
  formattedTimespan += seconds;
  formattedTimespan += 's';
  return formattedTimespan;
}

/** English month names in calendar order (index 0 = January). */
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Format a date-time value into a human-friendly string (e.g. "15 January 2026 at 09:08" or "15 January 2026").
 *
 * @param {Date|string|number} dateTime The date-time value.
 * @param {boolean} [withTime=true] Whether to include the "at HH:MM" time portion.
 * @returns {string} A human-readable date string, or empty string if invalid.
 */
export function formatHumanDateTime(dateTime, withTime = true) {
  dateTime = toDateTime(dateTime);
  if (!dateTime || isNaN(dateTime.getTime())) {
    return '';
  }
  const day = dateTime.getDate();
  const month = MONTH_NAMES[dateTime.getMonth()];
  const year = dateTime.getFullYear();
  if (!withTime) {
    return `${day} ${month} ${year}`;
  }
  const hours = String(dateTime.getHours()).padStart(2, '0');
  const minutes = String(dateTime.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} at ${hours}:${minutes}`;
}

/**
 * Format a date-time value into a detailed, human-friendly relative time string
 * (e.g. "1 day, 2 hours and 15 minutes ago", "2 hours and 15 minutes ago", "15 minutes ago", "just now").
 *
 * @param {Date|string|number} dateTime The date-time value.
 * @param {Date|number} [now=new Date()] Reference date-time.
 * @returns {string} A descriptive relative time string.
 */
export function formatDetailedRelativeTime(dateTime, now = new Date()) {
  dateTime = toDateTime(dateTime);
  if (!dateTime || isNaN(dateTime.getTime())) {
    return '';
  }
  const nowMillis = now instanceof Date ? now.getTime() : Date.now();
  const actualMillis = dateTime.getTime();
  const diffMillis = nowMillis - actualMillis;

  if (diffMillis < 0) {
    // In future or tiny forward clock drift
    if (Math.abs(diffMillis) < 60000) {
      return 'just now';
    }
    return formatRelativeDateTime(dateTime);
  }

  if (diffMillis < 60000) {
    return 'just now';
  }

  let totalSeconds = Math.floor(diffMillis / 1000);
  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);

  const dayPart = days > 0 ? (days === 1 ? '1 day' : `${days} days`) : '';
  const hourPart = hours > 0 ? (hours === 1 ? '1 hour' : `${hours} hours`) : '';
  const minutePart = minutes > 0 ? (minutes === 1 ? '1 minute' : `${minutes} minutes`) : '';

  if (days > 0) {
    if (hourPart && minutePart) {
      return `${dayPart}, ${hourPart} and ${minutePart} ago`;
    }
    if (hourPart) {
      return `${dayPart} and ${hourPart} ago`;
    }
    if (minutePart) {
      return `${dayPart} and ${minutePart} ago`;
    }
    return `${dayPart} ago`;
  }

  if (hours > 0) {
    if (minutePart) {
      return `${hourPart} and ${minutePart} ago`;
    }
    return `${hourPart} ago`;
  }

  if (minutes > 0) {
    return `${minutePart} ago`;
  }

  return 'just now';
}

/**
 * Serializes a Date (or date-convertible value) to a wire UTC ISO string without milliseconds
 * ('yyyy-MM-ddTHH:mm:ssZ'). Preserves null and undefined as-is.
 *
 * @param {Date|string|number|null|undefined} value Date value to serialize.
 * @returns {string|null|undefined} ISO-8601 UTC wire date string or passthrough value.
 */
export function toWireDate(value) {
  if (value === null || value === undefined) {
    return value;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Parses a server UTC date-time string into a real Date. Passing an existing Date,
 * null, or undefined is a safe passthrough.
 *
 * @param {string|number|Date|null|undefined} value Value to parse into a Date.
 * @returns {Date|null|undefined} Parsed Date instance or passthrough value.
 */
export function fromWireDate(value) {
  if (value === null || value === undefined || value instanceof Date) {
    return value;
  }
  return new Date(value);
}

/** Alias for fromWireDate. */
export const parseDate = fromWireDate;
