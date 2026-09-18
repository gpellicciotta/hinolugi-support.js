import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import AppActionBar, { ACTION_STATE_CHANGED_EVENT } from '../js/app-action-bar.mjs';

class MockElement {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.parent = null;
    this.innerHTML = '';
    this.dataset = {};
    this._attrs = new Map();
    this._listeners = {};
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      contains: (c) => this.classList._classes.has(c),
    };
  }

  setAttribute(k, v) {
    this._attrs.set(k, String(v));
    if (k === 'id') this.id = String(v);
  }

  getAttribute(k) {
    return this._attrs.get(k) ?? null;
  }

  hasAttribute(k) {
    return this._attrs.has(k);
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  cloneNode(deep = false) {
    const clone = new MockElement(this.tag);
    clone.id = this.id;
    clone.innerHTML = this.innerHTML;
    this.classList._classes.forEach((c) => clone.classList.add(c));
    this._attrs.forEach((v, k) => clone.setAttribute(k, v));
    if (deep) {
      for (const child of this.children) {
        clone.appendChild(child.cloneNode(true));
      }
    }
    return clone;
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
      const id = sel.slice(1).split(' ')[0];
      if (this.id === id || this._attrs.get('id') === id) return this;
    }
    if (sel.startsWith('.')) {
      const cls = sel.slice(1).split(' ')[0];
      if (this.classList.contains(cls)) return this;
    }
    for (const child of this.children) {
      if (child.id === sel.slice(1) || child._attrs.get('id') === sel.slice(1)) return child;
      if (sel.startsWith('.') && child.classList.contains(sel.slice(1).split(' ')[0])) return child;
      const found = child.querySelector(sel);
      if (found) return found;
    }
    const elem = new MockElement('div');
    return elem;
  }

  addEventListener(type, cb) {
    (this._listeners[type] ||= []).push(cb);
  }

  removeEventListener(type, cb) {
    if (this._listeners[type]) {
      this._listeners[type] = this._listeners[type].filter((c) => c !== cb);
    }
  }

  dispatch(type, eventObj = {}) {
    for (const cb of this._listeners[type] || []) {
      cb(eventObj);
    }
  }
}

function makeMockApp(options = {}) {
  const listeners = {};
  return {
    addEventListener: (type, cb) => {
      (listeners[type] ||= []).push(cb);
    },
    removeEventListener: (type, cb) => {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter((c) => c !== cb);
      }
    },
    dispatchEvent: (event) => {
      for (const cb of listeners[event.type] || []) {
        cb(event);
      }
    },
    ...options,
  };
}

describe('AppActionBar', () => {
  let originalDocument;

  beforeEach(() => {
    originalDocument = globalThis.document;
    globalThis.document = {
      createElement(tag) {
        if (tag === 'template') {
          const el = new MockElement('template');
          el.content = new MockElement('div');
          Object.defineProperty(el, 'innerHTML', {
            set(html) {
              el._html = html;
              const idMatch = html.match(/id="([^"]+)"/);
              const root = new MockElement('div');
              if (idMatch) root.id = idMatch[1];
              const list = new MockElement('ol');
              list.classList.add('action-bar');
              list.classList.add('main');
              root.appendChild(list);
              el.content.children = [root];
              root.parent = el.content;
              el.content.querySelector = (sel) => {
                if (idMatch && sel === '#' + idMatch[1]) return root;
                return root.querySelector(sel);
              };
            },
            get() {
              return el._html || '';
            },
          });
          return el;
        }
        return new MockElement(tag);
      },
    };
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  test('exported event constant matches standard value', () => {
    assert.equal(ACTION_STATE_CHANGED_EVENT, 'action-state-changed');
  });

  test('constructor initializes action IDs array', () => {
    const app = makeMockApp();
    const bar = new AppActionBar('test-actions', app, ['save', null, 'delete']);
    assert.equal(bar.id, 'test-actions');
    assert.deepEqual(bar.actionBarActionIds, ['save', null, 'delete']);
  });

  test('attach renders buttons and separators, binding click to runAction', () => {
    const ranActions = [];
    const actions = {
      save: { id: 'save', title: 'Save', description: 'Save items', icon: '<i class="fa-save"></i>' },
      delete: { id: 'delete', title: 'Delete', description: 'Delete item' },
    };
    const app = makeMockApp({
      getAction: (id) => actions[id] || null,
      isActionEnabled: (id) => true,
      runAction: (id) => ranActions.push(id),
    });

    const bar = new AppActionBar('main-bar', app, ['save', null, 'delete']);
    const parent = new MockElement('div');
    bar.attach(parent);

    assert.equal(bar.actionBarItems.length, 3);
    const [saveItem, sepItem, deleteItem] = bar.actionBarItems;

    assert.equal(saveItem.actionId, 'save');
    assert.equal(saveItem.rootElement.classList.contains('item'), true);
    assert.equal(saveItem.aElement.getAttribute('data-action'), 'save');
    assert.equal(saveItem.aElement.innerHTML, '<i class="fa-save"></i>');

    // Clicking button triggers runAction
    saveItem.aElement.dispatch('click', { preventDefault: () => {}, stopPropagation: () => {} });
    assert.deepEqual(ranActions, ['save']);

    // Separator has separator class
    assert.equal(sepItem.actionId, null);
    assert.equal(sepItem.rootElement.classList.contains('separator'), true);

    // Delete item uses title when icon not present
    assert.equal(deleteItem.aElement.innerHTML, 'Delete');
  });

  test('reacts to ACTION_STATE_CHANGED_EVENT and updates separators', () => {
    const actions = {
      action1: { id: 'action1', title: 'A1' },
      action2: { id: 'action2', title: 'A2' },
    };
    const app = makeMockApp({
      getAction: (id) => actions[id] || null,
      isActionEnabled: () => true,
      runAction: () => {},
    });

    const bar = new AppActionBar('bar', app, ['action1', null, 'action2']);
    const parent = new MockElement('div');
    bar.attach(parent);

    const [item1, sep, item2] = bar.actionBarItems;
    assert.equal(sep.rootElement.classList.contains('disabled'), false);

    // Disable action1 via event
    app.dispatchEvent({
      type: ACTION_STATE_CHANGED_EVENT,
      action: { id: 'action1', disabled: true, 'disabled-reason': 'Not permitted' },
    });

    assert.equal(item1.rootElement.classList.contains('disabled'), true);
    // Since item1 is disabled, separator in front of item2 has 0 active elements in front, so disabled
    assert.equal(sep.rootElement.classList.contains('disabled'), true);

    // Re-enable action1 via event
    app.dispatchEvent({
      type: ACTION_STATE_CHANGED_EVENT,
      action: { id: 'action1', disabled: false },
    });
    assert.equal(item1.rootElement.classList.contains('disabled'), false);
    assert.equal(sep.rootElement.classList.contains('disabled'), false);
  });

  test('detach cleans up listeners and unsubscribe', () => {
    let unsubscribed = false;
    const coordinator = {
      subscribe: () => () => {
        unsubscribed = true;
      },
    };
    const app = makeMockApp({
      getAction: () => null,
      isActionEnabled: () => true,
      getSyncCoordinator: () => coordinator,
    });

    const bar = new AppActionBar('main-action-bar', app, ['refresh']);
    const parent = new MockElement('div');
    bar.attach(parent);

    bar.detach();
    assert.equal(unsubscribed, true);
    assert.equal(bar.syncUnsubscribe, null);
  });
});
