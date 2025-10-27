import { LICENSE_FEATURES } from '../lib/License.js';

export default function enforceMfa(license) {
  if (!license.hasFeature(LICENSE_FEATURES.MFA_ENFORCEMENT)) {
    throw new Error(`MFA enforcement requires feature ${LICENSE_FEATURES.MFA_ENFORCEMENT}.`);
  }
  console.log('Multi-factor authentication enforcement enabled.');
}