import * as log from './log.mjs';

// Form related utility functions.

export function isEnabled(el) {
  return !el.classList.contains("disabled");
}

export function isDisabled(el) {
  return el.classList.contains("disabled");
}

export function disable(el, disableText) {
  let title = null;
  if (el.hasAttribute("title")) {
    title = el.getAttribute("title");
  }
  let disabledText = disableText || el.dataset.disabledText || "This element is currently disabled";
  if (title) {
    el.dataset.enabledText = title;
  }
  if (disabledText) {
    el.dataset.disabledText = disabledText;
    el.setAttribute('title', disabledText);
  }
  el.classList.add("disabled");
}

export function enable(el, enableText) {
  let enabledText = enableText || el.dataset.enabledText;
  if (enabledText) {
    el.setAttribute("title", enabledText);
    el.dataset.enabledText = enabledText;
  }
  el.classList.remove("disabled");
}

export function markValid(el) {
  let inputGroupEl = el.closest(".input-group");
  if (inputGroupEl) {
    inputGroupEl.classList.remove("invalid");
    inputGroupEl.classList.add("valid");
  }
}

export function markInvalid(el, errorText) {
  let inputGroupEl = el.closest(".input-group");
  if (inputGroupEl) {
    let errorTextEl = inputGroupEl.querySelector(".error-text");
    if (errorTextEl) {
      errorTextEl.innerHTML = errorText;
    }
    inputGroupEl.classList.remove("valid");
    inputGroupEl.classList.add("invalid"); 
  }
}

/**
 *  Assuming following HTML structure:
 *    <... class="icon-input">
 *      <input type='password' ...>
 *      <button><i class='icon fa fa-eye'></i></button>
 *    </...> 
 * 
 *  Make sure the button switches between revealing/disclosing the password input text.
 */
export function handlePasswordDisclosure(el) {
  const iconInputEl = el.closest('.icon-input');
  if (!iconInputEl) {
    throw new Error("Cannot determine root .icon-input");
  }
  const passwordEl = iconInputEl.querySelector("input");
  if (!passwordEl) {
    throw new Error("Cannot determine password input element");
  }
  const iconEl = iconInputEl.querySelector("button > .icon");
  if (!iconEl) {
    throw new Error("Cannot determine icon button element");
  }
  const buttonEl = iconEl.closest("button");
  buttonEl.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const iconButtonEl = buttonEl.querySelector(".icon"); // Need to do again, since the element might have changed from an <i> to an <svg?>
    if (passwordEl.type === "password") {
      passwordEl.setAttribute("type", "text");
      iconButtonEl.classList.remove("fa-eye");
      iconButtonEl.classList.add("fa-eye-slash");
    }
    else {
      passwordEl.setAttribute("type", "password");
      iconButtonEl.classList.remove("fa-eye-slash");
      iconButtonEl.classList.add("fa-eye");
    }
  });
}
