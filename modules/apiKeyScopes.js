import { LICENSE_FEATURES } from '../lib/License.js';

export default function manageApiKeyScopes(license) {
  if (!license.hasFeature(LICENSE_FEATURES.API_KEY_SCOPES)) {
    throw new Error(`API key scopes require feature ${LICENSE_FEATURES.API_KEY_SCOPES}.`);
  }
  console.log('API key scopes management enabled.');
}