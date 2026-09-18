import AppView from './app-view.mjs';
import * as utils from './utils.mjs';
import * as domutils from './domutils.mjs';

export const NOTIFICATION_ADDED_EVENT = 'notification-added';
export const NOTIFICATION_DELETED_EVENT = 'notification-deleted';
export const NOTIFICATIONS_CLEARED_EVENT = 'notifications-cleared';

/**
 *  An application notification bar, showing the latest non-dismissed notification
 *  with an expandable drawer for earlier notifications.
 */
export default class AppNotificationBar extends AppView {
  constructor(id, app) {
    super(id, app, 'Notification Bar');
    this.notificationBarItems = [];
  }

  createComponentUIHtml() {
    return `
      <div id="${this.id}" class="component">
        ${this.createMainUIHtml()}
      </div>`;
  }

  createMainUIHtml() {
    return `
      <div class="main">
        <span class="action-bar expand-bar">
          <label id="${this.id}-toggle" class="toggle-checkbox" for="${this.id}-expand-notifications">
            <input id="${this.id}-expand-notifications" name="expand-notifications" type="checkbox">
            <i title="Show only last" class="checked icon fa-solid fa-chevron-up"></i>
            <i title="Show all" class="unchecked icon fa-solid fa-chevron-down"></i>
          </label>  
        </span>  
        <ol id="${this.id}-list" class="notification-bar"></ol>
      </div>`;
  }

  attach(el, route, state) {
    super.attach(el, route, state);
    this.expandCollapseToggle =
      this.domParentEl?.querySelector?.(`#${this.id}-toggle > input`) ||
      this.componentUIEl?.querySelector?.(`#${this.id}-toggle > input`);
    this.notificationBarRootEl =
      this.domParentEl?.querySelector?.(`#${this.id}-list`) || this.componentUIEl?.querySelector?.(`#${this.id}-list`);
    this.updateMainUI();

    if (this.expandCollapseToggle) {
      this.expandCollapseToggle.addEventListener('change', () => {
        const targetContainer = this.domParentEl || this.componentUIEl;
        if (this.expandCollapseToggle.checked) {
          targetContainer?.classList.add('expanded');
        } else {
          targetContainer?.classList.remove('expanded');
        }
      });
    }

    if (this.notificationBarRootEl) {
      this.notificationBarRootEl.addEventListener('click', (e) => {
        const noteEl = e.target?.closest?.('.notification');
        if (!noteEl) {
          return;
        }
        const noteId = +noteEl.dataset.notificationId;
        if (e.target?.closest?.('[data-action="dismiss-notification"]')) {
          e.preventDefault?.();
          e.stopPropagation?.();
          if (typeof this.app?.deleteNotification === 'function') {
            this.app.deleteNotification(noteId);
          }
          return;
        }
        if (e.target?.closest?.('[data-action="notification-action"]')) {
          e.preventDefault?.();
          e.stopPropagation?.();
          const item = this.notificationBarItems.find((i) => i.note.id === noteId);
          if (item?.note?.action?.onClick) {
            item.note.action.onClick();
          }
          if (typeof this.app?.deleteNotification === 'function') {
            this.app.deleteNotification(noteId);
          }
        }
      });
    }
  }

  registerEventListeners() {
    this.registerEventListener(this.app, NOTIFICATION_ADDED_EVENT, this.updateMainUI.bind(this));
    this.registerEventListener(this.app, NOTIFICATION_DELETED_EVENT, this.updateMainUI.bind(this));
    this.registerEventListener(this.app, NOTIFICATIONS_CLEARED_EVENT, this.updateMainUI.bind(this));
  }

  updateMainUI() {
    if (!this.notificationBarRootEl) return;
    this.notificationBarItems = [];
    this.notificationBarRootEl.innerHTML = '';
    const notifications = typeof this.app?.getNotifications === 'function' ? this.app.getNotifications() : [];
    for (const note of notifications) {
      const liEl = this.createNotificationRow(note);
      this.notificationBarItems.push({
        note: note,
        element: liEl,
      });
      this.notificationBarRootEl.appendChild(liEl);
    }
    const container = this.domParentEl || this.componentUIEl;
    if (container) {
      if (container.dataset) {
        container.dataset.notificationCount = String(this.notificationBarItems.length);
      } else if (typeof container.setAttribute === 'function') {
        container.setAttribute('data-notification-count', String(this.notificationBarItems.length));
      }
    }
    if (this.notificationBarItems.length <= 1) {
      if (this.expandCollapseToggle) {
        this.expandCollapseToggle.checked = false;
      }
      container?.classList.remove('expanded');
    }
  }

  createNotificationRow(note) {
    const noteId = note.id;
    const time = note.time ? utils.formatRelativeDateTime(note.time) : '?';
    const type = note.type ? note.type : '?';
    const actionButtonHtml = note.action
      ? `<button class="action-button" data-action="notification-action" title="${utils.escapeHtml(note.action.label)}">${
          note.action.icon ? `<i class="${note.action.icon}"></i>` : utils.escapeHtml(note.action.label)
        }</button>`
      : '';
    const newNote = domutils.htmlToElement(`
      <li class="notification" data-notification-id="${noteId}" title="${type} notification created ${time}">
        <span class="message">${utils.escapeHtml(note.note || '')}</span>
        <span class="tags">
          <span class="type" data-type="${type}">${type}</span>
          <span class="creation time">${time}</span>
        </span>
        <span class="action-bar">
          ${actionButtonHtml}
          <button class="close-button" data-action="dismiss-notification" title="Dismiss"><i class="far fa-times-circle"></i></button>
        </span>
      </li>`);
    return newNote;
  }
}
