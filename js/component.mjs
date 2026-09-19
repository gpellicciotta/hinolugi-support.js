import { Logger } from './logs.mjs';
import { capitalize } from './strings.mjs';

/**
 * Base SPA component lifecycle, event bookkeeping, and UI overlay management.
 *
 * Provides the Component class representing attachable/detachable DOM views
 * with integrated progress indicators, error overlays, and asynchronous task execution.
 *
 * @module component
 */

const DEFAULT_WAIT_UI_DELAY_TIME = 700; // ms before the wait overlay is shown for a long-running operation

/**
 * @typedef {Object} LongRunningOperationSpec
 * @property {string} title Human-readable operation title.
 * @property {string} [description] Detailed description shown in wait overlay.
 * @property {() => Promise<*>} start Async function executing the operation.
 * @property {(result: *) => void} [success] Callback invoked on successful completion.
 * @property {(errorInfo: Object) => void} [error] Callback invoked on operation failure.
 * @property {() => void} [always] Callback invoked regardless of outcome.
 */

/**
 * Base class for all attachable/detachable DOM components in the application.
 */
export default class Component {
  /**
   * Create a Component instance.
   *
   * @param {string} id Unique identifier for this component.
   * @param {object} app The application instance this component belongs to.
   */
  constructor(id, app) {
    this.id = id;
    this.log = new Logger(`${id}`);
    this.app = app;
    this.domParentEl = null;
    this.componentUIEl = null;
    this.mainUIEl = null;
    this.eventListeners = [];
    this.template = document.createElement('template');
    this.template.innerHTML = this.createComponentUIHtml();
  }

  /**
   * Attach component to a DOM container, instantiate elements, and register event listeners.
   *
   * @param {HTMLElement} el The DOM element to attach this component into.
   * @returns {void}
   */
  attach(el) {
    this.log.trace(`Attach '${this.id}' to DOM...`);
    this.domParentEl = el;
    if (this.componentUIEl == null) {
      // First time:
      this.componentUIEl = this.template.content.querySelector('#' + this.id).cloneNode(true);
      this.createMainUI();
      this.errorUIEl = this.componentUIEl.querySelector('.error-overlay');
      if (this.errorUIEl) {
        this.errorDescriptionEl = this.errorUIEl.querySelector('.description');
        this.errorTitleEl = this.errorUIEl.querySelector('.title');
      }
      this.waitUIEl = this.componentUIEl.querySelector('.wait-overlay');
      if (this.waitUIEl) {
        this.waitProgressEl = this.waitUIEl.querySelector('.progress-text');
      }
    }
    this.domParentEl.appendChild(this.componentUIEl);
    this.registerEventListeners();
  }

  /**
   * Locate and initialize the main UI container element within the component.
   *
   * @returns {void}
   */
  createMainUI() {
    this.mainUIEl = this.componentUIEl.lastElementChild;
    this.mainUIEl.classList.add('main'); // Ensure 'main' class
  }

  /**
   * Detach component from the DOM, unregister event listeners, and perform cleanup.
   *
   * @returns {void}
   */
  detach() {
    this.unregisterEventListeners();
    this.componentUIEl.remove();
    this.domParentEl = null;
    this.log.trace(`Detached '${this.id}' from DOM...`);
  }

  /**
   * Register a tracked event listener that will be cleaned up automatically upon detach.
   *
   * @param {EventTarget} target The DOM element or event target to listen on.
   * @param {string} eventType The event name or type.
   * @param {EventListener|Function} cb The event handler callback.
   * @returns {void}
   */
  registerEventListener(target, eventType, cb) {
    target.addEventListener(eventType, cb);
    this.log.trace(`Registering event listener for event '${eventType}' in view '${this.id}'`);
    this.eventListeners.push({ target: target, eventType: eventType, handler: cb });
  }

  /**
   * Register component-specific event listeners (intended to be overridden by subclasses).
   *
   * @returns {void}
   */
  registerEventListeners() {}

  /**
   * Remove all tracked event listeners previously registered via `registerEventListener`.
   *
   * @returns {void}
   */
  unregisterEventListeners() {
    for (const el of this.eventListeners) {
      this.log.trace(`Unregister event listener for event '${el.eventType}' from view '${this.id}'`);
      el.target.removeEventListener(el.eventType, el.handler);
    }
    this.eventListeners = [];
  }

  /**
   * Generate the outer component HTML template string including overlays and main container.
   *
   * @returns {string} Outer component HTML template string.
   */
  createComponentUIHtml() {
    return `
      <div id="${this.id}" class="component">
        <div class="error-overlay">
          <h1 class="logo">:(</h1>
          <h1 class="title">Error Title</h2>
          <p class="description">Error Description</p>
        </div>
        <div class="wait-overlay progress-component">
          <p class="progress-text">Waiting for data...</p>
          <svg class="progress-spinner" viewBox="0 0 50 50">
            <circle class="progress-path" cx="25" cy="25" r="20" fill="none" stroke-width="2"></circle>
          </svg>
        </div>
        ${this.createMainUIHtml()}
      </div>`;
  }

  /**
   * Generate the inner main UI HTML string (intended to be overridden by subclasses).
   *
   * @returns {string} Inner main UI HTML string.
   */
  createMainUIHtml() {
    return `
      <div class="${this.id} main">
      </div>`;
  }

  /**
   * Display the main UI and hide any active wait or error overlays.
   *
   * @param {*} [info] Optional data object passed to `updateMainUI`.
   * @returns {void}
   */
  showMainUI(info) {
    if (info) {
      this.updateMainUI(info);
    }
    if (this.componentUIEl) {
      this.componentUIEl.classList.remove('error-overlay');
      this.componentUIEl.classList.remove('wait-overlay');
      this.componentUIEl.setAttribute('data-ui-state', 'ready');
    }
  }

  /**
   * Update the main UI using provided data (intended to be overridden by subclasses).
   *
   * @param {*} info Data returned from `refreshData` or provided to `showMainUI`.
   * @returns {void}
   */
  updateMainUI(info) {}

  /**
   * Show the progress / wait overlay with an optional custom message.
   *
   * @param {Object} [waitInfo] Configuration for the wait overlay.
   * @param {string} [waitInfo.progress-message] Custom wait text to display.
   * @returns {void}
   */
  showWaitOverlay(waitInfo) {
    if (this.componentUIEl) {
      this.componentUIEl.classList.remove('error-overlay');
      if (this.waitUIEl) {
        this.waitProgressEl.innerHTML = waitInfo?.['progress-message'] || 'Waiting for data...';
      }
      this.componentUIEl.classList.add('wait-overlay');
      this.componentUIEl.setAttribute('data-ui-state', 'updating');
    }
  }

  /**
   * Show the error overlay with error title and description.
   *
   * @param {Object} [errInfo] Information describing the error.
   * @param {string} [errInfo.error-title] Error title text.
   * @param {string} [errInfo.error-description] Error description details.
   * @returns {void}
   */
  showErrorOverlay(errInfo) {
    if (this.componentUIEl) {
      this.componentUIEl.classList.remove('wait-overlay');
      if (this.errorUIEl) {
        this.errorTitleEl.innerHTML = errInfo?.['error-title'] || 'Unknown Error';
        this.errorDescriptionEl.innerHTML = errInfo?.['error-description'] || 'No details available... Sorry.';
      }
      this.componentUIEl.classList.add('error-overlay');
      this.componentUIEl.setAttribute('data-ui-state', 'error');
    }
  }

  /**
   * Fetch or prepare data for this component (intended to be overridden by subclasses).
   *
   * @returns {Promise<*>} Promise resolving with the data to pass to `updateMainUI`.
   * @throws {Error} If not implemented by a concrete subclass.
   */
  async refreshData() {
    throw new Error('The refreshData method is not implemented');
  }

  /**
   * Initiate a UI refresh by executing `refreshData` within a managed long-running operation.
   *
   * @param {*} [event] Optional triggering event.
   * @returns {void}
   */
  refreshComponentUI(event) {
    if (!this.domParentEl) {
      return; // No refreshing if not attached
    }
    const viewObject = this;
    const op = {
      title: `Refresh ${this.title} View`,
      description: 'Updating data',
      start: () => {
        return viewObject.refreshData(event);
      },
      success: (info) => {
        viewObject.showMainUI(info);
      },
      error: (err) => {
        viewObject.showErrorOverlay(err);
      },
    };
    this.startLongRunningOperation(op);
  }

  /**
   * Start an asynchronous long-running operation with automatic progress timing, error handling, and overlays.
   *
   * @param {LongRunningOperationSpec|string|(() => Promise<*>)} longRunningOperation Operation spec object, title string, or async task function.
   * @param {() => Promise<*>} [asyncFn] Async function to execute when first parameter is a title string.
   * @returns {void}
   */
  startLongRunningOperation(longRunningOperation, asyncFn) {
    let op = longRunningOperation;
    if (typeof longRunningOperation === 'string' && typeof asyncFn === 'function') {
      op = {
        title: longRunningOperation,
        description: longRunningOperation,
        start: asyncFn,
        success: () => {},
        error: (err) => {
          this.log.error(`Operation '${longRunningOperation}' failed:`, err);
        },
      };
    } else if (typeof longRunningOperation === 'function') {
      op = {
        title: 'Operation',
        description: 'Operation in progress',
        start: longRunningOperation,
        success: () => {},
        error: (err) => {
          this.log.error('Operation failed:', err);
        },
      };
    }

    if (!op || typeof op.start !== 'function') {
      this.log.error(
        'Invalid long-running operation argument passed to startLongRunningOperation',
        longRunningOperation,
      );
      return;
    }

    if (this.startWaitUITimer) {
      clearTimeout(this.startWaitUITimer);
      this.startWaitUITimer = null;
    }
    const currentTimer = setTimeout(() => {
      if (this.startWaitUITimer === currentTimer) {
        this.startWaitUITimer = null;
        if (this.app && typeof this.app.startProgress === 'function') {
          this.app.startProgress();
          this._hasActiveAppProgress = true;
        }
        this.showWaitOverlay({ 'progress-message': op.description || op.title || 'Waiting for data...' });
      }
    }, DEFAULT_WAIT_UI_DELAY_TIME);
    this.startWaitUITimer = currentTimer;

    this.log.info(`Long-running operation '${op.title}' has started`);
    op.start()
      .then((info) => {
        this.log.trace(`Long-running operation '${op.title}' has succeeded: `, info);
        if (this.startWaitUITimer === currentTimer) {
          clearTimeout(this.startWaitUITimer);
          this.startWaitUITimer = null;
        }
        if (op.success) {
          op.success(info);
        }
      })
      .catch((err) => {
        this.log.error(`Long-running operation '${op.title}' has failed: `, err);
        if (this.startWaitUITimer) {
          clearTimeout(this.startWaitUITimer);
          this.startWaitUITimer = null;
        }
        let errMsg = err?.message;
        if (errMsg) {
          errMsg = capitalize(errMsg);
        }
        const errorInfo = {
          'error-title': op.title,
          'error-description': errMsg || op.description || 'No details available... Sorry.',
          'error-cause': err,
        };
        if (op.error) {
          op.error(errorInfo);
        }
      })
      .finally(() => {
        if (this.startWaitUITimer) {
          clearTimeout(this.startWaitUITimer);
          this.startWaitUITimer = null;
        }
        if (this._hasActiveAppProgress) {
          if (this.app && typeof this.app.stopProgress === 'function') {
            this.app.stopProgress();
          }
          this._hasActiveAppProgress = false;
        }
        if (this.componentUIEl) {
          this.componentUIEl.classList.remove('wait-overlay');
        }
        this.log.trace(`Long-running operation '${op.title}' has ended`);
        if (op.always) {
          op.always();
        }
      });
  }
}
