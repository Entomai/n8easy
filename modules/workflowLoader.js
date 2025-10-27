import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert the URL to a file system path. On Windows, the pathname of a file URL
// includes an extra slash before the drive letter (e.g. `/C:/path`). Using
// fileURLToPath normalizes this and avoids duplicating drive letters when
// constructing paths. See Node.js docs for fileURLToPath.
const WORKFLOWS_DIR = fileURLToPath(new URL('../workflows', import.meta.url));

/**
 * Load all workflow definitions from the workflows directory.
 * Each workflow file should be a JSON document describing a task.
 *
 * @returns {Promise<Array<Object>>} Array of workflow objects.
 */
export async function loadWorkflows() {
  let entries;
  try {
    entries = await fs.readdir(WORKFLOWS_DIR);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const workflows = [];
  for (const file of entries) {
    if (!file.endsWith('.json')) continue;
    // Join using the directory path (string) and file name. Because
    // WORKFLOWS_DIR is a normalized file system path (not a URL), this will
    // construct correct paths on both POSIX and Windows systems.
    const filePath = path.join(WORKFLOWS_DIR, file);
    const content = await fs.readFile(filePath, 'utf8');
    try {
      const data = JSON.parse(content);
      workflows.push(data);
    } catch (err) {
      console.warn(`Failed to parse workflow '${file}': ${err.message}`);
    }
  }
  return workflows;
}
