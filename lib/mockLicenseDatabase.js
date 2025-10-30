// Mock license definitions keyed by plan name.
// Each entry contains the license metadata and a feature map that will be
// cloned when constructing the final license object for persistence.
const PLAN_TEMPLATES = {
  free: {
    planLabel: 'Free',
    issuer: 'n8easy',
    product: 'n8easy-desktop-automation',
    version: '2.0',
    licenseFeatures: {
      'n8e:plan:name': 'Free',
      'n8e:collab:share': false,
      'n8e:collab:folders': false,
      'n8e:collab:customRoles': false,
      'n8e:collab:advancedPerms': false,
      'n8e:role:admin': false,
      'n8e:role:editor': false,
      'n8e:role:viewer': true,
      'n8e:auth:ldap': false,
      'n8e:auth:saml': false,
      'n8e:auth:oidc': false,
      'n8e:security:mfaEnforce': false,
      'n8e:security:apiKeyScopes': false,
      'n8e:workflow:history': true,
      'n8e:workflow:diffs': false,
      'n8e:workflow:sourceControl': false,
      'n8e:env:variables': true,
      'n8e:env:externalSecrets': false,
      'n8e:storage:s3Binary': false,
      'n8e:dev:debugEditor': false,
      'n8e:dev:nonProdBanner': true,
      'n8e:monitor:logStream': false,
      'n8e:monitor:advancedFilters': true,
      'n8e:monitor:workerView': false,
      'n8e:analytics:summary': true,
      'n8e:analytics:dashboard': false,
      'n8e:analytics:hourlyData': false,
      'n8e:ai:assistant': false,
      'n8e:ai:askAi': false,
      'n8e:ai:builder': false,
      'n8e:ai:credits': false,
      'n8e:infra:multiInstance': false,
      'n8e:infra:apiDisabled': false,
      'n8e:infra:customRegistry': false,
      'n8e:limit:users': 1,
      'n8e:limit:teamProjects': 1,
      'n8e:limit:activeWorkflows': 5,
      'n8e:limit:evalWorkflows': 0,
      'n8e:limit:variables': 10,
      'n8e:limit:historyPrune': 24,
      'n8e:limit:analytics:historyDays': 7,
      'n8e:limit:analytics:retentionDays': 30,
      'n8e:limit:analytics:pruneInterval': 24,
      'n8e:limit:ai:credits': 0,
      'n8e:limit:ai:builderCredits': 0
    }
  },
  pro: {
    planLabel: 'Pro',
    issuer: 'n8easy',
    product: 'n8easy-desktop-automation',
    version: '2.0',
    licenseFeatures: {
      'n8e:plan:name': 'Pro',
      'n8e:collab:share': true,
      'n8e:collab:folders': true,
      'n8e:collab:customRoles': true,
      'n8e:collab:advancedPerms': false,
      'n8e:role:admin': true,
      'n8e:role:editor': true,
      'n8e:role:viewer': true,
      'n8e:auth:ldap': false,
      'n8e:auth:saml': false,
      'n8e:auth:oidc': true,
      'n8e:security:mfaEnforce': true,
      'n8e:security:apiKeyScopes': true,
      'n8e:workflow:history': true,
      'n8e:workflow:diffs': true,
      'n8e:workflow:sourceControl': false,
      'n8e:env:variables': true,
      'n8e:env:externalSecrets': true,
      'n8e:storage:s3Binary': true,
      'n8e:dev:debugEditor': true,
      'n8e:dev:nonProdBanner': true,
      'n8e:monitor:logStream': true,
      'n8e:monitor:advancedFilters': true,
      'n8e:monitor:workerView': true,
      'n8e:analytics:summary': true,
      'n8e:analytics:dashboard': true,
      'n8e:analytics:hourlyData': false,
      'n8e:ai:assistant': true,
      'n8e:ai:askAi': true,
      'n8e:ai:builder': false,
      'n8e:ai:credits': true,
      'n8e:infra:multiInstance': false,
      'n8e:infra:apiDisabled': false,
      'n8e:infra:customRegistry': false,
      'n8e:limit:users': 25,
      'n8e:limit:teamProjects': 10,
      'n8e:limit:activeWorkflows': 100,
      'n8e:limit:evalWorkflows': 10,
      'n8e:limit:variables': 200,
      'n8e:limit:historyPrune': 72,
      'n8e:limit:analytics:historyDays': 30,
      'n8e:limit:analytics:retentionDays': 90,
      'n8e:limit:analytics:pruneInterval': 12,
      'n8e:limit:ai:credits': 200,
      'n8e:limit:ai:builderCredits': 50
    }
  },
  enterprise: {
    planLabel: 'Enterprise',
    issuer: 'n8easy',
    product: 'n8easy-desktop-automation',
    version: '2.0',
    licenseFeatures: {
      'n8e:plan:name': 'Enterprise',
      'n8e:collab:share': true,
      'n8e:collab:folders': true,
      'n8e:collab:customRoles': true,
      'n8e:collab:advancedPerms': true,
      'n8e:role:admin': true,
      'n8e:role:editor': true,
      'n8e:role:viewer': true,
      'n8e:auth:ldap': true,
      'n8e:auth:saml': true,
      'n8e:auth:oidc': true,
      'n8e:security:mfaEnforce': true,
      'n8e:security:apiKeyScopes': true,
      'n8e:workflow:history': true,
      'n8e:workflow:diffs': true,
      'n8e:workflow:sourceControl': true,
      'n8e:env:variables': true,
      'n8e:env:externalSecrets': true,
      'n8e:storage:s3Binary': true,
      'n8e:dev:debugEditor': true,
      'n8e:dev:nonProdBanner': false,
      'n8e:monitor:logStream': true,
      'n8e:monitor:advancedFilters': true,
      'n8e:monitor:workerView': true,
      'n8e:analytics:summary': true,
      'n8e:analytics:dashboard': true,
      'n8e:analytics:hourlyData': true,
      'n8e:ai:assistant': true,
      'n8e:ai:askAi': true,
      'n8e:ai:builder': true,
      'n8e:ai:credits': true,
      'n8e:infra:multiInstance': true,
      'n8e:infra:apiDisabled': false,
      'n8e:infra:customRegistry': true,
      'n8e:limit:users': -1,
      'n8e:limit:teamProjects': -1,
      'n8e:limit:activeWorkflows': -1,
      'n8e:limit:evalWorkflows': -1,
      'n8e:limit:variables': -1,
      'n8e:limit:historyPrune': 120,
      'n8e:limit:analytics:historyDays': 180,
      'n8e:limit:analytics:retentionDays': 365,
      'n8e:limit:analytics:pruneInterval': 6,
      'n8e:limit:ai:credits': 1000,
      'n8e:limit:ai:builderCredits': 500
    }
  }
};

function cloneTemplate(features) {
  return JSON.parse(JSON.stringify(features));
}

/**
 * Return a normalized license object for the provided plan name.
 *
 * @param {string} planName Incoming plan identifier (case insensitive).
 * @param {Object} [options]
 * @param {string} [options.licenseKey] Optional license key to embed.
 * @param {string} [options.issuedAt] Override issuedAt timestamp.
 * @returns {Object} License JSON ready for persistence.
 */
export function createLicenseFromPlan(planName, { licenseKey, issuedAt } = {}) {
  const normalized = (planName || '').toLowerCase();
  const template = PLAN_TEMPLATES[normalized];
  if (!template) {
    throw new Error(`Unknown license plan '${planName}'`);
  }
  const license = {
    issuer: template.issuer,
    version: template.version,
    product: template.product,
    issuedAt: issuedAt || new Date().toISOString(),
    licenseFeatures: cloneTemplate(template.licenseFeatures)
  };
  if (licenseKey) {
    license.licenseKey = licenseKey;
  }
  return license;
}

/**
 * Expose available plans for diagnostics or UI surfaces.
 *
 * @returns {Array<{planName: string, label: string}>}
 */
export function listAvailablePlans() {
  return Object.entries(PLAN_TEMPLATES).map(([planName, value]) => ({
    planName,
    label: value.planLabel
  }));
}
