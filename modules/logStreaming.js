import { LICENSE_FEATURES } from '../lib/License.js';

export default function enableLogStreaming(license) {
  if (!license.hasFeature(LICENSE_FEATURES.LOG_STREAMING)) {
    throw new Error(`Log streaming requires feature ${LICENSE_FEATURES.LOG_STREAMING}.`);
  }
  console.log('Log streaming feature enabled.');
}