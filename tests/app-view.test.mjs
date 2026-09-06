import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import AppView from '../js/app-view.mjs';

class MockElement {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.parent = null;
    this.innerHTML = '';
    this.attributes = new Map();
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      contains: (c) => this.classList._classes.has(c),
    };
  }
  setAttribute(k, v) {
    this.attributes.set(k, String(v));
  }
  getAttribute(k) {
    return this.attributes.get(k) ?? null;
  }
  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }
  remove() {
    if (this.parent) {
      const idx = this.parent.children.indexOf(this);
      if (idx >= 0) this.parent.children.splice(idx, 1);
      this.parent = null;
    }
  }
  get lastElementChild() {
    if (this.children.length > 0) return this.children[this.children.length - 1];
    const child = new MockElement('div');
    this.appendChild(child);
    return child;
  }
  querySelector(sel) {
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      if (this.attributes.get('id') === id) return this;
    }
    const elem = new MockElement('div');
    elem.classList.add('main');
    elem.classList.add('active');
    return elem;
  }
  cloneNode() {
    const clone = new MockElement(this.tag);
    this.attributes.forEach((v, k) => clone.setAttribute(k, v));
    return clone;
  }
}

function setupMockDocument() {
  globalThis.document = {
    createElement(tag) {
      if (tag === 'template') {
        const root = new MockElement('div');
        root.setAttribute('id', 'test-view');
        return {
          content: {
            querySelector: () => root,
          },
          innerHTML: '',
        };
      }
      return new MockElement(tag);
    },
  };
}

describe('AppView', () => {
  let originalDocument;

  beforeEach(() => {
    originalDocument = globalThis.document;
    setupMockDocument();
  });

  afterEach(() => {
    globalThis.document = originalDocument;
    AppView.ActionBarClass = null;
  });

  test('constructor initializes title and default route regex', () => {
    const app = { name: 'TestApp' };
    const view = new AppView('dashboard', app, 'Dashboard View');
    assert.equal(view.id, 'dashboard');
    assert.equal(view.app, app);
    assert.equal(view.title, 'Dashboard View');
    assert.equal(view.attachCount, 0);
    assert.deepEqual(view.actions, []);
    assert.equal(view.ctxActionBarId, null);

    assert.ok(view.routeRegex.test('/dashboard'));
    assert.ok(view.routeRegex.test('/dashboard/details'));
    assert.ok(view.routeRegex.test('/dashboard/123/edit'));
    assert.ok(!view.routeRegex.test('/other'));
  });

  test('constructor accepts custom route regex', () => {
    const customRegex = /^\/custom-path$/i;
    const view = new AppView('custom', {}, 'Custom', customRegex);
    assert.equal(view.routeRegex, customRegex);
    assert.ok(view.routeRegex.test('/custom-path'));
    assert.ok(!view.routeRegex.test('/custom-path/more'));
  });

  test('getActions() defaults to empty array', () => {
    const view = new AppView('test-view', {});
    assert.deepEqual(view.getActions(), []);
  });

  test('registerActions() registers actions on app and builds action bar', () => {
    const addedActions = [];
    let addedActionBar = null;
    let activatedActionBarId = null;

    class MockActionBar {
      constructor(id, app, actions) {
        this.id = id;
        this.app = app;
        this.actions = actions;
      }
    }

    const app = {
      addAction: (act) => addedActions.push(act),
      ActionBarClass: MockActionBar,
      addActionBar: (bar) => {
        addedActionBar = bar;
      },
      activateContextActionBar: (id) => {
        activatedActionBarId = id;
      },
    };

    class ViewWithActions extends AppView {
      getActions() {
        return [
          { id: 'test-view.action1', title: 'Action 1' },
          null, // separator
          { id: 'test-view.action2', title: 'Action 2', 'context-bar': false },
          { id: 'test-view.action3', title: 'Action 3', 'context-bar': true },
        ];
      }
    }

    const view = new ViewWithActions('test-view', app, 'View with actions');
    view.registerActions();

    assert.equal(addedActions.length, 3);
    assert.deepEqual(view.actions, ['test-view.action1', 'test-view.action2', 'test-view.action3']);
    assert.equal(view.ctxActionBarId, 'test-view__context-action-bar');
    assert.ok(addedActionBar);
    assert.equal(addedActionBar.id, 'test-view__context-action-bar');
    assert.deepEqual(addedActionBar.actions, ['test-view.action1', null, 'test-view.action3']);
    assert.equal(activatedActionBarId, 'test-view__context-action-bar');
  });

  test('unregisterActions() removes actions and cleans up action bar', () => {
    const removedActions = [];
    let removedActionBarId = null;
    let activatedBar = 'active-bar';

    const app = {
      removeAction: (id) => removedActions.push(id),
      removeActionBar: (id) => {
        removedActionBarId = id;
      },
      activateContextActionBar: (id) => {
        activatedBar = id;
      },
    };

    const view = new AppView('test-view', app, 'Test');
    view.actions = ['test-view.a1', 'test-view.a2'];
    view.ctxActionBarId = 'test-view__context-action-bar';

    view.unregisterActions();

    assert.deepEqual(removedActions, ['test-view.a1', 'test-view.a2']);
    assert.deepEqual(view.actions, []);
    assert.equal(removedActionBarId, 'test-view__context-action-bar');
    assert.equal(view.ctxActionBarId, null);
    assert.equal(activatedBar, null);
  });

  test('attach() increments attachCount and calls registerActions()', () => {
    const app = { addAction: () => {} };
    const view = new AppView('test-view', app, 'Test');
    let registerActionsCalled = false;
    view.registerActions = () => {
      registerActionsCalled = true;
    };

    const parentEl = new MockElement('main');
    view.attach(parentEl);

    assert.equal(view.attachCount, 1);
    assert.ok(registerActionsCalled);
  });

  test('detach() unregisters actions and cleans up', () => {
    const view = new AppView('test-view', {}, 'Test');
    const parentEl = new MockElement('main');
    view.attach(parentEl);

    let unregisterActionsCalled = false;
    view.unregisterActions = () => {
      unregisterActionsCalled = true;
    };

    view.detach();
    assert.ok(unregisterActionsCalled);
  });

  test('refreshData and updateMainUI are defined and callable', async () => {
    const view = new AppView('test-view', {}, 'Test');
    await view.refreshData();
    view.updateMainUI({});
    assert.ok(true);
  });
});
