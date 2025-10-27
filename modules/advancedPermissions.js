import { LICENSE_FEATURES } from '../lib/License.js';

export default function enableAdvancedPermissions(license) {
  if (!license.hasFeature(LICENSE_FEATURES.ADVANCED_PERMISSIONS)) {
    throw new Error(`Advanced permissions require feature ${LICENSE_FEATURES.ADVANCED_PERMISSIONS}.`);
  }
  console.log('Advanced permissions enabled.');
}