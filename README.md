# Lungful

Audio-guided breathwork app. No build step, no dependencies — just open `index.html` in a browser.

## Using the app

Open `index.html` directly in any modern browser, or serve it locally:

```bash
npx serve . -p 5000
```

Then visit `http://localhost:5000`.

## Development setup

### Prerequisites

**nvm** (Node Version Manager) isolates the Node version used by this project from other projects on your machine. Install it once:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Restart your terminal after installing, then verify:

```bash
nvm --version
```

### First-time setup

```bash
# Use the correct Node version for this project (defined in .nvmrc)
nvm install
nvm use

# Install packages into this project's local node_modules/
npm install

# Download the Playwright browser
npx playwright install chromium
```

After this, `node_modules/` contains everything the tests need. It is gitignored and never committed — `package.json` and `package-lock.json` record the exact versions instead.

### Returning to the project

```bash
nvm use       # switch to the project's Node version
npm test      # run the tests
```

## Running the tests

The test suite is end-to-end Playwright tests that run against a real browser. They cover all key behaviours: session control, preset patterns, pace model, timer, audio state, and settings persistence.

```bash
npm test                 # headless (fast, good for CI)
npm run test:headed      # watch the browser
npm run test:ui          # Playwright interactive UI
```

## Continuing development with Claude

Upload `index.html` to a new Claude conversation and describe what you want to change. The test suite acts as a regression harness — run it after any changes to verify existing behaviour is intact.

Suggested opening prompt:
> This is my Lungful breathwork app built with vanilla HTML/CSS/JS and the Web Audio API. I'd like to change X.

## Repo structure

```
index.html              # the entire app
package.json            # dependencies and npm scripts
package-lock.json       # exact dependency versions (commit this)
playwright.config.js    # test runner config
.nvmrc                  # Node version (used by nvm)
.gitignore
tests/
  e2e/
    lungful.spec.js     # all behavioural tests
```

## Design notes

- **Audio**: synthesised entirely via the Web Audio API — no audio files. Inhale/exhale uses three detuned sines with reverb; hold uses a tonal heartbeat at 35 BPM.
- **Pace model**: each preset has fixed integer ratios and an adjustable pace (seconds). Duration = ratio × pace.
- **Persistence**: pace and timer settings are saved to `localStorage` (key: `breathwork_params`).
- **Palette**: earthy light mode — parchment background (#f5f2eb), sage green accent (#5a7a42).
- **Fonts**: Cormorant Garamond (headings), Jost (UI), loaded from Google Fonts.
