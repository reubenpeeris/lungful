# Lungful

Audio-guided breathwork app. No build step, no framework — one HTML file plus a small folder of audio samples.

## Using the app

The app loads audio sample files at runtime, so it must be served over HTTP rather than opened directly as a file. From the repo root:

```bash
npx serve . -p 5000
```

Then visit `http://localhost:5000`.

> **Note**: double-clicking `index.html` will not work — browsers block local file fetches for security reasons.

### Audio samples

The app requires three cello samples in a `samples/` folder alongside `index.html`:

```
samples/
  cello-c2.flac             # bowed sustain — inhale/exhale glide
  cello-piz-rr1-c2.flac     # pizzicato C2 — hold after exhale
  cello-piz-rr1-g2.flac     # pizzicato G2 — hold after inhale
```

These are from the [Sonatina Symphonic Orchestra](https://github.com/peastman/sso) library by Mattias Westlund, used under the [Creative Commons Sampling Plus 1.0](https://creativecommons.org/licenses/sampling+/1.0/) licence. See `LICENSES.md` for full attribution. If the samples fail to load the app shows an error and is non-interactive.

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

## Installing as an app (PWA)

Lungful is a Progressive Web App. Once the site is hosted over HTTPS (e.g. GitHub Pages), Chrome on Android will offer an "Add to Home Screen" prompt automatically. The app will then launch full-screen without browser chrome, and work offline after the first visit — the service worker caches all assets including the audio samples.

For local development the PWA install prompt won't appear (requires HTTPS), but the app functions normally over `http://localhost:5000`.

## Repo structure

```
index.html              # the entire app
manifest.json           # PWA manifest
sw.js                   # service worker (caching + offline)
icons/
  icon.svg              # app icon (concentric circles mark)
samples/                # cello audio samples (see above)
LICENSES.md             # attribution for audio samples
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

- **Audio**: real cello samples from the Sonatina Symphonic Orchestra library. Inhale/exhale uses a bowed C2 sample looped and pitch-shifted across a perfect fifth (C2→G2). Hold uses pizzicato samples at C2 and G2 at 30 BPM — G2 after inhale, C2 after exhale. If samples fail to load the circle shows an error and the app is non-interactive.
- **Pace model**: each preset has fixed integer ratios and an adjustable pace (seconds). Duration = ratio × pace.
- **Persistence**: pace and timer settings are saved to `localStorage` (key: `breathwork_params`).
- **Palette**: earthy light mode — parchment background (#f5f2eb), sage green accent (#5a7a42).
- **Fonts**: Cormorant Garamond (headings), Maven Pro (UI), loaded from Google Fonts.

## Releasing a new version

The app version is displayed in the footer of `index.html` and must be kept in sync with the cache name in `sw.js`. The test suite enforces this — a mismatch will cause the version sync test to fail.

When making a release:

1. Update the version in the `index.html` footer: `<span data-testid="app-version">vX.Y.Z</span>`
2. Update the cache name in `sw.js`: `const CACHE = 'lungful-X.Y.Z';`
3. Run `npm test` to confirm they match
4. Commit and push both files together

Version numbering follows semver — patch (Z) for small fixes and tweaks, minor (Y) for new features, major (X) for breaking changes or redesigns.
