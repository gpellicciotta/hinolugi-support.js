import { Logger } from './log.mjs';
import * as utils from './utils.mjs';

// Base SPA component with a DOM lifecycle (attach/detach), event-listener bookkeeping, wait/error
// overlays, and a helper for running long-running (async) operations against that UI.

const DEFAULT_WAIT_UI_DELAY_TIME = 700; // ms before the wait overlay is shown for a long-running operation

/**
 *  Type representing a component that can be attached/de-attached from the DOM.
 *
 *  A component has following properties:
 *    - id: unique ID
 *    - app: the app it belongs to
 *    - domParentEl: when attached, the DOM element it is attached to.
 */
export default class Component {
  /**
   *  Create the component.
   *
   *  @param id Unique ID for this component.
   *  @param app The app this component belongs to.
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

  /** Attach to DOM, register event listeners, do any additional startup */
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

  createMainUI() {
    this.mainUIEl = this.componentUIEl.lastElementChild;
    this.mainUIEl.classList.add('main'); // Ensure 'main' class
  }

  /** Detach from DOM, unregister any event listeners, do any additional cleanup */
  detach() {
    this.unregisterEventListeners();
    this.componentUIEl.remove();
    this.domParentEl = null;
    this.log.trace(`Detached '${this.id}' from DOM...`);
  }

  registerEventListener(target, eventType, cb) {
    target.addEventListener(eventType, cb);
    this.log.trace(`Registering event listener for event '${eventType}' in view '${this.id}'`);
    this.eventListeners.push({ target: target, eventType: eventType, handler: cb });
  }

  /** Should be overridden */
  registerEventListeners() {}

  unregisterEventListeners() {
    for (const el of this.eventListeners) {
      this.log.trace(`Unregister event listener for event '${el.eventType}' from view '${this.id}'`);
      el.target.removeEventListener(el.eventType, el.handler);
    }
    this.eventListeners = [];
  }

  /** Could be overridden */
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

  /** Should be overridden / there should be a single root element. */
  createMainUIHtml() {
    return `
      <div class="${this.id} main">
      </div>`;
  }

  showMainUI(info) {
    if (info) {
      this.updateMainUI(info);
    }
    this.componentUIEl.classList.remove('error-overlay');
    this.componentUIEl.classList.remove('wait-overlay');
  }

  /**
   *  Should be overridden.
   *  Invoked with the object returned from refreshData.
   */
  updateMainUI(info) {}

  showWaitOverlay(waitInfo) {
    this.componentUIEl.classList.remove('error-overlay');
    if (this.waitUIEl) {
      this.waitProgressEl.innerHTML = waitInfo?.['progress-message'] || 'Waiting for data...';
    }
    this.componentUIEl.classList.add('wait-overlay');
  }

  showErrorOverlay(errInfo) {
    this.componentUIEl.classList.remove('wait-overlay');
    if (this.errorUIEl) {
      this.errorTitleEl.innerHTML = errInfo?.['error-title'] || 'Unknown Error';
      this.errorDescriptionEl.innerHTML = errInfo?.['error-description'] || 'No details available... Sorry.';
    }
    this.componentUIEl.classList.add('error-overlay');
  }

  /**
   *  Should be overridden.
   *  The object returned will be passed to updateMainUI.
   */
  async refreshData() {
    throw new Error('The refreshData method is not implemented');
  }

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
   *  Start a long-running operation, which will run asynchronously.
   *
   *  @param longRunningOperation Should be an object with:
   *    - title text property
   *    - description text property
   *    - start method returning a promise
   *    - success method that will be called when the promise resolves
   *    - error method that will be called when the promise rejects or some other error occurs
   *    - always method that will be called always, after either the success or error callbacks
   */
  startLongRunningOperation(longRunningOperation) {
    this.startWaitUITimer = setTimeout(() => {
      // Show wait UI only if we get no response within DEFAULT_WAIT_UI_DELAY_TIME
      this.startWaitUITimer = null;
      this.showWaitOverlay();
    }, DEFAULT_WAIT_UI_DELAY_TIME);

    this.log.info(`Long-running operation '${longRunningOperation.title}' has started`);
    longRunningOperation
      .start()
      .then((info) => {
        this.log.trace(`Long-running operation '${longRunningOperation.title}' has succeeded: `, info);
        if (this.startWaitUITimer) {
          clearTimeout(this.startWaitUITimer);
        }
        longRunningOperation.success(info);
      })
      .catch((err) => {
        this.log.error(`Long-running operation '${longRunningOperation.title}' has failed: `, err);
        if (this.startWaitUITimer) {
          clearTimeout(this.startWaitUITimer);
        }
        let errMsg = err?.message;
        if (errMsg) {
          errMsg = utils.capitalize(errMsg);
        }
        const errorInfo = {
          'error-title': longRunningOperation.title,
          'error-description': errMsg,
          'error-cause': err,
        };
        longRunningOperation.error(errorInfo);
      })
      .finally(() => {
        this.log.trace(`Long-running operation '${longRunningOperation.title}' has ended`);
        if (longRunningOperation.always) {
          longRunningOperation.always();
        }
      });
  }
}
