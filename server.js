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
  // Read a file (workflow or project)
  if (method === 'GET' && pathname === '/api/file') {
    const file = url.searchParams.get('file');
    const kind = url.searchParams.get('kind');
    if (!file || !kind) return sendJSON(res, 400, { error: 'Missing params' });
    const base = kind === 'workflows' ? WORKFLOWS_DIR : kind === 'projects' ? PROJECTS_DIR : null;
    if (!base) return unauthorized(res);
    const full = path.join(base, file);
    if (!full.startsWith(base)) return unauthorized(res);
    try {
      const raw = await fs.readFile(full, 'utf8');
      return sendJSON(res, 200, { file, kind, content: JSON.parse(raw) });
    } catch {
      return notFound(res);
    }
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