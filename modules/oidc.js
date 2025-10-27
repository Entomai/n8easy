import { LICENSE_FEATURES } from '../lib/License.js';

export default function enableOidc(license) {
  if (!license.hasFeature(LICENSE_FEATURES.OIDC)) {
    throw new Error(`OIDC authentication requires feature ${LICENSE_FEATURES.OIDC}.`);
  }
  console.log('OIDC authentication enabled.');
}