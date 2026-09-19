import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageAdapter, MemoryStorageAdapter, IndexedDbStorageAdapter } from '../js/storages.mjs';

test('StorageAdapter base interface contract', async (t) => {
  const adapter = new StorageAdapter();

  await t.test('all abstract methods throw Not implemented', async () => {
    await assert.rejects(() => adapter.open('user1'), /Not implemented/);
    await assert.rejects(() => adapter.close(), /Not implemented/);
    await assert.rejects(() => adapter.get('store', 'key'), /Not implemented/);
    await assert.rejects(() => adapter.getAll('store'), /Not implemented/);
    await assert.rejects(() => adapter.put('store', {}), /Not implemented/);
    await assert.rejects(() => adapter.delete('store', 'key'), /Not implemented/);
    await assert.rejects(() => adapter.clear('store'), /Not implemented/);
    await assert.rejects(() => adapter.count('store'), /Not implemented/);
  });
});

test('MemoryStorageAdapter - Lifecycle & User Namespacing', async (t) => {
  await t.test('operations before open throw error', async () => {
    const storage = new MemoryStorageAdapter();
    await assert.rejects(() => storage.get('items', 'k1'), /Storage adapter is not opened with a userId/);
    await assert.rejects(() => storage.getAll('items'), /Storage adapter is not opened with a userId/);
    await assert.rejects(() => storage.put('items', { id: 1 }), /Storage adapter is not opened with a userId/);
    await assert.rejects(() => storage.delete('items', 'k1'), /Storage adapter is not opened with a userId/);
    await assert.rejects(() => storage.clear('items'), /Storage adapter is not opened with a userId/);
    await assert.rejects(() => storage.count('items'), /Storage adapter is not opened with a userId/);
  });

  await t.test('open defaults to anonymous and close resets user', async () => {
    const storage = new MemoryStorageAdapter();
    assert.equal(storage.userId, null);
    await storage.open();
    assert.equal(storage.userId, 'anonymous');

    await storage.put('data', { test: 1 }, 'key1');
    assert.equal(await storage.count('data'), 1);

    await storage.close();
    assert.equal(storage.userId, null);
    await assert.rejects(() => storage.get('data', 'key1'), /Storage adapter is not opened with a userId/);
  });

  await t.test('open coerces numeric userId to string', async () => {
    const storage = new MemoryStorageAdapter();
    await storage.open(12345);
    assert.equal(storage.userId, '12345');
    await storage.put('data', { val: 'abc' }, 'key1');
    assert.deepEqual(await storage.get('data', 'key1'), { val: 'abc' });
    await storage.close();
  });

  await t.test('multi-user data isolation and re-opening', async () => {
    const storage = new MemoryStorageAdapter();

    // User A data
    await storage.open('user_alpha');
    await storage.put('notes', { id: 'note1', text: 'Alpha note' });
    await storage.put('profile', { theme: 'dark' }, 'settings');
    assert.equal(await storage.count('notes'), 1);

    // User B data
    await storage.open('user_beta');
    assert.equal(await storage.count('notes'), 0);
    assert.deepEqual(await storage.getAll('notes'), []);
    assert.equal(await storage.get('profile', 'settings'), undefined);

    await storage.put('notes', { id: 'note2', text: 'Beta note' });
    assert.equal(await storage.count('notes'), 1);

    // Switch back to User A
    await storage.open('user_alpha');
    const alphaNotes = await storage.getAll('notes');
    assert.equal(alphaNotes.length, 1);
    assert.equal(alphaNotes[0].text, 'Alpha note');
    assert.deepEqual(await storage.get('profile', 'settings'), { theme: 'dark' });

    // Switch back to User B
    await storage.open('user_beta');
    const betaNotes = await storage.getAll('notes');
    assert.equal(betaNotes.length, 1);
    assert.equal(betaNotes[0].text, 'Beta note');

    await storage.close();
  });
});

test('MemoryStorageAdapter - CRUD Operations, Keys, and Immutability', async (t) => {
  const storage = new MemoryStorageAdapter();
  await storage.open('crud_user');

  await t.test('key resolution from explicit key, value.key, and value.id', async () => {
    // Explicit key overrides value properties
    const k1 = await storage.put('counters', { id: 99, name: 'Explicit' }, 'custom_key');
    assert.equal(k1, 'custom_key');
    assert.deepEqual(await storage.get('counters', 'custom_key'), { id: 99, name: 'Explicit' });

    // Key inferred from value.key
    const k2 = await storage.put('counters', { key: 'pref_notifications', enabled: true });
    assert.equal(k2, 'pref_notifications');
    assert.deepEqual(await storage.get('counters', 'pref_notifications'), {
      key: 'pref_notifications',
      enabled: true,
    });

    // Key inferred from value.id
    const k3 = await storage.put('counters', { id: 'counter_50', count: 10 });
    assert.equal(k3, 'counter_50');
    assert.deepEqual(await storage.get('counters', 'counter_50'), { id: 'counter_50', count: 10 });

    // Array key serialized to string
    const k4 = await storage.put('counters', { val: 'array-key' }, ['scope', 1]);
    assert.deepEqual(k4, ['scope', 1]);
    assert.deepEqual(await storage.get('counters', ['scope', 1]), { val: 'array-key' });
  });

  await t.test('auto-increment key generation for objects without key/id', async () => {
    const rawObj1 = { title: 'First Task' };
    const generatedKey1 = await storage.put('tasks', rawObj1);
    assert.equal(generatedKey1, 1);
    assert.equal(rawObj1.id, 1, 'assigns generated id to input object if missing');

    const rawObj2 = { title: 'Second Task' };
    const generatedKey2 = await storage.put('tasks', rawObj2);
    assert.equal(generatedKey2, 2);
    assert.equal(rawObj2.id, 2);

    const task1 = await storage.get('tasks', 1);
    assert.deepEqual(task1, { id: 1, title: 'First Task' });
    const task2 = await storage.get('tasks', 2);
    assert.deepEqual(task2, { id: 2, title: 'Second Task' });
    assert.equal(await storage.count('tasks'), 2);
  });

  await t.test('put supports primitive values with explicit key', async () => {
    await storage.put('scalars', 42, 'num');
    await storage.put('scalars', 'hello', 'str');
    await storage.put('scalars', true, 'bool');

    assert.equal(await storage.get('scalars', 'num'), 42);
    assert.equal(await storage.get('scalars', 'str'), 'hello');
    assert.equal(await storage.get('scalars', 'bool'), true);
  });

  await t.test('deep cloning prevents unintended mutation', async () => {
    const original = { details: { nested: 'initial' } };
    await storage.put('immutable', original, 'key1');

    // Mutating original after put does not alter stored copy
    original.details.nested = 'mutated';
    const fetched = await storage.get('immutable', 'key1');
    assert.equal(fetched.details.nested, 'initial');

    // Mutating fetched object does not alter stored copy
    fetched.details.nested = 'modified_fetched';
    const fetchedAgain = await storage.get('immutable', 'key1');
    assert.equal(fetchedAgain.details.nested, 'initial');

    // Mutating object in getAll array does not alter stored copy
    const all = await storage.getAll('immutable');
    all[0].details.nested = 'modified_in_all';
    const finalFetched = await storage.get('immutable', 'key1');
    assert.equal(finalFetched.details.nested, 'initial');
  });

  await t.test('delete, clear, and count behavior', async () => {
    await storage.clear('temp_store');
    assert.equal(await storage.count('temp_store'), 0);

    await storage.put('temp_store', { name: 'Item 1' }, 'i1');
    await storage.put('temp_store', { name: 'Item 2' }, 'i2');
    await storage.put('temp_store', { name: 'Item 3' }, 'i3');
    assert.equal(await storage.count('temp_store'), 3);

    await storage.delete('temp_store', 'i2');
    assert.equal(await storage.count('temp_store'), 2);
    assert.equal(await storage.get('temp_store', 'i2'), undefined);

    // Deleting non-existent key is a safe no-op
    await storage.delete('temp_store', 'non_existent');
    assert.equal(await storage.count('temp_store'), 2);

    await storage.clear('temp_store');
    assert.equal(await storage.count('temp_store'), 0);
    assert.deepEqual(await storage.getAll('temp_store'), []);
  });

  await storage.close();
});

test('IndexedDbStorageAdapter - Contract & Configuration without Browser IndexedDB', async (t) => {
  await t.test('constructor defaults and options parsing', () => {
    const defaultAdapter = new IndexedDbStorageAdapter();
    assert.equal(defaultAdapter.dbPrefix, 'hinolugi_counters_user_');
    assert.equal(defaultAdapter.version, 2);
    assert.equal(defaultAdapter.userId, null);
    assert.equal(defaultAdapter.db, null);

    const customStringAdapter = new IndexedDbStorageAdapter('app_prefix_');
    assert.equal(customStringAdapter.dbPrefix, 'app_prefix_');

    const optionsAdapter = new IndexedDbStorageAdapter({
      dbPrefix: 'configured_prefix_',
      version: 4,
    });
    assert.equal(optionsAdapter.dbPrefix, 'configured_prefix_');
    assert.equal(optionsAdapter.version, 4);
  });

  await t.test('open throws in environment without indexedDB', async () => {
    const originalIndexedDB = globalThis.indexedDB;
    try {
      delete globalThis.indexedDB;
      const adapter = new IndexedDbStorageAdapter();
      await assert.rejects(
        () => adapter.open('test_user'),
        /IndexedDB is not supported or available in this environment/,
      );
    } finally {
      if (originalIndexedDB !== undefined) {
        globalThis.indexedDB = originalIndexedDB;
      }
    }
  });

  await t.test('CRUD operations before open reject with IndexedDB is not open', async () => {
    const adapter = new IndexedDbStorageAdapter();
    await assert.rejects(() => adapter.get('counters', 1), /IndexedDB is not open/);
    await assert.rejects(() => adapter.getAll('counters'), /IndexedDB is not open/);
    await assert.rejects(() => adapter.put('counters', { id: 1 }), /IndexedDB is not open/);
    await assert.rejects(() => adapter.delete('counters', 1), /IndexedDB is not open/);
    await assert.rejects(() => adapter.clear('counters'), /IndexedDB is not open/);
    await assert.rejects(() => adapter.count('counters'), /IndexedDB is not open/);
  });

  await t.test('close when not open resolves cleanly', async () => {
    const adapter = new IndexedDbStorageAdapter();
    await adapter.close();
    assert.equal(adapter.userId, null);
    assert.equal(adapter.db, null);
  });
});

test('IndexedDbStorageAdapter - Contract & Operations with Simulated IndexedDB', async (t) => {
  const originalIndexedDB = globalThis.indexedDB;

  class MockIDBObjectStore {
    constructor(name, options = {}) {
      this.name = name;
      this.options = options;
      this.data = new Map();
      this.indexes = new Map();
    }

    createIndex(name, keyPath, options) {
      this.indexes.set(name, { keyPath, options });
    }

    get(key) {
      const req = { result: undefined, error: null, onsuccess: null, onerror: null };
      queueMicrotask(() => {
        req.result = this.data.get(key);
        if (req.onsuccess) req.onsuccess({ target: req });
      });
      return req;
    }

    getAll() {
      const req = { result: [], error: null, onsuccess: null, onerror: null };
      queueMicrotask(() => {
        req.result = Array.from(this.data.values());
        if (req.onsuccess) req.onsuccess({ target: req });
      });
      return req;
    }

    put(value, key) {
      const req = { result: undefined, error: null, onsuccess: null, onerror: null };
      queueMicrotask(() => {
        const finalKey = key !== undefined && key !== null ? key : value[this.options.keyPath || 'id'];
        this.data.set(finalKey, value);
        req.result = finalKey;
        if (req.onsuccess) req.onsuccess({ target: req });
      });
      return req;
    }

    delete(key) {
      const req = { result: undefined, error: null, onsuccess: null, onerror: null };
      queueMicrotask(() => {
        this.data.delete(key);
        if (req.onsuccess) req.onsuccess({ target: req });
      });
      return req;
    }

    clear() {
      const req = { result: undefined, error: null, onsuccess: null, onerror: null };
      queueMicrotask(() => {
        this.data.clear();
        if (req.onsuccess) req.onsuccess({ target: req });
      });
      return req;
    }

    count() {
      const req = { result: 0, error: null, onsuccess: null, onerror: null };
      queueMicrotask(() => {
        req.result = this.data.size;
        if (req.onsuccess) req.onsuccess({ target: req });
      });
      return req;
    }
  }

  class MockIDBDatabase {
    constructor(name, version) {
      this.name = name;
      this.version = version;
      this.closed = false;
      this.stores = new Map();
      this.objectStoreNames = {
        contains: (storeName) => this.stores.has(storeName),
      };
    }

    createObjectStore(name, options) {
      const store = new MockIDBObjectStore(name, options);
      this.stores.set(name, store);
      return store;
    }

    transaction(storeNames, mode) {
      const storeName = Array.isArray(storeNames) ? storeNames[0] : storeNames;
      const store = this.stores.get(storeName);
      if (!store) {
        throw new Error(`NotFoundError: Object store "${storeName}" not found`);
      }
      return {
        objectStore: (name) => this.stores.get(name),
      };
    }

    close() {
      this.closed = true;
    }
  }

  t.after(() => {
    if (originalIndexedDB !== undefined) {
      globalThis.indexedDB = originalIndexedDB;
    } else {
      delete globalThis.indexedDB;
    }
  });

  await t.test('open initializes default stores and indexes on upgrade', async () => {
    let openedDbName = null;
    let openedVersion = null;

    globalThis.indexedDB = {
      open: (dbName, version) => {
        openedDbName = dbName;
        openedVersion = version;
        const req = { result: null, error: null, onupgradeneeded: null, onsuccess: null, onerror: null };
        queueMicrotask(() => {
          const db = new MockIDBDatabase(dbName, version);
          req.result = db;
          if (req.onupgradeneeded) {
            req.onupgradeneeded({ target: { result: db } });
          }
          if (req.onsuccess) {
            req.onsuccess({ target: { result: db } });
          }
        });
        return req;
      },
    };

    const adapter = new IndexedDbStorageAdapter();
    await adapter.open('user_test_id');

    assert.equal(openedDbName, 'hinolugi_counters_user_user_test_id');
    assert.equal(openedVersion, 2);
    assert.equal(adapter.userId, 'user_test_id');
    assert.ok(adapter.db);

    // Verify all standard stores were created
    const expectedStores = [
      'counters',
      'counter_values',
      'food_items',
      'mutation_queue',
      'failed_mutations',
      'user_data',
      'notifications',
    ];
    for (const s of expectedStores) {
      assert.ok(adapter.db.objectStoreNames.contains(s), `Expected store "${s}" to exist`);
    }

    // Verify CRUD methods
    const putRes = await adapter.put('counters', { id: 101, name: 'Steps' });
    assert.equal(putRes, 101);

    const getRes = await adapter.get('counters', 101);
    assert.deepEqual(getRes, { id: 101, name: 'Steps' });

    const countRes = await adapter.count('counters');
    assert.equal(countRes, 1);

    const allRes = await adapter.getAll('counters');
    assert.deepEqual(allRes, [{ id: 101, name: 'Steps' }]);

    await adapter.delete('counters', 101);
    assert.equal(await adapter.count('counters'), 0);
    assert.equal(await adapter.get('counters', 101), undefined);

    await adapter.put('counters', { id: 102, name: 'Water' });
    await adapter.clear('counters');
    assert.equal(await adapter.count('counters'), 0);

    // Fallbacks for non-existent store
    assert.equal(await adapter.get('non_existent_store', 'k1'), undefined);
    assert.deepEqual(await adapter.getAll('non_existent_store'), []);
    assert.equal(await adapter.put('non_existent_store', { id: 1 }), undefined);
    assert.equal(await adapter.delete('non_existent_store', 'k1'), undefined);
    assert.equal(await adapter.clear('non_existent_store'), undefined);
    assert.equal(await adapter.count('non_existent_store'), 0);

    await adapter.close();
    assert.equal(adapter.userId, null);
    assert.equal(adapter.db, null);
  });

  await t.test('custom stores and custom onUpgrade callback', async () => {
    let customUpgradeRan = false;

    globalThis.indexedDB = {
      open: (dbName, version) => {
        const req = { result: null, error: null, onupgradeneeded: null, onsuccess: null, onerror: null };
        queueMicrotask(() => {
          const db = new MockIDBDatabase(dbName, version);
          req.result = db;
          if (req.onupgradeneeded) req.onupgradeneeded({ target: { result: db } });
          if (req.onsuccess) req.onsuccess({ target: { result: db } });
        });
        return req;
      },
    };

    // Custom onUpgrade option
    const adapterWithHook = new IndexedDbStorageAdapter({
      onUpgrade: (db) => {
        customUpgradeRan = true;
        db.createObjectStore('custom_hook_store', { keyPath: 'id' });
      },
    });
    await adapterWithHook.open('hook_user');
    assert.equal(customUpgradeRan, true);
    assert.ok(adapterWithHook.db.objectStoreNames.contains('custom_hook_store'));
    await adapterWithHook.close();

    // Custom stores configuration option
    const adapterWithStores = new IndexedDbStorageAdapter({
      stores: [
        'simple_store',
        {
          name: 'complex_store',
          keyPath: 'customId',
          autoIncrement: true,
          indexes: [{ name: 'by_name', keyPath: 'name', unique: false }],
        },
      ],
    });
    await adapterWithStores.open('stores_user');
    assert.ok(adapterWithStores.db.objectStoreNames.contains('simple_store'));
    assert.ok(adapterWithStores.db.objectStoreNames.contains('complex_store'));
    await adapterWithStores.close();
  });

  await t.test('open rejection on indexedDB error', async () => {
    globalThis.indexedDB = {
      open: () => {
        const req = { result: null, error: new Error('Simulated QuotaExceededError'), onerror: null };
        queueMicrotask(() => {
          if (req.onerror) req.onerror(new Event('error'));
        });
        return req;
      },
    };

    const adapter = new IndexedDbStorageAdapter();
    await assert.rejects(() => adapter.open('error_user'), /Failed to open IndexedDB.*Simulated QuotaExceededError/);
  });

  await t.test('CRUD methods reject when underlying IDB request fails', async () => {
    const mockDb = new MockIDBDatabase('db', 1);
    const store = mockDb.createObjectStore('faulty', { keyPath: 'id' });

    // Force get to error
    store.get = () => {
      const req = { result: undefined, error: new Error('Disk read error'), onsuccess: null, onerror: null };
      queueMicrotask(() => {
        if (req.onerror) req.onerror({ target: req });
      });
      return req;
    };

    globalThis.indexedDB = {
      open: () => {
        const req = { result: mockDb, error: null, onsuccess: null };
        queueMicrotask(() => {
          if (req.onsuccess) req.onsuccess({ target: { result: mockDb } });
        });
        return req;
      },
    };

    const adapter = new IndexedDbStorageAdapter();
    await adapter.open('faulty_user');

    await assert.rejects(() => adapter.get('faulty', 'k1'), /Disk read error/);
    await adapter.close();
  });
});
