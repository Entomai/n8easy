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
    const filePath = path.join(WORKFLOWS_DIR, file);
    const content = await fs.readFile(filePath, 'utf8');
    try {
      const data = JSON.parse(content);
      // Include the filename (without extension) as the name property so the UI
      // can reference and open the workflow file. Existing name fields are
      // preserved if already defined.
      const baseName = path.basename(file, '.json');
      if (!data.name) data.name = baseName;
      workflows.push(data);
    } catch (err) {
      console.warn(`Failed to parse workflow '${file}': ${err.message}`);
    }
  }
  return workflows;
}
