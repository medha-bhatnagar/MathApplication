# Math Practice

A child-friendly math practice app built with React, TypeScript, and Vite. It includes configurable arithmetic sessions, summaries, statistics, settings, and mistake review. Practice history is saved in the browser using local storage; no account or API key is required.

## Run locally

### Requirements

- Node.js 20.19 or newer, or 22.12 or newer
- npm (included with Node.js)

### Start the development server

1. Open a terminal in the project folder.
2. Install the dependencies (first run, or after dependency changes):

   ```sh
   npm install
   ```

3. Start the app:

   ```sh
   npm run dev
   ```

4. Open the local URL printed by Vite, usually [http://localhost:5173](http://localhost:5173).

Leave the terminal running while using the app. Press `Ctrl+C` in that terminal to stop the development server.

## Other commands

```sh
npm test            # Run the test suite
npm run lint        # Check for lint issues
npm run format:check # Check formatting
npm run build       # Type-check and create a production build in dist/
npm run preview     # Preview the production build locally (run build first)
```

## Deploy to Netlify

The repository includes a `netlify.toml` build configuration and a `public/_redirects` rule so direct visits and page refreshes work on React Router routes.

To publish through Netlify, sign in to Netlify, choose **Add new site → Import an existing project**, connect the GitHub repository, and select the `main` branch. Netlify reads the build command (`npm run build`) and publish directory (`dist`) from `netlify.toml`. Each successful deploy provides a public site URL.
