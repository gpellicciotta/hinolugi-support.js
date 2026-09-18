import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import AppNotificationBar, {
  NOTIFICATION_ADDED_EVENT,
  NOTIFICATION_DELETED_EVENT,
  NOTIFICATIONS_CLEARED_EVENT,
} from '../js/app-notification-bar.mjs';

class MockElement {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.parent = null;
    this.innerHTML = '';
    this.dataset = {};
    this._attrs = new Map();
    this._listeners = {};
    this.checked = false;
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

  get firstChild() {
    return this.children.length ? this.children[0] : null;
  }

  get firstElementChild() {
    return this.children.length ? this.children[0] : null;
  }

  closest(sel) {
    let curr = this;
    while (curr) {
      if (curr.tag === sel) return curr;
      if (sel.startsWith('.') && curr.classList.contains(sel.slice(1))) return curr;
      if (sel.startsWith('#') && (curr.id === sel.slice(1) || curr._attrs.get('id') === sel.slice(1))) return curr;
      if (sel.includes('[data-action=') && curr.dataset?.action) {
        const expected = sel.match(/\[data-action="([^"]+)"\]/)?.[1];
        if (expected && curr.dataset.action === expected) return curr;
      }
      curr = curr.parent;
    }
    return null;
  }

  querySelector(sel) {
    if (sel.startsWith('#')) {
      const id = sel.slice(1).split(' ')[0];
      if (this.id === id || this._attrs.get('id') === id) return this;
    }
    for (const child of this.children) {
      if (child.id === sel.slice(1) || child._attrs.get('id') === sel.slice(1)) return child;
      if (sel.startsWith('.') && child.classList.contains(sel.slice(1))) return child;
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

function parseNotificationHtml(html) {
  const li = new MockElement('li');
  li.classList.add('notification');
  li.innerHTML = html;

  const idMatch = html.match(/data-notification-id="([^"]+)"/);
  if (idMatch) {
    li.dataset.notificationId = idMatch[1];
  }

  const messageSpan = new MockElement('span');
  messageSpan.classList.add('message');
  const msgMatch = html.match(/<span class="message">([^<]*)<\/span>/);
  if (msgMatch) messageSpan.innerHTML = msgMatch[1];
  li.appendChild(messageSpan);

  const actionBar = new MockElement('span');
  actionBar.classList.add('action-bar');

  if (html.includes('data-action="notification-action"')) {
    const actionBtn = new MockElement('button');
    actionBtn.classList.add('action-button');
    actionBtn.dataset.action = 'notification-action';
    actionBar.appendChild(actionBtn);
  }

  const closeBtn = new MockElement('button');
  closeBtn.classList.add('close-button');
  closeBtn.dataset.action = 'dismiss-notification';
  actionBar.appendChild(closeBtn);

  li.appendChild(actionBar);
  return li;
}

describe('AppNotificationBar', () => {
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
              if (html.includes('class="notification"')) {
                const root = parseNotificationHtml(html);
                el.content.children = [root];
                root.parent = el.content;
              } else {
                const idMatch = html.match(/id="([^"]+)"/);
                const root = new MockElement('div');
                if (idMatch) root.id = idMatch[1];
                el.content.children = [root];
                root.parent = el.content;
                el.content.querySelector = (sel) => {
                  if (idMatch && sel === '#' + idMatch[1]) return root;
                  return root.querySelector(sel);
                };
              }
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

  test('exported event constants match standard values', () => {
    assert.equal(NOTIFICATION_ADDED_EVENT, 'notification-added');
    assert.equal(NOTIFICATION_DELETED_EVENT, 'notification-deleted');
    assert.equal(NOTIFICATIONS_CLEARED_EVENT, 'notifications-cleared');
  });

  test('constructor initializes notificationBarItems', () => {
    const app = {};
    const bar = new AppNotificationBar('test-bar', app);
    assert.equal(bar.id, 'test-bar');
    assert.equal(bar.title, 'Notification Bar');
    assert.deepEqual(bar.notificationBarItems, []);
  });

  test('createComponentUIHtml and createMainUIHtml produce valid template', () => {
    const app = {};
    const bar = new AppNotificationBar('my-bar', app);
    const fullHtml = bar.createComponentUIHtml();
    assert.ok(fullHtml.includes('id="my-bar"'));
    assert.ok(fullHtml.includes('class="notification-bar"'));
    assert.ok(fullHtml.includes('id="my-bar-toggle"'));
  });

  test('createNotificationRow builds row with message, tags, dismiss button, and optional action', () => {
    const app = {};
    const bar = new AppNotificationBar('bar', app);
    const note = {
      id: 42,
      note: 'Battery low',
      type: 'warning',
      time: Date.now() - 120000,
      action: {
        label: 'Plug in',
        icon: 'fa-plug',
        onClick: () => {},
      },
    };

    const row = bar.createNotificationRow(note);
    assert.equal(row.dataset.notificationId, '42');
    assert.ok(row.innerHTML.includes('Battery low'));
    assert.ok(row.innerHTML.includes('data-type="warning"'));
    assert.ok(row.innerHTML.includes('data-action="notification-action"'));
    assert.ok(row.innerHTML.includes('data-action="dismiss-notification"'));
  });

  test('updateMainUI renders notification rows and manages count dataset', () => {
    const deleted = [];
    const notes = [
      { id: 1, note: 'Notice 1', type: 'info' },
      { id: 2, note: 'Notice 2', type: 'error' },
    ];
    const app = {
      getNotifications: () => notes,
      deleteNotification: (id) => deleted.push(id),
    };

    const bar = new AppNotificationBar('bar', app);
    const parent = new MockElement('div');
    const rootList = new MockElement('ol');
    bar.domParentEl = parent;
    bar.notificationBarRootEl = rootList;
    bar.expandCollapseToggle = new MockElement('input');

    bar.updateMainUI();

    assert.equal(bar.notificationBarItems.length, 2);
    assert.equal(parent.dataset.notificationCount, '2');
    assert.equal(rootList.children.length, 2);
  });

  test('updateMainUI resets expanded state when notification count <= 1', () => {
    const app = {
      getNotifications: () => [{ id: 1, note: 'Only one', type: 'info' }],
    };
    const bar = new AppNotificationBar('bar', app);
    const parent = new MockElement('div');
    parent.classList.add('expanded');
    const toggle = new MockElement('input');
    toggle.checked = true;

    bar.domParentEl = parent;
    bar.notificationBarRootEl = new MockElement('ol');
    bar.expandCollapseToggle = toggle;

    bar.updateMainUI();

    assert.equal(toggle.checked, false);
    assert.equal(parent.classList.contains('expanded'), false);
  });
});
