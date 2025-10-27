import { LICENSE_FEATURES } from '../lib/License.js';

export default function showWorkerView(license) {
  if (!license.hasFeature(LICENSE_FEATURES.WORKER_VIEW)) {
    throw new Error(`Worker view requires feature ${LICENSE_FEATURES.WORKER_VIEW}.`);
  }
  console.log('Worker view enabled.');
}