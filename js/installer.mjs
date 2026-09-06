// Installer for the SPA (PWA install-prompt handling)

import { Logger } from './log.mjs';

const defaultLog = new Logger('installer');

/**
 * PWA installation prompt handling and state tracking.
 */
export default class Installer {
  /**
   * Create an Installer instance.
   *
   * @param {Logger} [logger] Optional logger instance.
   */
  constructor(logger = defaultLog) {
    this.log = logger;
    this._deferredPrompt = null;
    this._installed = false;
  }

  /**
   * Whether the installer has run and the app is considered installed.
   */
  get installed() {
    return this._installed;
  }

  /**
   * Add a `beforeinstallprompt` event listener.
   *
   * @param {EventTarget} [ctx] The context to add the event listener to. Defaults to `window`.
   * @param {Function} [readyCallback] The callback to invoke once the app is ready for install.
   */
  registerBeforeInstallPromptListener(ctx, readyCallback) {
    ctx = ctx || (typeof window !== 'undefined' ? window : null);
    if (!ctx || typeof ctx.addEventListener !== 'function') {
      this.log.warn('Cannot register beforeinstallprompt listener: execution context has no addEventListener');
      return;
    }
    ctx.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); // Prevent Chrome 67 and earlier from automatically showing the prompt
      if (!this._deferredPrompt) {
        // Only report once
        this.log.info('App is ready for installation');
      }
      this._deferredPrompt = e; // Stash the event so it can be triggered later.
      if (readyCallback) {
        readyCallback();
      }
    });
    this.log.trace('Beforeinstallprompt listener has been registered');
  }

  /**
   * Request user consent for installation and then install.
   *
   * @param {Function} [installedCallback] Callback to invoke once user has given consent to install.
   * @returns {Promise<boolean>|boolean} Promise resolving to installation status, or false if not ready.
   */
  tryInstall(installedCallback) {
    if (!this._deferredPrompt) {
      this.log.warn('App is not ready for installation');
      return false;
    }
    this.log.info('Preparing for installation: asking user consent');
    // Show the prompt from within an event triggered by a user gesture
    try {
      this._deferredPrompt.prompt();
    } catch (error) {
      this.log.error('Failed to show install prompt: %O', error);
      return false;
    }
    // Wait for the user to respond to the prompt
    return this._deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult && choiceResult.outcome === 'accepted') {
        this.log.info('User accepted the "install" app prompt');
        this._deferredPrompt = null;
        this._installed = true;
        if (installedCallback) {
          installedCallback();
        }
      } else {
        this.log.warn('User dismissed the "install" app prompt');
      }
      return this._installed;
    });
  }
}
