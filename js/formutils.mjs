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
 *  Disable an element: add the 'disabled' class and set its title to `disableText`,
 *  remembering the previous title so `enable` can restore it.
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
}

/**
 *  Re-enable an element previously disabled via `disable`: remove the 'disabled' class
 *  and restore (or override with `enableText`) its title.
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
