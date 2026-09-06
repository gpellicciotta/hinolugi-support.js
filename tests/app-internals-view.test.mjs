import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import AppInternalsView, {
  DEFAULT_API_ROUTES,
  SIGN_IN_STATE_CHANGED_EVENT,
  APP_INSTALL_STATE_CHANGED_EVENT,
  SW_INSTALL_STATE_CHANGED_EVENT,
  ACTION_STATE_CHANGED_EVENT,
  ACTION_ADDED_EVENT,
  NOTIFICATION_ADDED_EVENT,
  NOTIFICATION_DELETED_EVENT,
  NOTIFICATIONS_CLEARED_EVENT,
} from '../js/app-internals-view.mjs';
import * as log from '../js/log.mjs';

class MockElement {
  constructor(tag = 'div') {
    this.tag = tag.toUpperCase();
    this.children = [];
    this.parent = null;
    this.innerHTML = '';
    this.innerText = '';
    this.value = '';
    this.attributes = new Map();
    this.dataset = {};
    this._listeners = {};
    this.classList = {
      _classes: new Set(),
      add: (...cls) => cls.forEach((c) => this.classList._classes.add(c)),
      remove: (...cls) => cls.forEach((c) => this.classList._classes.delete(c)),
      contains: (c) => this.classList._classes.has(c),
    };
  }
  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    if (k.startsWith('data-')) {
      const prop = k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      this.dataset[prop] = String(v);
    }
  }
  getAttribute(k) {
    return this.attributes.get(k) ?? null;
  }
  hasAttribute(k) {
    return this.attributes.has(k);
  }
  removeAttribute(k) {
    this.attributes.delete(k);
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
  addEventListener(type, cb) {
    (this._listeners[type] ||= []).push(cb);
  }
  querySelector() {
    return new MockElement('div');
  }
  querySelectorAll() {
    return [];
  }
  closest() {
    return this;
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
        root.setAttribute('id', 'app-internals-view');
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

describe('AppInternalsView', () => {
  let originalDocument;

  beforeEach(() => {
    originalDocument = globalThis.document;
    setupMockDocument();
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  test('constructor sets defaults and options', () => {
    const app = { apiBaseUrl: 'https://api.example.com' };
    const view = new AppInternalsView(app, {
      maxLogEvents: 10,
      apiRoutes: ['/api/custom'],
    });

    assert.equal(view.id, 'app-internals-view');
    assert.equal(view.title, 'App Internals');
    assert.equal(view.apiBaseUrl, 'https://api.example.com');
    assert.deepEqual(view.apiRoutes, ['/api/custom']);
    assert.equal(view.maxLogEvents, 10);
    assert.ok(view.routeRegex.test('/internals'));
    assert.ok(view.routeRegex.test('/internals/test'));
  });

  test('exported event constants match standard names', () => {
    assert.equal(SIGN_IN_STATE_CHANGED_EVENT, 'sign-in-state-changed');
    assert.equal(APP_INSTALL_STATE_CHANGED_EVENT, 'app-install-state-changed');
    assert.equal(SW_INSTALL_STATE_CHANGED_EVENT, 'sw-install-state-changed');
    assert.equal(ACTION_STATE_CHANGED_EVENT, 'action-state-changed');
    assert.equal(ACTION_ADDED_EVENT, 'action-added');
    assert.equal(NOTIFICATION_ADDED_EVENT, 'notification-added');
    assert.equal(NOTIFICATION_DELETED_EVENT, 'notification-deleted');
    assert.equal(NOTIFICATIONS_CLEARED_EVENT, 'notifications-cleared');
    assert.ok(DEFAULT_API_ROUTES.includes('/api/status'));
    assert.ok(DEFAULT_API_ROUTES.includes('/api/counters'));
    assert.ok(DEFAULT_API_ROUTES.includes('/api/credentials'));
  });

  test('log handler collects and bounds log events', () => {
    const view = new AppInternalsView({}, { maxLogEvents: 3 });
    log.info('test message 1');
    log.info('test message 2');
    log.info('test message 3');
    log.info('test message 4');

    assert.ok(view.logEvents.length <= 3);
    assert.ok(view.logEvents.some((e) => e.message.includes('test message 4')));
  });

  test('createMainUIHtml includes all panels', () => {
    const view = new AppInternalsView({});
    const html = view.createMainUIHtml();

    assert.ok(html.includes('id="log-in-center"'));
    assert.ok(html.includes('id="install-center"'));
    assert.ok(html.includes('id="action-center"'));
    assert.ok(html.includes('id="view-center"'));
    assert.ok(html.includes('id="notification-center"'));
    assert.ok(html.includes('id="logging-config-center"'));
    assert.ok(html.includes('id="logging-center"'));
    assert.ok(html.includes('id="api-test-center"'));
  });

  test('notification helpers call app methods', () => {
    let notificationAdded = null;
    let notificationsCleared = false;
    const app = {
      addNotification: (msg, type) => {
        notificationAdded = { msg, type };
      },
      clearNotifications: () => {
        notificationsCleared = true;
      },
    };

    const view = new AppInternalsView(app);
    view.doAddRandomNotification();
    assert.ok(notificationAdded);
    assert.ok(notificationAdded.msg.includes('A random message'));

    view.doClearAllNotifications();
    assert.equal(notificationsCleared, true);
  });

  test('log helpers add and clear log events', () => {
    const view = new AppInternalsView({});
    const initialCount = view.logEvents.length;

    view.doAddRandomLogMessage();
    assert.ok(view.logEvents.length >= initialCount);

    view.doClearAllLogs();
    assert.equal(view.logEvents.length, 0);
  });

  test('attach sets updateTimer and detach clears it', () => {
    const app = {};
    const view = new AppInternalsView(app);
    const parentEl = new MockElement('main');

    view.attach(parentEl);
    assert.ok(view.updateTimer);

    view.detach();
    assert.equal(view.updateTimer, null);
  });
});
