import test from 'node:test';
import assert from 'node:assert/strict';

// Set up minimal browser DOM globals for Node test environment before importing webapp modules
class MockDOMElement {
  constructor(tagName) {
    this.tagName = (tagName || 'DIV').toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.classList = {
      _classes: new Set(),
      add: (...cls) => cls.forEach((c) => this.classList._classes.add(c)),
      remove: (...cls) => cls.forEach((c) => this.classList._classes.delete(c)),
      contains: (c) => this.classList._classes.has(c),
      toggle: (c, force) => {
        if (force !== undefined) {
          if (force) this.classList.add(c);
          else this.classList.remove(c);
        } else {
          if (this.classList.contains(c)) this.classList.remove(c);
          else this.classList.add(c);
        }
      },
    };
    this.dataset = {};
    this._listeners = new Map();
    this.parentNode = null;
    this.value = '';
    this.checked = false;
    this.type = 'text';
    this.title = '';
  }

  get id() {
    return this.attributes.get('id') || '';
  }

  set id(val) {
    this.setAttribute('id', val);
  }

  get className() {
    return Array.from(this.classList._classes).join(' ');
  }

  set className(val) {
    this.classList._classes.clear();
    String(val || '')
      .split(/\s+/)
      .filter(Boolean)
      .forEach((c) => this.classList.add(c));
  }

  setAttribute(name, val) {
    this.attributes.set(name, String(val));
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      this.dataset[key] = String(val);
    }
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(newChild, refChild) {
    newChild.parentNode = this;
    const idx = this.children.indexOf(refChild);
    if (idx >= 0) {
      this.children.splice(idx, 0, newChild);
    } else {
      this.children.push(newChild);
    }
    return newChild;
  }

  remove() {
    if (this.parentNode) {
      const idx = this.parentNode.children.indexOf(this);
      if (idx >= 0) this.parentNode.children.splice(idx, 1);
      this.parentNode = null;
    }
  }

  addEventListener(evt, fn) {
    if (!this._listeners.has(evt)) this._listeners.set(evt, []);
    this._listeners.get(evt).push(fn);
  }

  removeEventListener(evt, fn) {
    if (this._listeners.has(evt)) {
      const arr = this._listeners.get(evt);
      const idx = arr.indexOf(fn);
      if (idx >= 0) arr.splice(idx, 1);
    }
  }

  dispatchEvent(evt) {
    const listeners = this._listeners.get(evt.type) || [];
    listeners.forEach((fn) => fn(evt));
    if (this.parentNode && !evt.cancelBubble) {
      this.parentNode.dispatchEvent(evt);
    }
  }

  get firstChild() {
    return this.children.length ? this.children[0] : null;
  }

  get lastElementChild() {
    return this.children.length ? this.children[this.children.length - 1] : null;
  }

  get innerHTML() {
    return '';
  }

  set innerHTML(val) {
    this.children = [];
  }

  _matches(sel) {
    if (!sel) return false;
    let s = sel.trim();
    if (s.endsWith(':checked')) {
      if (this.type !== 'checkbox' || !this.checked) return false;
      s = s.slice(0, -8).trim();
      if (!s) return true;
    }
    if (s === 'li' && this.tagName === 'LI') return true;
    if (s === 'input' && this.tagName === 'INPUT') return true;
    if (s === 'button' && this.tagName === 'BUTTON') return true;
    if (s === 'span' && this.tagName === 'SPAN') return true;
    if (s.startsWith('li.')) {
      const cls = s.slice(3);
      return this.tagName === 'LI' && this.classList.contains(cls);
    }
    if (s.startsWith('#')) return this.attributes.get('id') === s.slice(1);
    if (s.startsWith('.')) {
      const parts = s.split('.').filter(Boolean);
      return parts.every((c) => this.classList.contains(c));
    }
    if (s === '[data-action]') return !!this.dataset.action;
    return false;
  }

  closest(sel) {
    if (this._matches(sel)) return this;
    if (this.parentNode) return this.parentNode.closest(sel);
    return null;
  }

  querySelector(sel) {
    const parts = sel.split(/[\s>]+/).filter(Boolean);
    const target = parts[parts.length - 1];
    for (let c of this.children) {
      if (c._matches(target)) return c;
      const res = c.querySelector(target);
      if (res) return res;
    }
    return null;
  }

  querySelectorAll(sel) {
    const parts = sel.split(/[\s>]+/).filter(Boolean);
    const target = parts[parts.length - 1];
    let res = [];
    for (let c of this.children) {
      if (c._matches(target)) res.push(c);
      res.push(...c.querySelectorAll(target));
    }
    return res;
  }
}

function parseSimpleHtml(html) {
  const comp = new MockDOMElement('li');
  const classMatch = html.match(/class="([^"]+)"/);
  if (classMatch) comp.className = classMatch[1];
  const idMatch = html.match(/id="([^"]+)"/);
  if (idMatch) comp.setAttribute('id', idMatch[1]);
  const dataMatches = html.matchAll(/data-([a-z0-9-]+)="([^"]+)"/g);
  for (const match of dataMatches) {
    comp.setAttribute(`data-${match[1]}`, match[2]);
  }

  // Action bar
  const actionSpan = new MockDOMElement('span');
  actionSpan.className = 'action-bar delete-action';
  const label = new MockDOMElement('label');
  label.className = 'mark-for-deletion-action button';
  const input = new MockDOMElement('input');
  input.type = 'checkbox';
  const chIdMatch = html.match(/id="(mark-for-deletion-[^"]+)"/);
  if (chIdMatch) input.setAttribute('id', chIdMatch[1]);
  label.appendChild(input);
  actionSpan.appendChild(label);
  comp.appendChild(actionSpan);

  // Content
  const contentSpan = new MockDOMElement('span');
  contentSpan.className = 'content';
  comp.appendChild(contentSpan);

  return comp;
}

global.document = {
  createElement: (tag) => {
    if (tag === 'template') {
      const el = new MockDOMElement('template');
      el.content = new MockDOMElement('div');
      Object.defineProperty(el, 'innerHTML', {
        set(html) {
          const parsed = parseSimpleHtml(html);
          el.content.children = [parsed];
          parsed.parentNode = el.content;
        },
      });
      return el;
    }
    return new MockDOMElement(tag);
  },
};

const CollectionEditor = (await import('../js/collection-editor.mjs')).default;

test('CollectionEditor Unit Suite in hinolugi-support.js', async (t) => {
  await t.test('1. CollectionEditor.createItemRow builds standard list item markup and attributes', () => {
    const row = CollectionEditor.createItemRow({
      id: 'webhook-42',
      className: 'webhook',
      dataAttributes: { 'webhook-id': 42 },
      contentHtml: '<span class="target-url">https://example.com</span>',
      actionsHtml: '<button data-action="toggle">Toggle</button>',
    });

    assert.ok(row, 'Row element created');
    assert.equal(row.tagName, 'LI');
    assert.ok(row.classList.contains('webhook'));
    assert.equal(row.dataset.webhookId, '42');

    const checkbox = row.querySelector('.mark-for-deletion-action > input');
    assert.ok(checkbox, 'Mark-for-deletion checkbox is present');
    assert.equal(checkbox.type, 'checkbox');
    assert.equal(checkbox.id, 'mark-for-deletion-webhook-42');
  });

  await t.test('2. CollectionEditor sets and renders items with empty state management', () => {
    const headerEl = new MockDOMElement('div');
    const listEl = new MockDOMElement('ul');
    const emptyStateEl = new MockDOMElement('div');
    const deleteButtonEl = new MockDOMElement('button');

    const editor = new CollectionEditor({
      headerEl,
      listEl,
      emptyStateEl,
      deleteButtonEl,
      itemSelector: 'li.unit',
    });

    assert.equal(editor.getItemCount(), 0);
    assert.ok(!emptyStateEl.classList.contains('disabled'));
    assert.ok(listEl.classList.contains('disabled'));
    assert.ok(deleteButtonEl.classList.contains('disabled'));

    const items = [
      { name: '100g', value: 89 },
      { name: 'Piece', value: 105 },
    ];

    editor.setItems(items, (item) => {
      const row = new MockDOMElement('li');
      row.className = 'unit';
      row.dataset.name = item.name;
      row.dataset.value = String(item.value);

      const actionSpan = new MockDOMElement('span');
      actionSpan.className = 'mark-for-deletion-action';
      const ch = new MockDOMElement('input');
      ch.type = 'checkbox';
      actionSpan.appendChild(ch);
      row.appendChild(actionSpan);

      return row;
    });

    assert.equal(editor.getItemCount(), 2);
    assert.ok(emptyStateEl.classList.contains('disabled'));
    assert.ok(!listEl.classList.contains('disabled'));
  });

  await t.test('3. updateSelectionState and getSelectedElements track checked items and update delete button', () => {
    const listEl = new MockDOMElement('ul');
    const deleteButtonEl = new MockDOMElement('button');
    let notifiedCount = -1;

    const editor = new CollectionEditor({
      listEl,
      deleteButtonEl,
      itemSelector: 'li.unit',
      onSelectionChange: (count) => {
        notifiedCount = count;
      },
    });

    const row1 = new MockDOMElement('li');
    row1.className = 'unit';
    const actionSpan1 = new MockDOMElement('span');
    actionSpan1.className = 'mark-for-deletion-action';
    const ch1 = new MockDOMElement('input');
    ch1.type = 'checkbox';
    actionSpan1.appendChild(ch1);
    row1.appendChild(actionSpan1);
    listEl.appendChild(row1);

    const row2 = new MockDOMElement('li');
    row2.className = 'unit';
    const actionSpan2 = new MockDOMElement('span');
    actionSpan2.className = 'mark-for-deletion-action';
    const ch2 = new MockDOMElement('input');
    ch2.type = 'checkbox';
    actionSpan2.appendChild(ch2);
    row2.appendChild(actionSpan2);
    listEl.appendChild(row2);

    editor.updateSelectionState();
    assert.equal(editor.getSelectedCount(), 0);
    assert.ok(deleteButtonEl.classList.contains('disabled'));

    ch1.checked = true;
    editor.updateSelectionState();
    assert.equal(editor.getSelectedCount(), 1);
    assert.equal(notifiedCount, 1);
    assert.ok(!deleteButtonEl.classList.contains('disabled'));

    ch2.checked = true;
    editor.updateSelectionState();
    assert.equal(editor.getSelectedCount(), 2);
    assert.equal(notifiedCount, 2);

    const deleted = editor.removeSelectedItems();
    assert.equal(deleted, 2);
    assert.equal(editor.getItemCount(), 0);
    assert.equal(editor.getSelectedCount(), 0);
    assert.ok(deleteButtonEl.classList.contains('disabled'));
  });

  await t.test('4. clearInputs resets all configured input values', () => {
    const input1 = new MockDOMElement('input');
    input1.value = '100';
    const input2 = new MockDOMElement('input');
    input2.value = 'grams';

    const editor = new CollectionEditor({
      inputs: [input1, input2],
    });

    editor.clearInputs();
    assert.equal(input1.value, '');
    assert.equal(input2.value, '');
  });

  await t.test('5. Enter key on creation inputs and button clicks trigger configured callbacks', () => {
    const input = new MockDOMElement('input');
    const addButton = new MockDOMElement('button');
    let addTriggered = 0;

    const editor = new CollectionEditor({
      inputs: [input],
      addButtonEl: addButton,
      onAdd: () => {
        addTriggered += 1;
      },
    });

    input.dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault: () => {} });
    assert.equal(addTriggered, 1, 'Enter key triggered onAdd');

    addButton.dispatchEvent({ type: 'click', preventDefault: () => {} });
    assert.equal(addTriggered, 2, 'Add button click triggered onAdd');

    editor.destroy();
  });
});
