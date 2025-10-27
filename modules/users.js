import fs from 'fs/promises';
import { LICENSE_QUOTAS, LICENSE_FEATURES } from '../lib/License.js';

const USERS_FILE = new URL('../data/users.json', import.meta.url);

async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

/**
 * Register a new user if under quota.
 *
 * @param {License} license
 * @param {string} username
 * @param {string} password
 */
export async function registerUser(license, username, password) {
  const users = await loadUsers();
  if (users.find(u => u.username === username)) {
    throw new Error('Username already exists.');
  }
  const limit = license.getQuota(LICENSE_QUOTAS.USERS_LIMIT);
  if (limit !== undefined && limit >= 0 && users.length >= limit) {
    throw new Error(`User limit reached. Cannot register more than ${limit} users.`);
  }
  users.push({ username, password });
  await saveUsers(users);
  console.log(`User '${username}' registered successfully.`);
}

/**
 * Authenticate a user using either LDAP (if enabled) or the local user store.
 *
 * @param {License} license
 * @param {string} username
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function authenticateUser(license, username, password) {
  // If LDAP feature is enabled, you would normally authenticate against an LDAP
  // server here. For demonstration purposes, we'll fall back to local auth.
  if (license.hasFeature(LICENSE_FEATURES.LDAP)) {
    console.warn('LDAP authentication requested, but no LDAP integration is implemented. Falling back to local authentication.');
  }
  const users = await loadUsers();
  const user = users.find(u => u.username === username && u.password === password);
  return Boolean(user);
}
