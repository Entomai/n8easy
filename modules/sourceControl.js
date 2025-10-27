import { LICENSE_FEATURES } from '../lib/License.js';

export default function enableSourceControl(license) {
  if (!license.hasFeature(LICENSE_FEATURES.SOURCE_CONTROL)) {
    throw new Error(`Source control requires feature ${LICENSE_FEATURES.SOURCE_CONTROL}.`);
  }
  console.log('Source control integration enabled.');
}