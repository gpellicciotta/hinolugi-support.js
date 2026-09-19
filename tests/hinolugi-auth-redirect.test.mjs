import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { redirectToHinolugiAuth } from '../js/net.mjs';

class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(k) {
    return this.store[k] ?? null;
  }
  setItem(k, v) {
    this.store[k] = String(v);
  }
}

describe('redirectToHinolugiAuth', () => {
  let originalWindow;
  let originalSessionStorage;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalSessionStorage = globalThis.sessionStorage;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.sessionStorage = originalSessionStorage;
  });

  test('throws when mandatory parameters are missing', () => {
    assert.throws(() => redirectToHinolugiAuth(), /mandatory/);
    assert.throws(() => redirectToHinolugiAuth({ authServiceBaseUrl: 'https://auth.example.com' }), /mandatory/);
    assert.throws(
      () => redirectToHinolugiAuth({ authServiceBaseUrl: 'https://auth.example.com', appName: 'Counters' }),
      /mandatory/,
    );
  });

  test('constructs valid SSO sign-in URL with encoded parameters', () => {
    const targetUrl = redirectToHinolugiAuth({
      authServiceBaseUrl: 'https://auth.example.com/',
      appName: 'My App & Co',
      redirectUrl: 'https://myapp.example.com/callback?foo=1&bar=2',
    });

    assert.ok(targetUrl.startsWith('https://auth.example.com/sign-in?'));
    assert.ok(targetUrl.includes('app-name=My%20App%20%26%20Co'));
    assert.ok(targetUrl.includes('app-redirect-url=https%3A%2F%2Fmyapp.example.com%2Fcallback%3Ffoo%3D1%26bar%3D2'));
    assert.ok(!targetUrl.includes('app-logo-url'));
  });

  test('includes appLogoUrl when provided', () => {
    const targetUrl = redirectToHinolugiAuth({
      authServiceBaseUrl: 'https://auth.example.com',
      appName: 'Counters',
      redirectUrl: 'https://counters.example.com/callback',
      appLogoUrl: 'https://counters.example.com/img/logo.png',
    });

    assert.ok(targetUrl.includes('app-logo-url=https%3A%2F%2Fcounters.example.com%2Fimg%2Flogo.png'));
  });

  test('stores sign-in method in sessionStorage and navigates window', () => {
    const storage = new MockStorage();
    globalThis.sessionStorage = storage;
    const mockWindow = { location: { href: '' } };
    globalThis.window = mockWindow;

    const targetUrl = redirectToHinolugiAuth({
      authServiceBaseUrl: 'https://auth.example.com',
      appName: 'Test',
      redirectUrl: 'https://test.example.com/cb',
      signInMethod: 'custom-auth',
    });

    assert.equal(storage.getItem('sign-in-method'), 'custom-auth');
    assert.equal(mockWindow.location.href, targetUrl);
  });
});
