import * as utils from './utils.mjs';

// Form related utility functions.

/** @return True if `el` does not have the 'disabled' class. */
export function isEnabled(el) {
  return !el.classList.contains('disabled');
}

/** @return True if `el` has the 'disabled' class. */
export function isDisabled(el) {
  return el.classList.contains('disabled');
}

/**
 *  Disable an element: add the 'disabled' class, mark it read-only, and set its title to
 *  `disableText`, remembering the previous title so `enable` can restore it.
 *
 *  @param el The element to disable.
 *  @param disableText Title to show while disabled. Defaults to `el.dataset.disabledText`
 *                      or a generic message.
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
 *  Re-enable an element previously disabled via `disable`: remove the 'disabled' class,
 *  clear read-only, and restore (or override with `enableText`) its title.
 *
 *  @param el The element to enable.
 *  @param enableText Title to restore. Defaults to the title remembered by `disable`.
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

/** Reset `el` to its empty, enabled, unmarked state: clears its value, removes validity marks, and re-enables it. */
export function reset(el) {
  el.value = null;
  removeValidityMarks(el);
  enable(el);
}

/** Remove both the 'valid' and 'invalid' classes from the closest '.input-group' ancestor of `el`. */
export function removeValidityMarks(el) {
  const inputGroupEl = el.closest('.input-group');
  if (inputGroupEl) {
    inputGroupEl.classList.remove('invalid');
    inputGroupEl.classList.remove('valid');
  }
}

/** Mark the closest '.input-group' ancestor of `el` as valid. */
export function markValid(el) {
  const inputGroupEl = el.closest('.input-group');
  if (inputGroupEl) {
    inputGroupEl.classList.remove('invalid');
    inputGroupEl.classList.add('valid');
  }
}

/**
 *  Mark the closest '.input-group' ancestor of `el` as invalid, updating its '.error-text' element if present.
 *
 *  @param el The field element whose input-group should be marked invalid.
 *  @param errorText The error message to show in the '.error-text' element, if one exists.
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
 *  Validate a required, free-form input field and mark it valid/invalid accordingly.
 *
 *  @param inputEl The input element to validate.
 *  @return True if the field's value is acceptable.
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
  if (!utils.isValidEmailAddress(valueAvailable)) {
    markInvalid(inputEl, 'This is not a valid email address');
    return false;
  } else {
    markValid(inputEl);
    return true;
  }
}

/**
 *  Validate an email input field and mark it valid/invalid accordingly.
 *
 *  @param emailInputEl The email input element to validate.
 *  @return True if the field's value is a valid email address (or empty and not required).
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
  if (!utils.isValidEmailAddress(valueAvailable)) {
    markInvalid(emailInputEl, 'This is not a valid email address');
    return false;
  } else {
    markValid(emailInputEl);
    return true;
  }
}

/**
 *  Validate a password input field and mark it valid/invalid accordingly.
 *
 *  @param passwordInputEl The password input element to validate.
 *  @return True if the field's value is a valid password (or empty and not required).
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
  if (!utils.isValidPassword(valueAvailable)) {
    markInvalid(passwordInputEl, 'A valid password needs: ' + utils.validPasswordDescription());
    return false;
  } else {
    markValid(passwordInputEl);
    return true;
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
    const iconButtonEl = buttonEl.querySelector('.icon'); // Need to do again, since the element might have changed from an <i> to an <svg?>
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
