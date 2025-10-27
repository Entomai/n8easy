import { LICENSE_FEATURES } from '../lib/License.js';

/**
 * Demonstrate what happens if API access is disabled. When the
 * `n8e:infra:apiDisabled` feature is true, this function will throw an
 * error to signal that API calls should not be made.
 *
 * @param {License} license
 */
export default function checkApiAccess(license) {
  if (license.hasFeature(LICENSE_FEATURES.API_DISABLED)) {
    throw new Error('API access is disabled in this license.');
  }
  console.log('API access permitted.');
}