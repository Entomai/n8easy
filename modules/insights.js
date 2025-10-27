import { LICENSE_FEATURES, LICENSE_QUOTAS } from '../lib/License.js';

/**
 * Access insights data. This module demonstrates the three insight view
 * features and enforces quotas on history length and retention.
 *
 * @param {License} license
 * @param {Object} options
 * @param {boolean} options.summary Whether to view summary data
 * @param {boolean} options.dashboard Whether to view dashboard data
 * @param {boolean} options.hourly Whether to view hourly data
 * @param {number} options.historyDays Number of days of history requested
 */
export default function viewInsights(license, { summary, dashboard, hourly, historyDays }) {
  // Check which types of insight views are allowed.
  if (summary && !license.hasFeature(LICENSE_FEATURES.INSIGHTS_VIEW_SUMMARY)) {
    throw new Error(`Viewing summary insights requires feature ${LICENSE_FEATURES.INSIGHTS_VIEW_SUMMARY}.`);
  }
  if (dashboard && !license.hasFeature(LICENSE_FEATURES.INSIGHTS_VIEW_DASHBOARD)) {
    throw new Error(`Viewing dashboard insights requires feature ${LICENSE_FEATURES.INSIGHTS_VIEW_DASHBOARD}.`);
  }
  if (hourly && !license.hasFeature(LICENSE_FEATURES.INSIGHTS_VIEW_HOURLY_DATA)) {
    throw new Error(`Viewing hourly insights requires feature ${LICENSE_FEATURES.INSIGHTS_VIEW_HOURLY_DATA}.`);
  }
  // Enforce history length quotas
  const maxHistory = license.getQuota(LICENSE_QUOTAS.INSIGHTS_MAX_HISTORY_DAYS);
  if (maxHistory !== undefined && maxHistory >= 0 && historyDays > maxHistory) {
    throw new Error(`Cannot request ${historyDays} days of insight history; maximum is ${maxHistory}.`);
  }
  console.log(`Insights retrieved: summary=${summary}, dashboard=${dashboard}, hourly=${hourly}, historyDays=${historyDays}.`);
}