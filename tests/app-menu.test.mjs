import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import AppMenu, { ACTION_STATE_CHANGED_EVENT } from '../js/app-menu.mjs';

class MockElement {
  constructor(tag = 'div') {
    this.tag = tag.toUpperCase();
    this.children = [];
    this.parent = null;
    this.innerHTML = '';
    this.attributes = new Map();
    this.dataset = {};
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
  querySelector(sel) {
    if (sel.includes('.menu.main') || sel === '.menu.main') {
      let found = this.children.find((c) => c.classList.contains('menu') && c.classList.contains('main'));
      if (!found) {
        found = new MockElement('ol');
        found.classList.add('menu', 'main');
        this.appendChild(found);
      }
      return found;
    }
    return new MockElement('div');
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
        root.setAttribute('id', 'test-menu');
        const menuList = new MockElement('ol');
        menuList.classList.add('menu', 'main');
        root.appendChild(menuList);
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

describe('AppMenu', () => {
  let originalDocument;

  beforeEach(() => {
    originalDocument = globalThis.document;
    setupMockDocument();
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  test('constructor initializes menuActionIds and items', () => {
    const app = {};
    const menu = new AppMenu('main-menu', app, ['action1', null, 'action2']);
    assert.equal(menu.id, 'main-menu');
    assert.equal(menu.app, app);
    assert.deepEqual(menu.menuActionIds, ['action1', null, 'action2']);
    assert.deepEqual(menu.menuItems, []);
  });

  test('createComponentUIHtml and createMainUIHtml return expected HTML', () => {
    const menu = new AppMenu('main-menu', {});
    assert.ok(menu.createComponentUIHtml().includes('id="main-menu"'));
    assert.ok(menu.createMainUIHtml().includes('<ol class="menu main">'));
  });

  test('attach creates menu item elements for actions and separators', () => {
    const actionsMap = {
      action1: { id: 'action1', title: 'Action One', icon: '<i class="icon"></i>', description: 'First action' },
      action2: { id: 'action2', title: 'Link Action', href: '/some-page' },
      action3: { id: 'action3', title: 'Disabled Action', 'disabled-reason': 'Not allowed' },
    };
    const app = {
      getAction: (id) => actionsMap[id] || null,
      isActionEnabled: (id) => id !== 'action3',
    };

    const menu = new AppMenu('test-menu', app, ['action1', null, 'action2', 'action3']);
    const parentEl = new MockElement('header');
    menu.attach(parentEl);

    assert.equal(menu.menuItems.length, 4);

    // Item 1: button action with icon
    const item1 = menu.menuItems[0];
    assert.ok(item1.rootElement.classList.contains('item'));
    assert.equal(item1.aElement.tag, 'BUTTON');
    assert.equal(item1.aElement.dataset.action, 'action1');
    assert.equal(item1.aElement.getAttribute('title'), 'First action');
    assert.ok(item1.aElement.innerHTML.includes('Action One'));

    // Item 2: separator
    const item2 = menu.menuItems[1];
    assert.ok(item2.rootElement.classList.contains('separator'));
    assert.equal(item2.data, null);

    // Item 3: link action
    const item3 = menu.menuItems[2];
    assert.equal(item3.aElement.tag, 'A');
    assert.equal(item3.aElement.getAttribute('href'), '/some-page');

    // Item 4: disabled action
    const item4 = menu.menuItems[3];
    assert.ok(item4.rootElement.classList.contains('disabled'));
    assert.equal(item4.rootElement.getAttribute('title'), 'Not allowed');
  });

  test('re-attaching clears existing items and does not duplicate DOM', () => {
    const app = {
      getAction: (id) => ({ id, title: id }),
      isActionEnabled: () => true,
    };
    const menu = new AppMenu('test-menu', app, ['a1', 'a2']);
    const parentEl = new MockElement('header');

    menu.attach(parentEl);
    assert.equal(menu.menuItems.length, 2);

    menu.attach(parentEl);
    assert.equal(menu.menuItems.length, 2);
  });

  test('onActionStateChanged updates item and separator disabled states', () => {
    const actionsMap = {
      act1: { id: 'act1', title: 'Act 1' },
      act2: { id: 'act2', title: 'Act 2' },
    };
    const app = {
      getAction: (id) => actionsMap[id] || null,
      isActionEnabled: () => true,
      ACTION_STATE_CHANGED_EVENT,
    };
    const menu = new AppMenu('test-menu', app, ['act1', null, 'act2']);
    const parentEl = new MockElement('header');
    menu.attach(parentEl);

    // Disable act1
    menu.onActionStateChanged({
      action: { id: 'act1', disabled: true, 'disabled-reason': 'Action 1 disabled' },
    });
    assert.ok(menu.menuItems[0].rootElement.classList.contains('disabled'));
    // Separator should be disabled because preceding item is disabled
    assert.ok(menu.menuItems[1].rootElement.classList.contains('disabled'));

    // Re-enable act1
    menu.onActionStateChanged({
      action: { id: 'act1', disabled: false },
    });
    assert.ok(!menu.menuItems[0].rootElement.classList.contains('disabled'));
    // Separator should be re-enabled
    assert.ok(!menu.menuItems[1].rootElement.classList.contains('disabled'));
  });
});
