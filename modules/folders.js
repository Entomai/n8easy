import { LICENSE_FEATURES } from '../lib/License.js';

export default function enableFolders(license) {
  if (!license.hasFeature(LICENSE_FEATURES.FOLDERS)) {
    throw new Error(`Folders feature requires feature ${LICENSE_FEATURES.FOLDERS}.`);
  }
  console.log('Folders feature enabled.');
}