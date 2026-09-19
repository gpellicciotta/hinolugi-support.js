import { disable, enable } from './forms.mjs';
import { htmlToElement } from './dom.mjs';
import { escapeHtml } from './strings.mjs';

/**
 * Reusable DOM helper and lifecycle manager for sub-list / collection item editors.
 *
 * Manages the canonical visual pattern for embedded collection editors:
 *   1. Header input strip with inline inputs, add button, and delete selected button.
 *   2. Collection items list (<ul>) with item checkboxes and action buttons.
 *   3. Empty state fallback visibility toggle.
 */
export default class CollectionEditor {
  /**
   * Create a CollectionEditor instance.
   *
   * @param {Object} options Configuration options:
   *   @param {HTMLElement} options.headerEl Container element of the header input strip.
   *   @param {HTMLElement} options.listEl Unordered list element (<ul>) holding collection item rows.
   *   @param {HTMLElement} [options.emptyStateEl] Optional container shown when zero items exist.
   *   @param {HTMLElement} [options.addButtonEl] Add action button in header.
   *   @param {HTMLElement} [options.deleteButtonEl] Delete selected action button in header.
   *   @param {Array<HTMLElement>|Object} [options.inputs] Input elements in header strip.
   *   @param {string} [options.itemSelector] Selector for item rows (default: 'li').
   *   @param {Function} [options.onAdd] Callback when item creation is triggered.
   *   @param {Function} [options.onDeleteSelected] Callback when delete selected button is clicked.
   *   @param {Function} [options.onSelectionChange] Callback when selected items count changes: `(count, elements) => {}`.
   *   @param {Function} [options.onItemAction] Callback for data-action clicks: `(action, dataset, event, actionEl) => {}`.
   */
  constructor(options = {}) {
    this.headerEl = options.headerEl || null;
    this.listEl = options.listEl || null;
    this.emptyStateEl = options.emptyStateEl || null;
    this.addButtonEl = options.addButtonEl || null;
    this.deleteButtonEl = options.deleteButtonEl || null;
    this.inputs = options.inputs || [];
    this.itemSelector = options.itemSelector || 'li';
    this.onAdd = options.onAdd || null;
    this.onDeleteSelected = options.onDeleteSelected || null;
    this.onSelectionChange = options.onSelectionChange || null;
    this.onItemAction = options.onItemAction || null;
    this._eventCleanups = [];
    this._lastSelectedCount = -1;
    this.init();
  }

  /**
   * Wire up event handlers for header controls, creation inputs, and list interactions.
   */
  init() {
    // Add button click:
    if (this.addButtonEl && this.onAdd) {
      const addHandler = (ev) => {
        ev.preventDefault();
        this.onAdd(ev);
      };
      this.addButtonEl.addEventListener('click', addHandler);
      this._eventCleanups.push(() => this.addButtonEl.removeEventListener('click', addHandler));
    }

    // Delete selected button click:
    if (this.deleteButtonEl && this.onDeleteSelected) {
      const deleteHandler = (ev) => {
        ev.preventDefault();
        this.onDeleteSelected(this.getSelectedElements(), ev);
      };
      this.deleteButtonEl.addEventListener('click', deleteHandler);
      this._eventCleanups.push(() => this.deleteButtonEl.removeEventListener('click', deleteHandler));
    }

    // Enter key handling on creation inputs:
    const inputList = Array.isArray(this.inputs) ? this.inputs : Object.values(this.inputs);
    inputList.forEach((inputEl) => {
      if (inputEl && inputEl.addEventListener) {
        const keyHandler = (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            if (this.onAdd) {
              this.onAdd(ev);
            }
          }
        };
        inputEl.addEventListener('keydown', keyHandler);
        this._eventCleanups.push(() => inputEl.removeEventListener('keydown', keyHandler));
      }
    });

    // List delegation for checkbox change and action buttons:
    if (this.listEl) {
      const changeHandler = (ev) => {
        if (ev.target && ev.target.type === 'checkbox') {
          this.updateSelectionState(true);
        }
      };
      this.listEl.addEventListener('change', changeHandler);
      this._eventCleanups.push(() => this.listEl.removeEventListener('change', changeHandler));

      if (this.onItemAction) {
        const clickHandler = (ev) => {
          const actionEl = ev.target.closest('[data-action]');
          if (actionEl && actionEl.dataset.action) {
            ev.preventDefault();
            this.onItemAction(actionEl.dataset.action, actionEl.dataset, ev, actionEl);
          }
        };
        this.listEl.addEventListener('click', clickHandler);
        this._eventCleanups.push(() => this.listEl.removeEventListener('click', clickHandler));
      }
    }

    this.updateEmptyState();
    this.updateSelectionState();
  }

  /**
   * Clean up registered event listeners.
   */
  destroy() {
    this._eventCleanups.forEach((cleanup) => cleanup());
    this._eventCleanups = [];
  }

  /**
   * Get all currently rendered item row elements in the list.
   *
   * @return {Array<HTMLElement>}
   */
  getItemElements() {
    if (!this.listEl) {
      return [];
    }
    return Array.from(this.listEl.querySelectorAll(this.itemSelector));
  }

  /**
   * Get total number of item rows in the list.
   *
   * @return {number}
   */
  getItemCount() {
    return this.getItemElements().length;
  }

  /**
   * Get all currently selected (checked) item row elements.
   *
   * @return {Array<HTMLElement>}
   */
  getSelectedElements() {
    if (!this.listEl) {
      return [];
    }
    const checked = Array.from(
      this.listEl.querySelectorAll(`${this.itemSelector} .mark-for-deletion-action > input:checked`),
    );
    return checked.map((chEl) => chEl.closest(this.itemSelector)).filter(Boolean);
  }

  /**
   * Get number of selected items.
   *
   * @return {number}
   */
  getSelectedCount() {
    return this.getSelectedElements().length;
  }

  /**
   * Update delete button enabled/disabled state and notify onSelectionChange.
   *
   * @param {boolean} [notify=true] Whether to invoke onSelectionChange callback if selection changed.
   */
  updateSelectionState(notify = true) {
    if (this._isUpdatingSelection) {
      return;
    }
    this._isUpdatingSelection = true;
    try {
      const selected = this.getSelectedElements();
      const count = selected.length;

      if (this.deleteButtonEl) {
        if (count > 0) {
          enable(this.deleteButtonEl, count === 1 ? 'Delete the selected item' : `Delete the ${count} selected items`);
        } else {
          disable(this.deleteButtonEl, 'No items have been selected for deletion');
        }
      }

      if (notify && count !== this._lastSelectedCount) {
        this._lastSelectedCount = count;
        if (this.onSelectionChange) {
          this.onSelectionChange(count, selected);
        }
      } else {
        this._lastSelectedCount = count;
      }
    } finally {
      this._isUpdatingSelection = false;
    }
  }

  /**
   * Update empty state and list visibility based on current item count.
   *
   * @param {number} [count] Explicit item count override.
   */
  updateEmptyState(count) {
    const total = typeof count === 'number' ? count : this.getItemCount();
    if (this.emptyStateEl) {
      if (total > 0) {
        disable(this.emptyStateEl);
      } else {
        enable(this.emptyStateEl);
      }
    }
    if (this.listEl) {
      if (total > 0) {
        enable(this.listEl);
      } else {
        disable(this.listEl);
      }
    }
  }

  /**
   * Set and render all items in the list.
   *
   * @param {Array} items Collection of item data objects.
   * @param {Function} renderRowFn Function converting item data into a DOM element: `(item, index) => HTMLElement`.
   */
  setItems(items, renderRowFn) {
    if (!this.listEl) {
      return;
    }
    this.listEl.innerHTML = '';
    const itemList = items || [];
    if (itemList.length > 0 && typeof renderRowFn === 'function') {
      itemList.forEach((item, index) => {
        const row = renderRowFn(item, index);
        if (row) {
          this.listEl.appendChild(row);
        }
      });
    }
    this.updateEmptyState(itemList.length);
    this.updateSelectionState();
  }

  /**
   * Append or prepend a single item element to the list.
   *
   * @param {HTMLElement} rowEl The item row element.
   * @param {boolean} [prepend=false] Whether to insert at the beginning.
   */
  addItem(rowEl, prepend = false) {
    if (!this.listEl || !rowEl) {
      return;
    }
    if (prepend && this.listEl.firstChild) {
      this.listEl.insertBefore(rowEl, this.listEl.firstChild);
    } else {
      this.listEl.appendChild(rowEl);
    }
    this.updateEmptyState();
    this.updateSelectionState();
  }

  /**
   * Remove all currently selected item row elements from the DOM.
   *
   * @return {number} Number of deleted items.
   */
  removeSelectedItems() {
    const selected = this.getSelectedElements();
    selected.forEach((el) => el.remove());
    this.updateEmptyState();
    this.updateSelectionState();
    return selected.length;
  }

  /**
   * Clear all creation input values.
   */
  clearInputs() {
    const inputList = Array.isArray(this.inputs) ? this.inputs : Object.values(this.inputs);
    inputList.forEach((inputEl) => {
      if (inputEl) {
        inputEl.value = '';
      }
    });
  }

  /**
   * Helper to construct a standardized collection item row (`<li>`).
   *
   * @param {Object} config Row configuration:
   *   @param {string|number} config.id Unique item identifier.
   *   @param {string} [config.className='collection-editor-item'] CSS class for the `<li>`.
   *   @param {Object} [config.dataAttributes={}] Custom `data-*` attributes to attach to the `<li>`.
   *   @param {string} config.contentHtml Middle content HTML (info, inputs, badges).
   *   @param {string} [config.actionsHtml] Right-hand action button HTML.
   *   @param {string} [config.checkboxId] Custom ID for the deletion checkbox input.
   *   @param {boolean} [config.isChecked=false] Initial checkbox state.
   * @return {HTMLElement} Constructed `<li>` DOM element.
   */
  static createItemRow(config = {}) {
    const {
      id,
      className = 'collection-editor-item',
      dataAttributes = {},
      contentHtml = '',
      actionsHtml = '',
      checkboxId = `mark-for-deletion-${id}`,
      isChecked = false,
    } = config;

    let dataAttrsStr = '';
    for (const [key, val] of Object.entries(dataAttributes)) {
      dataAttrsStr += ` data-${key}="${escapeHtml(String(val))}"`;
    }

    const html = `
      <li class="${className}"${dataAttrsStr}>
        <span class="action-bar delete-action">
          <label for="${checkboxId}" class="mark-for-deletion-action button">
            <input id="${checkboxId}" name="${checkboxId}" type="checkbox"${isChecked ? ' checked' : ''}>
            <i title="Marked for deletion" class="checked icon fa-solid fa-trash-can"></i>
            <i title="Not marked for deletion" class="unchecked icon fa-regular fa-trash-can"></i>
          </label>
        </span>
        ${contentHtml}
        ${actionsHtml ? `<span class="toggle-action actions">${actionsHtml}</span>` : ''}
      </li>`;

    return htmlToElement(html);
  }
}
