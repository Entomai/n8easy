import { LICENSE_FEATURES } from '../lib/License.js';

/**
 * Execute a series of click actions after specified delays. Each click object
 * should have the form { x: number, y: number, delay: number } where delay
 * is in milliseconds. Requires the Advanced Execution Filters feature
 * (configured as `n8e:monitor:advancedFilters`) to perform scripted
 * actions.
 *
 * @param {License} license
 * @param {Array<Object>} clicks
 */
export default async function executeClicks(license, clicks) {
  if (!license.hasFeature(LICENSE_FEATURES.ADVANCED_EXECUTION_FILTERS)) {
    throw new Error(`Executing click workflows requires feature ${LICENSE_FEATURES.ADVANCED_EXECUTION_FILTERS}.`);
  }
  for (const click of clicks) {
    const { x, y, delay } = click;
    await new Promise((resolve) => setTimeout(resolve, delay));
    console.log(`Click at (${x}, ${y}) after ${delay}ms`);
  }
  console.log('Completed click workflow.');
}