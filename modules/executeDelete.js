import deleteTrash from './deleteTrash.js';

/**
 * Execute a deleteTrash workflow by delegating to the deleteTrash module.
 *
 * @param {License} license
 */
export default function executeDeleteWorkflow(license) {
  deleteTrash(license);
}