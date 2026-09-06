import Component from './component.mjs';
import * as utils from './utils.mjs';

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
    this.routeRegex = routeRegex || new RegExp('^/' + utils.escapeRegex(id) + '(/.*)?$', 'i');
    this.actions = [];
    this.attachCount = 0;
    this.ctxActionBarId = null;
  }

  /**
   * Should be overridden - all action IDs should start with the view ID, followed by a dot.
   *
   * @returns {Array} List of view actions.
   */
  getActions() {
    return [];
  }

  /**
   * Factory method to instantiate a contextual action bar for this view.
   * Resolves via app.createActionBar(), app.ActionBarClass, or AppView.ActionBarClass.
   *
   * @param {Array} contextMenuActions Action IDs or action specs for the bar.
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

  /** Attach to DOM, register event listeners, do any additional startup */
  attach(el, route, state) {
    super.attach(el);
    this.attachCount += 1;
    this.registerActions();
  }

  /** Registers view actions and optional context action bar with the app. */
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

  /** Unregisters view actions and removes any contextual action bar. */
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

  /** Detach from DOM, unregister any event listeners, do any additional cleanup */
  detach() {
    this.unregisterActions();
    super.detach();
  }

  /**
   * Should be overridden.
   * The object returned will be passed to updateMainUI.
   */
  async refreshData(event) {
    this.log.error('The refreshData method is not implemented', this);
  }

  /** Should be overridden */
  updateMainUI(info) {
    this.log.error('The updateMainUI method must be overridden/implemented', this);
  }
}
