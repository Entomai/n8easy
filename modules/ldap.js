import { LICENSE_FEATURES } from '../lib/License.js';

/**
 * Enable LDAP authentication. Requires the LDAP feature (`n8e:auth:ldap`).
 * @param {License} license
 */
export default function enableLdap(license) {
  if (!license.hasFeature(LICENSE_FEATURES.LDAP)) {
    throw new Error(`LDAP authentication requires feature ${LICENSE_FEATURES.LDAP}.`);
  }
  console.log('LDAP authentication enabled.');
}
