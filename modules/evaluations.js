import { LICENSE_QUOTAS } from '../lib/License.js';

/**
 * Determine whether adding a new workflow with evaluations is allowed based on
 * the evaluation workflows limit quota (`n8e:limit:evalWorkflows`). Negative values mean unlimited.
 *
 * @param {License} license
 * @param {number} currentEvaluatedWorkflows The current count of workflows with evaluation enabled
 */
export default function addEvaluatedWorkflow(license, currentEvaluatedWorkflows) {
  const limit = license.getQuota(LICENSE_QUOTAS.WORKFLOWS_WITH_EVALUATION_LIMIT);
  if (limit !== undefined && limit >= 0 && currentEvaluatedWorkflows >= limit) {
    throw new Error(`Cannot add another evaluated workflow; limit of ${limit} reached.`);
  }
  console.log('Evaluated workflow added.');
}