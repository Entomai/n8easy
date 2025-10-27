import fs from 'fs/promises';
import path from 'path';
import { LICENSE_FEATURES } from '../lib/License.js';

/**
 * Download a file from a remote URL and save it to a destination on disk.
 * This operation requires the Advanced Execution Filters feature
 * (`n8e:monitor:advancedFilters`) to be enabled in the licence. The function ensures the destination directory
 * exists before writing. It uses the global fetch API available in Node.js
 * 18+ to perform the download.
 *
 * @param {License} license The loaded licence controlling feature access.
 * @param {Object} options Options for the download task.
 * @param {string} options.url The URL of the file to download.
 * @param {string} options.dest The path on disk where the file should be saved.
 */
export default async function downloadFile(license, { url, dest }) {
  if (!license.hasFeature(LICENSE_FEATURES.ADVANCED_EXECUTION_FILTERS)) {
    throw new Error(`Downloading files requires feature ${LICENSE_FEATURES.ADVANCED_EXECUTION_FILTERS}.`);
  }
  if (!url || !dest) {
    throw new Error('Download task requires both url and dest properties.');
  }
  // Ensure directory exists
  const dir = path.dirname(dest);
  await fs.mkdir(dir, { recursive: true });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  await fs.writeFile(dest, Buffer.from(buffer));
  console.log(`Downloaded '${url}' to '${dest}'.`);
}
