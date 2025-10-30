import fs from 'fs/promises';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { License } from './lib/License.js';
import { activateServiceApiKey } from './lib/serviceApiKeyPortal.js';

// User management and workflows
import { registerUser, authenticateUser } from './modules/users.js';
import { loadWorkflows } from './modules/workflowLoader.js';
import executeClicks from './modules/executeClicks.js';
import executeDeleteWorkflow from './modules/executeDelete.js';
import { loadProjects } from './modules/projectLoader.js';
import downloadFile from './modules/downloadFile.js';
import renameFile from './modules/renameFile.js';

/**
 * Load a license from the control portal if environment variables are set,
 * otherwise fall back to the bundled license.json file.
 *
 * Set the following environment variables to enable remote license check:
 *   LICENSE_KEY       Service API key issued by control.entomai.com
 *
 * @returns {Promise<License>}
 */
async function loadLicense() {
  const { LICENSE_KEY } = process.env;
  if (LICENSE_KEY) {
    try {
      const result = await activateServiceApiKey(LICENSE_KEY);
      console.log('License generated via control.entomai.com.');
      return new License(result);
    } catch (err) {
      console.warn(`Remote license activation failed: ${err.message}`);
      console.warn('Falling back to local license.json.');
    }
  }
  const json = JSON.parse(await fs.readFile(new URL('./license.json', import.meta.url)));
  console.log('Loaded local license.');
  return new License(json);
}

async function main() {
  const license = await loadLicense();
  // Prompt user for login or registration
  const rl = readline.createInterface({ input, output });
  let authenticated = false;
  let currentUser;
  while (!authenticated) {
    const action = (await rl.question('Do you want to [login] or [register]? ')).trim().toLowerCase();
    if (action !== 'login' && action !== 'register') {
      console.log('Invalid choice. Please type "login" or "register".');
      continue;
    }
    const username = await rl.question('Username: ');
    const password = await rl.question('Password: ');
    try {
      if (action === 'register') {
        await registerUser(license, username, password);
      }
      const ok = await authenticateUser(license, username, password);
      if (!ok) {
        console.log('Authentication failed. Please try again.');
        continue;
      }
      console.log(`Authenticated as '${username}'.`);
      authenticated = true;
      currentUser = username;
    } catch (err) {
      console.error(err.message);
    }
  }
  // Load workflows from directory and execute them sequentially
  const workflows = await loadWorkflows();
  for (const wf of workflows) {
    try {
      if (wf.type === 'clicks' && Array.isArray(wf.clicks)) {
        await executeClicks(license, wf.clicks);
      } else if (wf.type === 'deleteTrash') {
        executeDeleteWorkflow(license);
      } else {
        console.warn(`Unknown workflow type: ${wf.type}`);
      }
    } catch (err) {
      console.error(`Error executing workflow '${wf.type}':`, err.message);
    }
  }
  // Load projects and schedule them for the authenticated user
  const projects = await loadProjects();
  for (const project of projects) {
    const { name, allowedUsers = [], tasks = [], schedule = {} } = project;
    if (allowedUsers.length > 0 && !allowedUsers.includes(currentUser)) {
      console.log(`Skipping project '${name}' – user '${currentUser}' is not allowed.`);
      continue;
    }
    const delay = typeof schedule.delay === 'number' ? schedule.delay : 0;
    const interval = typeof schedule.interval === 'number' ? schedule.interval : 0;
    // repeatTimes: if undefined or null, default to 1 (run once). If -1, repeat indefinitely.
    let repeatTimes;
    if (schedule.repeatTimes === undefined || schedule.repeatTimes === null) {
      repeatTimes = 1;
    } else {
      repeatTimes = schedule.repeatTimes;
    }
    // Define a function to run all tasks in this project sequentially.
    const runTasks = async () => {
      for (const task of tasks) {
        try {
          switch (task.type) {
            case 'clicks':
              if (Array.isArray(task.clicks)) {
                await executeClicks(license, task.clicks);
              } else {
                console.warn(`Task 'clicks' requires a clicks array.`);
              }
              break;
            case 'deleteTrash':
              executeDeleteWorkflow(license);
              break;
            case 'download':
              await downloadFile(license, { url: task.url, dest: task.dest });
              break;
            case 'rename':
              await renameFile(license, { from: task.from, to: task.to });
              break;
            default:
              console.warn(`Unknown task type '${task.type}' in project '${name}'.`);
          }
        } catch (err) {
          console.error(`Error in project '${name}' task '${task.type}':`, err.message);
        }
      }
    };
    // Schedule execution according to schedule
    if (repeatTimes === -1 || repeatTimes > 1) {
      // Repeating tasks
      setTimeout(() => {
        let count = 0;
        const executeAndCount = async () => {
          count++;
          await runTasks();
          // If repeatTimes is -1 (infinite), never clear the interval
          if (repeatTimes !== -1 && count >= repeatTimes) {
            clearInterval(timer);
          }
        };
        // Run immediately once at start
        executeAndCount();
        const timer = setInterval(executeAndCount, interval > 0 ? interval : 1000);
      }, delay);
    } else {
      // Single execution
      if (delay > 0) {
        setTimeout(() => {
          runTasks().catch((err) => {
            console.error(`Error executing project '${name}':`, err.message);
          });
        }, delay);
      } else {
        await runTasks();
      }
    }
  }
  await rl.close();
}

main().catch((err) => {
  console.error(err);
});
