import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  hslToRgb,
  rgbToHsl,
  hslToString,
  stringToRgba,
  rgbaToString,
  textContrastColor,
  randomRgbColor,
} from '../js/colors.mjs';

describe('colors', () => {
  test('hslToRgb converts HSL to RGB', () => {
    const black = hslToRgb(0, 0, 0);
    assert.deepEqual(black, { r: 0, g: 0, b: 0 });

    const white = hslToRgb(0, 0, 1);
    assert.deepEqual(white, { r: 255, g: 255, b: 255 });

    const red = hslToRgb(0, 1, 0.5);
    assert.equal(red.r, 255);
    assert.equal(red.g, 0);
    assert.equal(red.b, 0);
  });

  test('rgbToHsl converts RGB to HSL', () => {
    const redHsl = rgbToHsl(255, 0, 0);
    assert.equal(redHsl.h, 0);
    assert.equal(redHsl.s, 1);
    assert.equal(redHsl.l, 0.5);
  });

  test('hslToString formats HSL object as CSS string', () => {
    const str = hslToString({ h: 0, s: 1, l: 0.5 });
    assert.equal(str, 'hsl(0,100%,50%)');
  });

  test('stringToRgba parses various CSS formats', () => {
    assert.deepEqual(stringToRgba('#fff'), { r: 255, g: 255, b: 255, a: 1.0 });
    assert.deepEqual(stringToRgba('#ffffff'), { r: 255, g: 255, b: 255, a: 1.0 });
    assert.deepEqual(stringToRgba('rgb(255, 0, 0)'), { r: 255, g: 0, b: 0, a: 1.0 });
    assert.deepEqual(stringToRgba('rgba(0, 255, 0, 0.5)'), { r: 0, g: 255, b: 0, a: 0.5 });
    assert.deepEqual(stringToRgba('red'), { r: 255, g: 0, b: 0, a: 1.0 });
    assert.deepEqual(stringToRgba(''), { r: 0, g: 0, b: 0, a: 1.0 });
  });

  test('rgbaToString formats RGBA object as CSS string', () => {
    assert.equal(rgbaToString({ r: 255, g: 128, b: 0, a: 0.8 }), 'rgba(255,128,0,0.8)');
  });

  test('textContrastColor chooses black or white appropriately', () => {
    assert.equal(textContrastColor(0, 0, 0), 'white');
    assert.equal(textContrastColor(1, 1, 1), 'black');
  });

  test('randomRgbColor produces valid rgb and rgba strings', () => {
    const rgb = randomRgbColor(false);
    assert.match(rgb, /^rgb\(\d+,\s*\d+,\s*\d+\)$/);

    const rgba = randomRgbColor(true);
    assert.match(rgba, /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/);
  });
});
