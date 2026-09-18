import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isEnabled,
  isDisabled,
  disable,
  enable,
  reset,
  removeValidityMarks,
  markValid,
  markInvalid,
  validateInputField,
  validateEmailField,
  validatePasswordField,
  handlePasswordDisclosure,
  setButtonLoading,
} from '../js/formutils.mjs';

// Minimal fake DOM element, just enough to exercise formutils.mjs without a jsdom dependency.
class FakeElement {
  constructor(tag, classes = []) {
    this.tag = tag;
    this._classes = new Set(classes);
    this._attrs = {};
    this.dataset = {};
    this.children = [];
    this.parent = null;
    this._listeners = {};
    this.value = '';
    this._innerHTML = '';
    this._textContent = undefined;
    this.disabled = false;
  }

  get textContent() {
    if (this._textContent !== undefined) return this._textContent;
    if (this.children.length > 0) return this.children.map((c) => c.textContent).join('');
    return this._innerHTML || '';
  }

  set textContent(v) {
    this._textContent = v;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(v) {
    this._innerHTML = v;
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  get classList() {
    const classes = this._classes;
    return {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    };
  }

  hasAttribute(name) {
    return name in this._attrs;
  }

  getAttribute(name) {
    return this._attrs[name];
  }

  setAttribute(name, value) {
    this._attrs[name] = value;
    if (name === 'type') {
      this.type = value;
    }
  }

  closest(selector) {
    const matchesSelector = selector.startsWith('.')
      ? (node) => node._classes.has(selector.slice(1))
      : (node) => node.tag === selector;
    let node = this;
    while (node) {
      if (matchesSelector(node)) {
        return node;
      }
      node = node.parent;
    }
    return null;
  }

  querySelector(selector) {
    const parts = selector.split('>').map((s) => s.trim());
    const matches = (node, part) => (part.startsWith('.') ? node._classes.has(part.slice(1)) : node.tag === part);
    const search = (node) => {
      for (const child of node.children) {
        const lastPart = parts[parts.length - 1];
        const parentOk = parts.length === 1 || matches(node, parts[parts.length - 2]);
        if (parentOk && matches(child, lastPart)) {
          return child;
        }
        const found = search(child);
        if (found) {
          return found;
        }
      }
      return null;
    };
    return search(this);
  }

  addEventListener(type, callback) {
    this._listeners[type] = this._listeners[type] || [];
    this._listeners[type].push(callback);
  }

  dispatch(type, ev) {
    (this._listeners[type] || []).forEach((cb) => cb(ev));
  }
}

function makeInputGroup() {
  const inputGroupEl = new FakeElement('div', ['input-group']);
  const inputEl = inputGroupEl.appendChild(new FakeElement('input'));
  const errorTextEl = inputGroupEl.appendChild(new FakeElement('span', ['error-text']));
  return { inputGroupEl, inputEl, errorTextEl };
}

describe('isEnabled / isDisabled', () => {
  test('reflect the disabled class', () => {
    const el = new FakeElement('input');
    assert.equal(isEnabled(el), true);
    assert.equal(isDisabled(el), false);
    el.classList.add('disabled');
    assert.equal(isEnabled(el), false);
    assert.equal(isDisabled(el), true);
  });
});

describe('disable / enable', () => {
  test('disable adds the class, sets readOnly, and remembers the title', () => {
    const el = new FakeElement('input');
    el.setAttribute('title', 'Original title');
    disable(el, 'Disabled now');
    assert.equal(isDisabled(el), true);
    assert.equal(el.readOnly, true);
    assert.equal(el.getAttribute('title'), 'Disabled now');
    assert.equal(el.dataset.enabledText, 'Original title');
  });

  test('enable removes the class, clears readOnly, and restores the title', () => {
    const el = new FakeElement('input');
    el.setAttribute('title', 'Original title');
    disable(el, 'Disabled now');
    enable(el);
    assert.equal(isEnabled(el), true);
    assert.equal(el.readOnly, false);
    assert.equal(el.getAttribute('title'), 'Original title');
  });
});

describe('reset', () => {
  test('clears the value, removes validity marks, and re-enables the field', () => {
    const { inputGroupEl, inputEl } = makeInputGroup();
    inputEl.value = 'some text';
    disable(inputEl);
    markInvalid(inputEl, 'bad');
    reset(inputEl);
    assert.equal(inputEl.value, null);
    assert.equal(isEnabled(inputEl), true);
    assert.equal(inputGroupEl.classList.contains('valid'), false);
    assert.equal(inputGroupEl.classList.contains('invalid'), false);
  });
});

describe('markValid / markInvalid / removeValidityMarks', () => {
  test('markValid adds valid and removes invalid', () => {
    const { inputGroupEl, inputEl } = makeInputGroup();
    inputGroupEl.classList.add('invalid');
    markValid(inputEl);
    assert.equal(inputGroupEl.classList.contains('valid'), true);
    assert.equal(inputGroupEl.classList.contains('invalid'), false);
  });

  test('markInvalid adds invalid, removes valid, and sets the error text', () => {
    const { inputGroupEl, inputEl, errorTextEl } = makeInputGroup();
    inputGroupEl.classList.add('valid');
    markInvalid(inputEl, 'Something is wrong');
    assert.equal(inputGroupEl.classList.contains('invalid'), true);
    assert.equal(inputGroupEl.classList.contains('valid'), false);
    assert.equal(errorTextEl.innerHTML, 'Something is wrong');
  });

  test('removeValidityMarks clears both classes', () => {
    const { inputGroupEl, inputEl } = makeInputGroup();
    inputGroupEl.classList.add('valid');
    removeValidityMarks(inputEl);
    assert.equal(inputGroupEl.classList.contains('valid'), false);
    assert.equal(inputGroupEl.classList.contains('invalid'), false);
  });
});

describe('validateInputField / validateEmailField', () => {
  test('rejects a missing required value', () => {
    const { inputGroupEl, inputEl } = makeInputGroup();
    inputEl.setAttribute('required', '');
    inputEl.value = '  ';
    assert.equal(validateInputField(inputEl), false);
    assert.equal(inputGroupEl.classList.contains('invalid'), true);
  });

  test('accepts a missing optional value', () => {
    const { inputEl } = makeInputGroup();
    inputEl.value = '';
    assert.equal(validateInputField(inputEl), true);
  });

  test('rejects an invalid email address', () => {
    const { inputGroupEl, inputEl } = makeInputGroup();
    inputEl.value = 'not-an-email';
    assert.equal(validateEmailField(inputEl), false);
    assert.equal(inputGroupEl.classList.contains('invalid'), true);
  });

  test('accepts a valid email address', () => {
    const { inputGroupEl, inputEl } = makeInputGroup();
    inputEl.value = 'user@example.com';
    assert.equal(validateEmailField(inputEl), true);
    assert.equal(inputGroupEl.classList.contains('valid'), true);
  });
});

describe('validatePasswordField', () => {
  test('rejects a missing required password', () => {
    const { inputGroupEl, inputEl } = makeInputGroup();
    inputEl.setAttribute('required', '');
    inputEl.value = '';
    assert.equal(validatePasswordField(inputEl), false);
    assert.equal(inputGroupEl.classList.contains('invalid'), true);
  });

  test('rejects a too-short password', () => {
    const { inputGroupEl, inputEl } = makeInputGroup();
    inputEl.value = 'abc';
    assert.equal(validatePasswordField(inputEl), false);
    assert.equal(inputGroupEl.classList.contains('invalid'), true);
  });

  test('accepts a valid password', () => {
    const { inputGroupEl, inputEl } = makeInputGroup();
    inputEl.value = 'abcdef';
    assert.equal(validatePasswordField(inputEl), true);
    assert.equal(inputGroupEl.classList.contains('valid'), true);
  });
});

describe('handlePasswordDisclosure', () => {
  test('toggles the password input type and icon class on click', () => {
    const iconInputEl = new FakeElement('div', ['icon-input']);
    const passwordEl = iconInputEl.appendChild(new FakeElement('input'));
    passwordEl.type = 'password';
    const buttonEl = iconInputEl.appendChild(new FakeElement('button'));
    const iconEl = buttonEl.appendChild(new FakeElement('i', ['icon', 'fa-eye']));

    handlePasswordDisclosure(iconEl);
    const ev = { preventDefault: () => {}, stopPropagation: () => {} };
    buttonEl.dispatch('click', ev);
    assert.equal(passwordEl.type, 'text');
    assert.equal(iconEl.classList.contains('fa-eye-slash'), true);

    buttonEl.dispatch('click', ev);
    assert.equal(passwordEl.type, 'password');
    assert.equal(iconEl.classList.contains('fa-eye'), true);
  });

  test('throws when the required structure is missing', () => {
    const el = new FakeElement('div');
    assert.throws(() => handlePasswordDisclosure(el), /Cannot determine root .icon-input/);
  });
});

describe('setButtonLoading', () => {
  test('safely ignores null or undefined element', () => {
    assert.doesNotThrow(() => setButtonLoading(null, true));
    assert.doesNotThrow(() => setButtonLoading(undefined, false));
  });

  test('toggles loading state, disables button, and injects spinner', () => {
    const button = new FakeElement('button');
    button.innerHTML = 'Save Preferences';

    setButtonLoading(button, true);

    assert.equal(button.disabled, true);
    assert.equal(button.classList.contains('is-loading'), true);
    assert.equal(button.dataset.originalContent, 'Save Preferences');
    assert.ok(button.innerHTML.includes('fa-circle-notch fa-spin'));
    assert.ok(button.innerHTML.includes('Save Preferences'));

    setButtonLoading(button, false);

    assert.equal(button.disabled, false);
    assert.equal(button.classList.contains('is-loading'), false);
    assert.equal(button.innerHTML, 'Save Preferences');
    assert.equal(button.dataset.originalContent, undefined);
  });

  test('supports custom loadingText', () => {
    const button = new FakeElement('button');
    button.innerHTML = 'Export Data';

    setButtonLoading(button, true, 'Exporting...');

    assert.equal(button.disabled, true);
    assert.equal(button.classList.contains('is-loading'), true);
    assert.ok(button.innerHTML.includes('Exporting...'));

    setButtonLoading(button, false);
    assert.equal(button.innerHTML, 'Export Data');
  });

  test('extracts label from child .text element if present', () => {
    const button = new FakeElement('button');
    const span = new FakeElement('span', ['text']);
    span.textContent = 'Submit Form';
    button.appendChild(span);
    button.innerHTML = '<span class="text">Submit Form</span>';

    setButtonLoading(button, true);
    assert.ok(button.innerHTML.includes('Submit Form'));

    setButtonLoading(button, false);
    assert.equal(button.innerHTML, '<span class="text">Submit Form</span>');
  });
});
