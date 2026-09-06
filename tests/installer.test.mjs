import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import Installer from '../js/installer.mjs';

describe('Installer', () => {
  test('constructor initializes installed to false', () => {
    const installer = new Installer();
    assert.equal(installer.installed, false);
  });

  test('registerBeforeInstallPromptListener ignores context without addEventListener', () => {
    const installer = new Installer();
    installer.registerBeforeInstallPromptListener(null);
    installer.registerBeforeInstallPromptListener({});
    assert.equal(installer.installed, false);
  });

  test('registerBeforeInstallPromptListener hooks event and invokes callback', () => {
    const installer = new Installer();
    const listeners = {};
    const ctx = {
      addEventListener: (type, fn) => {
        listeners[type] = fn;
      },
    };

    let callbackInvoked = false;
    installer.registerBeforeInstallPromptListener(ctx, () => {
      callbackInvoked = true;
    });

    assert.ok(listeners['beforeinstallprompt']);

    let defaultPrevented = false;
    const fakeEvent = {
      preventDefault: () => {
        defaultPrevented = true;
      },
    };

    listeners['beforeinstallprompt'](fakeEvent);

    assert.ok(defaultPrevented);
    assert.ok(callbackInvoked);
  });

  test('tryInstall returns false when prompt is not ready', () => {
    const installer = new Installer();
    const result = installer.tryInstall();
    assert.equal(result, false);
  });

  test('tryInstall catches error if prompt() throws', () => {
    const installer = new Installer();
    const listeners = {};
    const ctx = {
      addEventListener: (t, fn) => {
        listeners[t] = fn;
      },
    };
    installer.registerBeforeInstallPromptListener(ctx);

    listeners['beforeinstallprompt']({
      preventDefault: () => {},
      prompt: () => {
        throw new Error('NotAllowedError');
      },
    });

    const result = installer.tryInstall();
    assert.equal(result, false);
  });

  test('tryInstall handles accepted user consent', async () => {
    const installer = new Installer();
    const listeners = {};
    const ctx = {
      addEventListener: (t, fn) => {
        listeners[t] = fn;
      },
    };
    installer.registerBeforeInstallPromptListener(ctx);

    let promptCalled = false;
    listeners['beforeinstallprompt']({
      preventDefault: () => {},
      prompt: () => {
        promptCalled = true;
      },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });

    let callbackCalled = false;
    const installed = await installer.tryInstall(() => {
      callbackCalled = true;
    });

    assert.ok(promptCalled);
    assert.equal(installed, true);
    assert.equal(installer.installed, true);
    assert.ok(callbackCalled);
  });

  test('tryInstall handles dismissed user consent', async () => {
    const installer = new Installer();
    const listeners = {};
    const ctx = {
      addEventListener: (t, fn) => {
        listeners[t] = fn;
      },
    };
    installer.registerBeforeInstallPromptListener(ctx);

    listeners['beforeinstallprompt']({
      preventDefault: () => {},
      prompt: () => {},
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });

    const installed = await installer.tryInstall();
    assert.equal(installed, false);
    assert.equal(installer.installed, false);
  });
});
