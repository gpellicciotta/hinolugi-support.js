import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { areEqual, areArraysEqual, deepClone } from '../js/objects.mjs';

describe('objects', () => {
  describe('areEqual', () => {
    test('compares primitive values', () => {
      assert.equal(areEqual(1, 1), true);
      assert.equal(areEqual('a', 'a'), true);
      assert.equal(areEqual(true, true), true);
      assert.equal(areEqual(1, 2), false);
      assert.equal(areEqual('a', 'b'), false);
    });

    test('handles null and undefined', () => {
      assert.equal(areEqual(null, null), true);
      assert.equal(areEqual(undefined, undefined), true);
      assert.equal(areEqual(null, undefined), true);
      assert.equal(areEqual(null, 0), false);
      assert.equal(areEqual({}, null), false);
    });

    test('deeply compares objects and arrays', () => {
      assert.equal(areEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] }), true);
      assert.equal(areEqual({ a: 1 }, { a: 2 }), false);
      assert.equal(areEqual([1, 2], [1, 2]), true);
      assert.equal(areEqual([1, 2], [1, 3]), false);
      assert.equal(areEqual([1], { 0: 1 }), false);
    });
  });

  describe('areArraysEqual', () => {
    test('compares array lengths and elements', () => {
      assert.equal(areArraysEqual([], []), true);
      assert.equal(areArraysEqual([1, 2], [1, 2]), true);
      assert.equal(areArraysEqual([1, 2], [1]), false);
      assert.equal(areArraysEqual([{ a: 1 }], [{ a: 1 }]), true);
      assert.equal(areArraysEqual([{ a: 1 }], [{ a: 2 }]), false);
    });
  });

  describe('deepClone', () => {
    test('clones object without retaining references', () => {
      const original = { a: 1, nested: { b: 2 }, arr: [1, 2, 3] };
      const clone = deepClone(original);
      assert.deepEqual(clone, original);
      assert.notEqual(clone, original);
      assert.notEqual(clone.nested, original.nested);
      assert.notEqual(clone.arr, original.arr);
    });
  });
});
