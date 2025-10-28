# Node Automation Easy (n8easy) Desktop Automation

Welcome to **Node Automation Easy**, a desktop automation platform built with Node.js.  This application allows you to automate routine tasks on your desktop, such as simulating mouse clicks, keyboard input, managing local files and folders, and scheduling these actions to run at specific times.  It provides a simple web interface where you can create and edit automation workflows (JSON files) and group them into projects.  The project is inspired by the open‑source workflow tool n8n, but focuses exclusively on local desktop automation and is **not affiliated with n8n.io**.

## Features

* **Desktop automation:** Automate mouse clicks, keyboard input and file operations.
* **JSON‑based workflows:** Define your own workflows and projects using JSON files in the `workflows/` and `projects/` directories.
* **User management:** Register and log in with a username and password.  User quotas are enforced by the license.
* **License control:** Personal use is free.  For commercial use you must obtain a license from n8easy (see [Licensing](#licensing) below).
* **History tracking:** When you save a workflow or project through the web interface, the previous version is archived with an expiration time based on your license.
* **Insights dashboard:** View execution statistics and graphs for your workflows (number of runs, by day, by hour) if enabled by your license.
* **License API integration:** Check your license status, request a new license via the external portal, or paste a license manually.

## Getting Started

### Prerequisites

* **Node.js 18 or higher** is recommended.  Install it from [nodejs.org](https://nodejs.org/) if you don’t already have it.

### Installation

1. Clone or download this repository.
2. Open a terminal in the project root and install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

   The server will listen on port `8080` by default and will log the URL when it starts.

4. Open your browser and navigate to `http://localhost:8080` to access the web interface.

### Using the Application

1. **Register or log in:** Use the form on the “Login & Archivos” tab to create a user or log in.  A session token will be stored in your browser for subsequent API requests.
2. **Workflows and Projects:** After logging in, the application lists workflow files (`workflows/*.json`) and project files (`projects/*.json`).  Click **Editar** to load a JSON file into the editor, make changes and click **Guardar** to save it.  The previous version is archived in the `history/` directory for the number of hours defined by your license (`n8e:limit:historyPrune`).
3. **License / Auth:** In the “License / Auth” tab you can see your current license status, request a commercial license (if API access is enabled) or paste a license JSON manually.  A personal license is sufficient for non‑commercial use.  If the API is disabled by your license, you will need to paste a new license manually.
4. **Insights:** The “Insights” tab displays execution statistics for your workflows.  Totals, per‑day and per‑hour breakdowns are shown if your license permits (`n8e:analytics:*` features).  Use the **Días** field to adjust the history window, up to the maximum allowed by your license (`n8e:limit:analytics:historyDays`).
5. **Recording workflow events:** To populate the insights dashboard, your automation code (or any script) should call the `/api/logs/workflow` endpoint with `{ name, status }` after running a workflow.  See `modules/insightsDashboard.js` for details.

## Licensing

Node Automation Easy is free for personal use.  You may run and modify the software on your own computer for non‑commercial purposes.  To use it in a commercial environment (for example, as part of a business or paid service), you must obtain a commercial license from n8easy.  Licenses can be purchased via the portal at **[control.entomai.com](https://control.entomai.com)**.

The project is inspired by the n8n workflow automation platform, but it is a separate project focused on desktop automation.  It is not affiliated with or endorsed by n8n.io, and no part of n8n is redistributed here.  While certain concepts may look familiar, the code and logic were developed independently.

Refer to `LICENSE.md` for more details on license terms, personal vs. commercial use and the project’s independence from n8n.

## Expected Behaviour

When you run `npm start`, the server boots up and prints a message like:

```
n8easy server running on http://localhost:8080
```

Opening the URL in a browser should display the three main tabs (Login & Archivos, License / Auth, Insights).  If you see an empty page or error, make sure you installed dependencies correctly and that no other process is listening on port 8080.

JSON files edited through the web interface are saved to disk immediately.  History files are created in the `history/workflows/` or `history/projects/` directories with a timestamp and an expiration timestamp derived from your license.  Expired history files are automatically pruned on each request.

If you enable execution logging (by POSTing to `/api/logs/workflow`), the Insights dashboard will update the totals and graphs when you click **Actualizar**.

## Contributing

Pull requests are welcome.  For major changes, please open an issue first to discuss what you would like to change.  By contributing, you agree to license your work under the same terms as this project.

## Support

For questions about licensing or commercial use, please contact **support@entomai.com** or open a ticket via the license portal.