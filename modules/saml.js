import { LICENSE_FEATURES } from '../lib/License.js';

export default function enableSaml(license) {
  if (!license.hasFeature(LICENSE_FEATURES.SAML)) {
    throw new Error(`SAML authentication requires feature ${LICENSE_FEATURES.SAML}.`);
  }
  console.log('SAML authentication enabled.');
}