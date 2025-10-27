/*
 * A helper class to manage license features and quotas.
 *
 * This module defines a License class which encapsulates the JSON data returned
 * from a FOSSBilling license check. In n8easy v2 licenses, features and
 * quotas are identified by strings beginning with `n8e:`.  Each key
 * encodes a namespace (e.g. `n8e:auth:ldap` or `n8e:limit:users`).
 * Legacy `ft:` and `qa:` prefixes are no longer used but are preserved
 * internally via the LICENSE_FEATURES and LICENSE_QUOTAS mappings.
 *
 * The class provides convenience methods to test whether a feature is enabled
 * and to retrieve numeric quotas. When a feature key is not present in the
 * license, it is considered disabled. Quotas absent from the license return
 * `undefined`.
 */

//
// The LICENSE_FEATURES map defines stable keys used throughout the
// application to refer to individual features. Each entry maps to the
// corresponding identifier used in the loaded license JSON.  As of
// n8easy license version 2.0 the identifiers live within the `n8e:`
// namespace. Updating this map allows the remainder of the codebase to
// continue referring to familiar keys (e.g. `LICENSE_FEATURES.SHARING`)
// while transparently reading from the new license fields.
export const LICENSE_FEATURES = Object.freeze({
  // Plan name for display purposes
  PLAN_NAME_FEATURE: 'n8e:plan:name',
  // Collaboration features
  SHARING: 'n8e:collab:share',
  FOLDERS: 'n8e:collab:folders',
  CUSTOM_ROLES: 'n8e:collab:customRoles',
  ADVANCED_PERMISSIONS: 'n8e:collab:advancedPerms',
  // Project role assignments
  PROJECT_ROLE_ADMIN: 'n8e:role:admin',
  PROJECT_ROLE_EDITOR: 'n8e:role:editor',
  PROJECT_ROLE_VIEWER: 'n8e:role:viewer',
  // Authentication providers
  LDAP: 'n8e:auth:ldap',
  SAML: 'n8e:auth:saml',
  OIDC: 'n8e:auth:oidc',
  // Security and enforcement
  MFA_ENFORCEMENT: 'n8e:security:mfaEnforce',
  API_KEY_SCOPES: 'n8e:security:apiKeyScopes',
  // Workflow and environment capabilities
  WORKFLOW_HISTORY: 'n8e:workflow:history',
  WORKFLOW_DIFFS: 'n8e:workflow:diffs',
  SOURCE_CONTROL: 'n8e:workflow:sourceControl',
  VARIABLES: 'n8e:env:variables',
  EXTERNAL_SECRETS: 'n8e:env:externalSecrets',
  // Storage
  BINARY_DATA_S3: 'n8e:storage:s3Binary',
  // Developer tools
  DEBUG_IN_EDITOR: 'n8e:dev:debugEditor',
  SHOW_NON_PROD_BANNER: 'n8e:dev:nonProdBanner',
  // Monitoring
  LOG_STREAMING: 'n8e:monitor:logStream',
  ADVANCED_EXECUTION_FILTERS: 'n8e:monitor:advancedFilters',
  WORKER_VIEW: 'n8e:monitor:workerView',
  // Analytics
  INSIGHTS_VIEW_SUMMARY: 'n8e:analytics:summary',
  INSIGHTS_VIEW_DASHBOARD: 'n8e:analytics:dashboard',
  INSIGHTS_VIEW_HOURLY_DATA: 'n8e:analytics:hourlyData',
  // AI capabilities
  AI_ASSISTANT: 'n8e:ai:assistant',
  ASK_AI: 'n8e:ai:askAi',
  AI_BUILDER: 'n8e:ai:builder',
  AI_CREDITS_FEATURE: 'n8e:ai:credits',
  // Infrastructure
  MULTIPLE_MAIN_INSTANCES: 'n8e:infra:multiInstance',
  API_DISABLED: 'n8e:infra:apiDisabled',
  COMMUNITY_NODES_CUSTOM_REGISTRY: 'n8e:infra:customRegistry'
});

// Similar to LICENSE_FEATURES, LICENSE_QUOTAS maps descriptive names to
// numerical limits defined in the license.  Each entry corresponds to a
// quota identifier prefixed with `n8e:limit:` as defined in the new
// license schema.  If a quota is absent or set to a non‑numeric value in
// the license file, the getter will return `undefined`.
export const LICENSE_QUOTAS = Object.freeze({
  TRIGGER_LIMIT: 'n8e:limit:activeWorkflows',
  VARIABLES_LIMIT: 'n8e:limit:variables',
  USERS_LIMIT: 'n8e:limit:users',
  WORKFLOW_HISTORY_PRUNE_LIMIT: 'n8e:limit:historyPrune',
  TEAM_PROJECT_LIMIT: 'n8e:limit:teamProjects',
  INSIGHTS_MAX_HISTORY_DAYS: 'n8e:limit:analytics:historyDays',
  INSIGHTS_RETENTION_MAX_AGE_DAYS: 'n8e:limit:analytics:retentionDays',
  INSIGHTS_RETENTION_PRUNE_INTERVAL_DAYS: 'n8e:limit:analytics:pruneInterval',
  WORKFLOWS_WITH_EVALUATION_LIMIT: 'n8e:limit:evalWorkflows',
  AI_CREDITS: 'n8e:limit:ai:credits',
  AI_BUILDER_CREDITS: 'n8e:limit:ai:builderCredits'
});

export class License {
  /**
   * Construct a new License from raw JSON data.
   *
   * @param {Object} data The object returned from the FOSSBilling check. It
   *   should include a `licenseFeatures` property mapping feature and quota
   *   identifiers to values.
   */
  constructor(data = {}) {
    const { licenseFeatures = {} } = data;
    this._features = licenseFeatures;
  }

  /**
   * Test whether a feature is enabled in this license.
   *
   * @param {string} featureKey One of the values in LICENSE_FEATURES.
   * @returns {boolean} True if the feature exists and is truthy.
   */
  hasFeature(featureKey) {
    return Boolean(this._features[featureKey]);
  }

  /**
   * Retrieve the numeric quota associated with a given key.
   *
   * @param {string} quotaKey One of the values in LICENSE_QUOTAS.
   * @returns {number|undefined} The quota value or undefined if not set.
   */
  getQuota(quotaKey) {
    const value = this._features[quotaKey];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = Number(value);
      return Number.isNaN(num) ? undefined : num;
    }
    return undefined;
  }
}
