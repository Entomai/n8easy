import { LICENSE_FEATURES } from '../lib/License.js';

/**
 * Delete temporary files as a demonstration of a workflow.
 * Requires the VARIABLES feature.
 *
 * @param {License} license
 */
export default function deleteTrash(license) {
  if (!license.hasFeature(LICENSE_FEATURES.VARIABLES)) {
    throw new Error(`Deleting trash requires feature ${LICENSE_FEATURES.VARIABLES}.`);
  }
  console.log('Trash has been deleted.');
}
