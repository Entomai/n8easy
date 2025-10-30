import { createLicenseFromPlan } from './mockLicenseDatabase.js';

const API_ROOT = 'https://control.entomai.com/api/guest/serviceapikey';

async function postJson(endpoint, body) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Portal request failed with status ${response.status}`);
  }
  return response.json();
}

/**
 * Verify that a service API key exists and is valid.
 *
 * @param {string} licenseKey
 * @returns {Promise<void>}
 */
export async function verifyServiceApiKey(licenseKey) {
  const payload = await postJson(`${API_ROOT}/check`, { key: licenseKey });
  if (payload?.result === true) {
    return;
  }
  const message = payload?.error?.message || 'License API key validation failed';
  const err = new Error(message);
  if (payload?.error?.code) {
    err.code = payload.error.code;
  }
  err.details = payload;
  throw err;
}

/**
 * Retrieve detailed configuration for a service API key.
 *
 * @param {string} licenseKey
 * @returns {Promise<Object>} The raw result payload from the portal.
 */
export async function fetchServiceApiKeyInfo(licenseKey) {
  const payload = await postJson(`${API_ROOT}/get_info`, { key: licenseKey });
  if (!payload?.result) {
    throw new Error('License portal did not return key information');
  }
  return payload.result;
}

/**
 * Build a persisted license JSON object from a validated API key.
 *
 * @param {string} licenseKey
 * @returns {Promise<Object>} A license document ready to be saved locally.
 */
export async function activateServiceApiKey(licenseKey) {
  await verifyServiceApiKey(licenseKey);
  const info = await fetchServiceApiKeyInfo(licenseKey);
  const planName = info?.config?.n8ePlanName;
  if (!planName) {
    throw new Error('License portal response missing plan information');
  }
  return createLicenseFromPlan(planName, { licenseKey });
}
