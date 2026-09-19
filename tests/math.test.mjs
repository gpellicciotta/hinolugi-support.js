import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  random,
  randomFloat,
  randomBoolean,
  randomElement,
  shuffle,
  distance,
  constrain,
  clamp,
  radiansToDegrees,
  degreesToRadians,
  decimalString,
  percentString,
  map,
  isNumeric,
  formatNumber,
  matrixMultiply,
} from '../js/math.mjs';

describe('math', () => {
  test('random generates numbers in range', () => {
    for (let i = 0; i < 50; i++) {
      const val = random(5, 10);
      assert.ok(val >= 5 && val <= 10);
      assert.equal(val, Math.floor(val));
    }
    const singleVal = random(5);
    assert.ok(singleVal >= 0 && singleVal <= 5);
  });

  test('randomFloat generates floats in range', () => {
    for (let i = 0; i < 50; i++) {
      const val = randomFloat(1.5, 4.5);
      assert.ok(val >= 1.5 && val <= 4.5001);
    }
  });

  test('randomBoolean generates boolean values', () => {
    const val = randomBoolean();
    assert.equal(typeof val, 'boolean');
  });

  test('randomElement picks from array', () => {
    assert.equal(randomElement([]), null);
    const arr = ['a', 'b', 'c'];
    assert.ok(arr.includes(randomElement(arr)));
  });

  test('shuffle reorders elements', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffle(arr, false);
    assert.equal(shuffled.length, arr.length);
    assert.deepEqual(
      shuffled.slice().sort((a, b) => a - b),
      arr,
    );
  });

  test('distance calculates 2D Euclidean distance', () => {
    assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  });

  test('constrain and clamp restrict values', () => {
    assert.equal(constrain(5, 0, 10), 5);
    assert.equal(constrain(-5, 0, 10), 0);
    assert.equal(constrain(15, 0, 10), 10);
    assert.equal(clamp(15, 0, 10), 10);
  });

  test('radiansToDegrees and degreesToRadians convert accurately', () => {
    assert.equal(radiansToDegrees(Math.PI), 180);
    assert.equal(degreesToRadians(180), Math.PI);
  });

  test('decimalString and percentString format numbers', () => {
    assert.equal(decimalString(3.14159, 2), '3.14');
    assert.equal(decimalString(0, 2), '0.00');
    assert.equal(percentString(0.5, 1), '50.0%');
  });

  test('map maps across numeric intervals', () => {
    assert.equal(map(5, 0, 10, 0, 100), 50);
  });

  test('isNumeric correctly identifies numbers', () => {
    assert.equal(isNumeric(42), true);
    assert.equal(isNumeric('42.5'), true);
    assert.equal(isNumeric('abc'), false);
    assert.equal(isNumeric(''), false);
  });

  test('formatNumber localizes numbers with grouping and digits', () => {
    assert.equal(typeof formatNumber(1234.56, 2, 1, false), 'string');
  });

  test('matrixMultiply multiplies valid matrices and rejects incompatible dimensions', () => {
    const m1 = [
      [1, 2],
      [3, 4],
    ];
    const m2 = [
      [2, 0],
      [1, 2],
    ];
    const result = matrixMultiply(m1, m2);
    assert.deepEqual(result, [
      [4, 4],
      [10, 8],
    ]);

    const incompatible = matrixMultiply([[1, 2]], [[1, 2]]);
    assert.equal(incompatible, null);
  });
});
