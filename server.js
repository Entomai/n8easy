import http from 'http';
import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { License } from './lib/License.js';
import { LICENSE_FEATURES } from './lib/License.js';
import { loadLocalLicense, getLicenseStatus, submitLicenseJSON } from './lib/authLicense.js';
import { loadWorkflows } from './modules/workflowLoader.js';
import { loadProjects } from './modules/projectLoader.js';
import { recordWorkflowEvent, getInsights } from './modules/insightsDashboard.js';
import { registerUser, authenticateUser } from './modules/users.js';

// Additional imports for new functionality
import os from 'os';
import { checkLicense } from './lib/fossbilling.js';
import executeClicks from './modules/executeClicks.js';
import executeDeleteWorkflow from './modules/executeDelete.js';
import downloadFile from './modules/downloadFile.js';
import renameFile from './modules/renameFile.js';

// Determine root paths for static files and data directories.
const __ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = path.join(__ROOT, 'public');
const WORKFLOWS_DIR = path.join(__ROOT, 'workflows');
const PROJECTS_DIR = path.join(__ROOT, 'projects');
const HISTORY_DIR = path.join(__ROOT, 'history');

// Ensure history directories exist at startup.
await fs.mkdir(HISTORY_DIR, { recursive: true });
await fs.mkdir(path.join(HISTORY_DIR, 'workflows'), { recursive: true });
await fs.mkdir(path.join(HISTORY_DIR, 'projects'), { recursive: true });

// In-memory session store: token -> { username, createdAt }
const sessions = new Map();

function newToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function notFound(res) {
  res.writeHead(404);
  res.end('Not found');
}

function unauthorized(res) {
  sendJSON(res, 401, { error: 'Unauthorized' });
}

// Run a single workflow definition. Supports simple types defined in
// modules/executeClicks.js and executeDelete.js. Throws on unknown types.
async function runSingleWorkflow(def, license) {
  if (!def || typeof def !== 'object') throw new Error('Invalid workflow definition');
  const t = def.type;
  if (t === 'clicks') {
    if (!Array.isArray(def.clicks)) throw new Error('Workflow clicks missing');
    await executeClicks(license, def.clicks);
  } else if (t === 'deleteTrash') {
    await executeDeleteWorkflow(license);
  } else {
    throw new Error(`Tipo de workflow desconocido: ${t}`);
  }
}

// Run a project definition. Validates allowedUsers and iterates tasks.
async function runProjectWorkflows(proj, username, license) {
  if (!proj || typeof proj !== 'object') throw new Error('Invalid project definition');
  const { name, allowedUsers = [], tasks = [] } = proj;
  if (allowedUsers.length > 0 && !allowedUsers.includes(username)) {
    throw new Error(`Usuario '${username}' no autorizado para el proyecto '${name}'`);
  }
  for (const task of tasks) {
    const type = task.type;
    if (type === 'clicks') {
      if (!Array.isArray(task.clicks)) throw new Error('Tarea clicks inválida');
      await executeClicks(license, task.clicks);
    } else if (type === 'deleteTrash') {
      await executeDeleteWorkflow(license);
    } else if (type === 'download') {
      await downloadFile(license, { url: task.url, dest: task.dest });
    } else if (type === 'rename') {
      await renameFile(license, { from: task.from, to: task.to });
    } else {
      throw new Error(`Tipo de tarea desconocida: ${type}`);
    }
  }
}

async function createHistorySnapshot(license, kind, filename, content) {
  // Determine hours to retain from license quota
  const pruneHours = license.getQuota('n8e:limit:historyPrune') ?? 120;
  const expiresAt = Date.now() + pruneHours * 3600 * 1000;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotName = `${filename}.${stamp}.history.json`;
  const dir = path.join(HISTORY_DIR, kind);
  const snapshot = {
    filename,
    content,
    createdAt: Date.now(),
    expiresAt
  };
  await fs.writeFile(path.join(dir, snapshotName), JSON.stringify(snapshot, null, 2), 'utf8');
}

async function purgeExpiredHistory() {
  const kinds = ['workflows', 'projects'];
  for (const k of kinds) {
    const dir = path.join(HISTORY_DIR, k);
    try {
      const files = await fs.readdir(dir);
      for (const f of files) {
        if (!f.endsWith('.json')) continue;
        try {
          const raw = await fs.readFile(path.join(dir, f), 'utf8');
          const j = JSON.parse(raw);
          if (j.expiresAt && Date.now() > j.expiresAt) {
            await fs.unlink(path.join(dir, f));
          }
        } catch {
          // ignore malformed
        }
      }
    } catch {
      // ignore dir errors
    }
  }
}

// Serve static assets from /public
async function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname.slice(1));
  if (!filePath.startsWith(PUBLIC_DIR)) return notFound(res);
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type =
      ext === '.html' ? 'text/html' :
      ext === '.js' ? 'text/javascript' :
      ext === '.css' ? 'text/css' :
      ext === '.png' ? 'image/png' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch {
    notFound(res);
  }
}

// Main server
const server = http.createServer(async (req, res) => {
  // Prune history on each request
  purgeExpiredHistory().catch(() => {});
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method || 'GET';
  // Static
  if (method === 'GET' && (pathname === '/' || pathname.startsWith('/public/'))) {
    return serveStatic(req, res, pathname);
  }
  // License status endpoint
  if (method === 'GET' && pathname === '/api/license/status') {
    const license = await loadLocalLicense();
    const token = req.headers['x-auth-token'];
    const sess = token ? sessions.get(token) : null;
    const userId = sess?.username || null;
    return sendJSON(res, 200, getLicenseStatus(license, { userId }));
  }
  // Manual license submission
  if (method === 'POST' && pathname === '/api/license/submit') {
    try {
      const payload = await readBody(req);
      await submitLicenseJSON(payload);
      return sendJSON(res, 200, { ok: true });
    } catch (e) {
      return sendJSON(res, 400, { error: e.message || 'Invalid license' });
    }
  }

  // Activate a license using a license key. This checks against a remote
  // FOSSBilling instance and, on success, persists the resulting license JSON.
  if (method === 'POST' && pathname === '/api/license/activate') {
    try {
      const { key } = await readBody(req);
      if (!key) return sendJSON(res, 400, { error: 'Missing license key' });
      const baseUrl = process.env.FOSS_BILLING_URL;
      if (!baseUrl) return sendJSON(res, 500, { error: 'FOSS_BILLING_URL not configured' });
      const result = await checkLicense({ baseUrl, licenseKey: key, host: os.hostname(), version: '1.0.0', path: process.cwd() });
      if (!result) return sendJSON(res, 200, { license: null, error: 'Invalid license' });
      await submitLicenseJSON(result);
      return sendJSON(res, 200, { license: result });
    } catch (e) {
      return sendJSON(res, 500, { error: e.message || 'Activation failed' });
    }
  }
  // Register
  if (method === 'POST' && pathname === '/api/auth/register') {
    const license = await loadLocalLicense();
    const { username, password } = await readBody(req);
    try {
      await registerUser(license, username, password);
      const ok = await authenticateUser(license, username, password);
      if (!ok) return unauthorized(res);
      const tok = newToken();
      sessions.set(tok, { username, createdAt: Date.now() });
      return sendJSON(res, 200, { token: tok, username });
    } catch (e) {
      return sendJSON(res, 400, { error: e.message });
    }
  }
  // Login
  if (method === 'POST' && pathname === '/api/auth/login') {
    const license = await loadLocalLicense();
    const { username, password } = await readBody(req);
    const ok = await authenticateUser(license, username, password);
    if (!ok) return unauthorized(res);
    const tok = newToken();
    sessions.set(tok, { username, createdAt: Date.now() });
    return sendJSON(res, 200, { token: tok, username });
  }
  // Auth guard for subsequent endpoints
  const token = req.headers['x-auth-token'];
  const sess = token ? sessions.get(token) : null;
  if (!sess) return unauthorized(res);
  // List workflows
  if (method === 'GET' && pathname === '/api/workflows') {
    const list = await loadWorkflows();
    return sendJSON(res, 200, list);
  }
  // List projects
  if (method === 'GET' && pathname === '/api/projects') {
    const list = await loadProjects();
    return sendJSON(res, 200, list);
  }

    // Execute a workflow or project. Requires kind ('workflows' or 'projects')
    // and the file name (without extension). Executes synchronously and
    // returns when complete. Records success/failure to workflow logs.
    if (method === 'POST' && pathname === '/api/run') {
      try {
        const { kind, name } = await readBody(req);
        if (!kind || !name) return sendJSON(res, 400, { error: 'Missing kind or name' });
        const base = kind === 'workflows' ? WORKFLOWS_DIR : kind === 'projects' ? PROJECTS_DIR : null;
        if (!base) return sendJSON(res, 400, { error: 'Invalid kind' });
        // Resolve file paths (with and without .json)
        const sanitized = path.basename(name);
        const primary = path.join(base, sanitized);
        const candidates = [];
        candidates.push(primary);
        if (!primary.endsWith('.json')) candidates.push(primary + '.json');
        let content = null;
        for (const filePath of candidates) {
          try {
            const raw = await fs.readFile(filePath, 'utf8');
            content = JSON.parse(raw);
            break;
          } catch {}
        }
        if (!content) return notFound(res);
        const license = (await loadLocalLicense()) || new License({ licenseFeatures: {} });
        // Run according to kind
        if (kind === 'workflows') {
          await runSingleWorkflow(content, license);
        } else {
          const username = sess?.username || null;
          await runProjectWorkflows(content, username, license);
        }
        await recordWorkflowEvent({ name: name || 'unnamed', status: 'success', at: Date.now() });
        return sendJSON(res, 200, { ok: true, message: 'Ejecutado con éxito' });
      } catch (e) {
        // Attempt to record a failure for this execution
        try {
          await recordWorkflowEvent({ name: name || 'unknown', status: 'failed', at: Date.now() });
        } catch {}
        return sendJSON(res, 500, { error: e.message || 'Execution failed' });
      }
    }
  // Read a file (workflow or project)
  if (method === 'GET' && pathname === '/api/file') {
    const fileParam = url.searchParams.get('file');
    const kind = url.searchParams.get('kind');
    if (!fileParam || !kind) return sendJSON(res, 400, { error: 'Missing params' });
    const base = kind === 'workflows' ? WORKFLOWS_DIR : kind === 'projects' ? PROJECTS_DIR : null;
    if (!base) return unauthorized(res);
    // Sanitize file path to avoid directory traversal
    // If the provided file name does not end with .json, attempt both the raw name and the `.json` variant
    const candidates = [];
    // Normalize to a file base name to avoid directory traversal
    const sanitized = path.basename(fileParam);
    const primary = path.join(base, sanitized);
    // Only allow reading inside the base directory
    if (primary.startsWith(base)) {
      candidates.push(primary);
      if (!primary.endsWith('.json')) {
        candidates.push(primary + '.json');
      }
    }
    for (const candidate of candidates) {
      try {
        const raw = await fs.readFile(candidate, 'utf8');
        return sendJSON(res, 200, { file: fileParam, kind, content: JSON.parse(raw) });
      } catch {
        // try next candidate
      }
    }
    return notFound(res);
  }
  // Save file + history snapshot
  if (method === 'POST' && pathname === '/api/file') {
    const { file, kind, content } = await readBody(req);
    if (!file || !kind || typeof content !== 'object') return sendJSON(res, 400, { error: 'Invalid body' });
    const base = kind === 'workflows' ? WORKFLOWS_DIR : kind === 'projects' ? PROJECTS_DIR : null;
    if (!base) return unauthorized(res);
    const full = path.join(base, file);
    if (!full.startsWith(base)) return unauthorized(res);
    let oldContent = {};
    try {
      const rawOld = await fs.readFile(full, 'utf8');
      oldContent = JSON.parse(rawOld);
    } catch {
      oldContent = {};
    }
    // Write new file
    await fs.writeFile(full, JSON.stringify(content, null, 2), 'utf8');
    const license = await loadLocalLicense();
    await createHistorySnapshot(license || new License({ licenseFeatures: {} }), kind, file, oldContent);
    await purgeExpiredHistory();
    return sendJSON(res, 200, { ok: true });
  }
  // Log a workflow event (for demo)
  if (method === 'POST' && pathname === '/api/logs/workflow') {
    const { name, status, at } = await readBody(req);
    await recordWorkflowEvent({ name: name || 'unnamed', status: status || 'success', at: at || Date.now() });
    return sendJSON(res, 200, { ok: true });
  }
  // Insights
  if (method === 'GET' && pathname === '/api/insights') {
    const license = await loadLocalLicense();
    if (!license) return sendJSON(res, 400, { error: 'License required' });
    const days = parseInt(url.searchParams.get('days') || '7', 10);
    const data = await getInsights(license, { days });
    return sendJSON(res, 200, data);
  }
  return notFound(res);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`n8easy server running on http://localhost:${PORT}`);
});