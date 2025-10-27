/*
 * Module to verify licenses against a FOSSBilling installation.
 *
 * The FOSSBilling documentation describes the `/guest/servicelicense/check`
 * endpoint for validating licenses【894762623615522†L217-L254】. This helper wraps
 * that call and normalizes the response so that you receive either the
 * license object (with its features and quotas) or `null` when invalid.
 */

/**
 * Check a license key against a FOSSBilling server.
 *
 * @param {Object} params
 * @param {string} params.baseUrl The base URL of your FOSSBilling instance
 *   (for example, "https://mybilling.example.com"). Do not include a trailing
 *   slash. This parameter is required.
 * @param {string} params.licenseKey The license key to validate.
 * @param {string} params.host The hostname of the client (e.g. from
 *   `os.hostname()`). Required by FOSSBilling unless host validation is
 *   disabled.
 * @param {string} params.version The version of the software requesting
 *   validation.
 * @param {string} params.path The installation path for the software.
 *
 * @returns {Promise<Object|null>} Resolves with the license JSON when valid,
 *   otherwise `null` if the license is invalid or cannot be verified.
 */
export async function checkLicense({ baseUrl, licenseKey, host, version, path }) {
  if (!baseUrl) throw new Error('Missing baseUrl for FOSSBilling');
  const url = `${baseUrl.replace(/\/$/, '')}/guest/servicelicense/check`;
  const payload = new URLSearchParams({
    license: licenseKey,
    host,
    version,
    path
  });
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    });
    const data = await response.json();
    // According to the docs, a valid license returns {result: {...}, error: null}
    if (data && data.result && data.error === null) {
      return data.result;
    }
    return null;
  } catch (err) {
    // If any network or parsing error occurs, treat as invalid
    console.error('License check failed:', err);
    return null;
  }
}
