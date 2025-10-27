import { LICENSE_FEATURES, LICENSE_QUOTAS } from '../lib/License.js';

/**
 * Access workflow history. Requires the workflow history feature
 * (`n8e:workflow:history`). Also respects the workflow history prune quota:
 * if the number of days of
 * history exceeds the allowed value, it throws an error.
 *
 * @param {License} license
 * @param {number} daysOfHistory Number of days of history requested
 */
export default function getWorkflowHistory(license, daysOfHistory) {
  if (!license.hasFeature(LICENSE_FEATURES.WORKFLOW_HISTORY)) {
    throw new Error(`Workflow history is disabled (${LICENSE_FEATURES.WORKFLOW_HISTORY}).`);
  }
  const pruneAfter = license.getQuota(LICENSE_QUOTAS.WORKFLOW_HISTORY_PRUNE_LIMIT);
  if (pruneAfter !== undefined && pruneAfter >= 0 && daysOfHistory > pruneAfter) {
    throw new Error(`Cannot retrieve ${daysOfHistory} days of history; max is ${pruneAfter}.`);
  }
  console.log(`Retrieved ${daysOfHistory} days of workflow history.`);
}