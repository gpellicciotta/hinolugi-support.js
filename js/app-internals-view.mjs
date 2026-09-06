import AppView from './app-view.mjs';
import * as utils from './utils.mjs';
import * as formutils from './formutils.mjs';
import * as log from './log.mjs';

const VIEW_ID = 'app-internals-view';

export const SIGN_IN_STATE_CHANGED_EVENT = 'sign-in-state-changed';
export const APP_INSTALL_STATE_CHANGED_EVENT = 'app-install-state-changed';
export const SW_INSTALL_STATE_CHANGED_EVENT = 'sw-install-state-changed';
export const ACTION_STATE_CHANGED_EVENT = 'action-state-changed';
export const ACTION_ADDED_EVENT = 'action-added';
export const NOTIFICATIONS_CLEARED_EVENT = 'notifications-cleared';
export const NOTIFICATION_DELETED_EVENT = 'notification-deleted';
export const NOTIFICATION_ADDED_EVENT = 'notification-added';

export const DEFAULT_API_ROUTES = [
  '/api/status',
  '/api/version',
  '/api/server',
  '/api/tokens',
  '/api/credentials',
  '/api/sessions',
  '/api/users',
  '/api/users/me',
  '/api/counters',
  '/api/food-items',
  '/api/lists',
];

/**
 * App state internals view: for debugging and development.
 */
export default class AppInternalsView extends AppView {
  /**
   * Create an AppInternalsView.
   *
   * @param {object} app The app instance this view belongs to.
   * @param {object} [options] Optional configuration options.
   * @param {string} [options.apiBaseUrl] Base URL for the API Test Center.
   * @param {Array<string>} [options.apiRoutes] Custom endpoint routes for the datalist.
   * @param {number} [options.maxLogEvents] Maximum log events to keep in memory (default 25).
   */
  constructor(app, options = {}) {
    super(VIEW_ID, app, 'App Internals', new RegExp('^/internals([/?#].*)?$', 'i'));
    this.apiBaseUrl = options.apiBaseUrl || app?.apiBaseUrl || app?.constants?.API_BASE_URL || '/api';
    this.apiRoutes = options.apiRoutes || DEFAULT_API_ROUTES;
    this.maxLogEvents = options.maxLogEvents || 25;
    this.lastUpdateTime = null;
    this.updateTimer = null;
    this.logEvents = [];
    log.addLogHandler((logEvent) => {
      this.logEvents.push(logEvent);
      if (this.logEvents.length > this.maxLogEvents) {
        this.logEvents.splice(0, this.logEvents.length - this.maxLogEvents); // Remove oldest
      }
    });
  }

  registerEventListeners() {
    if (typeof this.app?.addEventListener !== 'function') return;
    this.registerEventListener(this.app, 'refresh', this.refreshComponentUI.bind(this));
    this.registerEventListener(this.app, SIGN_IN_STATE_CHANGED_EVENT, this.updateLoginState.bind(this));
    this.registerEventListener(this.app, APP_INSTALL_STATE_CHANGED_EVENT, this.updateInstallState.bind(this));
    this.registerEventListener(this.app, SW_INSTALL_STATE_CHANGED_EVENT, this.updateInstallState.bind(this));
    this.registerEventListener(this.app, ACTION_STATE_CHANGED_EVENT, this.onActionsChanged.bind(this));
    this.registerEventListener(this.app, ACTION_ADDED_EVENT, this.onActionsChanged.bind(this));
    this.registerEventListener(this.app, NOTIFICATIONS_CLEARED_EVENT, this.onNotificationsChanged.bind(this));
    this.registerEventListener(this.app, NOTIFICATION_DELETED_EVENT, this.onNotificationsChanged.bind(this));
    this.registerEventListener(this.app, NOTIFICATION_ADDED_EVENT, this.onNotificationsChanged.bind(this));
  }

  attach(el, route, state) {
    super.attach(el, route, state);
    const MILLIS_PER_30S = 30 * 1000;
    this.updateTimer = setInterval(this.updateLogs.bind(this), MILLIS_PER_30S, 'timer-triggered');
    this.refreshComponentUI();
  }

  detach() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    super.detach();
  }

  createMainUIHtml() {
    return `
      <div class="${this.id} main">
        ${this.createLogInCenterPanelHtml()}
        ${this.createInstallCenterPanelHtml()}
        ${this.createActionCenterPanelHtml()}
        ${this.createViewCenterPanelHtml()}
        ${this.createNotificationCenterPanelHtml()}
        ${this.createLoggingConfigCenterPanelHtml()}
        ${this.createLoggingCenterPanelHtml()}
        ${this.createApiTestCenterPanelHtml()}
      </div>`;
  }

  createLogInCenterPanelHtml() {
    return `
    <form id="log-in-center" class="panel">
     <h1>Log In Center</h1>
     <p class="login-state">Login state is being determined...</p>
    </form>`;
  }

  createInstallCenterPanelHtml() {
    return `
    <form id="install-center" class="panel">
      <h1>Install Center</h1>
      <p class="app-install-state">Checking whether already installed as app</p>
      <button class="install-app">Install as App</button>
      <p class="sw-install-state">Checking whether a service worker is already installed</p>
      <button class="check-for-sw-update">Check for Update</button>
      <button class="install-sw-update button">Install Update</button>
    </form>`;
  }

  createActionCenterPanelHtml() {
    return `
    <form id="action-center" class="panel">
      <h1>Action Center</h1>
      <table class="actions">
        <thead>
          <tr>
            <th class="id">ID</th>
            <th class="state">State</th>
            <th class="count">Run Count</th>
            <th class="description">Description</th>
            <th class="actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="5">No actions yet</td></tr>
        </tbody>
      </table>
    </form>`;
  }

  createViewCenterPanelHtml() {
    return `
    <form id="view-center" class="panel">
      <h1>View Center</h1>
      <table class="views">
        <thead>
          <tr>
            <th class="id">ID</th>
            <th class="title">Title</th>
            <th class="count">Activation Count</th>
            <th class="actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="4">No views yet</td></tr>
        </tbody>
      </table>
    </form>`;
  }

  createNotificationCenterPanelHtml() {
    return `
    <form id="notification-center" class="panel">
      <h1>Notification Center</h1>
      <div class="actions-bar">
        <button id='add-random-notification'><i class="icon fas fa-dice"></i><i class="text">Add Random Notification</i></button>
        <button id='delete-all-notifications'><i class="icon fas fa-trash"></i><i class="text">Delete All Notifications</i></button>
      </div>
      <table class="notifications">
        <thead>
          <tr>
            <th class="id">ID</th>
            <th class="type">Type</th>
            <th class="message">Message</th>
            <th class="time">Time</th>
            <th class="actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="5">No notifications yet</td></tr>
        </tbody>
      </table>
    </form>`;
  }

  createLoggingConfigCenterPanelHtml() {
    return `
    <form id="logging-config-center" class="panel">
      <h1>Logging Config Center</h1>
      <div class="form-group">
        <label for="max-log-events">Max. log events to keep:</label>
        <input id="max-log-events" name="max-log-events" type="number" placeholder="Max. events to keep"></input>
        <label for="min-log-level">Min. Log Level</label>
        <select id="min-log-level" name="min-log-level" class="form-control">
          <option value="${log.ERROR_LEVEL}">error</option>
          <option value="${log.WARNING_LEVEL}">warning</option>
          <option value="${log.INFO_LEVEL}" selected="selected">info</option>
          <option value="${log.TRACE_LEVEL}">trace</option>
        </select>
      </div>
    </form>`;
  }

  createLoggingCenterPanelHtml() {
    return `
    <form id="logging-center" class="panel">
      <h1>Logging Center</h1>
      <div class="actions-bar">
        <span id="log-filter" class="icon-input">
          <input name="filter-words"><i class="icon fa fa-search"></i>
        </span>
        <button id='add-random-log'><i class="icon fas fa-dice"></i><i class="text">Add Random Log Event</i></button>
        <button id='delete-all-logs'><i class="icon fas fa-trash"></i><i class="text">Delete All Logs</i></button>
      </div>
      <ol class="logs">
        <li class="header">
          <span class="time">Time</span>
          <span class="name">Name</span>
          <span class="type">Type</span>
          <span class="message">Message</span>
          <span class="actions">Actions</span>
        </li>
        <li>No logs yet</li>
      </ol>
    </form>`;
  }

  createApiTestCenterPanelHtml() {
    const routes = this.apiRoutes || DEFAULT_API_ROUTES;
    const routeOptions = routes.map((r) => `<option value="${r}">${r}</option>`).join('\n              ');
    return `
    <div id="api-test-center" class="panel">
      <h1>API Test Center</h1>
      <fieldset name='api-test-panel'>
        <legend>API Test Request Data</legend>
        <form class="form-group">
          <div class="form-group">
            <label for="api-test-panel-method">HTTP Method</label>
            <select id="api-test-panel-method" name="methods" class="form-control">
              <option value="GET" selected="selected">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div class="form-group">
            <label for="api-test-panel-uri">HTTP URI</label>
            <input id="api-test-panel-uri" class="form-control" type="text" name="api-test-panel-uri" list="api-routes" placeholder="URI"></input>
            <datalist id="api-routes">
              ${routeOptions}
            </datalist>
          </div>
          <div class="form-group">
            <label for="api-test-panel-datatype">Body Data Type</label>
            <select id="api-test-panel-datatype" name="api-test-panel-datatype" class="form-control">
              <option value="NONE" selected="selected">No data</option>
              <option value="FORMDATA">Form Data</option>
              <option value="JSON">Json</option>
            </select>
          </div>
          <div class="form-group">
            <label for="api-test-panel-data">Body Data</label>
            <textarea id="api-test-panel-data" class="form-control" rows="10" type='text' name='data' placeholder='The data to be sent'></textarea>
          </div>
          <div class="form-group">
            <input id="api-test-panel-send" type='button' value='Send Request'></input>
          </div>
        </form>
      </fieldset>
      <fieldset name='api-test-panel'>
        <legend>API Test Response Data</legend>
        <div id='api-test-panel-response'>
          <div id="api-test-panel-response-code">None yet</div>
          <pre id="api-test-panel-response-data">None yet</pre>
        </div>
      </fieldset>
    </div>`;
  }

  createMainUI() {
    super.createMainUI();
    // UI parts:
    // Login Center:
    this.loginStateElement = this.mainUIEl.querySelector('p.login-state');
    // Install Center:
    this.appInstallStateElement = this.mainUIEl.querySelector('p.app-install-state');
    this.installAppButton = this.mainUIEl.querySelector('button.install-app');
    this.swInstallStateElement = this.mainUIEl.querySelector('p.sw-install-state');
    this.checkForSwUpdateButton = this.mainUIEl.querySelector('button.check-for-sw-update');
    this.installSwUpdateButton = this.mainUIEl.querySelector('button.install-sw-update');

    if (this.installAppButton) {
      this.installAppButton.addEventListener('click', this.doAppInstall.bind(this));
    }
    if (this.checkForSwUpdateButton) {
      this.checkForSwUpdateButton.addEventListener('click', this.doCheckForServiceWorkerUpdate.bind(this));
    }
    if (this.installSwUpdateButton) {
      this.installSwUpdateButton.addEventListener('click', this.doInstallServiceWorkerUpdate.bind(this));
    }
    // Actions Center:
    this.actionsTableBodyElement = this.mainUIEl.querySelector('table.actions > tbody');
    // Views Center:
    this.viewsTableBodyElement = this.mainUIEl.querySelector('table.views > tbody');
    // Notifications Center:
    this.notificationsTableBodyElement = this.mainUIEl.querySelector('table.notifications > tbody');
    this.createRandomNotificationButton = this.mainUIEl.querySelector('#add-random-notification');
    if (this.createRandomNotificationButton) {
      this.createRandomNotificationButton.addEventListener('click', this.doAddRandomNotification.bind(this));
    }
    this.deleteAllNotificationsButton = this.mainUIEl.querySelector('#delete-all-notifications');
    if (this.deleteAllNotificationsButton) {
      this.deleteAllNotificationsButton.addEventListener('click', this.doClearAllNotifications.bind(this));
    }
    // Logging Center:
    this.logTableBodyElement = this.mainUIEl.querySelector('#logging-center .logs');
    this.maxLogEventsInput = this.mainUIEl.querySelector('#max-log-events');
    if (this.maxLogEventsInput) {
      this.maxLogEventsInput.value = this.maxLogEvents;
      this.maxLogEventsInput.addEventListener('change', () => {
        const max = +this.maxLogEventsInput.value;
        if (max > 1 && max < this.logEvents.length) {
          this.maxLogEvents = max;
          this.logEvents.splice(0, this.logEvents.length - max);
          this.updateLogs();
        }
      });
    }
    this.minLogLevelSelect = this.mainUIEl.querySelector('#min-log-level');
    if (this.minLogLevelSelect) {
      this.minLogLevelSelect.value = log.config()['min-level'];
      this.minLogLevelSelect.addEventListener('change', () => {
        const desiredLogLevel = +this.minLogLevelSelect.value;
        log.config({ 'min-level': desiredLogLevel });
        log.info(`Reconfigured global log level to '${log.levelToLevelName(log.config()['min-level'])}'`);
      });
    }
    this.logFilterInputEl = this.mainUIEl.querySelector('#log-filter > input');
    if (this.logFilterInputEl) {
      this.logFilterInputEl.addEventListener('keyup', () => {
        this.doFilterLogs();
      });
    }
    this.createRandomLogMessageButton = this.mainUIEl.querySelector('#add-random-log');
    if (this.createRandomLogMessageButton) {
      this.createRandomLogMessageButton.addEventListener('click', this.doAddRandomLogMessage.bind(this));
    }
    this.deleteAllLogsButton = this.mainUIEl.querySelector('#delete-all-logs');
    if (this.deleteAllLogsButton) {
      this.deleteAllLogsButton.addEventListener('click', this.doClearAllLogs.bind(this));
    }
    // API Test Center:
    this.httpMethodSelect = this.mainUIEl.querySelector('#api-test-panel-method');
    this.uriElement = this.mainUIEl.querySelector('#api-test-panel-uri');
    this.dataElement = this.mainUIEl.querySelector('#api-test-panel-data');
    this.dataTypeSelect = this.mainUIEl.querySelector('#api-test-panel-datatype');
    this.sendButton = this.mainUIEl.querySelector('#api-test-panel-send');
    if (this.sendButton) {
      this.sendButton.addEventListener('click', this.doApiTest.bind(this));
    }
    this.responseCodeElement = this.mainUIEl.querySelector('#api-test-panel-response-code');
    this.responseDataElement = this.mainUIEl.querySelector('#api-test-panel-response-data');
  }

  onActionsChanged() {
    this.updateActions();
  }

  onNotificationsChanged() {
    this.updateNotifications();
  }

  doAddRandomNotification(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    this.addRandomNotification();
    this.updateNotifications();
  }

  doClearAllNotifications(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof this.app?.clearNotifications === 'function') {
      this.app.clearNotifications();
    }
    this.updateNotifications();
  }

  addRandomNotification() {
    let msg = 'A random message ' + utils.random(10, 30);
    let msgType = utils.randomElement(['warning', 'info', 'error', 'question']);
    if (typeof this.app?.addNotification === 'function') {
      this.app.addNotification(msg, msgType);
    }
  }

  doAddRandomLogMessage(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    this.addRandomLogMessage();
    this.updateLogs();
  }

  doClearAllLogs(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    this.logEvents = [];
    this.updateLogs();
  }

  addRandomLogMessage() {
    let msg = 'A random message ' + utils.random(10, 30);
    let level = utils.randomElement([log.TRACE_LEVEL, log.INFO_LEVEL, log.WARNING_LEVEL, log.ERROR_LEVEL]);
    log.log(level, msg);
  }

  doFilterLogs() {
    if (!this.logFilterInputEl || !this.logTableBodyElement) return;
    const filterVal = this.logFilterInputEl.value.toLowerCase();
    if (
      this.logTableBodyElement.dataset.lastFilterVal &&
      this.logTableBodyElement.dataset.lastFilterVal === filterVal
    ) {
      return;
    }
    this.log.trace(`Filtering logs with '${filterVal}' in name...`);
    this.logTableBodyElement.querySelectorAll('.log-event').forEach((itemEl) => {
      const eventText = itemEl.innerText.toLowerCase();
      if (!filterVal || eventText.indexOf(filterVal.toLowerCase()) >= 0) {
        formutils.enable(itemEl);
      } else {
        formutils.disable(itemEl);
      }
    });
    this.logTableBodyElement.dataset.lastFilterVal = filterVal;
  }

  refreshComponentUI() {
    if (this.startWaitUITimer) {
      clearTimeout(this.startWaitUITimer);
    }
    this.updateLoginState();
    this.updateInstallState();
    this.updateActions();
    this.updateViews();
    this.updateNotifications();
    this.updateLogs();
  }

  async updateLoginState() {
    if (!this.loginStateElement) return;
    if (!this.app?.signedInUser || !this.app.signedInUser.id) {
      this.loginStateElement.innerHTML = `<p>App. is being used anonymously.</p>
                                          <p>Sign in via:</p>
                                          <button id="sign-in-button">Sign In</button>`;
      const button = this.loginStateElement.querySelector('#sign-in-button');
      if (button) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          if (typeof this.app?.activateView === 'function') {
            this.app.activateView('/sign-in', {}, 'Sign-in button clicked');
          }
        });
      }
    } else {
      this.loginStateElement.innerHTML = `<p>${this.app.signedInUser.name} is <b>signed-in</b>.</p>
                                          <p>Sign-out via:</p>
                                          <button id="sign-out-button">Sign Out</button>`;
      const button = this.loginStateElement.querySelector('#sign-out-button');
      if (button) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          if (typeof this.app?.setSignedInUser === 'function') {
            this.app.setSignedInUser(null);
          }
          this.updateLoginState();
        });
      }
    }
  }

  async updateInstallState() {
    if (!this.appInstallStateElement || !this.swInstallStateElement) return;
    // App install state:
    let appInstallState = 'App. install state is being determined...';
    if (this.app?.isAppInstalled && this.app.isAppInstalled()) {
      appInstallState = 'App. has been installed';
      if (this.installAppButton) formutils.disable(this.installAppButton);
    } else if (this.app?.isAppInstallable && this.app.isAppInstallable()) {
      appInstallState = 'App. has been not been installed yet';
      if (this.installAppButton) formutils.enable(this.installAppButton);
    } else {
      appInstallState = 'App. install state cannot currently be determined';
      if (this.installAppButton) formutils.disable(this.installAppButton);
    }
    this.appInstallStateElement.innerHTML = appInstallState;

    // SW install state:
    let swInstallState = 'SW install state is being determined...';
    const sw =
      typeof this.app?.getServiceWorkerRegistration === 'function' ? this.app.getServiceWorkerRegistration() : null;
    if (!sw) {
      swInstallState = 'No service worker has been registered yet';
      if (this.checkForSwUpdateButton) formutils.disable(this.checkForSwUpdateButton);
      if (this.installSwUpdateButton) formutils.disable(this.installSwUpdateButton);
    } else if (sw.waiting) {
      swInstallState = 'SW is ready for install';
      if (this.checkForSwUpdateButton) formutils.disable(this.checkForSwUpdateButton);
      if (this.installSwUpdateButton) formutils.enable(this.installSwUpdateButton);
    } else if (sw.active) {
      swInstallState = 'SW has been installed and is active';
      if (this.checkForSwUpdateButton) formutils.enable(this.checkForSwUpdateButton);
      if (this.installSwUpdateButton) formutils.disable(this.installSwUpdateButton);
    }
    this.swInstallStateElement.innerHTML = swInstallState;
  }

  doAppInstall(event) {
    this.log.trace('Installing as app...');
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof this.app?.installApp === 'function') {
      this.app.installApp();
    }
  }

  doCheckForServiceWorkerUpdate(event) {
    this.log.trace('Checking for service worker update...');
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof this.app?.runAction === 'function') {
      this.app.runAction('check-app-update');
    }
    setTimeout(() => {
      this.updateInstallState();
    }, 200);
  }

  doInstallServiceWorkerUpdate(event) {
    this.log.trace('Installing service worker update...');
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (this.installSwUpdateButton) formutils.disable(this.installSwUpdateButton);
    if (typeof this.app?.runAction === 'function') {
      this.app.runAction('install-app-update');
    }
    setTimeout(() => {
      this.updateInstallState();
    }, 200);
  }

  async updateActions() {
    if (!this.actionsTableBodyElement) return;
    let actionsTableRows = '<tr><td colspan="5">No actions yet</td></tr>';
    if (this.app?.actions && this.app.actions.size > 0) {
      actionsTableRows = '';
      this.app.actions.forEach((action, actionId) => {
        const isEnabled = typeof this.app.isActionEnabled === 'function' ? this.app.isActionEnabled(actionId) : true;
        actionsTableRows += `
          <tr>
            <td>${actionId}</td>
            <td>
              <label class="toggle-checkbox toggle-action" for="toggle-${actionId}" data-action-id="${actionId}">
                <input id="toggle-${actionId}" name="toggle-${actionId}" type="checkbox" ${isEnabled ? 'checked' : ''}>
                <i title="Enable" class="checked icon fa fa-toggle-on"></i>
                <i title="Disable" class="unchecked icon fa fa-toggle-off"></i>
              </label>
            </td>
            <td>${Object.prototype.hasOwnProperty.call(action, 'run-count') ? action['run-count'] : 'Unknown'}</td>
            <td>${action['description'] ? action['description'] : 'No description'}</td>
            <td>
              <button class="${isEnabled ? '' : 'disabled '}action run-action" data-action="${actionId}">
                <i class="icon far fa-play-circle"></i><i class="text">Run</i>
              </button>
            </td>
          </tr>`;
      });
    }
    this.actionsTableBodyElement.innerHTML = actionsTableRows;
    this.actionsTableBodyElement.querySelectorAll('.toggle-action > input[type=checkbox]').forEach((toggle) => {
      toggle.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const label = toggle.closest('.toggle-action');
        const actionId = label.getAttribute('data-action-id');
        this.log.trace(`Toggling action with id ${actionId}`);
        if (typeof this.app?.toggleAction === 'function') {
          this.app.toggleAction(actionId);
        }
        this.updateActions();
      });
    });
    this.actionsTableBodyElement.querySelectorAll('button.toggle-action').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const actionId = button.getAttribute('data-action-id');
        this.log.trace(`Toggling action with id ${actionId}`);
        if (typeof this.app?.toggleAction === 'function') {
          this.app.toggleAction(actionId);
        }
        this.updateActions();
      });
    });
    this.actionsTableBodyElement.querySelectorAll('button.run-action').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const actionId = button.dataset.action;
        this.log.trace(`Running action with id ${actionId}`);
        if (typeof this.app?.runAction === 'function') {
          this.app.runAction(actionId);
        }
        this.updateActions();
      });
    });
  }

  async updateViews() {
    if (!this.viewsTableBodyElement) return;
    let viewsTableRows = '<tr><td colspan="4">No views yet</td></tr>';
    if (this.app?.views && this.app.views.length) {
      viewsTableRows = '';
      this.app.views.forEach((view) => {
        viewsTableRows += `
          <tr>
            <td>${view.id}</td>
            <td>${view.title}</td>
            <td>${Object.prototype.hasOwnProperty.call(view, 'activation-count') ? view['activation-count'] : 'Unknown'}</td>
            <td>`;
        if (Object.prototype.hasOwnProperty.call(view, 'defaultRoute') && view.defaultRoute) {
          viewsTableRows += `<button class="go-to-view-action action" data-view-route="${view.defaultRoute}"><i class="icon far fa-play-circle"></i><i class="text">Activate</i></button>`;
        } else {
          viewsTableRows += `&nbsp;`;
        }
        viewsTableRows += `
            </td>
          </tr>`;
      });
    }
    this.viewsTableBodyElement.innerHTML = viewsTableRows;
    this.viewsTableBodyElement.querySelectorAll('button.go-to-view-action').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const viewRoute = button.getAttribute('data-view-route');
        this.log.trace(`Activating view with route ${viewRoute}`);
        if (typeof this.app?.activateView === 'function') {
          this.app.activateView(viewRoute, {}, 'Click activate-view button');
        }
        this.updateViews();
      });
    });
  }

  async updateNotifications() {
    if (!this.notificationsTableBodyElement) return;
    let notificationsTableRows = '<tr><td colspan="5">No notifications yet</td></tr>';
    if (this.app?.notifications && this.app.notifications.length > 0) {
      notificationsTableRows = '';
      this.app.notifications.forEach((note) => {
        notificationsTableRows += `
          <tr>
            <td>${note.id}</td>
            <td>${note.type}</td>
            <td>${note.note}</td>
            <td>${utils.formatDateTime(note.time)}</td>
            <td><button class="delete-action action" data-notification-id="${note.id}"><i class="icon fas fa-trash"></i><i class="text">Delete</i></button></td>
          </tr>`;
      });
    }
    this.notificationsTableBodyElement.innerHTML = notificationsTableRows;
    this.notificationsTableBodyElement.querySelectorAll('button.delete-action').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const noteId = +button.getAttribute('data-notification-id');
        this.log.trace(`Deleting notification with ID ${noteId}`);
        if (typeof this.app?.deleteNotification === 'function') {
          this.app.deleteNotification(noteId);
        }
        this.updateNotifications();
      });
    });
  }

  async updateLogs() {
    if (!this.logTableBodyElement) return;
    let logTableRows = '<li><span>No logs yet</li>';
    if (this.logEvents.length > 0) {
      logTableRows = '';
      this.logEvents.forEach((logEvent, index) => {
        logTableRows = `
          <li class="log-event">
            <span class="time">${utils.formatDateTime(logEvent.time)}</span>
            <span class="name">${logEvent.name}</span>
            <span class="type">${log.levelToLevelName(logEvent.level)}</span>
            <span class="message">${logEvent.message.replace('<', '&lt;').replace('>', '&gt;')}</span>
            <span class="actions"><button class="delete-action action" data-log-event-index="${index}" data-log-event-id="${logEvent.id}"><i class="icon fas fa-trash"></i><i class="text">Delete</i></button></span>
          </li>
          ${logTableRows}`;
      });
    }
    this.logTableBodyElement.innerHTML = `
      <li class="header">
        <span class="time">Time</span>
        <span class="name">Name</span>
        <span class="type">Type</span>
        <span class="message">Message</span>
        <span class="actions">Actions</span>
      </li>
      ${logTableRows}`;
    this.doFilterLogs();
    this.logTableBodyElement.querySelectorAll('button.delete-action').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const logEventId = +button.dataset.logEventId;
        const logEventIndex = +button.dataset.logEventIndex;
        log.defaultHandler({
          id: -1,
          level: log.INFO_LEVEL,
          message: `Deleting log event with ID ${logEventId}`,
          args: null,
        });
        this.logEvents.splice(logEventIndex, 1);
        this.updateLogs();
      });
    });
  }

  async doApiTest(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    this.log.trace('Performing API test');
    // URI + data
    let uri = this.uriElement ? this.uriElement.value : '';
    const baseUrl = this.apiBaseUrl || '';
    if (!uri.startsWith('http')) {
      if (uri.startsWith('/api')) {
        uri = baseUrl + uri.substring(4);
      } else {
        uri = baseUrl + uri;
      }
    }
    let data = this.dataElement ? this.dataElement.value : '';
    // Method + data type
    let httpMethod = this.httpMethodSelect ? this.httpMethodSelect.value : 'GET';
    let dataType = this.dataTypeSelect ? this.dataTypeSelect.value : 'NONE';
    // Fetch
    this.log.trace(`Trying to do a '${httpMethod} ${uri}' of type '${dataType}'`);
    let fetchUrl = uri || '/admin/version';
    let contentType =
      dataType === 'FORMDATA' ? 'application/x-www-form-urlencoded;charset=UTF-8' : 'application/json;charset=UTF-8';
    const authTokenCode = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('session-token') : null;
    let fetchOptions = {
      method: httpMethod,
      headers: {
        'Content-Type': contentType,
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    };
    if (authTokenCode) {
      fetchOptions.headers['Authorization'] = `Bearer ${authTokenCode}`;
    }
    if (data && httpMethod !== 'GET' && httpMethod !== 'DELETE') {
      fetchOptions.body = data;
    }
    const respCode = this.responseCodeElement;
    const respData = this.responseDataElement;
    if (respData) respData.innerText = 'Waiting...';
    const logInstance = this.log;
    let fetchSuccess = function (resp) {
      let respType = resp.headers?.get?.('content-type') || 'text/html';
      if (respCode) {
        respCode.innerHTML = '<b>' + resp.status + '</b> - ' + resp.statusText + ' - ' + respType;
      }
      if (respType === 'text/html' || respType === 'text/csv') {
        resp.text().then((txt) => {
          logInstance.trace('getting text or csv data');
          if (respData) respData.innerText = txt;
        });
      } else {
        resp.json().then((jsonData) => {
          logInstance.trace('getting json data');
          if (respData) respData.innerText = JSON.stringify(jsonData, null, 2);
        });
      }
      logInstance.trace('response received');
      logInstance.trace(resp);
    };
    let fetchError = function (err) {
      logInstance.error(`error received: ${err}`);
      if (respCode) respCode.innerHTML = '<h1>Error: ' + err.name + '</h1>';
      if (respData) respData.innerText = err.message;
    };
    if (typeof fetch === 'function') {
      fetch(fetchUrl, fetchOptions).then(fetchSuccess).catch(fetchError);
    }
  }
}
