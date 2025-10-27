import { LICENSE_FEATURES } from '../lib/License.js';

export default function enableCustomRoles(license) {
  if (!license.hasFeature(LICENSE_FEATURES.CUSTOM_ROLES)) {
    throw new Error(`Custom roles require feature ${LICENSE_FEATURES.CUSTOM_ROLES}.`);
  }
  console.log('Custom roles feature enabled.');
}