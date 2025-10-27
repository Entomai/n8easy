import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve the projects directory relative to this file. Converting to a
// filesystem path avoids issues with Windows drive letters when using path
// operations.
const PROJECTS_DIR = fileURLToPath(new URL('../projects', import.meta.url));

/**
 * Load all project definitions from the projects directory. Each project is
 * described in a JSON file with fields:
 *   - name: a string identifier for the project
 *   - allowedUsers: array of usernames allowed to run the project
 *   - tasks: array of task objects with a 'type' property
 *   - schedule (optional): object with scheduling properties such as
 *       delay (milliseconds before first execution), interval (milliseconds
 *       between repeats), and repeatTimes (number of times to repeat)
 *
 * @returns {Promise<Array<Object>>} An array of project objects
 */
export async function loadProjects() {
  let entries;
  try {
    entries = await fs.readdir(PROJECTS_DIR);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const projects = [];
  for (const file of entries) {
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(PROJECTS_DIR, file);
    const content = await fs.readFile(filePath, 'utf8');
    try {
      const data = JSON.parse(content);
      projects.push(data);
    } catch (err) {
      console.warn(`Failed to parse project '${file}': ${err.message}`);
    }
  }
  return projects;
}
