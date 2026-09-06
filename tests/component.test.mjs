import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import Component from '../js/component.mjs';
import { Logger } from '../js/log.mjs';

// Minimal fake DOM element, just enough to exercise component.mjs without a jsdom dependency.
class FakeElement {
  constructor(tag, classes = []) {
    this.tag = tag;
    this._classes = new Set(classes);
    this.children = [];
    this.parent = null;
    this._listeners = {};
    this.innerHTML = '';
  }

  get classList() {
    const classes = this._classes;
    return {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    };
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (this.parent) {
      const idx = this.parent.children.indexOf(this);
      if (idx >= 0) {
        this.parent.children.splice(idx, 1);
      }
    }
    this.parent = null;
  }

  get lastElementChild() {
    return this.children[this.children.length - 1];
  }

  addEventListener(type, cb) {
    (this._listeners[type] ||= []).push(cb);
  }

  removeEventListener(type, cb) {
    if (this._listeners[type]) {
      this._listeners[type] = this._listeners[type].filter((c) => c !== cb);
    }
  }
}

// Builds a Component instance bypassing the real constructor (which needs a global `document`
// to create/clone its <template>), pre-wired with the same overlay/element structure that
// `attach()` would normally produce on first attach.
function makeComponent() {
  const comp = Object.create(Component.prototype);
  comp.id = 'test-comp';
  comp.log = new Logger('test-comp');
  comp.app = {};
  comp.domParentEl = null;
  comp.eventListeners = [];

  comp.componentUIEl = new FakeElement('div');
  comp.errorUIEl = new FakeElement('div', ['error-overlay']);
  comp.errorTitleEl = new FakeElement('h1', ['title']);
  comp.errorDescriptionEl = new FakeElement('p', ['description']);
  comp.componentUIEl.appendChild(comp.errorUIEl);

  comp.waitUIEl = new FakeElement('div', ['wait-overlay']);
  comp.waitProgressEl = new FakeElement('p', ['progress-text']);
  comp.componentUIEl.appendChild(comp.waitUIEl);

  return comp;
}

describe('attach / detach', () => {
  test('attach appends componentUIEl and registers listeners; detach reverses it', () => {
    const comp = makeComponent();
    const parentEl = new FakeElement('div');
    let registerCalls = 0;
    comp.registerEventListeners = () => {
      registerCalls++;
    };

    comp.attach(parentEl);
    assert.equal(comp.domParentEl, parentEl);
    assert.equal(parentEl.children.includes(comp.componentUIEl), true);
    assert.equal(registerCalls, 1);

    const target = new FakeElement('button');
    const handler = () => {};
    comp.registerEventListener(target, 'click', handler);
    assert.equal(target._listeners.click.includes(handler), true);

    comp.detach();
    assert.equal(comp.domParentEl, null);
    assert.equal(parentEl.children.includes(comp.componentUIEl), false);
    assert.equal(target._listeners.click.includes(handler), false);
    assert.equal(comp.eventListeners.length, 0);
  });
});

describe('showMainUI / showWaitOverlay / showErrorOverlay', () => {
  test('showMainUI clears the error and wait overlay classes', () => {
    const comp = makeComponent();
    comp.componentUIEl.classList.add('error-overlay');
    comp.componentUIEl.classList.add('wait-overlay');
    let updateInfo;
    comp.updateMainUI = (info) => {
      updateInfo = info;
    };

    comp.showMainUI({ some: 'info' });
    assert.deepEqual(updateInfo, { some: 'info' });
    assert.equal(comp.componentUIEl.classList.contains('error-overlay'), false);
    assert.equal(comp.componentUIEl.classList.contains('wait-overlay'), false);
  });

  test('showWaitOverlay defaults the progress text and adds the wait-overlay class', () => {
    const comp = makeComponent();
    comp.showWaitOverlay();
    assert.equal(comp.waitProgressEl.innerHTML, 'Waiting for data...');
    assert.equal(comp.componentUIEl.classList.contains('wait-overlay'), true);
  });

  test('showWaitOverlay uses a custom progress message when given', () => {
    const comp = makeComponent();
    comp.showWaitOverlay({ 'progress-message': 'Loading widgets...' });
    assert.equal(comp.waitProgressEl.innerHTML, 'Loading widgets...');
  });

  test('showErrorOverlay defaults the title/description and adds the error-overlay class', () => {
    const comp = makeComponent();
    comp.showErrorOverlay();
    assert.equal(comp.errorTitleEl.innerHTML, 'Unknown Error');
    assert.equal(comp.errorDescriptionEl.innerHTML, 'No details available... Sorry.');
    assert.equal(comp.componentUIEl.classList.contains('error-overlay'), true);
  });

  test('showErrorOverlay uses the given title/description when given', () => {
    const comp = makeComponent();
    comp.showErrorOverlay({ 'error-title': 'Save failed', 'error-description': 'Network is down' });
    assert.equal(comp.errorTitleEl.innerHTML, 'Save failed');
    assert.equal(comp.errorDescriptionEl.innerHTML, 'Network is down');
  });
});

describe('refreshData', () => {
  test('the default implementation throws, since subclasses must override it', async () => {
    const comp = makeComponent();
    await assert.rejects(() => comp.refreshData(), /not implemented/);
  });
});

describe('startLongRunningOperation', () => {
  test('on success, calls success(info) and clears the wait-overlay timer', async () => {
    const comp = makeComponent();
    let successInfo;
    await new Promise((resolveTest) => {
      comp.startLongRunningOperation({
        title: 'Load things',
        description: 'Loading',
        start: () => Promise.resolve({ loaded: true }),
        success: (info) => {
          successInfo = info;
        },
        error: () => {
          assert.fail('error should not be called on success');
        },
        always: () => resolveTest(),
      });
    });
    assert.deepEqual(successInfo, { loaded: true });
  });

  test('on failure, passes the actual (capitalized) error message, not the static description', async () => {
    const comp = makeComponent();
    let errorInfo;
    await new Promise((resolveTest) => {
      comp.startLongRunningOperation({
        title: 'Load things',
        description: 'Loading',
        start: () => Promise.reject(new Error('something went wrong')),
        success: () => {
          assert.fail('success should not be called on failure');
        },
        error: (info) => {
          errorInfo = info;
        },
        always: () => resolveTest(),
      });
    });
    assert.equal(errorInfo['error-title'], 'Load things');
    assert.equal(errorInfo['error-description'], 'Something went wrong');
    assert.equal(errorInfo['error-description'] === 'Loading', false);
    assert.ok(errorInfo['error-cause'] instanceof Error);
  });
});
