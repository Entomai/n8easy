import { LICENSE_FEATURES } from '../lib/License.js';

export default function showWorkflowDiffs(license) {
  if (!license.hasFeature(LICENSE_FEATURES.WORKFLOW_DIFFS)) {
    throw new Error(`Workflow diffs require feature ${LICENSE_FEATURES.WORKFLOW_DIFFS}.`);
  }
  console.log('Workflow differences available.');
}