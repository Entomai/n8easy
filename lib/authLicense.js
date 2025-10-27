import fs from 'fs/promises';
import os from 'os';
import crypto from 'crypto';
import { License } from './License.js';

// Path to the local license file.  This helper loads from the root
// directory relative to this module.  When no license exists
// locally the caller must prompt the user to obtain one.
const LICENSE_PATH = new URL('../license.json', import.meta.url);

/**
 * Load the locally stored license file.  If the file does not exist
 * or is invalid JSON, this returns null instead of throwing.
 *
 * @returns {Promise<License|null>} A License instance or null.
 */
export async function loadLocalLicense() {
  try {
    const raw = await fs.readFile(LICENSE_PATH, 'utf8');
    const json = JSON.parse(raw);
    return new License(json);
  } catch {
    return null;
  }
}

/**
 * Derive a short machine identifier from host properties.  This id
 * can be included in license request URLs to uniquely identify the
 * client.  It is not persisted anywhere.
 *
 * @returns {string} A hex string representing part of a SHA256 hash.
 */
export function machineId() {
  const basis = os.hostname() + '|' + os.platform() + '|' + os.arch();
  return crypto.createHash('sha256').update(basis).digest('hex').slice(0, 16);
}

/**
 * Build a URL for requesting a new license from the licensing portal.
 * When the API is not disabled and the user has a userId, this
 * constructs a query string containing the machineId and userId.
 *
 * @param {Object} params
 * @param {string} [params.userId] Optional user identifier to include.
 * @returns {string} Full URL to license request page.
 */
export function buildRequestLicenseURL({ userId } = {}) {
  const mid = machineId();
  const params = new URLSearchParams({ mid });
  if (userId) params.set('userId', userId);
  return `https://control.entomai.com/request-license?${params.toString()}`;
}

/**
 * Compute a summary of the current license for display in the UI.
 * This exposes only the data relevant to the client, such as which
 * authentication methods are enabled and what quotas apply.  If
 * no license is loaded, this returns defaults indicating absence.
 *
 * @param {License|null} license
 * @param {Object} options
 * @param {string} [options.userId] Current logged in user, if any.
 * @returns {Object} A status object suitable for JSON rendering.
 */
export function getLicenseStatus(license, { userId } = {}) {
  const base = {
    present: !!license,
    userId: userId || null,
    machineId: machineId(),
    allowRemoteRequest: false,
    requestUrl: null,
    features: {},
    quotas: {},
    requireMFA: false,
    authMethods: []
  };
  if (!license) return base;
  // Determine important features for the UI.  See lib/License.js for keys.
  const pick = (key) => license.hasFeature(key);
  const quota = (key, fallback = null) => license.getQuota(key) ?? fallback;
  base.features = {
    ldap: pick('n8e:auth:ldap'),
    saml: pick('n8e:auth:saml'),
    oidc: pick('n8e:auth:oidc'),
    mfaEnforce: pick('n8e:security:mfaEnforce'),
    apiDisabled: pick('n8e:infra:apiDisabled'),
    analyticsSummary: pick('n8e:analytics:summary'),
    analyticsDashboard: pick('n8e:analytics:dashboard'),
    analyticsHourly: pick('n8e:analytics:hourlyData')
  };
  base.requireMFA = base.features.mfaEnforce;
  base.authMethods = ['password'];
  if (base.features.ldap) base.authMethods.push('ldap');
  if (base.features.saml) base.authMethods.push('saml');
  if (base.features.oidc) base.authMethods.push('oidc');
  base.quotas = {
    historyPruneHours: quota('n8e:limit:historyPrune', 120),
    insightsHistoryDays: quota('n8e:limit:analytics:historyDays', 14)
  };
  base.allowRemoteRequest = !base.features.apiDisabled;
  base.requestUrl = base.allowRemoteRequest ? buildRequestLicenseURL({ userId }) : null;
  return base;
}

/**
 * Validate and persist a license provided by the user.  Throws if
 * the payload is missing required fields.  Successful writes
 * overwrite any existing license file.
 *
 * @param {Object} licenseJson JSON object representing a license.
 * @returns {Promise<boolean>} True if saved successfully.
 */
export async function submitLicenseJSON(licenseJson) {
  if (!licenseJson || typeof licenseJson !== 'object') {
    throw new Error('Invalid license payload.');
  }
  if (!licenseJson.issuer || !licenseJson.product || !licenseJson.licenseFeatures) {
    throw new Error('License missing required fields (issuer, product, licenseFeatures).');
  }
  await fs.writeFile(LICENSE_PATH, JSON.stringify(licenseJson, null, 2), 'utf8');
  return true;
}