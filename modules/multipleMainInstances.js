import { LICENSE_FEATURES } from '../lib/License.js';

export default function enableMultipleMainInstances(license) {
  if (!license.hasFeature(LICENSE_FEATURES.MULTIPLE_MAIN_INSTANCES)) {
    throw new Error(`Multiple main instances require feature ${LICENSE_FEATURES.MULTIPLE_MAIN_INSTANCES}.`);
  }
  console.log('Multiple main instances are enabled.');
}