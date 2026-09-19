/**
 * Lightweight, zero-dependency headless Mock DOM utility for test environments.
 * Supports MockElement, MockDocument, MockDocumentFragment, and global installer hooks.
 * @module mock-dom
 */

function escapeHtml(val) {
  return String(val == null ? '' : val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(val) {
  return String(val == null ? '' : val)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function splitCommas(sel) {
  const parts = [];
  let cur = '';
  let inBracket = false;
  let inQuote = null;

  for (let i = 0; i < sel.length; i++) {
    const ch = sel[i];
    if (inQuote) {
      cur += ch;
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      cur += ch;
      continue;
    }
    if (ch === '[') {
      inBracket = true;
      cur += ch;
      continue;
    }
    if (ch === ']') {
      inBracket = false;
      cur += ch;
      continue;
    }
    if (ch === ',' && !inBracket) {
      if (cur.trim()) parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function tokenizeSelector(sel) {
  const rawTokens = [];
  let cur = '';
  let inBracket = false;
  let inQuote = null;

  for (let i = 0; i < sel.length; i++) {
    const ch = sel[i];
    if (inQuote) {
      cur += ch;
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      cur += ch;
      continue;
    }
    if (ch === '[') {
      inBracket = true;
      cur += ch;
      continue;
    }
    if (ch === ']') {
      inBracket = false;
      cur += ch;
      continue;
    }
    if (inBracket) {
      cur += ch;
      continue;
    }

    if (ch === '>' || ch === '+' || ch === '~') {
      if (cur.trim()) rawTokens.push(cur.trim());
      cur = '';
      rawTokens.push(ch);
      continue;
    }

    if (/\s/.test(ch)) {
      if (cur.trim()) {
        rawTokens.push(cur.trim());
        cur = '';
      }
      rawTokens.push(' ');
      continue;
    }

    cur += ch;
  }
  if (cur.trim()) rawTokens.push(cur.trim());

  const tokens = [];
  for (let i = 0; i < rawTokens.length; i++) {
    const t = rawTokens[i];
    if (t === ' ') {
      const prev = tokens[tokens.length - 1];
      const next = rawTokens[i + 1];
      if (!prev || prev === '>' || prev === '+' || prev === '~' || prev === ' ') continue;
      if (next === '>' || next === '+' || next === '~') continue;
    }
    tokens.push(t);
  }
  return tokens;
}

function matchCompound(element, sel) {
  if (!element || !(element instanceof MockElement)) return false;
  if (!sel || sel === '*') return true;

  const attrRegex = /\[([a-zA-Z0-9_:-]+)(?:([~|^$*]?=)(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/g;
  let remaining = sel;
  let attrMatch;

  while ((attrMatch = attrRegex.exec(sel)) !== null) {
    const attrName = attrMatch[1];
    const op = attrMatch[2];
    const expected = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? null;

    if (!element.hasAttribute(attrName)) {
      if (attrName.startsWith('data-')) {
        const dKey = attrName.slice(5).replace(/-([a-z0-9])/g, (_, l) => l.toUpperCase());
        if (element.dataset[dKey] === undefined) return false;
      } else {
        return false;
      }
    }

    if (op) {
      const actual = element.getAttribute(attrName);
      if (op === '=' && actual !== expected) return false;
      if (op === '^=' && (!actual || !actual.startsWith(expected))) return false;
      if (op === '$=' && (!actual || !actual.endsWith(expected))) return false;
      if (op === '*=' && (!actual || !actual.includes(expected))) return false;
      if (op === '~=' && (!actual || !actual.split(/\s+/).includes(expected))) return false;
      if (op === '|=' && (!actual || (actual !== expected && !actual.startsWith(expected + '-')))) return false;
    }
  }
  remaining = remaining.replace(attrRegex, '');

  if (remaining.includes(':checked')) {
    if (!element.checked) return false;
    remaining = remaining.replace(/:checked/g, '');
  }
  if (remaining.includes(':disabled')) {
    if (!element.disabled) return false;
    remaining = remaining.replace(/:disabled/g, '');
  }
  if (remaining.includes(':first-child')) {
    if (!element.parentNode || element.parentNode.children[0] !== element) return false;
    remaining = remaining.replace(/:first-child/g, '');
  }
  if (remaining.includes(':last-child')) {
    if (!element.parentNode || element.parentNode.children[element.parentNode.children.length - 1] !== element) {
      return false;
    }
    remaining = remaining.replace(/:last-child/g, '');
  }

  const idMatch = remaining.match(/#([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    if (element.id !== idMatch[1] && element.getAttribute('id') !== idMatch[1]) return false;
    remaining = remaining.replace(/#[a-zA-Z0-9_-]+/, '');
  }

  const classMatches = remaining.match(/\.([a-zA-Z0-9_-]+)/g);
  if (classMatches) {
    for (const cm of classMatches) {
      const cls = cm.slice(1);
      if (!element.classList.contains(cls)) return false;
    }
    remaining = remaining.replace(/\.[a-zA-Z0-9_-]+/g, '');
  }

  const tag = remaining.trim();
  if (tag && tag !== '*') {
    if (element.tagName !== tag.toUpperCase()) return false;
  }

  return true;
}

function matchesSelector(element, selector) {
  if (!element || !(element instanceof MockElement)) return false;
  if (!selector) return false;

  const parts = splitCommas(selector);
  if (parts.length > 1) {
    return parts.some((p) => matchesSelector(element, p));
  }

  const tokens = tokenizeSelector(selector);
  if (tokens.length === 0) return false;

  function matchStep(node, tokenIdx) {
    if (!node || !(node instanceof MockElement)) return false;
    const compound = tokens[tokenIdx];
    if (!matchCompound(node, compound)) return false;
    if (tokenIdx === 0) return true;

    const combinator = tokens[tokenIdx - 1];
    const prevCompoundIdx = tokenIdx - 2;

    if (combinator === '>') {
      return matchStep(node.parentNode, prevCompoundIdx);
    } else if (combinator === ' ') {
      let cur = node.parentNode;
      while (cur) {
        if (matchStep(cur, prevCompoundIdx)) return true;
        cur = cur.parentNode;
      }
      return false;
    } else if (combinator === '+') {
      if (!node.parentNode) return false;
      const sibs = node.parentNode.children;
      const idx = sibs.indexOf(node);
      if (idx > 0) {
        return matchStep(sibs[idx - 1], prevCompoundIdx);
      }
      return false;
    }
    return false;
  }

  return matchStep(element, tokens.length - 1);
}

function parseHtml(html) {
  if (!html || typeof html !== 'string') return [];

  const root = new MockDocumentFragment();
  const stack = [root];
  const voidTags = new Set([
    'AREA',
    'BASE',
    'BR',
    'COL',
    'EMBED',
    'HR',
    'IMG',
    'INPUT',
    'LINK',
    'META',
    'PARAM',
    'SOURCE',
    'TRACK',
    'WBR',
  ]);
  const isHeading = (t) => /^H[1-6]$/.test(t);

  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9-]+)([^>]*)>|([^<]+)/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const [full, isClose, tagName, rawAttrs, text] = match;

    if (full.startsWith('<!--')) {
      continue;
    }

    if (text !== undefined && text !== '') {
      const parent = stack[stack.length - 1];
      const textNode = new MockTextNode(text);
      if (parent.tagName === 'TEMPLATE' && parent.content) {
        parent.content.appendChild(textNode);
      } else {
        parent.appendChild(textNode);
      }
      continue;
    }

    if (isClose) {
      const tagUpper = tagName.toUpperCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tagName === tagUpper || (isHeading(tagUpper) && isHeading(stack[i].tagName))) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const tagUpper = tagName.toUpperCase();
    const isSelfClosing = rawAttrs.trim().endsWith('/') || voidTags.has(tagUpper);
    const el = new MockElement(tagName);

    const attrRegex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1];
      if (attrName === '/') continue;
      const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
      el.setAttribute(attrName, attrVal);
    }

    const currentParent = stack[stack.length - 1];
    if (currentParent) {
      if (currentParent.tagName === 'TEMPLATE' && currentParent.content) {
        currentParent.content.appendChild(el);
      } else {
        currentParent.appendChild(el);
      }
    }

    if (!isSelfClosing) {
      stack.push(el);
    }
  }

  return [...root.childNodes];
}

function serializeNode(node) {
  if (node instanceof MockTextNode) {
    return node.textContent;
  }
  if (!(node instanceof MockElement)) {
    return '';
  }

  const tag = node.tagName.toLowerCase();
  const attrs = [];

  if (node.id) attrs.push(`id="${escapeAttr(node.id)}"`);
  if (node.classList._classes.size > 0) {
    attrs.push(`class="${escapeAttr(Array.from(node.classList._classes).join(' '))}"`);
  }
  for (const [k, v] of node.attributes.entries()) {
    if (k !== 'id' && k !== 'class') {
      attrs.push(v ? `${k}="${escapeAttr(v)}"` : k);
    }
  }

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  const voidTags = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ]);

  if (voidTags.has(tag)) {
    return `<${tag}${attrStr}>`;
  }

  const inner =
    node.childNodes.length > 0
      ? node.childNodes.map(serializeNode).join('')
      : node.children.length > 0
        ? node.children.map(serializeNode).join('')
        : node._textContent !== undefined
          ? escapeHtml(node._textContent)
          : node._innerHTML || '';

  return `<${tag}${attrStr}>${inner}</${tag}>`;
}

function createDatasetProxy(element) {
  return new Proxy(
    {},
    {
      get(target, prop) {
        if (typeof prop === 'symbol') return target[prop];
        if (prop === 'toJSON') {
          return () => {
            const res = {};
            for (const [k, v] of element.attributes.entries()) {
              if (k.startsWith('data-')) {
                const camel = k.slice(5).replace(/-([a-z0-9])/g, (_, l) => l.toUpperCase());
                res[camel] = v;
              }
            }
            return res;
          };
        }
        const kebab = 'data-' + prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        return element.attributes.has(kebab) ? element.attributes.get(kebab) : target[prop];
      },
      set(target, prop, val) {
        if (typeof prop === 'symbol') {
          target[prop] = val;
          return true;
        }
        const strVal = String(val);
        const kebab = 'data-' + prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        element.attributes.set(kebab, strVal);
        target[prop] = strVal;
        return true;
      },
      deleteProperty(target, prop) {
        if (typeof prop === 'symbol') {
          delete target[prop];
          return true;
        }
        const kebab = 'data-' + prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        element.attributes.delete(kebab);
        delete target[prop];
        return true;
      },
      has(target, prop) {
        if (typeof prop === 'symbol') return prop in target;
        const kebab = 'data-' + prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        return element.attributes.has(kebab) || prop in target;
      },
      ownKeys(target) {
        const keys = new Set(Object.keys(target));
        for (const k of element.attributes.keys()) {
          if (k.startsWith('data-')) {
            const camel = k.slice(5).replace(/-([a-z0-9])/g, (_, l) => l.toUpperCase());
            keys.add(camel);
          }
        }
        return Array.from(keys);
      },
      getOwnPropertyDescriptor(target, prop) {
        const kebab = typeof prop === 'string' ? 'data-' + prop.replace(/([A-Z])/g, '-$1').toLowerCase() : null;
        if (kebab && element.attributes.has(kebab)) {
          return {
            enumerable: true,
            configurable: true,
            writable: true,
            value: element.attributes.get(kebab),
          };
        }
        if (prop in target) {
          return Object.getOwnPropertyDescriptor(target, prop);
        }
        return undefined;
      },
    },
  );
}

/**
 * Mock representation of a DOM Text node.
 */
export class MockTextNode {
  /**
   * Creates an instance of MockTextNode.
   * @param {string} [text=''] - Initial text content.
   */
  constructor(text = '') {
    this.nodeType = 3;
    this.textContent = String(text);
    this.parentNode = null;
    this._ownerDocument = null;
  }

  /**
   * Gets the text data.
   * @returns {string} Text content.
   */
  get data() {
    return this.textContent;
  }

  /**
   * Sets the text data.
   * @param {*} val - New text data.
   */
  set data(val) {
    this.textContent = String(val);
  }

  /**
   * Gets the node value.
   * @returns {string} Text content.
   */
  get nodeValue() {
    return this.textContent;
  }

  /**
   * Sets the node value.
   * @param {*} val - New node value.
   */
  set nodeValue(val) {
    this.textContent = String(val);
  }

  /**
   * Clones this text node.
   * @returns {MockTextNode} New clone of this text node.
   */
  cloneNode() {
    return new MockTextNode(this.textContent);
  }

  /**
   * Removes this text node from its parent.
   * @returns {void}
   */
  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }
}

/**
 * Mock representation of a DOM Element for headless testing.
 */
export class MockElement {
  /**
   * Creates an instance of MockElement.
   * @param {string} [tagName='div'] - Element tag name.
   */
  constructor(tagName = 'div') {
    this.nodeType = 1;
    this.tagName = String(tagName || 'div').toUpperCase();
    this.children = [];
    this.childNodes = [];
    this.parentNode = null;
    this.attributes = new Map();
    this._listeners = new Map();
    this._value = '';
    this._disabled = false;
    this._checked = false;
    this._innerHTML = '';
    this._innerHTMLStale = false;
    this._textContent = undefined;
    this._ownerDocument = null;

    this.classList = {
      _classes: new Set(),
      add: (...cls) =>
        cls.forEach((c) => {
          if (c && typeof c === 'string') this.classList._classes.add(c.trim());
        }),
      remove: (...cls) => cls.forEach((c) => this.classList._classes.delete(c)),
      contains: (c) => this.classList._classes.has(c),
      toggle: (c, force) => {
        const shouldAdd = force !== undefined ? Boolean(force) : !this.classList._classes.has(c);
        if (shouldAdd) {
          this.classList._classes.add(c);
        } else {
          this.classList._classes.delete(c);
        }
        return shouldAdd;
      },
      replace: (oldCls, newCls) => {
        if (this.classList._classes.has(oldCls)) {
          this.classList._classes.delete(oldCls);
          this.classList._classes.add(newCls);
          return true;
        }
        return false;
      },
      get value() {
        return Array.from(this._classes).join(' ');
      },
      set value(val) {
        this._classes.clear();
        String(val || '')
          .split(/\s+/)
          .filter(Boolean)
          .forEach((c) => this.add(c));
      },
      get length() {
        return this._classes.size;
      },
      entries: () => this.classList._classes.entries(),
      keys: () => this.classList._classes.keys(),
      values: () => this.classList._classes.values(),
      forEach: (cb, thisArg) => this.classList._classes.forEach(cb, thisArg),
      [Symbol.iterator]: () => this.classList._classes[Symbol.iterator](),
      toString: () => this.classList.value,
    };

    this.dataset = createDatasetProxy(this);

    this.style = {
      setProperty: (prop, val) => {
        this.style[prop] = String(val);
      },
      getPropertyValue: (prop) => this.style[prop] || '',
      removeProperty: (prop) => {
        const val = this.style[prop];
        delete this.style[prop];
        return val || '';
      },
    };

    if (this.tagName === 'TEMPLATE') {
      this.content = new MockDocumentFragment();
      this.content._host = this;
    }
  }

  /**
   * Gets the element ID.
   * @returns {string} Element ID attribute.
   */
  get id() {
    return this.getAttribute('id') || '';
  }
  /**
   * Sets the element ID.
   * @param {*} val - ID value.
   */
  set id(val) {
    if (val != null && val !== '') {
      this.setAttribute('id', val);
    } else {
      this.removeAttribute('id');
    }
  }

  /**
   * Gets the element title.
   * @returns {string} Element title attribute.
   */
  get title() {
    return this.getAttribute('title') || '';
  }
  /**
   * Sets the element title.
   * @param {*} val - Title value.
   */
  set title(val) {
    if (val != null && val !== '') {
      this.setAttribute('title', val);
    } else {
      this.removeAttribute('title');
    }
  }

  /**
   * Gets the class name string.
   * @returns {string} Space-delimited list of classes.
   */
  get className() {
    return this.classList.value;
  }
  /**
   * Sets the class name string.
   * @param {*} val - New class name value.
   */
  set className(val) {
    this.classList.value = val;
  }

  /**
   * Gets the element value.
   * @returns {string} Input or element value.
   */
  get value() {
    return this._value !== undefined ? this._value : this.getAttribute('value') || '';
  }
  /**
   * Sets the element value.
   * @param {*} val - New value.
   */
  set value(val) {
    this._value = String(val == null ? '' : val);
  }

  /**
   * Gets whether element is disabled.
   * @returns {boolean} True if disabled.
   */
  get disabled() {
    return Boolean(this._disabled || this.hasAttribute('disabled'));
  }
  /**
   * Sets whether element is disabled.
   * @param {*} val - Disabled state.
   */
  set disabled(val) {
    this._disabled = Boolean(val);
    if (this._disabled) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  /**
   * Gets whether element is checked.
   * @returns {boolean} True if checked.
   */
  get checked() {
    return Boolean(this._checked || this.hasAttribute('checked'));
  }
  /**
   * Sets whether element is checked.
   * @param {*} val - Checked state.
   */
  set checked(val) {
    this._checked = Boolean(val);
    if (this._checked) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
  }

  /**
   * Gets the text content of the element and its descendants.
   * @returns {string} Combined text content.
   */
  get textContent() {
    if (this.childNodes.length > 0) {
      return this.childNodes.map((n) => n.textContent).join('');
    }
    if (this.children.length > 0) {
      return this.children.map((c) => c.textContent).join('');
    }
    if (this._textContent !== undefined) {
      return this._textContent;
    }
    return this._innerHTML || '';
  }
  /**
   * Sets the text content of the element.
   * @param {*} val - New text content.
   */
  set textContent(val) {
    this._textContent = String(val == null ? '' : val);
    this.children = [];
    this.childNodes = [];
    if (this._textContent) {
      const textNode = new MockTextNode(this._textContent);
      textNode.parentNode = this;
      this.childNodes.push(textNode);
    }
    this._innerHTML = escapeHtml(this._textContent);
    this._innerHTMLStale = false;
  }

  /**
   * Gets the inner text of the element.
   * @returns {string} Inner text.
   */
  get innerText() {
    return this.textContent;
  }
  /**
   * Sets the inner text of the element.
   * @param {*} val - Inner text.
   */
  set innerText(val) {
    this.textContent = val;
  }

  /**
   * Gets the serialized HTML content within the element.
   * @returns {string} Inner HTML.
   */
  get innerHTML() {
    if (!this._innerHTMLStale && this._innerHTML !== '') {
      return this._innerHTML;
    }
    if (this.childNodes.length > 0) {
      return this.childNodes.map(serializeNode).join('');
    }
    if (this.children.length > 0) {
      return this.children.map(serializeNode).join('');
    }
    return this._innerHTML || '';
  }
  /**
   * Sets the HTML content within the element, parsing it into child nodes.
   * @param {*} val - HTML string.
   */
  set innerHTML(val) {
    this._innerHTML = val == null ? '' : String(val);
    this._innerHTMLStale = false;
    this.children = [];
    this.childNodes = [];
    this._textContent = undefined;

    const parsed = parseHtml(this._innerHTML);
    if (this.tagName === 'TEMPLATE' && this.content) {
      this.content.children = [];
      this.content.childNodes = [];
      for (const node of parsed) {
        this.content.appendChild(node);
      }
    } else {
      for (const node of parsed) {
        this.appendChild(node);
      }
    }
  }

  /**
   * Gets the first child node.
   * @returns {MockElement|MockTextNode|null} First child node or null.
   */
  get firstChild() {
    return this.childNodes[0] || this.children[0] || null;
  }

  /**
   * Gets the last child node.
   * @returns {MockElement|MockTextNode|null} Last child node or null.
   */
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || this.children[this.children.length - 1] || null;
  }

  /**
   * Gets the first child element.
   * @returns {MockElement|null} First element child or null.
   */
  get firstElementChild() {
    return this.children[0] || null;
  }

  /**
   * Gets the last child element.
   * @returns {MockElement|null} Last element child or null.
   */
  get lastElementChild() {
    return this.children[this.children.length - 1] || null;
  }

  /**
   * Gets the count of child elements.
   * @returns {number} Number of child elements.
   */
  get childElementCount() {
    return this.children.length;
  }

  /**
   * Gets the next sibling element.
   * @returns {MockElement|null} Next sibling element or null.
   */
  get nextElementSibling() {
    if (!this.parentNode) return null;
    const idx = this.parentNode.children.indexOf(this);
    return idx >= 0 && idx < this.parentNode.children.length - 1 ? this.parentNode.children[idx + 1] : null;
  }

  /**
   * Gets the previous sibling element.
   * @returns {MockElement|null} Previous sibling element or null.
   */
  get previousElementSibling() {
    if (!this.parentNode) return null;
    const idx = this.parentNode.children.indexOf(this);
    return idx > 0 ? this.parentNode.children[idx - 1] : null;
  }

  /**
   * Sets an attribute value.
   * @param {string} name - Attribute name.
   * @param {*} val - Attribute value.
   * @returns {void}
   */
  setAttribute(name, val) {
    const strVal = String(val == null ? '' : val);
    this.attributes.set(name, strVal);
    if (name === 'class') {
      this.classList.value = strVal;
    } else if (name === 'disabled') {
      this._disabled = true;
    } else if (name === 'checked') {
      this._checked = true;
    } else if (name === 'value') {
      this._value = strVal;
    }
    this._innerHTMLStale = true;
  }

  /**
   * Gets an attribute value.
   * @param {string} name - Attribute name.
   * @returns {string|null} Attribute value or null if not present.
   */
  getAttribute(name) {
    if (name === 'class' && this.classList._classes.size > 0) {
      return this.classList.value;
    }
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  /**
   * Checks whether the element has an attribute.
   * @param {string} name - Attribute name.
   * @returns {boolean} True if attribute exists.
   */
  hasAttribute(name) {
    if (name === 'class') {
      return this.classList._classes.size > 0 || this.attributes.has('class');
    }
    return this.attributes.has(name);
  }

  /**
   * Removes an attribute.
   * @param {string} name - Attribute name.
   * @returns {void}
   */
  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === 'class') {
      this.classList._classes.clear();
    } else if (name === 'disabled') {
      this._disabled = false;
    } else if (name === 'checked') {
      this._checked = false;
    }
    this._innerHTMLStale = true;
  }

  /**
   * Appends a child node to this element.
   * @param {MockElement|MockTextNode|MockDocumentFragment} child - Child node to append.
   * @returns {MockElement|MockTextNode|MockDocumentFragment} Appended child node.
   */
  appendChild(child) {
    if (!child) return child;
    if (child.nodeType === 11 || child instanceof MockDocumentFragment) {
      const toMove = [...child.childNodes];
      for (const c of toMove) {
        this.appendChild(c);
      }
      child.childNodes = [];
      child.children = [];
      return child;
    }
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    this.childNodes.push(child);
    if (child.nodeType === 1 || child instanceof MockElement) {
      this.children.push(child);
    }
    this._innerHTMLStale = true;
    return child;
  }

  /**
   * Removes a child node from this element.
   * @param {MockElement|MockTextNode} child - Child node to remove.
   * @returns {MockElement|MockTextNode} Removed child node.
   */
  removeChild(child) {
    const childIdx = this.children.indexOf(child);
    if (childIdx >= 0) {
      this.children.splice(childIdx, 1);
    }
    const nodeIdx = this.childNodes.indexOf(child);
    if (nodeIdx >= 0) {
      this.childNodes.splice(nodeIdx, 1);
    }
    child.parentNode = null;
    this._innerHTMLStale = true;
    return child;
  }

  /**
   * Inserts a node before a reference child node.
   * @param {MockElement|MockTextNode|MockDocumentFragment} newNode - Node to insert.
   * @param {MockElement|MockTextNode|null} referenceNode - Node before which newNode is inserted.
   * @returns {MockElement|MockTextNode|MockDocumentFragment} Inserted node.
   */
  insertBefore(newNode, referenceNode) {
    if (!newNode) return newNode;
    if (newNode.nodeType === 11 || newNode instanceof MockDocumentFragment) {
      const toMove = [...newNode.childNodes];
      for (const c of toMove) {
        this.insertBefore(c, referenceNode);
      }
      newNode.childNodes = [];
      newNode.children = [];
      return newNode;
    }
    if (newNode.parentNode) {
      newNode.parentNode.removeChild(newNode);
    }
    newNode.parentNode = this;

    if (!referenceNode) {
      this.childNodes.push(newNode);
      if (newNode.nodeType === 1 || newNode instanceof MockElement) {
        this.children.push(newNode);
      }
    } else {
      const nodeIdx = this.childNodes.indexOf(referenceNode);
      if (nodeIdx >= 0) {
        this.childNodes.splice(nodeIdx, 0, newNode);
      } else {
        this.childNodes.push(newNode);
      }

      if (newNode.nodeType === 1 || newNode instanceof MockElement) {
        const childIdx = this.children.indexOf(referenceNode);
        if (childIdx >= 0) {
          this.children.splice(childIdx, 0, newNode);
        } else {
          this.children.push(newNode);
        }
      }
    }
    this._innerHTMLStale = true;
    return newNode;
  }

  /**
   * Replaces an existing child node with a new child node.
   * @param {MockElement|MockTextNode|MockDocumentFragment} newChild - Replacement node.
   * @param {MockElement|MockTextNode} oldChild - Child node being replaced.
   * @returns {MockElement|MockTextNode} Replaced old child node.
   */
  replaceChild(newChild, oldChild) {
    this.insertBefore(newChild, oldChild);
    this.removeChild(oldChild);
    return oldChild;
  }

  /**
   * Removes this element from its parent node.
   * @returns {void}
   */
  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  /**
   * Clones this element.
   * @param {boolean} [deep=false] - Whether to clone child nodes recursively.
   * @returns {MockElement} Cloned element.
   */
  cloneNode(deep = false) {
    const clone = new MockElement(this.tagName.toLowerCase());
    for (const [k, v] of this.attributes.entries()) {
      clone.setAttribute(k, v);
    }
    for (const c of this.classList._classes) {
      clone.classList.add(c);
    }
    Object.assign(clone.style, this.style);
    clone.value = this.value;
    clone.disabled = this.disabled;
    clone.checked = this.checked;
    clone._innerHTML = this._innerHTML;
    clone._textContent = this._textContent;

    if (this.tagName === 'TEMPLATE' && this.content) {
      clone.content = this.content.cloneNode(deep);
    }

    if (deep) {
      for (const child of this.childNodes) {
        clone.appendChild(child.cloneNode(true));
      }
    }
    return clone;
  }

  /**
   * Registers an event listener on this element.
   * @param {string} type - Event type.
   * @param {Function} listener - Event callback.
   * @param {Object} [options] - Event listener options.
   * @returns {void}
   */
  addEventListener(type, listener, options) {
    if (typeof listener !== 'function') return;
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }
    const once = Boolean(options && typeof options === 'object' && options.once);
    this._listeners.get(type).push({ fn: listener, once });
  }

  /**
   * Removes a registered event listener from this element.
   * @param {string} type - Event type.
   * @param {Function} listener - Event callback.
   * @returns {void}
   */
  removeEventListener(type, listener) {
    if (!this._listeners.has(type)) return;
    const list = this._listeners.get(type);
    const idx = list.findIndex((e) => e.fn === listener);
    if (idx >= 0) list.splice(idx, 1);
  }

  /**
   * Directly dispatches an event to registered listeners without bubbling.
   * @param {string} evt - Event name.
   * @param {*} [eventObj] - Event object or detail payload.
   * @returns {void}
   */
  dispatch(evt, eventObj) {
    const listeners = this._listeners.get(evt) || [];
    for (const entry of [...listeners]) {
      entry.fn(eventObj);
    }
  }

  /**
   * Dispatches an event through the DOM hierarchy, handling bubbling and cancellation.
   * @param {Object|string} event - Event object or event name.
   * @returns {boolean} True if the event was not cancelled by preventDefault.
   */
  dispatchEvent(event) {
    const evt = typeof event === 'object' && event !== null ? event : { type: String(event) };
    if (!evt.type) return true;

    evt.target ||= this;
    evt.currentTarget = this;
    if (evt.defaultPrevented === undefined) evt.defaultPrevented = false;
    if (evt.preventDefault === undefined) {
      evt.preventDefault = () => {
        evt.defaultPrevented = true;
      };
    }
    if (evt.stopPropagation === undefined) {
      evt.stopPropagation = () => {
        evt._propagationStopped = true;
      };
    }

    const invokeOn = (node) => {
      evt.currentTarget = node;
      const listeners = node._listeners ? node._listeners.get(evt.type) || [] : [];
      for (let i = 0; i < listeners.length; i++) {
        const entry = listeners[i];
        try {
          entry.fn.call(node, evt);
        } catch (err) {
          console.error(err);
        }
        if (entry.once) {
          listeners.splice(i, 1);
          i--;
        }
      }
      const inlineHandler = node['on' + evt.type];
      if (typeof inlineHandler === 'function') {
        try {
          inlineHandler.call(node, evt);
        } catch (err) {
          console.error(err);
        }
      }
    };

    invokeOn(this);

    if (evt.bubbles && !evt._propagationStopped) {
      let cur = this.parentNode;
      while (cur && !evt._propagationStopped) {
        invokeOn(cur);
        cur = cur.parentNode;
      }
    }

    return !evt.defaultPrevented;
  }

  /**
   * Returns the first descendant matching the CSS selector.
   * @param {string} sel - CSS selector.
   * @returns {MockElement|null} Matching element or null.
   */
  querySelector(sel) {
    for (const child of this.children) {
      if (matchesSelector(child, sel)) return child;
      const found = child.querySelector(sel);
      if (found) return found;
    }
    return null;
  }

  /**
   * Returns all descendants matching the CSS selector.
   * @param {string} sel - CSS selector.
   * @returns {MockElement[]} Matching elements.
   */
  querySelectorAll(sel) {
    const results = [];
    function collect(node) {
      for (const child of node.children) {
        if (matchesSelector(child, sel)) results.push(child);
        collect(child);
      }
    }
    collect(this);
    return results;
  }

  /**
   * Finds the closest matching ancestor element (or self).
   * @param {string} sel - CSS selector.
   * @returns {MockElement|null} Closest matching element or null.
   */
  closest(sel) {
    let cur = this;
    while (cur) {
      if (cur instanceof MockElement && matchesSelector(cur, sel)) return cur;
      cur = cur.parentNode;
    }
    return null;
  }

  /**
   * Focuses this element and dispatches a focus event.
   * @returns {void}
   */
  focus() {
    if (this._ownerDocument) {
      this._ownerDocument.activeElement = this;
    } else if (globalThis.document && 'activeElement' in globalThis.document) {
      globalThis.document.activeElement = this;
    }
    this.dispatchEvent({ type: 'focus', target: this });
  }

  /**
   * Blurs this element and dispatches a blur event.
   * @returns {void}
   */
  blur() {
    if (this._ownerDocument && this._ownerDocument.activeElement === this) {
      this._ownerDocument.activeElement = null;
    } else if (globalThis.document && globalThis.document.activeElement === this) {
      globalThis.document.activeElement = null;
    }
    this.dispatchEvent({ type: 'blur', target: this });
  }

  /**
   * Simulates clicking this element.
   * @returns {void}
   */
  click() {
    this.dispatchEvent({ type: 'click', bubbles: true, target: this });
  }
}

/**
 * Mock representation of a DocumentFragment.
 * @extends MockElement
 */
export class MockDocumentFragment extends MockElement {
  /**
   * Creates an instance of MockDocumentFragment.
   */
  constructor() {
    super('#document-fragment');
    this.nodeType = 11;
  }

  /**
   * Clones this document fragment.
   * @param {boolean} [deep=false] - Whether to clone child nodes recursively.
   * @returns {MockDocumentFragment} Cloned fragment.
   */
  cloneNode(deep = false) {
    const clone = new MockDocumentFragment();
    if (deep) {
      for (const child of this.childNodes) {
        clone.appendChild(child.cloneNode(true));
      }
    }
    return clone;
  }
}

/**
 * Mock representation of a DOM Document for headless testing.
 */
export class MockDocument {
  /**
   * Creates an instance of MockDocument.
   */
  constructor() {
    this.nodeType = 9;
    this.documentElement = new MockElement('html');
    this.head = new MockElement('head');
    this.body = new MockElement('body');
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.activeElement = this.body;
    this._listeners = new Map();
  }

  /**
   * Creates an element with the given tag name.
   * @param {string} tagName - Tag name for the new element.
   * @returns {MockElement} Created element.
   */
  createElement(tagName) {
    const el = new MockElement(tagName);
    el._ownerDocument = this;
    return el;
  }

  /**
   * Creates a new empty DocumentFragment.
   * @returns {MockDocumentFragment} Created fragment.
   */
  createDocumentFragment() {
    const frag = new MockDocumentFragment();
    frag._ownerDocument = this;
    return frag;
  }

  /**
   * Creates a new Text node with the given text content.
   * @param {string} text - Initial text.
   * @returns {MockTextNode} Created text node.
   */
  createTextNode(text) {
    const textNode = new MockTextNode(text);
    textNode._ownerDocument = this;
    return textNode;
  }

  /**
   * Finds an element by its ID attribute.
   * @param {string} id - Element ID.
   * @returns {MockElement|null} Found element or null.
   */
  getElementById(id) {
    const targetId = id.startsWith('#') ? id.slice(1) : id;
    function search(node) {
      if (node instanceof MockElement && (node.id === targetId || node.getAttribute('id') === targetId)) {
        return node;
      }
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
      return null;
    }
    return search(this.documentElement);
  }

  /**
   * Finds the first element in the document matching the selector.
   * @param {string} selector - CSS selector.
   * @returns {MockElement|null} Matching element or null.
   */
  querySelector(selector) {
    if (matchesSelector(this.documentElement, selector)) {
      return this.documentElement;
    }
    return this.documentElement.querySelector(selector);
  }

  /**
   * Finds all elements in the document matching the selector.
   * @param {string} selector - CSS selector.
   * @returns {MockElement[]} Matching elements.
   */
  querySelectorAll(selector) {
    const results = [];
    if (matchesSelector(this.documentElement, selector)) {
      results.push(this.documentElement);
    }
    results.push(...this.documentElement.querySelectorAll(selector));
    return results;
  }

  /**
   * Finds all elements with the given tag name.
   * @param {string} tagName - Tag name to match.
   * @returns {MockElement[]} Matching elements.
   */
  getElementsByTagName(tagName) {
    const upper = tagName.toUpperCase();
    return this.querySelectorAll(upper === '*' ? '*' : tagName);
  }

  /**
   * Finds all elements with the given class name.
   * @param {string} className - Class name to match.
   * @returns {MockElement[]} Matching elements.
   */
  getElementsByClassName(className) {
    return this.querySelectorAll('.' + className);
  }

  /**
   * Registers an event listener on the document.
   * @param {string} type - Event type.
   * @param {Function} listener - Event callback.
   * @param {Object} [options] - Listener options.
   * @returns {void}
   */
  addEventListener(type, listener, options) {
    if (typeof listener !== 'function') return;
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }
    const once = Boolean(options && typeof options === 'object' && options.once);
    this._listeners.get(type).push({ fn: listener, once });
  }

  /**
   * Removes an event listener from the document.
   * @param {string} type - Event type.
   * @param {Function} listener - Event callback.
   * @returns {void}
   */
  removeEventListener(type, listener) {
    if (!this._listeners.has(type)) return;
    const list = this._listeners.get(type);
    const idx = list.findIndex((e) => e.fn === listener);
    if (idx >= 0) list.splice(idx, 1);
  }

  /**
   * Dispatches an event on the document.
   * @param {Object|string} event - Event object or event name.
   * @returns {boolean} Always true.
   */
  dispatchEvent(event) {
    const evt = typeof event === 'object' && event !== null ? event : { type: String(event) };
    evt.target ||= this;
    evt.currentTarget = this;
    const listeners = this._listeners.get(evt.type) || [];
    for (let i = 0; i < listeners.length; i++) {
      const entry = listeners[i];
      entry.fn.call(this, evt);
      if (entry.once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    return true;
  }
}

function createMockStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (i) => Array.from(store.keys())[i] ?? null,
  };
}

const restoreStack = [];

/**
 * @typedef {Object} MockDomOptions
 * @property {MockDocument} [document] - Custom mock document instance.
 * @property {Object} [sessionStorage] - Custom mock sessionStorage implementation.
 * @property {Object} [localStorage] - Custom mock localStorage implementation.
 * @property {string} [url] - Initial URL for mock window.location.
 * @property {string} [html] - Initial HTML markup to set on document.body.
 * @property {Record<string, *>} [customGlobals] - Extra global variables to register during the mock session.
 */

/**
 * Installs headless Mock DOM globals onto globalThis.
 * @param {MockDomOptions} [options={}] - Configuration options for mock DOM environment.
 * @returns {() => void} Function that restores the previous globals when invoked.
 */
export function installMockDom(options = {}) {
  const previousGlobals = {
    window: globalThis.window,
    document: globalThis.document,
    sessionStorage: globalThis.sessionStorage,
    localStorage: globalThis.localStorage,
    Element: globalThis.Element,
    HTMLElement: globalThis.HTMLElement,
    DocumentFragment: globalThis.DocumentFragment,
    Text: globalThis.Text,
    CustomEvent: globalThis.CustomEvent,
    Event: globalThis.Event,
    getComputedStyle: globalThis.getComputedStyle,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    ...(options.customGlobals
      ? Object.fromEntries(Object.keys(options.customGlobals).map((k) => [k, globalThis[k]]))
      : {}),
  };

  const doc = options.document || new MockDocument();
  const sessionStorage = options.sessionStorage || createMockStorage();
  const localStorage = options.localStorage || createMockStorage();

  const mockWindow = {
    document: doc,
    sessionStorage,
    localStorage,
    location: {
      href: options.url || 'http://localhost/',
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
      assign: () => {},
      replace: () => {},
      reload: () => {},
    },
    addEventListener: (t, fn, opts) => doc.addEventListener(t, fn, opts),
    removeEventListener: (t, fn) => doc.removeEventListener(t, fn),
    dispatchEvent: (e) => doc.dispatchEvent(e),
    getComputedStyle: (el) => el.style || {},
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
    matchMedia: (query) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }),
    scrollTo: () => {},
    alert: () => {},
    ...options.window,
  };

  globalThis.window = mockWindow;
  globalThis.document = doc;
  globalThis.sessionStorage = sessionStorage;
  globalThis.localStorage = localStorage;
  globalThis.Element = MockElement;
  globalThis.HTMLElement = MockElement;
  globalThis.DocumentFragment = MockDocumentFragment;
  globalThis.Text = MockTextNode;
  globalThis.getComputedStyle = mockWindow.getComputedStyle;
  globalThis.requestAnimationFrame = mockWindow.requestAnimationFrame;
  globalThis.cancelAnimationFrame = mockWindow.cancelAnimationFrame;

  if (typeof globalThis.CustomEvent === 'undefined') {
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, eventInitDict = {}) {
        this.type = type;
        this.detail = eventInitDict.detail ?? null;
        this.bubbles = Boolean(eventInitDict.bubbles);
        this.cancelable = Boolean(eventInitDict.cancelable);
      }
    };
  }

  if (typeof globalThis.Event === 'undefined') {
    globalThis.Event = class Event {
      constructor(type, eventInitDict = {}) {
        this.type = type;
        this.bubbles = Boolean(eventInitDict.bubbles);
        this.cancelable = Boolean(eventInitDict.cancelable);
      }
    };
  }

  if (options.customGlobals) {
    for (const [k, v] of Object.entries(options.customGlobals)) {
      globalThis[k] = v;
    }
  }

  if (options.html) {
    doc.body.innerHTML = options.html;
  }

  const restore = function restoreMockDom() {
    for (const [key, val] of Object.entries(previousGlobals)) {
      if (val === undefined) {
        delete globalThis[key];
      } else {
        globalThis[key] = val;
      }
    }
    const idx = restoreStack.indexOf(restore);
    if (idx >= 0) {
      restoreStack.splice(idx, 1);
    }
  };

  restoreStack.push(restore);
  return restore;
}

/**
 * Restores the most recently installed Mock DOM environment, reverting globalThis.
 * @returns {void}
 */
export function uninstallMockDom() {
  const restore = restoreStack.pop();
  if (restore) {
    restore();
  }
}
