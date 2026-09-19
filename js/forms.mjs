/**
 * Form element state, validity marking, loading states, and field validation.
 */

/**
 * Checks whether a string is a valid email address.
 *
 * @param {string} email
 * @returns {boolean} True if email is non-empty and matches standard email format.
 */
export function isValidEmailAddress(email) {
  if (!email) {
    return false;
  }
  if (email.indexOf('@') <= 0) {
    return false;
  }
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

/**
 * Checks whether a string is a valid password (at least 6 characters).
 *
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  if (!password || password.length < 6) {
    return false;
  }
  return true;
}

/**
 * Human-readable description of what constitutes a valid password.
 *
 * @returns {string}
 */
export function validPasswordDescription() {
  return 'minimally 6 letters';
}

/**
 * Returns true if element does not have the 'disabled' class.
 *
 * @param {HTMLElement} el
 * @returns {boolean}
 */
export function isEnabled(el) {
  return !el.classList.contains('disabled');
}

/**
 * Returns true if element has the 'disabled' class.
 *
 * @param {HTMLElement} el
 * @returns {boolean}
 */
export function isDisabled(el) {
  return el.classList.contains('disabled');
}

/**
 * Disables an element: adds the 'disabled' class, marks it read-only, and sets title to disableText.
 *
 * @param {HTMLElement} el
 * @param {string} [disableText]
 */
export function disable(el, disableText) {
  let title = null;
  if (el.hasAttribute('title')) {
    title = el.getAttribute('title');
  }
  const disabledText = disableText || el.dataset.disabledText || 'This element is currently disabled';
  if (title) {
    el.dataset.enabledText = title;
  }
  if (disabledText) {
    el.dataset.disabledText = disabledText;
    el.setAttribute('title', disabledText);
  }
  el.classList.add('disabled');
  el.readOnly = true;
}

/**
 * Re-enables an element previously disabled via disable().
 *
 * @param {HTMLElement} el
 * @param {string} [enableText]
 */
export function enable(el, enableText) {
  const enabledText = enableText || el.dataset.enabledText;
  if (enabledText) {
    el.setAttribute('title', enabledText);
    el.dataset.enabledText = enabledText;
  }
  el.classList.remove('disabled');
  el.readOnly = false;
}

/**
 * Resets an element to its empty, enabled, unmarked state.
 *
 * @param {HTMLElement} el
 */
export function reset(el) {
  el.value = null;
  removeValidityMarks(el);
  enable(el);
}

/**
 * Removes both 'valid' and 'invalid' classes from the closest '.input-group' ancestor.
 *
 * @param {HTMLElement} el
 */
export function removeValidityMarks(el) {
  const inputGroupEl = el.closest('.input-group');
  if (inputGroupEl) {
    inputGroupEl.classList.remove('invalid');
    inputGroupEl.classList.remove('valid');
  }
}

/**
 * Marks the closest '.input-group' ancestor of el as valid.
 *
 * @param {HTMLElement} el
 */
export function markValid(el) {
  const inputGroupEl = el.closest('.input-group');
  if (inputGroupEl) {
    inputGroupEl.classList.remove('invalid');
    inputGroupEl.classList.add('valid');
  }
}

/**
 * Marks the closest '.input-group' ancestor of el as invalid and sets error text.
 *
 * @param {HTMLElement} el
 * @param {string} errorText
 */
export function markInvalid(el, errorText) {
  const inputGroupEl = el.closest('.input-group');
  if (inputGroupEl) {
    const errorTextEl = inputGroupEl.querySelector('.error-text');
    if (errorTextEl) {
      errorTextEl.innerHTML = errorText;
    }
    inputGroupEl.classList.remove('valid');
    inputGroupEl.classList.add('invalid');
  }
}

/**
 * Validates a required, free-form input field and marks it valid/invalid.
 *
 * @param {HTMLInputElement} inputEl
 * @returns {boolean}
 */
export function validateInputField(inputEl) {
  const valueAvailable = inputEl.value.trim();
  if (!valueAvailable) {
    if (inputEl.hasAttribute('required')) {
      markInvalid(inputEl, 'An email address is mandatory');
      return false;
    } else {
      removeValidityMarks(inputEl);
      return true;
    }
  }
  if (!isValidEmailAddress(valueAvailable)) {
    markInvalid(inputEl, 'This is not a valid email address');
    return false;
  } else {
    markValid(inputEl);
    return true;
  }
}

/**
 * Validates an email input field and marks it valid/invalid.
 *
 * @param {HTMLInputElement} emailInputEl
 * @returns {boolean}
 */
export function validateEmailField(emailInputEl) {
  const valueAvailable = emailInputEl.value.trim();
  if (!valueAvailable) {
    if (emailInputEl.hasAttribute('required')) {
      markInvalid(emailInputEl, 'An email address is mandatory');
      return false;
    } else {
      removeValidityMarks(emailInputEl);
      return true;
    }
  }
  if (!isValidEmailAddress(valueAvailable)) {
    markInvalid(emailInputEl, 'This is not a valid email address');
    return false;
  } else {
    markValid(emailInputEl);
    return true;
  }
}

/**
 * Validates a password input field and marks it valid/invalid.
 *
 * @param {HTMLInputElement} passwordInputEl
 * @returns {boolean}
 */
export function validatePasswordField(passwordInputEl) {
  const valueAvailable = passwordInputEl.value.trim();
  if (!valueAvailable) {
    if (passwordInputEl.hasAttribute('required')) {
      markInvalid(passwordInputEl, 'A password is mandatory');
      return false;
    } else {
      removeValidityMarks(passwordInputEl);
      return true;
    }
  }
  if (!isValidPassword(valueAvailable)) {
    markInvalid(passwordInputEl, 'A valid password needs: ' + validPasswordDescription());
    return false;
  } else {
    markValid(passwordInputEl);
    return true;
  }
}

/**
 * Switches password visibility on a password input paired with an eye toggle button.
 *
 * @param {HTMLElement} el
 */
export function handlePasswordDisclosure(el) {
  const iconInputEl = el.closest('.icon-input');
  if (!iconInputEl) {
    throw new Error('Cannot determine root .icon-input');
  }
  const passwordEl = iconInputEl.querySelector('input');
  if (!passwordEl) {
    throw new Error('Cannot determine password input element');
  }
  const iconEl = iconInputEl.querySelector('button > .icon');
  if (!iconEl) {
    throw new Error('Cannot determine icon button element');
  }
  const buttonEl = iconEl.closest('button');
  buttonEl.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const iconButtonEl = buttonEl.querySelector('.icon');
    if (passwordEl.type === 'password') {
      passwordEl.setAttribute('type', 'text');
      iconButtonEl.classList.remove('fa-eye');
      iconButtonEl.classList.add('fa-eye-slash');
    } else {
      passwordEl.setAttribute('type', 'password');
      iconButtonEl.classList.remove('fa-eye-slash');
      iconButtonEl.classList.add('fa-eye');
    }
  });
}

/**
 * Toggles an inline loading state on a button during async operations.
 *
 * @param {HTMLElement} buttonEl The button element to toggle
 * @param {boolean} [isLoading=true]
 * @param {string|null} [loadingText=null]
 */
export function setButtonLoading(buttonEl, isLoading = true, loadingText = null) {
  if (!buttonEl) return;
  if (isLoading) {
    if (!buttonEl.dataset) {
      buttonEl.dataset = {};
    }
    if (!buttonEl.dataset.originalContent) {
      buttonEl.dataset.originalContent = buttonEl.innerHTML || '';
    }
    buttonEl.disabled = true;
    if (buttonEl.classList && typeof buttonEl.classList.add === 'function') {
      buttonEl.classList.add('is-loading');
    }
    const textSpan = typeof buttonEl.querySelector === 'function' ? buttonEl.querySelector('.text') : null;
    const label = loadingText || (textSpan ? textSpan.textContent : buttonEl.textContent?.trim() || 'Processing...');
    buttonEl.innerHTML = `<i class="icon fa-solid fa-circle-notch fa-spin"></i> <span class="text">${label}</span>`;
  } else {
    buttonEl.disabled = false;
    if (buttonEl.classList && typeof buttonEl.classList.remove === 'function') {
      buttonEl.classList.remove('is-loading');
    }
    if (buttonEl.dataset && buttonEl.dataset.originalContent) {
      buttonEl.innerHTML = buttonEl.dataset.originalContent;
      delete buttonEl.dataset.originalContent;
    }
  }
}
