import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  MockElement,
  MockDocument,
  MockDocumentFragment,
  MockTextNode,
  installMockDom,
  uninstallMockDom,
} from '../js/mock-dom.mjs';

describe('MockElement Core Properties & Attributes', () => {
  test('initializes default tagName as DIV and uppercase', () => {
    const el1 = new MockElement();
    assert.equal(el1.tagName, 'DIV');
    assert.equal(el1.nodeType, 1);

    const el2 = new MockElement('span');
    assert.equal(el2.tagName, 'SPAN');
  });

  test('handles id and title property getter/setter and attribute synchronization', () => {
    const el = new MockElement('div');
    assert.equal(el.id, '');
    assert.equal(el.title, '');

    el.id = 'main-container';
    assert.equal(el.id, 'main-container');
    assert.equal(el.getAttribute('id'), 'main-container');

    el.title = 'Hover text';
    assert.equal(el.title, 'Hover text');
    assert.equal(el.getAttribute('title'), 'Hover text');

    el.id = '';
    assert.equal(el.id, '');
    assert.equal(el.getAttribute('id'), null);
  });

  test('handles value, disabled, and checked state', () => {
    const input = new MockElement('input');
    assert.equal(input.value, '');
    assert.equal(input.disabled, false);
    assert.equal(input.checked, false);

    input.value = 'test-val';
    assert.equal(input.value, 'test-val');

    input.disabled = true;
    assert.equal(input.disabled, true);
    assert.ok(input.hasAttribute('disabled'));

    input.disabled = false;
    assert.equal(input.disabled, false);
    assert.ok(!input.hasAttribute('disabled'));

    input.checked = true;
    assert.equal(input.checked, true);
    assert.ok(input.hasAttribute('checked'));

    input.checked = false;
    assert.equal(input.checked, false);
    assert.ok(!input.hasAttribute('checked'));
  });

  test('supports style manipulation via properties and methods', () => {
    const el = new MockElement('div');
    el.style.display = 'flex';
    assert.equal(el.style.display, 'flex');

    el.style.setProperty('color', 'blue');
    assert.equal(el.style.getPropertyValue('color'), 'blue');

    const removed = el.style.removeProperty('color');
    assert.equal(removed, 'blue');
    assert.equal(el.style.getPropertyValue('color'), '');
  });

  test('supports getAttribute, setAttribute, hasAttribute, removeAttribute', () => {
    const el = new MockElement('a');
    assert.equal(el.getAttribute('href'), null);
    assert.equal(el.hasAttribute('href'), false);

    el.setAttribute('href', '/dashboard');
    assert.equal(el.getAttribute('href'), '/dashboard');
    assert.equal(el.hasAttribute('href'), true);

    el.removeAttribute('href');
    assert.equal(el.getAttribute('href'), null);
    assert.equal(el.hasAttribute('href'), false);
  });
});

describe('MockElement classList & className', () => {
  test('add, remove, contains, and toggle classes', () => {
    const el = new MockElement('button');
    assert.equal(el.className, '');

    el.classList.add('btn', 'btn-primary');
    assert.ok(el.classList.contains('btn'));
    assert.ok(el.classList.contains('btn-primary'));
    assert.equal(el.classList.length, 2);

    el.classList.remove('btn-primary');
    assert.ok(!el.classList.contains('btn-primary'));
    assert.ok(el.classList.contains('btn'));

    const toggledOn = el.classList.toggle('active');
    assert.equal(toggledOn, true);
    assert.ok(el.classList.contains('active'));

    const toggledOff = el.classList.toggle('active');
    assert.equal(toggledOff, false);
    assert.ok(!el.classList.contains('active'));

    el.classList.toggle('forced', true);
    assert.ok(el.classList.contains('forced'));
    el.classList.toggle('forced', false);
    assert.ok(!el.classList.contains('forced'));
  });

  test('replace and className string assignment synchronization', () => {
    const el = new MockElement('div');
    el.classList.add('alpha');
    const replaced = el.classList.replace('alpha', 'beta');
    assert.equal(replaced, true);
    assert.ok(!el.classList.contains('alpha'));
    assert.ok(el.classList.contains('beta'));

    const replaceMissing = el.classList.replace('nonexistent', 'gamma');
    assert.equal(replaceMissing, false);

    el.className = 'item selected active';
    assert.equal(el.classList.length, 3);
    assert.ok(el.classList.contains('item'));
    assert.ok(el.classList.contains('selected'));
    assert.ok(el.classList.contains('active'));
    assert.equal(el.getAttribute('class'), 'item selected active');

    const classesArray = Array.from(el.classList);
    assert.deepEqual(classesArray, ['item', 'selected', 'active']);
  });
});

describe('MockElement dataset Proxy', () => {
  test('syncs attributes to dataset and camelCase transformation', () => {
    const el = new MockElement('div');
    el.setAttribute('data-user-id', '42');
    el.setAttribute('data-display-name', 'Alice');

    assert.equal(el.dataset.userId, '42');
    assert.equal(el.dataset.displayName, 'Alice');

    el.dataset.accountStatus = 'verified';
    assert.equal(el.getAttribute('data-account-status'), 'verified');

    assert.ok('userId' in el.dataset);
    assert.ok('accountStatus' in el.dataset);

    delete el.dataset.userId;
    assert.equal(el.getAttribute('data-user-id'), null);
    assert.equal(el.dataset.userId, undefined);

    el.dataset.testNum = 100;
    assert.equal(el.dataset.testNum, '100');
    assert.equal(el.getAttribute('data-test-num'), '100');

    const keys = Object.keys(el.dataset);
    assert.ok(keys.includes('displayName'));
    assert.ok(keys.includes('accountStatus'));
    assert.ok(keys.includes('testNum'));
  });
});

describe('MockElement Tree Manipulation & Traversal', () => {
  test('appendChild, removeChild, and reparenting', () => {
    const parent = new MockElement('ul');
    const li1 = new MockElement('li');
    const li2 = new MockElement('li');

    parent.appendChild(li1);
    parent.appendChild(li2);

    assert.equal(parent.children.length, 2);
    assert.equal(parent.firstElementChild, li1);
    assert.equal(parent.lastElementChild, li2);
    assert.equal(li1.parentNode, parent);
    assert.equal(li2.parentNode, parent);

    parent.removeChild(li1);
    assert.equal(parent.children.length, 1);
    assert.equal(li1.parentNode, null);
    assert.equal(parent.firstElementChild, li2);

    const otherParent = new MockElement('div');
    otherParent.appendChild(li2);
    assert.equal(parent.children.length, 0);
    assert.equal(otherParent.children.length, 1);
    assert.equal(li2.parentNode, otherParent);
  });

  test('insertBefore and replaceChild', () => {
    const container = new MockElement('div');
    const a = new MockElement('span');
    const c = new MockElement('span');
    const b = new MockElement('span');

    container.appendChild(a);
    container.appendChild(c);

    container.insertBefore(b, c);
    assert.deepEqual(container.children, [a, b, c]);

    const d = new MockElement('span');
    container.insertBefore(d, null);
    assert.deepEqual(container.children, [a, b, c, d]);

    const replacement = new MockElement('p');
    container.replaceChild(replacement, b);
    assert.deepEqual(container.children, [a, replacement, c, d]);
  });

  test('remove method on child elements', () => {
    const container = new MockElement('div');
    const child = new MockElement('p');
    container.appendChild(child);

    assert.equal(container.children.length, 1);
    child.remove();
    assert.equal(container.children.length, 0);
    assert.equal(child.parentNode, null);
  });

  test('nextElementSibling and previousElementSibling', () => {
    const parent = new MockElement('div');
    const el1 = new MockElement('h1');
    const el2 = new MockElement('p');
    const el3 = new MockElement('footer');

    parent.appendChild(el1);
    parent.appendChild(el2);
    parent.appendChild(el3);

    assert.equal(el1.previousElementSibling, null);
    assert.equal(el1.nextElementSibling, el2);
    assert.equal(el2.previousElementSibling, el1);
    assert.equal(el2.nextElementSibling, el3);
    assert.equal(el3.nextElementSibling, null);
  });

  test('cloneNode shallow and deep', () => {
    const parent = new MockElement('div');
    parent.id = 'orig';
    parent.classList.add('box');
    parent.dataset.info = 'secret';
    const child = new MockElement('span');
    child.textContent = 'Nested';
    parent.appendChild(child);

    const shallow = parent.cloneNode(false);
    assert.equal(shallow.id, 'orig');
    assert.ok(shallow.classList.contains('box'));
    assert.equal(shallow.dataset.info, 'secret');
    assert.equal(shallow.children.length, 0);

    const deep = parent.cloneNode(true);
    assert.equal(deep.children.length, 1);
    assert.equal(deep.firstElementChild.tagName, 'SPAN');
    assert.equal(deep.firstElementChild.textContent, 'Nested');
    assert.notEqual(deep.firstElementChild, child);
  });
});

describe('MockElement innerHTML & textContent', () => {
  test('textContent sets text and removes children', () => {
    const el = new MockElement('div');
    el.appendChild(new MockElement('span'));
    el.appendChild(new MockElement('b'));
    assert.equal(el.children.length, 2);

    el.textContent = 'Plain text only';
    assert.equal(el.textContent, 'Plain text only');
    assert.equal(el.children.length, 0);
    assert.equal(el.innerText, 'Plain text only');
  });

  test('innerHTML parses HTML elements and attributes', () => {
    const container = new MockElement('div');
    container.innerHTML = `
      <section id="banner" class="hero">
        <h1 title="Welcome">Title Text</h1>
        <p class="desc">A description paragraph with <a href="/more">link</a>.</p>
        <input type="text" value="Default Input" disabled checked />
      </section>
    `;

    const section = container.querySelector('#banner');
    assert.ok(section);
    assert.equal(section.tagName, 'SECTION');
    assert.ok(section.classList.contains('hero'));

    const h1 = section.querySelector('h1');
    assert.ok(h1);
    assert.equal(h1.textContent, 'Title Text');
    assert.equal(h1.getAttribute('title'), 'Welcome');

    const p = section.querySelector('.desc');
    assert.ok(p);
    assert.ok(p.textContent.includes('A description paragraph with'));
    assert.ok(p.textContent.includes('link'));

    const a = section.querySelector('a');
    assert.ok(a);
    assert.equal(a.getAttribute('href'), '/more');
    assert.equal(a.textContent, 'link');

    const input = section.querySelector('input');
    assert.ok(input);
    assert.equal(input.value, 'Default Input');
    assert.equal(input.disabled, true);
    assert.equal(input.checked, true);
  });

  test('TEMPLATE element content and innerHTML handling', () => {
    const tmpl = new MockElement('template');
    assert.ok(tmpl.content);
    assert.equal(tmpl.content.nodeType, 11);

    tmpl.innerHTML = '<div id="template-root" class="card"><span class="label">Item</span></div>';
    assert.equal(tmpl.children.length, 0);
    assert.equal(tmpl.content.children.length, 1);

    const root = tmpl.content.querySelector('#template-root');
    assert.ok(root);
    assert.ok(root.classList.contains('card'));

    const span = root.querySelector('.label');
    assert.ok(span);
    assert.equal(span.textContent, 'Item');

    const clonedRoot = root.cloneNode(true);
    assert.equal(clonedRoot.id, 'template-root');
    assert.equal(clonedRoot.querySelector('.label').textContent, 'Item');
  });

  test('DocumentFragment appendChild moves all children into destination', () => {
    const container = new MockElement('div');
    const frag = new MockDocumentFragment();
    const child1 = new MockElement('span');
    const child2 = new MockElement('b');
    frag.appendChild(child1);
    frag.appendChild(child2);

    assert.equal(frag.children.length, 2);

    container.appendChild(frag);
    assert.equal(container.children.length, 2);
    assert.equal(frag.children.length, 0);
    assert.equal(child1.parentNode, container);
    assert.equal(child2.parentNode, container);
  });
});

describe('CSS Selectors Engine', () => {
  let doc;

  beforeEach(() => {
    doc = new MockDocument();
    doc.body.innerHTML = `
      <main id="app" class="application">
        <header class="header-bar">
          <nav>
            <ul class="nav-list">
              <li class="nav-item active"><a href="#home" data-route="home">Home</a></li>
              <li class="nav-item"><a href="#settings" data-route="settings">Settings</a></li>
            </ul>
          </nav>
        </header>
        <div id="content" class="main-content">
          <form id="login-form" data-state="ready">
            <input type="email" id="email" name="email" value="user@example.com" class="input-field" />
            <input type="password" id="pass" class="input-field" disabled />
            <input type="checkbox" id="remember" checked />
            <button type="submit" class="btn btn-primary" id="btn-submit">Submit</button>
            <button type="button" class="btn btn-secondary" id="btn-cancel">Cancel</button>
          </form>
        </div>
      </main>
    `;
  });

  test('tag, id, and class selectors', () => {
    assert.equal(doc.querySelector('main').id, 'app');
    assert.equal(doc.querySelector('#content').className, 'main-content');
    assert.equal(doc.querySelector('.btn-primary').id, 'btn-submit');
    assert.equal(doc.querySelectorAll('.nav-item').length, 2);
  });

  test('compound selectors: tag + id + class', () => {
    assert.ok(doc.querySelector('button.btn.btn-primary#btn-submit'));
    assert.equal(doc.querySelector('input.input-field#email').value, 'user@example.com');
  });

  test('attribute selectors and operators', () => {
    assert.equal(doc.querySelector('[data-route="home"]').textContent, 'Home');
    assert.equal(doc.querySelector('[name=email]').id, 'email');
    assert.equal(doc.querySelector('[href^="#set"]').textContent, 'Settings');
    assert.equal(doc.querySelectorAll('[type]').length, 5);
  });

  test('pseudo-classes :checked and :disabled', () => {
    const checked = doc.querySelector('input:checked');
    assert.ok(checked);
    assert.equal(checked.id, 'remember');

    const disabled = doc.querySelector('input:disabled');
    assert.ok(disabled);
    assert.equal(disabled.id, 'pass');
  });

  test('child and descendant combinators', () => {
    const directChild = doc.querySelector('nav > ul > li.active > a');
    assert.ok(directChild);
    assert.equal(directChild.textContent, 'Home');

    const descendant = doc.querySelector('main .main-content button.btn-secondary');
    assert.ok(descendant);
    assert.equal(descendant.id, 'btn-cancel');
  });

  test('comma-separated selectors', () => {
    const matches = doc.querySelectorAll('a, button');
    assert.equal(matches.length, 4);
  });

  test('closest method traverses ancestors', () => {
    const submitBtn = doc.querySelector('#btn-submit');
    assert.equal(submitBtn.closest('button'), submitBtn);
    assert.equal(submitBtn.closest('form').id, 'login-form');
    assert.equal(submitBtn.closest('main').id, 'app');
    assert.equal(submitBtn.closest('.nonexistent'), null);
  });
});

describe('Events and Interactive Methods', () => {
  test('addEventListener, removeEventListener, dispatchEvent, and once option', () => {
    const el = new MockElement('button');
    let callCount = 0;
    const handler = () => {
      callCount++;
    };

    el.addEventListener('click', handler);
    el.dispatchEvent({ type: 'click' });
    assert.equal(callCount, 1);

    el.removeEventListener('click', handler);
    el.dispatchEvent({ type: 'click' });
    assert.equal(callCount, 1);

    let onceCount = 0;
    el.addEventListener(
      'custom',
      () => {
        onceCount++;
      },
      { once: true },
    );
    el.dispatchEvent({ type: 'custom' });
    el.dispatchEvent({ type: 'custom' });
    assert.equal(onceCount, 1);
  });

  test('preventDefault marks defaultPrevented and dispatchEvent returns false', () => {
    const el = new MockElement('form');
    el.addEventListener('submit', (e) => {
      e.preventDefault();
    });

    const notPrevented = el.dispatchEvent({ type: 'submit' });
    assert.equal(notPrevented, false);
  });

  test('event bubbling and stopPropagation', () => {
    const parent = new MockElement('div');
    const child = new MockElement('span');
    parent.appendChild(child);

    const log = [];
    parent.addEventListener('custom-evt', () => {
      log.push('parent');
    });
    child.addEventListener('custom-evt', () => {
      log.push('child');
    });

    child.dispatchEvent({ type: 'custom-evt', bubbles: true });
    assert.deepEqual(log, ['child', 'parent']);

    const log2 = [];
    parent.addEventListener('stopped-evt', () => {
      log2.push('parent');
    });
    child.addEventListener('stopped-evt', (e) => {
      log2.push('child');
      e.stopPropagation();
    });

    child.dispatchEvent({ type: 'stopped-evt', bubbles: true });
    assert.deepEqual(log2, ['child']);
  });

  test('click, focus, blur, and inline onclick handler', () => {
    const doc = new MockDocument();
    const btn = doc.createElement('button');
    doc.body.appendChild(btn);

    let clicked = false;
    btn.onclick = () => {
      clicked = true;
    };
    btn.click();
    assert.equal(clicked, true);

    assert.equal(doc.activeElement, doc.body);
    btn.focus();
    assert.equal(doc.activeElement, btn);

    btn.blur();
    assert.equal(doc.activeElement, null);
  });

  test('dispatch compatibility helper', () => {
    const el = new MockElement('div');
    let received = null;
    el.addEventListener('test-action', (data) => {
      received = data;
    });

    el.dispatch('test-action', { status: 'ok' });
    assert.deepEqual(received, { status: 'ok' });
  });
});

describe('MockDocument API', () => {
  test('createElement, createDocumentFragment, createTextNode', () => {
    const doc = new MockDocument();
    const el = doc.createElement('section');
    assert.equal(el.tagName, 'SECTION');

    const frag = doc.createDocumentFragment();
    assert.equal(frag.nodeType, 11);

    const txt = doc.createTextNode('Hello text');
    assert.equal(txt.nodeType, 3);
    assert.equal(txt.textContent, 'Hello text');
  });

  test('documentElement, head, body, and getElementById', () => {
    const doc = new MockDocument();
    assert.equal(doc.documentElement.tagName, 'HTML');
    assert.equal(doc.head.tagName, 'HEAD');
    assert.equal(doc.body.tagName, 'BODY');
    assert.deepEqual(doc.documentElement.children, [doc.head, doc.body]);

    const card = doc.createElement('div');
    card.id = 'unique-card';
    doc.body.appendChild(card);

    const found = doc.getElementById('unique-card');
    assert.equal(found, card);
    assert.equal(doc.getElementById('nonexistent'), null);
  });

  test('getElementsByTagName and getElementsByClassName', () => {
    const doc = new MockDocument();
    const div1 = doc.createElement('div');
    div1.classList.add('box', 'red');
    const div2 = doc.createElement('div');
    div2.classList.add('box', 'blue');
    doc.body.appendChild(div1);
    doc.body.appendChild(div2);

    const divs = doc.getElementsByTagName('div');
    assert.equal(divs.length, 2);

    const boxes = doc.getElementsByClassName('box');
    assert.equal(boxes.length, 2);

    const redBoxes = doc.getElementsByClassName('red');
    assert.equal(redBoxes.length, 1);
  });
});

describe('installMockDom & uninstallMockDom Environment Hooks', () => {
  test('installs and restores globalThis properties cleanly', () => {
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;

    const restore = installMockDom({
      url: 'https://example.test/app',
      html: '<h1 id="headline">Installed</h1>',
    });

    assert.ok(globalThis.window);
    assert.ok(globalThis.document);
    assert.equal(globalThis.window.location.href, 'https://example.test/app');
    assert.equal(globalThis.document.getElementById('headline').textContent, 'Installed');

    globalThis.sessionStorage.setItem('token', 'abc-123');
    assert.equal(globalThis.sessionStorage.getItem('token'), 'abc-123');

    restore();
    assert.equal(globalThis.window, originalWindow);
    assert.equal(globalThis.document, originalDocument);
  });

  test('uninstallMockDom restores cleanly without explicit restore function reference', () => {
    const initialWindow = globalThis.window;

    installMockDom();
    assert.ok(globalThis.window);

    uninstallMockDom();
    assert.equal(globalThis.window, initialWindow);
  });

  test('preserves and restores customGlobals', () => {
    const restore = installMockDom({
      customGlobals: {
        __TEST_GLOBAL_HOOK__: 'activated',
      },
    });

    assert.equal(globalThis.__TEST_GLOBAL_HOOK__, 'activated');

    restore();
    assert.equal(globalThis.__TEST_GLOBAL_HOOK__, undefined);
  });
});
