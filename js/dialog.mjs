import { EventEmitter } from './events.mjs';
import { Logger } from './logs.mjs';
import { disable, enable } from './forms.mjs';

/**
 * Modal dialog component with customizable buttons, backdrop overlay, and async promise resolution.
 *
 * Extends EventEmitter to notify callers of 'open' and 'close' events,
 * and provides an async open() method resolving to the selected answer value.
 *
 * @module dialog
 */

/**
 * Modal dialog component capable of displaying interactive prompts and resolving user choices.
 */
export default class Dialog extends EventEmitter {
  /**
   * Create a Dialog instance.
   *
   * @param {string} id Unique identifier for this dialog.
   * @param {object} app The application instance this dialog belongs to.
   * @param {string} [title='What is your answer?'] The prompt question displayed in the dialog header.
   * @param {Object<string, *>} [answers={ Yes: true, No: false }] Mapping of button labels to their resolved values.
   */
  constructor(id, app, title = 'What is your answer?', answers = { Yes: true, No: false }) {
    super();
    this.id = id;
    this.log = new Logger(`${id}`);
    this.app = app;
    this.title = title;
    this.answers = answers;
    this.overlay = this.createDialogOverlay();
    this.dialog = this.createDialog();
    this.overlay.appendChild(this.dialog);
    this.registeredEvents = [];
  }

  /**
   * Generate the dialog container HTML (intended to be overridden by subclasses).
   *
   * @returns {string} Dialog container HTML template string.
   */
  createDialogUIHtml() {
    return `
      <div id="${this.id}" class="dialog">
        ${this.createDialogCloseButton()}
        <h1 class="dialog-title">${this.title}</h1>
        <div class="dialog-buttons">
          ${this.createDialogButtons()}
        </div> 
      </div>
      `;
  }

  /**
   * Generate the close button HTML element string.
   *
   * @returns {string} HTML markup for the close button.
   */
  createDialogCloseButton() {
    return `<button href="#" data-answer="undefined" id="close-dialog-button" class="close-button"><i class="fa fa-xmark"></i></button>`;
  }

  /**
   * Generate HTML buttons for all configured answers.
   *
   * @returns {string} HTML markup for all answer buttons.
   */
  createDialogButtons() {
    let buttonHtml = '';
    for (const answer in this.answers) {
      buttonHtml += `
        <button data-answer="${answer}">${answer}</button>
      `;
    }
    return buttonHtml;
  }

  /**
   * Create and initialize the backdrop overlay DOM element.
   *
   * @returns {HTMLElement} The backdrop overlay element.
   */
  createDialogOverlay() {
    const overlay = document.createElement('div');
    overlay.id = `${this.id}-overlay`;
    overlay.classList.add('dialog-overlay', 'disabled');
    return overlay;
  }

  /**
   * Create and initialize the dialog DOM element from its HTML template.
   *
   * @returns {HTMLElement} The dialog DOM element.
   */
  createDialog() {
    const dialogTemplate = document.createElement('template');
    dialogTemplate.innerHTML = this.createDialogUIHtml();
    const dialog = dialogTemplate.content.querySelector('#' + this.id).cloneNode(true);
    dialog.classList.add('dialog');
    return dialog;
  }

  /**
   * Process click events within the dialog to detect button responses.
   *
   * @param {MouseEvent} event The click event.
   * @returns {void}
   */
  onClick(event) {
    if (event && event.target) {
      let eventTarget = event.target;
      if (!eventTarget.hasAttribute('data-answer')) {
        eventTarget = eventTarget.closest('[data-answer]');
      }
      if (eventTarget) {
        event.preventDefault();
        const answerId = eventTarget.dataset.answer;
        const answerValue = this.answers[answerId];
        this.close(answerValue);
      }
    }
  }

  /**
   * Display the modal dialog and return a Promise resolving to the selected answer value.
   *
   * @returns {Promise<*>} Promise resolving with the selected answer value or undefined.
   */
  async open() {
    let attachedOverlay = document.querySelector(`#${this.id}-overlay`);
    if (!attachedOverlay) {
      document.body.appendChild(this.overlay);
      attachedOverlay = document.querySelector(`#${this.id}-overlay`);
    }
    const ce = this.onClick.bind(this);
    this.registeredEvents.push({ target: this.dialog, type: 'click', callback: ce });
    this.dialog.addEventListener('click', ce);
    this.result = null;
    enable(this.overlay);
    this.dispatchEvent({ type: 'open', dialog: this });
    const dlg = this;
    return new Promise((resolve) => {
      const callback = (e) => {
        dlg.removeEventListener('close', callback);
        resolve(e.result);
      };
      dlg.addEventListener('close', callback);
    });
  }

  /**
   * Close the dialog, unregister listeners, remove overlay from DOM, and dispatch close event.
   *
   * @param {*} [answer] The answer value to resolve the dialog with.
   * @returns {void}
   */
  close(answer) {
    this.result = answer;
    disable(this.overlay);
    this.dispatchEvent({ type: 'close', dialog: this, result: this.result });
    for (const er of this.registeredEvents) {
      er.target.removeEventListener(er.type, er.callback);
    }
    document.body.removeChild(this.overlay);
  }
}
