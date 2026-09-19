import Component from './component.mjs';
import { disable, enable } from './forms.mjs';

/**
 * Application action bar component rendering horizontal action buttons and dynamic sync badges.
 *
 * @module app-action-bar
 */

/**
 * Event name dispatched when an action's state (enabled/disabled) changes.
 *
 * @type {string}
 */
export const ACTION_STATE_CHANGED_EVENT = 'action-state-changed';

/**
 * An application action bar, rendering standard horizontal action buttons and separators
 * and responding dynamically to action state changes.
 */
export default class AppActionBar extends Component {
  /**
   * Create an AppActionBar instance.
   *
   * @param {string} id Unique component ID.
   * @param {object} app The application instance this bar belongs to.
   * @param {Array<string|null>} [actionIds=[]] List of action IDs or null separators to display.
   */
  constructor(id, app, actionIds = []) {
    super(id, app);
    this.actionBarActionIds = [...(actionIds || [])];
    this.actionBarItems = [];
    this.syncUnsubscribe = null;
    this.currentSyncData = { state: 'online', pendingCount: 0, failedCount: 0, pending: [], failed: [] };
  }

  /**
   * Generate outer action bar component HTML markup.
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
   * Generate inner ordered list HTML container for action items.
   *
   * @returns {string} Inner action bar HTML template.
   */
  createMainUIHtml() {
    return `
      <ol class="action-bar main">
      </ol>`;
  }

  /**
   * Attach action bar to DOM container, populate items, and bind action buttons.
   *
   * @param {HTMLElement} el The container DOM element.
   * @param {string} [route] Active route path.
   * @param {*} [state] Optional navigation state.
   * @returns {void}
   */
  attach(el, route, state) {
    super.attach(el, route, state);
    this.actionBarRootEl = this.componentUIEl?.querySelector('.action-bar.main');
    if (!this.actionBarRootEl) return;

    this.actionBarRootEl.innerHTML = '';
    this.actionBarItems = [];
    this.syncBadgeBtn = null;

    for (const actionId of this.actionBarActionIds) {
      const action = actionId ? (this.app?.getAction ? this.app.getAction(actionId) : null) : null;
      const actionBarItem = {};
      const liEl = document.createElement('li');
      actionBarItem.rootElement = liEl;
      actionBarItem.data = action;
      actionBarItem.actionId = actionId;
      liEl.classList.add('item');

      if (actionId == null) {
        liEl.classList.add('separator');
      } else {
        const aEl = document.createElement(action?.href ? 'a' : 'button');
        aEl.classList.add('action-button');
        aEl.setAttribute('data-action', actionId);

        const isEnabled = this.app?.isActionEnabled ? this.app.isActionEnabled(actionId) : true;
        if (!isEnabled) {
          disable(liEl, action?.['disabled-reason']);
        } else {
          enable(liEl);
        }

        if (action?.href) {
          aEl.setAttribute('href', action.href);
        } else {
          aEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof this.app?.runAction === 'function') {
              this.app.runAction(actionId);
            }
          });
        }

        if (action?.description) {
          aEl.setAttribute('title', action.description);
        }

        if (action?.icon) {
          aEl.innerHTML = action.icon;
        } else if (action?.title) {
          aEl.innerHTML = action.title;
        } else {
          aEl.innerHTML = actionId;
        }

        // Optional sync badge integration when sync coordinator is available
        if (
          this.id === 'main-action-bar' &&
          actionId === 'refresh' &&
          typeof this.app?.getSyncCoordinator === 'function'
        ) {
          liEl.classList.add('sync-status-item');
          aEl.id = 'sync-status-btn';
          aEl.classList.add('sync-status-btn', 'online');
          this.syncBadgeBtn = aEl;
        }

        actionBarItem.aElement = aEl;
        liEl.appendChild(aEl);
      }

      this.actionBarItems.push(actionBarItem);
      this.actionBarRootEl.appendChild(liEl);
    }

    this.updateSeparators();
    this.initSyncStatusListener();
  }

  /**
   * Register event listeners for action state change notifications.
   *
   * @returns {void}
   */
  registerEventListeners() {
    if (typeof this.app?.addEventListener === 'function') {
      this.registerEventListener(this.app, ACTION_STATE_CHANGED_EVENT, this.onActionStateChanged.bind(this));
    }
  }

  /**
   * Handle action state changed events by enabling/disabling the matching item.
   *
   * @param {Object} e Event object.
   * @param {Object} [e.action] Action whose state changed.
   * @param {string} [e.action.id] Identifier of the action.
   * @param {boolean} [e.action.disabled] Disabled status.
   * @param {string} [e.action.disabled-reason] Explanation of why action is disabled.
   * @returns {void}
   */
  onActionStateChanged(e) {
    if (!e?.action?.id) return;
    const actionId = e.action.id;

    for (const item of this.actionBarItems) {
      if (item.actionId === actionId && item.rootElement) {
        if (e.action.disabled) {
          disable(item.rootElement, e.action['disabled-reason']);
        } else {
          enable(item.rootElement);
        }
      }
    }

    this.updateSeparators();
  }

  /**
   * Update visibility / active state of separators based on adjacent enabled action buttons.
   *
   * @returns {void}
   */
  updateSeparators() {
    let activeElementsSinceLastSeparator = 0;
    for (const item of this.actionBarItems) {
      if (!item.rootElement) continue;
      if (!item.rootElement.classList.contains('separator')) {
        if (!item.rootElement.classList.contains('disabled')) {
          activeElementsSinceLastSeparator += 1;
        }
      } else {
        if (activeElementsSinceLastSeparator > 0) {
          enable(item.rootElement);
        } else {
          disable(item.rootElement);
        }
        activeElementsSinceLastSeparator = 0;
      }
    }
  }

  /**
   * Initialize subscription to application synchronization status changes.
   *
   * @returns {void}
   */
  initSyncStatusListener() {
    const coordinator = typeof this.app?.getSyncCoordinator === 'function' ? this.app.getSyncCoordinator() : null;
    if (!coordinator) return;

    if (this.syncUnsubscribe) {
      this.syncUnsubscribe();
      this.syncUnsubscribe = null;
    }

    if (typeof coordinator.subscribe === 'function') {
      this.syncUnsubscribe = coordinator.subscribe((data) => {
        this.currentSyncData = data;
        this.updateSyncBadge(data);
      });
    }
  }

  /**
   * Update the sync status button badge and tooltip according to synchronization state.
   *
   * @param {Object} syncData Synchronization state payload.
   * @param {'online'|'offline'|'syncing'|'error'} [syncData.state='online'] Current connectivity / synchronization state.
   * @param {number} [syncData.pendingCount=0] Count of mutations pending synchronization.
   * @param {number} [syncData.failedCount=0] Count of mutations that failed synchronization.
   * @returns {void}
   */
  updateSyncBadge(syncData) {
    if (!this.syncBadgeBtn || !syncData) return;
    const { state = 'online', pendingCount = 0, failedCount = 0 } = syncData;
    this.syncBadgeBtn.className = `action-button sync-status-btn ${state}`;

    if (state === 'offline') {
      this.syncBadgeBtn.innerHTML =
        "<span class='sync-icon-offline'><i class='fa-solid fa-cloud'></i></span>" +
        (pendingCount > 0 ? `<span class='sync-pill'>${pendingCount}</span>` : '');
      this.syncBadgeBtn.setAttribute('title', `Offline (${pendingCount} pending)`);
    } else if (state === 'syncing') {
      this.syncBadgeBtn.innerHTML =
        "<i class='fa-solid fa-rotate fa-spin'></i>" +
        (pendingCount > 0 ? `<span class='sync-pill'>${pendingCount}</span>` : '');
      this.syncBadgeBtn.setAttribute('title', `Syncing ${pendingCount} changes...`);
    } else if (state === 'error' || failedCount > 0) {
      this.syncBadgeBtn.innerHTML =
        "<i class='fa-solid fa-triangle-exclamation'></i>" + `<span class='sync-pill error'>${failedCount}</span>`;
      this.syncBadgeBtn.setAttribute('title', `Sync Warning (${failedCount} failed)`);
    } else {
      this.syncBadgeBtn.innerHTML = "<i class='fa-solid fa-cloud'></i>";
      this.syncBadgeBtn.setAttribute('title', 'Online - All changes synchronized');
    }
  }

  /**
   * Detach action bar from DOM, unsubscribe from sync updates, and perform cleanup.
   *
   * @returns {void}
   */
  detach() {
    if (this.syncUnsubscribe) {
      this.syncUnsubscribe();
      this.syncUnsubscribe = null;
    }
    super.detach();
  }
}
