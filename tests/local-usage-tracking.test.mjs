import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  recordUsage,
  getSuggestions,
  getTopKeys,
  setPinned,
  pinKey,
  isPinned,
  sortByUsage,
} from '../js/local-usage-tracking.mjs';

class MockLocalStorage {
  constructor() {
    this._store = {};
  }
  getItem(key) {
    return this._store[key] ?? null;
  }
  setItem(key, value) {
    this._store[key] = String(value);
  }
  removeItem(key) {
    delete this._store[key];
  }
  clear() {
    this._store = {};
  }
}

describe('local-usage-tracking', () => {
  let originalLocalStorage;

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = new MockLocalStorage();
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
  });

  test('recordUsage records usage and increments counts', () => {
    const key = 'test-usage';
    recordUsage(key, 'item1');
    recordUsage(key, 'item1');
    recordUsage(key, 'item2');

    const suggestions = getSuggestions(key);
    assert.deepEqual(suggestions, ['item1', 'item2']);
    assert.deepEqual(getTopKeys(key), ['item1', 'item2']);
  });

  test('ignores falsy keys', () => {
    const key = 'test-empty';
    recordUsage(key, '');
    recordUsage(key, null);
    assert.deepEqual(getSuggestions(key), []);
  });

  test('pinned items always sort first regardless of count', () => {
    const key = 'test-pinned';
    recordUsage(key, 'popular');
    recordUsage(key, 'popular');
    recordUsage(key, 'popular');
    recordUsage(key, 'rare');

    assert.deepEqual(getSuggestions(key), ['popular', 'rare']);
    assert.equal(isPinned(key, 'rare'), false);

    setPinned(key, 'rare', true);
    assert.equal(isPinned(key, 'rare'), true);
    assert.deepEqual(getSuggestions(key), ['rare', 'popular']);

    // pinKey alias unpins
    pinKey(key, 'rare', false);
    assert.equal(isPinned(key, 'rare'), false);
    assert.deepEqual(getSuggestions(key), ['popular', 'rare']);
  });

  test('limits results to specified limit', () => {
    const key = 'test-limit';
    for (let i = 1; i <= 5; i++) {
      recordUsage(key, `item${i}`);
    }
    assert.equal(getSuggestions(key, 3).length, 3);
  });

  test('prunes store when exceeding MAX_STORED_ENTRIES', () => {
    const key = 'test-prune';
    for (let i = 0; i < 60; i++) {
      recordUsage(key, `entry-${i}`);
    }
    const all = getSuggestions(key, 100);
    assert.equal(all.length, 50);
  });

  test('sortByUsage sorts array in place by tracked usage and pin status', () => {
    const storageKey = 'test-sort';
    recordUsage(storageKey, 'b');
    recordUsage(storageKey, 'b');
    recordUsage(storageKey, 'c');
    setPinned(storageKey, 'a', true);

    const items = [
      { id: 'c', val: 1 },
      { id: 'x', val: 2 },
      { id: 'b', val: 3 },
      { id: 'a', val: 4 },
      { id: 'y', val: 5 },
    ];

    const sorted = sortByUsage(items, storageKey, (item) => item.id);
    assert.equal(sorted, items); // in-place
    assert.deepEqual(
      items.map((i) => i.id),
      ['a', 'b', 'c', 'x', 'y'],
    );
  });

  test('gracefully handles missing or broken localStorage', () => {
    globalThis.localStorage = null;
    assert.doesNotThrow(() => recordUsage('broken', 'x'));
    assert.deepEqual(getSuggestions('broken'), []);
    assert.equal(isPinned('broken', 'x'), false);
    assert.doesNotThrow(() => setPinned('broken', 'x', true));

    const arr = [{ id: '1' }, { id: '2' }];
    assert.doesNotThrow(() => sortByUsage(arr, 'broken', (i) => i.id));
  });
});
