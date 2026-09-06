import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import HomeView from '../js/home-view.mjs';

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
        root.setAttribute('id', 'home-view');
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

describe('HomeView', () => {
  let originalDocument;

  beforeEach(() => {
    originalDocument = globalThis.document;
    setupMockDocument();
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  test('constructor defaults title to app.name Home or Home', () => {
    const appWithCounters = { name: 'Counters' };
    const viewCounters = new HomeView(appWithCounters);
    assert.equal(viewCounters.id, 'home-view');
    assert.equal(viewCounters.title, 'Counters Home');
    assert.equal(viewCounters.neverWhenSignedIn, true);

    const appWithAuth = { name: 'Auth' };
    const viewAuth = new HomeView(appWithAuth);
    assert.equal(viewAuth.title, 'Auth Home');

    const appWithoutName = {};
    const viewDefault = new HomeView(appWithoutName);
    assert.equal(viewDefault.title, 'Home');

    const customView = new HomeView(appWithCounters, 'Custom Home Title');
    assert.equal(customView.title, 'Custom Home Title');
  });

  test('routeRegex matches root path with query/hash options', () => {
    const view = new HomeView({});
    assert.ok(view.routeRegex.test('/'));
    assert.ok(view.routeRegex.test('/?ref=pwa'));
    assert.ok(view.routeRegex.test('/#section'));
    assert.ok(!view.routeRegex.test('/dashboard'));
    assert.ok(!view.routeRegex.test('/settings'));
  });

  test('createMainUIHtml provides sign-in and create-account links', () => {
    const view = new HomeView({});
    const html = view.createMainUIHtml();
    assert.ok(html.includes('data-action="navigate-to-sign-in"'));
    assert.ok(html.includes('href="/sign-in"'));
    assert.ok(html.includes('data-action="navigate-to-create-account"'));
    assert.ok(html.includes('href="/create-account"'));
  });

  test('attach triggers app.showSplashScreen(true, true)', () => {
    let splashParams = null;
    const app = {
      showSplashScreen: (visible, anim) => {
        splashParams = [visible, anim];
      },
    };
    const view = new HomeView(app);
    const parentEl = new MockElement('main');
    view.attach(parentEl);

    assert.deepEqual(splashParams, [true, true]);
  });
});
