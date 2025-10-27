import { LICENSE_FEATURES } from '../lib/License.js';

export default function enableExternalSecrets(license) {
  if (!license.hasFeature(LICENSE_FEATURES.EXTERNAL_SECRETS)) {
    throw new Error(`External secrets require feature ${LICENSE_FEATURES.EXTERNAL_SECRETS}.`);
  }
  console.log('External secrets integration enabled.');
}