import { LICENSE_FEATURES, LICENSE_QUOTAS } from '../lib/License.js';

/**
 * Manage runtime variables. This function shows how to check both feature
 * availability and a quota. If unlimited (negative) variables are allowed,
 * it proceeds without limit. Otherwise, it checks a provided count against
 * the quota.
 *
 * @param {License} license
 * @param {number} variableCount The current number of variables in use.
 */
export default function manageVariables(license, variableCount) {
  if (!license.hasFeature(LICENSE_FEATURES.VARIABLES)) {
    throw new Error(`Managing variables requires feature ${LICENSE_FEATURES.VARIABLES}.`);
  }
  const max = license.getQuota(LICENSE_QUOTAS.VARIABLES_LIMIT);
  if (max !== undefined && max >= 0 && variableCount > max) {
    throw new Error(`Variable limit exceeded. Limit: ${max}, Current: ${variableCount}`);
  }
  console.log(`Variables managed successfully. Count: ${variableCount}`);
}