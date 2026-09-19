import Component from './component.mjs';
import { escapeRegex } from './strings.mjs';

/**
 * Base Application View class supporting contextual actions, routing regexes, and lifecycle integration.
 *
 * @module app-view
 */

/**
 * Type representing an application content view.
 *
 * A content view has following additional (on top of Component) properties:
 *   - title: the human-readable view title
 *   - routeRegex: regex that can be tested to see whether a view should be activated.
 *
 * Following methods should minimally be overridden/implemented:
 *   1) createMainUIHtml (unless the default <div class="${this.id}"></div> is sufficient)
 *   2) createMainUI (unless: see above)
 *   3) updateMainUI (unless: there is no refresh possible)
 *   4) async refreshData (unless: there is no data)
 */
export default class AppView extends Component {
  /**
   * Optional class reference for creating context action bars.
   * Can be configured globally or per-app on app.ActionBarClass.
   *
   * @type {typeof import('./app-action-bar.mjs').default|null}
   */
  static ActionBarClass = null;

  /**
   * Create the content view.
   *
   * @param {string} id Unique ID for this component.
   * @param {object} app The app this component belongs to.
   * @param {string} [title] The view title.
   * @param {RegExp} [routeRegex] Regex to determine whether a route should select this view.
   *                              Defaults to `^/{id}(/.*)?$`
   */
  constructor(id, app, title, routeRegex) {
    super(id, app);
    this.title = title;
    this.routeRegex = routeRegex || new RegExp('^/' + escapeRegex(id) + '(/.*)?$', 'i');
    this.actions = [];
    this.attachCount = 0;
    this.ctxActionBarId = null;
  }

  /**
   * Return actions provided by this view. Action IDs should start with the view ID, followed by a dot.
   *
   * @returns {Array<Object|null>} List of view actions (null denotes a separator).
   */
  getActions() {
    return [];
  }

  /**
   * Factory method to instantiate a contextual action bar for this view.
   * Resolves via app.createActionBar(), app.ActionBarClass, or AppView.ActionBarClass.
   *
   * @param {Array<string|null>} contextMenuActions Action IDs or null separators for the bar.
   * @returns {object|null} Context action bar instance, or null if unconfigured.
   */
  createContextActionBar(contextMenuActions) {
    if (typeof this.app?.createActionBar === 'function') {
      return this.app.createActionBar(this.ctxActionBarId, contextMenuActions);
    }
    const ActionBarClass = this.app?.ActionBarClass || AppView.ActionBarClass;
    if (ActionBarClass) {
      return new ActionBarClass(this.ctxActionBarId, this.app, contextMenuActions);
    }
    return null;
  }

  /**
   * Attach to DOM, register event listeners, record attach count, and register view actions.
   *
   * @param {HTMLElement} el The DOM container element to attach into.
   * @param {string} [route] Active route path.
   * @param {*} [state] Optional navigation state.
   * @returns {void}
   */
  attach(el, route, state) {
    super.attach(el);
    this.attachCount += 1;
    this.registerActions();
  }

  /**
   * Register view actions and optional context action bar with the app.
   *
   * @returns {void}
   */
  registerActions() {
    const app = this.app;
    let contextMenuActions = [];
    for (const viewAction of this.getActions()) {
      if (viewAction) {
        this.log.trace(`Registering view action '${viewAction.id}'`);
        this.actions.push(viewAction.id);
        if (typeof app?.addAction === 'function') {
          app.addAction(viewAction);
        }
      }
      if (!viewAction) {
        // Null means separator
        contextMenuActions.push(null);
      } else if (!('context-bar' in viewAction) || viewAction['context-bar']) {
        // Don't include if viewAction['context-bar'] === false
        contextMenuActions.push(viewAction.id);
      }
    }
    if (contextMenuActions.length > 0) {
      this.ctxActionBarId = this.id + '__context-action-bar';
      const ctxActionBar = this.createContextActionBar(contextMenuActions);
      if (ctxActionBar) {
        if (typeof app?.addActionBar === 'function') {
          app.addActionBar(ctxActionBar);
        }
        if (typeof app?.activateContextActionBar === 'function') {
          app.activateContextActionBar(ctxActionBar.id);
        }
      }
    }
  }

  /**
   * Unregister view actions and remove any contextual action bar.
   *
   * @returns {void}
   */
  unregisterActions() {
    if (this.ctxActionBarId) {
      if (typeof this.app?.removeActionBar === 'function') {
        this.app.removeActionBar(this.ctxActionBarId);
      }
      this.ctxActionBarId = null;
    }
    if (typeof this.app?.activateContextActionBar === 'function') {
      this.app.activateContextActionBar(null);
    }
    for (let actionId of this.actions) {
      this.log.trace(`Unregistering view action '${actionId}'`);
      if (typeof this.app?.removeAction === 'function') {
        this.app.removeAction(actionId);
      }
    }
    this.actions = [];
  }

  /**
   * Detach from DOM, unregister actions, and perform Component cleanup.
   *
   * @returns {void}
   */
  detach() {
    this.unregisterActions();
    super.detach();
  }

  /**
   * Fetch data for this view (intended to be overridden by subclasses).
   *
   * @param {*} [event] Optional triggering event.
   * @returns {Promise<*>} Promise resolving with view data passed to `updateMainUI`.
   */
  async refreshData(event) {
    this.log.error('The refreshData method is not implemented', this);
  }

  /**
   * Update the view's main UI using provided data (intended to be overridden by subclasses).
   *
   * @param {*} info Data returned from `refreshData` or provided to `showMainUI`.
   * @returns {void}
   */
  updateMainUI(info) {
    this.log.error('The updateMainUI method must be overridden/implemented', this);
  }
}
