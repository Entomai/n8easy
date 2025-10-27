import fs from 'fs/promises';
import { LICENSE_FEATURES } from '../lib/License.js';

/**
 * Rename a file on disk. Requires the Advanced Execution Filters feature
 * (`n8e:monitor:advancedFilters`).
 *
 * @param {License} license
 * @param {Object} options
 * @param {string} options.from The current file path.
 * @param {string} options.to The new file path.
 */
export default async function renameFile(license, { from, to }) {
  if (!license.hasFeature(LICENSE_FEATURES.ADVANCED_EXECUTION_FILTERS)) {
    throw new Error(`Renaming files requires feature ${LICENSE_FEATURES.ADVANCED_EXECUTION_FILTERS}.`);
  }
  if (!from || !to) {
    throw new Error('Rename task requires both from and to properties.');
  }
  await fs.rename(from, to);
  console.log(`Renamed '${from}' to '${to}'.`);
}
