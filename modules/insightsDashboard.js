import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { LICENSE_FEATURES } from '../lib/License.js';

// Determine root and log paths.  This module stores workflow log
// entries in a JSON array at logs/workflows.json.  Each entry
// includes a name, status and timestamp.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LOG_DIR = path.join(ROOT, 'logs');
const WF_LOG_PATH = path.join(LOG_DIR, 'workflows.json');

// Ensure that the log directory and file exist.  Called before
// reading or writing logs.
async function ensureFiles() {
  await fs.mkdir(LOG_DIR, { recursive: true });
  try {
    await fs.access(WF_LOG_PATH);
  } catch {
    await fs.writeFile(WF_LOG_PATH, '[]', 'utf8');
  }
}

/**
 * Append a workflow execution event to the logs.  This may be
 * called by any module that runs workflows or by external hooks.
 *
 * @param {Object} param0
 * @param {string} param0.name Workflow name
 * @param {string} [param0.status] Optional status (success, failed, other)
 * @param {number} [param0.at] Optional timestamp (ms since epoch)
 */
export async function recordWorkflowEvent({ name, status = 'success', at = Date.now() }) {
  await ensureFiles();
  const raw = await fs.readFile(WF_LOG_PATH, 'utf8');
  let arr;
  try {
    arr = JSON.parse(raw);
    if (!Array.isArray(arr)) arr = [];
  } catch {
    arr = [];
  }
  arr.push({ name, status, at });
  await fs.writeFile(WF_LOG_PATH, JSON.stringify(arr, null, 2), 'utf8');
}

/**
 * Generate insights metrics from the workflow logs.  Respects the
 * license features controlling which metrics are available and the
 * quota limiting history window size.
 *
 * @param {License} license Loaded license instance
 * @param {Object} options
 * @param {number} [options.days=7] Requested number of days history
 * @returns {Promise<Object>} Insights data with fields depending on permissions
 */
export async function getInsights(license, { days = 7 } = {}) {
  await ensureFiles();
  // Determine feature permissions
  const allowSummary = license.hasFeature(LICENSE_FEATURES.INSIGHTS_VIEW_SUMMARY);
  const allowDashboard = license.hasFeature(LICENSE_FEATURES.INSIGHTS_VIEW_DASHBOARD);
  const allowHourly = license.hasFeature(LICENSE_FEATURES.INSIGHTS_VIEW_HOURLY_DATA);
  // Determine maximum history based on license quotas. Prefer the analytics
  // historyDays quota, but also respect the general history prune limit (hours).
  const maxDaysQuota = license.getQuota('n8e:limit:analytics:historyDays') ?? 14;
  const pruneHours = license.getQuota('n8e:limit:historyPrune');
  // Convert prune hours to days if defined, flooring the result. If pruneHours is
  // very small (<24), this yields 0; treat undefined as unlimited.
  let pruneDays;
  if (typeof pruneHours === 'number') {
    pruneDays = Math.floor(pruneHours / 24);
    if (pruneDays < 1) pruneDays = 1;
  } else {
    pruneDays = undefined;
  }
  const maxDays = pruneDays ? Math.min(maxDaysQuota, pruneDays) : maxDaysQuota;
  const clampDays = Math.max(1, Math.min(days, maxDays));
  const since = Date.now() - clampDays * 24 * 3600 * 1000;
  let arr;
  try {
    arr = JSON.parse(await fs.readFile(WF_LOG_PATH, 'utf8'));
    if (!Array.isArray(arr)) arr = [];
  } catch {
    arr = [];
  }
  arr = arr.filter((e) => e.at >= since);
  const res = {
    rangeDays: clampDays,
    allowed: { summary: allowSummary, dashboard: allowDashboard, hourly: allowHourly },
    totals: null,
    byDay: null,
    byHour: null,
    sample: null
  };
  if (!allowSummary && !allowDashboard) {
    return res;
  }
  // Compute totals
  const totals = { success: 0, failed: 0, other: 0 };
  for (const e of arr) {
    if (e.status === 'success') totals.success++;
    else if (e.status === 'failed') totals.failed++;
    else totals.other++;
  }
  res.totals = totals;
  // Group by day (YYYY-MM-DD)
  const byDay = {};
  for (const e of arr) {
    const d = new Date(e.at);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] || 0) + 1;
  }
  res.byDay = byDay;
  // Hourly breakdown if allowed
  if (allowHourly) {
    const byHour = {};
    for (const e of arr) {
      const d = new Date(e.at);
      const h = d.getUTCHours();
      byHour[h] = (byHour[h] || 0) + 1;
    }
    res.byHour = byHour;
  }
  // Include sample of recent events
  res.sample = arr.slice(-20);
  return res;
}