// Generic localStorage-backed "recent + frequently used" tracking.
// Tracks how often and recently a key was used, and allows retrieving top suggestions.
// Falls back gracefully if localStorage is unavailable.

const MAX_STORED_ENTRIES = 50;

function getStorage() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage !== null) {
      return localStorage;
    }
  } catch (e) {
    // Access denied or not available
  }
  return null;
}

function readStore(storageKey) {
  try {
    const storage = getStorage();
    if (!storage) return {};
    const raw = storage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeStore(storageKey, store) {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(storageKey, JSON.stringify(store));
  } catch (e) {
    // Non-fatal: storage full or quota exceeded
  }
}

function sortedKeys(store) {
  return Object.keys(store).sort((a, b) => {
    const ea = store[a];
    const eb = store[b];
    const pinnedDiff = (eb.pinned ? 1 : 0) - (ea.pinned ? 1 : 0);
    if (pinnedDiff !== 0) {
      return pinnedDiff;
    }
    if (eb.count !== ea.count) {
      return eb.count - ea.count;
    }
    return (eb.lastUsed || 0) - (ea.lastUsed || 0);
  });
}

function pruneIfNeeded(store) {
  const keys = sortedKeys(store);
  for (const key of keys.slice(MAX_STORED_ENTRIES)) {
    delete store[key];
  }
}

/**
 *  Record a use of `key` under `storageKey`, incrementing its usage count and last-used timestamp.
 *
 *  @param {string} storageKey The localStorage key identifying this tracked set.
 *  @param {string} key The value being tracked.
 */
export function recordUsage(storageKey, key) {
  if (!key) return;
  const store = readStore(storageKey);
  const entry = store[key] || { count: 0, lastUsed: 0, pinned: false };
  entry.count += 1;
  entry.lastUsed = Date.now();
  store[key] = entry;
  pruneIfNeeded(store);
  writeStore(storageKey, store);
}

/**
 *  @param {string} storageKey The localStorage key.
 *  @param {number} limit Maximum number of keys to return.
 *  @return {string[]} Up to `limit` keys previously recorded under `storageKey`, pinned first, then most-used/most-recent.
 */
export function getSuggestions(storageKey, limit = 10) {
  return sortedKeys(readStore(storageKey)).slice(0, limit);
}

export const getTopKeys = getSuggestions;

/**
 *  Pins (or unpins) `key` under `storageKey`.
 *
 *  @param {string} storageKey The localStorage key.
 *  @param {string} key The tracked key.
 *  @param {boolean} pinned Whether the key is pinned.
 */
export function setPinned(storageKey, key, pinned) {
  if (!key) return;
  const store = readStore(storageKey);
  const entry = store[key] || { count: 0, lastUsed: 0 };
  entry.pinned = !!pinned;
  store[key] = entry;
  writeStore(storageKey, store);
}

export const pinKey = setPinned;

/**
 *  Check if `key` is pinned under `storageKey`.
 *
 *  @param {string} storageKey The localStorage key.
 *  @param {string} key The tracked key.
 *  @return {boolean} True if pinned.
 */
export function isPinned(storageKey, key) {
  const store = readStore(storageKey);
  return !!(store[key] && store[key].pinned);
}

/**
 *  Sorts an arbitrary array of items in place by tracked pin/usage status under `storageKey`
 *  (pinned first, then most-used/most-recent, then original relative order for untracked items).
 *
 *  @param {Array} items The array to sort in place.
 *  @param {string} storageKey The localStorage key.
 *  @param {Function} keyFn Given an item, returns the key it's tracked under.
 *  @return {Array} The same array, sorted.
 */
export function sortByUsage(items, storageKey, keyFn) {
  const store = readStore(storageKey);
  const rank = (item) => {
    const entry = store[keyFn(item)];
    return entry ? [entry.pinned ? 0 : 1, -(entry.count || 0), -(entry.lastUsed || 0)] : [1, 0, 0];
  };
  const indexed = items.map((item, index) => ({ item, index, rank: rank(item) }));
  indexed.sort((a, b) => {
    for (let i = 0; i < a.rank.length; i++) {
      if (a.rank[i] !== b.rank[i]) {
        return a.rank[i] - b.rank[i];
      }
    }
    return a.index - b.index; // Stable
  });
  items.length = 0;
  items.push(...indexed.map((entry) => entry.item));
  return items;
}
