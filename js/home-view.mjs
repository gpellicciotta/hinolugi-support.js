import AppView from './app-view.mjs';

const VIEW_ID = 'home-view';

/**
 * Generic home view: displays sign-in / create-account links
 * and triggers showing the app splash screen on attach.
 */
export default class HomeView extends AppView {
  /**
   * Create a HomeView instance.
   *
   * @param {object} app The app instance this view belongs to.
   * @param {string} [title] Optional view title, defaults to `${app.name} Home` or `'Home'`.
   */
  constructor(app, title) {
    const viewTitle = title || (app?.name ? `${app.name} Home` : 'Home');
    super(VIEW_ID, app, viewTitle, new RegExp('^/([?#].*)?$', 'i'));
    this.neverWhenSignedIn = true;
  }

  createMainUIHtml() {
    return `
      <div id="${this.id}">
        <p><a data-action="navigate-to-sign-in" href="/sign-in">Sign In</a><span> or </span><a data-action="navigate-to-create-account" href="/create-account">Create Account</a></p>  
      </div>
      `;
  }

  attach(el, route, state) {
    super.attach(el, route, state);
    if (typeof this.app?.showSplashScreen === 'function') {
      this.app.showSplashScreen(true, true);
    }
  }
}
