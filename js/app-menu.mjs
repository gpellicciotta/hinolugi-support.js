import Component from './component.mjs';
import * as formutils from './formutils.mjs';

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

  createComponentUIHtml() {
    return `
      <div id="${this.id}" class="component">
        ${this.createMainUIHtml()}
      </div>`;
  }

  createMainUIHtml() {
    return `
      <ol class="menu main">
      </ol>`;
  }

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
          formutils.disable(liEl, action['disabled-reason']);
        } else {
          formutils.enable(liEl);
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

  registerEventListeners() {
    if (typeof this.app?.addEventListener === 'function') {
      const eventName = this.app?.ACTION_STATE_CHANGED_EVENT || ACTION_STATE_CHANGED_EVENT;
      this.registerEventListener(this.app, eventName, this.onActionStateChanged.bind(this));
    }
  }

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
            formutils.disable(menuItem.rootElement, e.action['disabled-reason']);
          } else {
            formutils.enable(menuItem.rootElement);
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
              formutils.enable(menuItem.rootElement);
            } else {
              formutils.disable(menuItem.rootElement);
            }
            activeElementsSinceLastSeparator = 0;
          }
        }
      }
    }
  }
}
