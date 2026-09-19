/**
 * Storage adapters (Memory, IndexedDB) and client-side usage tracking / pin management.
 */

/**
 * Zero-dependency Storage Adapters for Offline-First Data and Mutation Queue.
 */

/**
 * Abstract base class defining the storage adapter interface for offline persistence.
 */
export class StorageAdapter {
  /**
   * Opens the storage adapter for a given user.
   *
   * @param {string|number} [userId] Identifier of the user partitioning the store.
   * @returns {Promise<StorageAdapter>} Resolves with the active adapter instance.
   */
  async open(userId) {
    throw new Error('Not implemented');
  }

  /**
   * Closes the storage adapter and resets active user state.
   *
   * @returns {Promise<void>} Resolves when the adapter is closed.
   */
  async close() {
    throw new Error('Not implemented');
  }

  /**
   * Retrieves a single item from the store by key.
   *
   * @param {string} storeName Target object store or collection name.
   * @param {string|number|Array} key Primary key or composite key to look up.
   * @returns {Promise<*>} Resolves with the retrieved record or undefined if not found.
   */
  async get(storeName, key) {
    throw new Error('Not implemented');
  }

  /**
   * Retrieves all items from the store.
   *
   * @param {string} storeName Target object store or collection name.
   * @returns {Promise<Array<*>>} Resolves with all records in the store.
   */
  async getAll(storeName) {
    throw new Error('Not implemented');
  }

  /**
   * Puts or updates an item in the store.
   *
   * @param {string} storeName Target object store or collection name.
   * @param {*} value Value to persist.
   * @param {string|number|Array} [key] Optional explicit primary key.
   * @returns {Promise<string|number>} Resolves with the assigned record key.
   */
  async put(storeName, value, key) {
    throw new Error('Not implemented');
  }

  /**
   * Deletes an item from the store by key.
   *
   * @param {string} storeName Target object store or collection name.
   * @param {string|number|Array} key Primary key of the record to remove.
   * @returns {Promise<void>} Resolves when the record is deleted.
   */
  async delete(storeName, key) {
    throw new Error('Not implemented');
  }

  /**
   * Clears all items from the store.
   *
   * @param {string} storeName Target object store or collection name.
   * @returns {Promise<void>} Resolves when the store is cleared.
   */
  async clear(storeName) {
    throw new Error('Not implemented');
  }

  /**
   * Counts the number of items in the store.
   *
   * @param {string} storeName Target object store or collection name.
   * @returns {Promise<number>} Resolves with the total number of items stored.
   */
  async count(storeName) {
    throw new Error('Not implemented');
  }
}

/**
 * In-Memory storage adapter for Node.js testing and non-browser environments.
 * Partitions data per user and auto-increments missing keys.
 */
export class MemoryStorageAdapter extends StorageAdapter {
  constructor() {
    super();
    this.userId = null;
    this.stores = new Map();
    this.autoIncrementCounters = new Map();
  }

  /**
   * Opens the adapter for a given user identifier.
   * @param {string|number} [userId='anonymous']
   * @returns {Promise<MemoryStorageAdapter>}
   */
  async open(userId = 'anonymous') {
    this.userId = String(userId);
    if (!this.stores.has(this.userId)) {
      this.stores.set(this.userId, new Map());
      this.autoIncrementCounters.set(this.userId, new Map());
    }
    return this;
  }

  /**
   * Closes the adapter and disconnects active user.
   * @returns {Promise<void>}
   */
  async close() {
    this.userId = null;
  }

  /**
   * @private
   * @param {string} storeName
   * @returns {Map<string, *>}
   */
  _getStore(storeName) {
    if (!this.userId) {
      throw new Error('Storage adapter is not opened with a userId');
    }
    const userStores = this.stores.get(this.userId);
    if (!userStores.has(storeName)) {
      userStores.set(storeName, new Map());
    }
    return userStores.get(storeName);
  }

  /**
   * Retrieves a single item from the store.
   * @param {string} storeName
   * @param {string|number|Array} key
   * @returns {Promise<*>}
   */
  async get(storeName, key) {
    const store = this._getStore(storeName);
    const item = store.get(this._serializeKey(key));
    return item !== undefined ? JSON.parse(JSON.stringify(item)) : undefined;
  }

  /**
   * Retrieves all items from the store.
   * @param {string} storeName
   * @returns {Promise<Array>}
   */
  async getAll(storeName) {
    const store = this._getStore(storeName);
    return Array.from(store.values()).map((v) => JSON.parse(JSON.stringify(v)));
  }

  /**
   * Stores an item with automatic key resolution and deep cloning.
   * @param {string} storeName
   * @param {*} value
   * @param {string|number|Array} [key=null]
   * @returns {Promise<string|number>}
   */
  async put(storeName, value, key = null) {
    const store = this._getStore(storeName);
    let finalKey = key;

    if (finalKey === null || finalKey === undefined) {
      if (value && typeof value === 'object') {
        if ('key' in value && value.key !== undefined && value.key !== null) {
          finalKey = value.key;
        } else if ('id' in value && value.id !== undefined && value.id !== null) {
          finalKey = value.id;
        }
      }
      if (finalKey === null || finalKey === undefined) {
        const counters = this.autoIncrementCounters.get(this.userId);
        const nextId = (counters.get(storeName) || 0) + 1;
        counters.set(storeName, nextId);
        finalKey = nextId;
        if (typeof value === 'object' && value !== null && !('id' in value)) {
          value.id = finalKey;
        }
      }
    }

    const cloned = JSON.parse(JSON.stringify(value));
    store.set(this._serializeKey(finalKey), cloned);
    return finalKey;
  }

  /**
   * Deletes an item from the store.
   * @param {string} storeName
   * @param {string|number|Array} key
   * @returns {Promise<void>}
   */
  async delete(storeName, key) {
    const store = this._getStore(storeName);
    store.delete(this._serializeKey(key));
  }

  /**
   * Clears all items from the store.
   * @param {string} storeName
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    const store = this._getStore(storeName);
    store.clear();
  }

  /**
   * Returns item count in the store.
   * @param {string} storeName
   * @returns {Promise<number>}
   */
  async count(storeName) {
    const store = this._getStore(storeName);
    return store.size;
  }

  /**
   * @private
   * @param {*} key
   * @returns {string}
   */
  _serializeKey(key) {
    if (Array.isArray(key)) return JSON.stringify(key);
    return String(key);
  }
}

/**
 * Native IndexedDB storage adapter partitioned by userId.
 */
export class IndexedDbStorageAdapter extends StorageAdapter {
  /**
   * @param {string|Object} [dbPrefixOrOptions='hinolugi_counters_user_'] Database name prefix or options configuration object.
   * @param {Object} [options={}] Optional adapter settings when string prefix was provided.
   * @param {number} [options.version=2] Target IndexedDB schema version.
   * @param {Array<string|{name: string, keyPath?: string|null, autoIncrement?: boolean, indexes?: Array<{name: string, keyPath?: string, unique?: boolean}>}>} [options.stores] Custom store declarations.
   * @param {function(IDBDatabase, IDBVersionChangeEvent): void} [options.onUpgrade] Custom database upgrade callback.
   */
  constructor(dbPrefixOrOptions = 'hinolugi_counters_user_', options = {}) {
    super();
    let opts = options;
    let prefix = 'hinolugi_counters_user_';
    if (typeof dbPrefixOrOptions === 'object' && dbPrefixOrOptions !== null) {
      opts = dbPrefixOrOptions;
      prefix = opts.dbPrefix || 'hinolugi_counters_user_';
    } else if (typeof dbPrefixOrOptions === 'string') {
      prefix = dbPrefixOrOptions;
    }
    this.dbPrefix = prefix;
    this.userId = null;
    this.db = null;
    this.version = opts.version ?? 2;
    this.stores = opts.stores ?? null;
    this.onUpgrade = opts.onUpgrade ?? null;
  }

  /**
   * Opens the IndexedDB instance for the specified user.
   *
   * @param {string|number} [userId='anonymous'] Identifier of the active user.
   * @returns {Promise<IndexedDbStorageAdapter>} Resolves with opened adapter instance.
   */
  async open(userId = 'anonymous') {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not supported or available in this environment');
    }
    this.userId = String(userId);
    const dbName = this.dbPrefix + this.userId;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (typeof this.onUpgrade === 'function') {
          this.onUpgrade(db, event);
          return;
        }

        if (Array.isArray(this.stores)) {
          for (const s of this.stores) {
            const name = typeof s === 'string' ? s : s.name;
            const keyPath = typeof s === 'object' && s.keyPath !== undefined ? s.keyPath : 'id';
            const autoIncrement = typeof s === 'object' && s.autoIncrement ? s.autoIncrement : false;
            if (!db.objectStoreNames.contains(name)) {
              const store =
                keyPath === null
                  ? db.createObjectStore(name, { autoIncrement })
                  : db.createObjectStore(name, { keyPath, autoIncrement });
              if (s.indexes && Array.isArray(s.indexes)) {
                for (const idx of s.indexes) {
                  store.createIndex(idx.name, idx.keyPath || idx.name, { unique: !!idx.unique });
                }
              }
            }
          }
          return;
        }

        if (!db.objectStoreNames.contains('counters')) {
          db.createObjectStore('counters', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('counter_values')) {
          const valStore = db.createObjectStore('counter_values', { keyPath: 'key' });
          valStore.createIndex('counterId', 'counterId', { unique: false });
        }
        if (!db.objectStoreNames.contains('food_items')) {
          db.createObjectStore('food_items', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('mutation_queue')) {
          const queueStore = db.createObjectStore('mutation_queue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains('failed_mutations')) {
          db.createObjectStore('failed_mutations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('user_data')) {
          db.createObjectStore('user_data', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this);
      };

      request.onerror = (event) => {
        reject(new Error('Failed to open IndexedDB ' + dbName + ': ' + request.error?.message));
      };
    });
  }

  /**
   * Closes the active IndexedDB connection.
   * @returns {Promise<void>}
   */
  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.userId = null;
  }

  /**
   * @private
   * @param {string} storeName
   * @param {'readonly'|'readwrite'} [mode='readonly']
   * @returns {IDBObjectStore|null}
   */
  _getTransaction(storeName, mode = 'readonly') {
    if (!this.db) {
      throw new Error('IndexedDB is not open');
    }
    if (!this.db.objectStoreNames.contains(storeName)) {
      return null;
    }
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  /**
   * Retrieves an item from IndexedDB.
   * @param {string} storeName
   * @param {*} key
   * @returns {Promise<*>}
   */
  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      try {
        const store = this._getTransaction(storeName, 'readonly');
        if (!store) {
          resolve(undefined);
          return;
        }
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Retrieves all items from an IndexedDB object store.
   * @param {string} storeName
   * @returns {Promise<Array>}
   */
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      try {
        const store = this._getTransaction(storeName, 'readonly');
        if (!store) {
          resolve([]);
          return;
        }
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Puts an item into an IndexedDB object store.
   * @param {string} storeName
   * @param {*} value
   * @param {*} [key=null]
   * @returns {Promise<*>}
   */
  async put(storeName, value, key = null) {
    return new Promise((resolve, reject) => {
      try {
        const store = this._getTransaction(storeName, 'readwrite');
        if (!store) {
          resolve(undefined);
          return;
        }
        const req = key !== null && key !== undefined ? store.put(value, key) : store.put(value);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Deletes an item from an IndexedDB object store.
   * @param {string} storeName
   * @param {*} key
   * @returns {Promise<void>}
   */
  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      try {
        const store = this._getTransaction(storeName, 'readwrite');
        if (!store) {
          resolve(undefined);
          return;
        }
        const req = store.delete(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Clears all items from an IndexedDB object store.
   * @param {string} storeName
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    return new Promise((resolve, reject) => {
      try {
        const store = this._getTransaction(storeName, 'readwrite');
        if (!store) {
          resolve(undefined);
          return;
        }
        const req = store.clear();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Returns the count of items in an IndexedDB object store.
   * @param {string} storeName
   * @returns {Promise<number>}
   */
  async count(storeName) {
    return new Promise((resolve, reject) => {
      try {
        const store = this._getTransaction(storeName, 'readonly');
        if (!store) {
          resolve(0);
          return;
        }
        const req = store.count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }
}

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
 * Record a use of `key` under `storageKey`, incrementing its usage count and last-used timestamp.
 *
 * @param {string} storageKey The localStorage key identifying this tracked set.
 * @param {string} key The value being tracked.
 * @returns {void}
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
 * Retrieve suggested keys based on pinned status, frequency, and recency.
 *
 * @param {string} storageKey The localStorage key.
 * @param {number} [limit=10] Maximum number of keys to return.
 * @returns {string[]} Up to `limit` keys previously recorded under `storageKey`, pinned first, then most-used/most-recent.
 */
export function getSuggestions(storageKey, limit = 10) {
  return sortedKeys(readStore(storageKey)).slice(0, limit);
}

/**
 * Alias of getSuggestions.
 * @type {typeof getSuggestions}
 */
export const getTopKeys = getSuggestions;

/**
 * Pins (or unpins) `key` under `storageKey`.
 *
 * @param {string} storageKey The localStorage key.
 * @param {string} key The tracked key.
 * @param {boolean} pinned Whether the key is pinned.
 * @returns {void}
 */
export function setPinned(storageKey, key, pinned) {
  if (!key) return;
  const store = readStore(storageKey);
  const entry = store[key] || { count: 0, lastUsed: 0 };
  entry.pinned = !!pinned;
  store[key] = entry;
  writeStore(storageKey, store);
}

/**
 * Alias of setPinned.
 * @type {typeof setPinned}
 */
export const pinKey = setPinned;

/**
 * Check if `key` is pinned under `storageKey`.
 *
 * @param {string} storageKey The localStorage key.
 * @param {string} key The tracked key.
 * @returns {boolean} True if pinned.
 */
export function isPinned(storageKey, key) {
  const store = readStore(storageKey);
  return !!(store[key] && store[key].pinned);
}

/**
 * Sorts an arbitrary array of items in place by tracked pin/usage status under `storageKey`
 * (pinned first, then most-used/most-recent, then original relative order for untracked items).
 *
 * @template T
 * @param {T[]} items The array to sort in place.
 * @param {string} storageKey The localStorage key.
 * @param {function(T): string} keyFn Given an item, returns the key it's tracked under.
 * @returns {T[]} The same array, sorted.
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
