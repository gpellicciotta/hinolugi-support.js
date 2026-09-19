import Component from './component.mjs';
import { disable, enable } from './forms.mjs';

export const ACTION_STATE_CHANGED_EVENT = 'action-state-changed';

/**
 *  An application action bar, rendering standard horizontal action buttons and separators
 *  and responding dynamically to action state changes.
 */
export default class AppActionBar extends Component {
  constructor(id, app, actionIds = []) {
    super(id, app);
    this.actionBarActionIds = [...(actionIds || [])];
    this.actionBarItems = [];
    this.syncUnsubscribe = null;
    this.currentSyncData = { state: 'online', pendingCount: 0, failedCount: 0, pending: [], failed: [] };
  }

  createComponentUIHtml() {
    return `
      <div id="${this.id}" class="component">
        ${this.createMainUIHtml()}
      </div>`;
  }

  createMainUIHtml() {
    return `
      <ol class="action-bar main">
      </ol>`;
  }

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

  registerEventListeners() {
    if (typeof this.app?.addEventListener === 'function') {
      this.registerEventListener(this.app, ACTION_STATE_CHANGED_EVENT, this.onActionStateChanged.bind(this));
    }
  }

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

  detach() {
    if (this.syncUnsubscribe) {
      this.syncUnsubscribe();
      this.syncUnsubscribe = null;
    }
    super.detach();
  }
}
