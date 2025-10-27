import { LICENSE_FEATURES, LICENSE_QUOTAS } from '../lib/License.js';

/**
 * Assign project roles to a number of team projects. This module
 * demonstrates using project role features and enforcing the maximum
 * number of team projects specified by the Team Project Limit quota
 * (`n8e:limit:teamProjects`).
 *
 * @param {License} license
 * @param {Object} options
 * @param {number} options.projectCount The number of projects to create
 * @param {('admin'|'editor'|'viewer')} options.role The role to assign
 */
export default function assignProjectRoles(license, { projectCount, role }) {
  const maxProjects = license.getQuota(LICENSE_QUOTAS.TEAM_PROJECT_LIMIT);
  if (maxProjects !== undefined && maxProjects >= 0 && projectCount > maxProjects) {
    throw new Error(`Cannot create ${projectCount} projects; maximum is ${maxProjects}.`);
  }
  let featureKey;
  if (role === 'admin') featureKey = LICENSE_FEATURES.PROJECT_ROLE_ADMIN;
  else if (role === 'editor') featureKey = LICENSE_FEATURES.PROJECT_ROLE_EDITOR;
  else if (role === 'viewer') featureKey = LICENSE_FEATURES.PROJECT_ROLE_VIEWER;
  else throw new Error(`Unknown role '${role}'.`);
  if (!license.hasFeature(featureKey)) {
    throw new Error(`Assigning role '${role}' requires feature '${featureKey}'.`);
  }
  console.log(`${projectCount} project(s) created with role '${role}'.`);
}