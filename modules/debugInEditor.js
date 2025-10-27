import { LICENSE_FEATURES } from '../lib/License.js';

export default function debugInEditor(license) {
  if (!license.hasFeature(LICENSE_FEATURES.DEBUG_IN_EDITOR)) {
    throw new Error(`Debugging in editor requires feature ${LICENSE_FEATURES.DEBUG_IN_EDITOR}.`);
  }
  console.log('Debugging in editor is enabled.');
}