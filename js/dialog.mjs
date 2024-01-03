import { EventEmitter } from './events.mjs';
import { Logger } from './log.mjs';
import * as formutils from './formutils.mjs';

/**
 *  Type representing a modal dialog that can be attached/de-attached from the DOM.
 *
 *  A component has following properties:
 *    - id: unique ID
 *    - app: the app it belongs to
 *    - domParentEl: when attached, the DOM element it is attached to.
 */
export default class Dialog extends EventEmitter
{
  /**
   *  Create the component.
   *
   *  @param id Unique ID for this component.
   *  @param app The app this component belongs to.
   *  @param title The question to be answered.
   *  @param answers The possible answers, with the value they represent.
   */
  constructor(id, app, title="What is your answer?", answers = { "Yes": true, "No": false }) {
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

  /** Should be overridden */
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

  createDialogCloseButton() {
    return `<button href="#" data-answer="undefined" id="close-dialog-button" class="close-button"><i class="fa fa-xmark"></i></button>`;
  }

  createDialogButtons() {
    const dlg = this;
    let buttonHtml = '';
    for (let answer in this.answers) {
      buttonHtml += `
        <button data-answer="${answer}">${answer}</button>
      `;
    }
    return buttonHtml;
  }

  createDialogOverlay() {
    let overlay = document.createElement("div");
    overlay.id = `${this.id}-overlay`;
    overlay.classList.add("dialog-overlay", "disabled");
    return overlay;
  }

  createDialog() {
    let dialogTemplate = document.createElement("template");
    dialogTemplate.innerHTML = this.createDialogUIHtml();
    let dialog = dialogTemplate.content.querySelector("#" + this.id).cloneNode(true);
    dialog.classList.add("dialog");
    return dialog;
  }

  onClick(event) {
    if (event && event.target) {
      let eventTarget = event.target;
      if (!eventTarget.hasAttribute("data-answer")) {
        eventTarget = eventTarget.closest("[data-answer]");
      }
      if (eventTarget) {
        event.preventDefault();
        let answerId = eventTarget.dataset.answer;
        let answerValue = this.answers[answerId];
        this.close(answerValue);
      }
    }
  }
  
  async open() {
    let attachedOverlay = document.querySelector(`#${this.id}-overlay`);
    if (!attachedOverlay) {
      document.body.appendChild(this.overlay);
      attachedOverlay = document.querySelector(`#${this.id}-overlay`);
    }
    let ce = this.onClick.bind(this);
    this.registeredEvents.push({ target: this.dialog, type: 'click', callback: ce });
    this.dialog.addEventListener('click', ce);
    this.result = null;
    formutils.enable(this.overlay);
    this.dispatchEvent({type: 'open', dialog: this});
    const dlg = this;
    return new Promise((resolve, reject) => {
      const callback = (e) => {
        dlg.removeEventListener('close', callback);
        resolve(e.result);
      };
      dlg.addEventListener('close', callback);
    });
  }

  close(answer) {
    this.result = answer;
    formutils.disable(this.overlay);
    this.dispatchEvent({ type: 'close', dialog: this, result: this.result });
    for (let er of this.registeredEvents) {
      er.target.removeEventListener(er.type, er.callback);
    }
    document.body.removeChild(this.overlay);
  }
}
