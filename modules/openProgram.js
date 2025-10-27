import { LICENSE_FEATURES } from '../lib/License.js';

/**
 * Simulate opening an external program. This feature is gated behind
 * the ADVANCED_EXECUTION_FILTERS feature, which in this example stands
 * for allowing the user to execute external processes.
 *
 * @param {License} license
 * @param {string} program The command or executable name.
 */
export default function openProgram(license, program) {
  if (!license.hasFeature(LICENSE_FEATURES.ADVANCED_EXECUTION_FILTERS)) {
    throw new Error(`Opening programs requires feature ${LICENSE_FEATURES.ADVANCED_EXECUTION_FILTERS}.`);
  }
  console.log(`Program '${program}' has been opened.`);
}
