import Component from './component.mjs';
import { disable, enable } from './forms.mjs';

/**
 * Application menu component rendering vertical or horizontal navigation menus with separators.
 *
 * @module app-menu
 */

/**
 * Event name dispatched when an action's state changes.
 *
 * @type {string}
 */
export const ACTION_STATE_CHANGED_EVENT = 'action-state-changed';

/**
 * An application menu, typically a horizontal or vertical bar with actions, grouped via separators.
 */
export default class AppMenu extends Component {
  /**
   * Create an AppMenu instance.
   *
   * @param {string} id Unique component ID.
   * @param {object} app App instance this menu belongs to.
   * @param {Array<string|null>} menuActionIds Action IDs or null separators to display in the menu.
   */
  constructor(id, app, menuActionIds = []) {
    super(id, app);
    this.menuActionIds = [...menuActionIds];
    this.menuItems = [];
  }

  /**
   * Generate outer menu component HTML markup.
   *
   * @returns {string} Outer component HTML template.
   */
  createComponentUIHtml() {
    return `
      <div id="${this.id}" class="component">
        ${this.createMainUIHtml()}
      </div>`;
  }

  /**
   * Generate inner ordered list HTML container for menu items.
   *
   * @returns {string} Inner menu list HTML template.
   */
  createMainUIHtml() {
    return `
      <ol class="menu main">
      </ol>`;
  }

  /**
   * Attach menu to DOM container, populate items, and bind click actions.
   *
   * @param {HTMLElement} el Container DOM element to attach into.
   * @param {string} [route] Active route path.
   * @param {*} [state] Optional navigation state.
   * @returns {void}
   */
  attach(el, route, state) {
    super.attach(el, route, state);
    this.menuRootEl = this.componentUIEl ? this.componentUIEl.querySelector('.menu.main') : null;
    if (this.menuRootEl) {
      this.menuRootEl.innerHTML = '';
    }
    this.menuItems = [];
    for (let actionId of this.menuActionIds) {
      const action = actionId && typeof this.app?.getAction === 'function' ? this.app.getAction(actionId) : null;
      let menuItem = {};
      let liEl = document.createElement('li');
      menuItem.rootElement = liEl;
      menuItem.data = action;
      liEl.classList.add('item');
      if (action == null) {
        liEl.classList.add('separator');
      } else {
        let aEl = document.createElement(action.href ? 'a' : 'button');
        aEl.setAttribute('data-action', actionId);
        if (typeof this.app?.isActionEnabled === 'function' && !this.app.isActionEnabled(actionId)) {
          disable(liEl, action['disabled-reason']);
        } else {
          enable(liEl);
        }
        if (action.href) {
          aEl.setAttribute('href', action.href);
        }
        if (action.description) {
          aEl.setAttribute('title', action.description);
        }
        if (action.icon) {
          aEl.innerHTML = action.icon + '&nbsp;' + action.title;
        } else {
          aEl.innerHTML = action.title || actionId;
        }
        menuItem.aElement = aEl;
        liEl.appendChild(aEl);
      }
      this.menuItems.push(menuItem);
      if (this.menuRootEl) {
        this.menuRootEl.appendChild(liEl);
      }
    }
  }

  /**
   * Register event listeners for action state change events.
   *
   * @returns {void}
   */
  registerEventListeners() {
    if (typeof this.app?.addEventListener === 'function') {
      const eventName = this.app?.ACTION_STATE_CHANGED_EVENT || ACTION_STATE_CHANGED_EVENT;
      this.registerEventListener(this.app, eventName, this.onActionStateChanged.bind(this));
    }
  }

  /**
   * Handle action state changes by updating item disabled attributes and adjacent separators.
   *
   * @param {Object} e Event object.
   * @param {Object} [e.action] Action whose state changed.
   * @param {string} [e.action.id] Identifier of the action.
   * @param {boolean} [e.action.disabled] Whether the action is disabled.
   * @param {string} [e.action.disabled-reason] Reason the action is disabled.
   * @returns {void}
   */
  onActionStateChanged(e) {
    if (e?.action?.id) {
      let actionId = e.action.id;
      // Find menu item with given action and enable/disable:
      for (let menuItem of this.menuItems) {
        if (
          menuItem.rootElement &&
          menuItem.aElement &&
          (menuItem.aElement.dataset.action === actionId || menuItem.aElement.getAttribute('data-action') === actionId)
        ) {
          if (e.action.disabled) {
            disable(menuItem.rootElement, e.action['disabled-reason']);
          } else {
            enable(menuItem.rootElement);
          }
        }
      }
      // Also disable separator if no non-disabled elements in front
      let activeElementsSinceLastSeparator = 0;
      for (let menuItem of this.menuItems) {
        if (menuItem.rootElement) {
          if (!menuItem.rootElement.classList.contains('separator')) {
            if (!menuItem.rootElement.classList.contains('disabled')) {
              activeElementsSinceLastSeparator += 1;
            }
          } else {
            // Check whether the separator should be disabled
            if (activeElementsSinceLastSeparator) {
              enable(menuItem.rootElement);
            } else {
              disable(menuItem.rootElement);
            }
            activeElementsSinceLastSeparator = 0;
          }
        }
      }
    }
  }
}
