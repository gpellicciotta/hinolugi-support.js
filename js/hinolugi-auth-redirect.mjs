/**
 *  Redirects the browser to hinolugi-auth SSO sign-in.
 *  hinolugi-auth treats a first sign-in as registration as well, so this also serves "Create Account".
 *
 *  @param {object} options Redirection configuration
 *  @param {string} options.authServiceBaseUrl Base URL of the auth service (e.g. 'https://auth.example.com')
 *  @param {string} options.appName Application name registered with auth service
 *  @param {string} options.redirectUrl Return callback URL for auth token exchange
 *  @param {string} [options.appLogoUrl] Optional URL pointing to application logo
 *  @param {string} [options.signInMethod='hinolugi-auth'] Session storage identifier for sign-in method
 *  @returns {string} The fully constructed target URL
 */
export function redirectToHinolugiAuth({
  authServiceBaseUrl,
  appName,
  redirectUrl,
  appLogoUrl,
  signInMethod = 'hinolugi-auth',
} = {}) {
  if (!authServiceBaseUrl || !appName || !redirectUrl) {
    throw new Error('authServiceBaseUrl, appName, and redirectUrl are mandatory');
  }

  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage !== null) {
      sessionStorage.setItem('sign-in-method', signInMethod);
    }
  } catch (e) {
    // Non-fatal if storage is unavailable or restricted
  }

  const baseUrl = authServiceBaseUrl.replace(/\/+$/, '');
  let targetUrl =
    `${baseUrl}/sign-in` +
    `?app-name=${encodeURIComponent(appName)}` +
    `&app-redirect-url=${encodeURIComponent(redirectUrl)}`;

  if (appLogoUrl) {
    targetUrl += `&app-logo-url=${encodeURIComponent(appLogoUrl)}`;
  }

  if (typeof window !== 'undefined' && window?.location) {
    window.location.href = targetUrl;
  }

  return targetUrl;
}
