const { test, expect } = require('@playwright/test');

// Helper: open the app, clear state, and wait for samples to load
async function openApp(page) {
  await page.goto('/');
  await page.waitForSelector('[data-testid="circle"]');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-testid="circle"]');
  // Wait for audio samples to finish loading before any interaction
  await page.waitForFunction(() => window._lungfulState?.samplesReady === true, { timeout: 10000 });
}

function state(page) {
  return page.evaluate(() => window._lungfulState);
}

// ─── Sample loading ────────────────────────────────────────────────────────

test.describe('Sample loading', () => {

  test('all three samples load successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window._lungfulState?.samplesReady === true, { timeout: 10000 });
    const ready = await page.evaluate(() => window._lungfulState.samplesReady);
    expect(ready).toBe(true);
  });

  test('circle shows "begin" after samples load', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window._lungfulState?.samplesReady === true, { timeout: 10000 });
    await expect(page.getByTestId('circle-label')).toHaveText('begin');
  });

  test('circle becomes interactive after samples load', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window._lungfulState?.samplesReady === true, { timeout: 10000 });
    const pointerEvents = await page.evaluate(() =>
      document.getElementById('circleOuter').style.pointerEvents
    );
    expect(pointerEvents).toBe('');
  });

  test('error dialog is not visible when samples load successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window._lungfulState?.samplesReady === true, { timeout: 10000 });
    await expect(page.getByTestId('error-dialog')).not.toBeVisible();
  });

});

// ─── Session: circle as the primary control ────────────────────────────────

test.describe('Circle control', () => {

  test('circle shows "begin" before a session starts', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId('circle-label')).toHaveText('begin');
  });

  test('clicking the circle starts a session', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('circle').click();
    const s = await state(page);
    expect(s.running).toBe(true);
  });

  test('circle shows "pause" while a session is running', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('circle').click();
    await expect(page.getByTestId('circle-label')).toHaveText('pause');
  });

  test('clicking the circle while running pauses the session', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('circle').click();
    await page.getByTestId('circle').click();
    const s = await state(page);
    expect(s.running).toBe(false);
  });

  test('circle shows "begin" after pausing without a timer', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('circle').click();
    await page.getByTestId('circle').click();
    await expect(page.getByTestId('circle-label')).toHaveText('begin');
  });

});

// ─── Session phases ────────────────────────────────────────────────────────

test.describe('Session phases', () => {

  test('first phase of box breathing is Inhale', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('circle').click();
    await expect(page.getByTestId('phase-name')).toHaveText('Inhale');
  });

  test('phase label clears when session stops', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('circle').click();
    await page.getByTestId('circle').click();
    await expect(page.getByTestId('phase-name')).toHaveText('—');
  });

  test('cycle counter increments each cycle', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('preset-box').click();
    const decBtn = page.locator('[id="tv-pace"]').locator('..').locator('button').first();
    for (let i = 0; i < 14; i++) await decBtn.click();
    await page.getByTestId('circle').click();
    await page.waitForTimeout(2500);
    const s = await state(page);
    expect(s.cycleCount).toBeGreaterThan(0);
  });

});

// ─── Preset selection ──────────────────────────────────────────────────────

test.describe('Preset selection', () => {

  test('switching preset stops a running session', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('circle').click();
    await page.getByTestId('preset-coherence').click();
    const s = await state(page);
    expect(s.running).toBe(false);
  });

  test('switching preset changes the active preset', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('preset-478').click();
    const s = await state(page);
    expect(s.currentPreset).toBe('478');
  });

  test('box preset pattern strip shows four phases', async ({ page }) => {
    await openApp(page);
    const phases = page.locator('.pattern-phase');
    await expect(phases).toHaveCount(4);
  });

  test('coherence preset pattern strip shows two phases', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('preset-coherence').click();
    const phases = page.locator('.pattern-phase');
    await expect(phases).toHaveCount(2);
  });

  test('4-7-8 preset pattern strip shows three phases', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('preset-478').click();
    const phases = page.locator('.pattern-phase');
    await expect(phases).toHaveCount(3);
  });

});

// ─── Pace model ────────────────────────────────────────────────────────────

test.describe('Pace model', () => {

  test('box at pace 4 produces four phases of 4s each', async ({ page }) => {
    await openApp(page);
    const params = await page.evaluate(() => window._lungfulState.presetParams('box'));
    expect(params.pace).toBe(4);
    const phases = page.locator('.pattern-phase');
    await expect(phases.nth(0)).toContainText('4s');
    await expect(phases.nth(1)).toContainText('4s');
    await expect(phases.nth(2)).toContainText('4s');
    await expect(phases.nth(3)).toContainText('4s');
  });

  test('4-7-8 at pace 1 produces 4s, 7s, 8s phases', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('preset-478').click();
    const phases = page.locator('.pattern-phase');
    await expect(phases.nth(0)).toContainText('4s');
    await expect(phases.nth(1)).toContainText('7s');
    await expect(phases.nth(2)).toContainText('8s');
  });

  test('4-7-8 at pace 2 produces 8s, 14s, 16s phases', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('preset-478').click();
    const incBtn = page.locator('[id="tv-pace"]').locator('..').locator('button').last();
    await incBtn.click();
    await incBtn.click();
    const phases = page.locator('.pattern-phase');
    await expect(phases.nth(0)).toContainText('8s');
    await expect(phases.nth(1)).toContainText('14s');
    await expect(phases.nth(2)).toContainText('16s');
  });

  test('coherence at pace 5 produces two phases of 5s each', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('preset-coherence').click();
    const phases = page.locator('.pattern-phase');
    await expect(phases.nth(0)).toContainText('5s');
    await expect(phases.nth(1)).toContainText('5s');
  });

});

// ─── Timer ────────────────────────────────────────────────────────────────

test.describe('Timer', () => {

  test('timer runtime row is hidden before a session starts', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('timer-checkbox').check();
    await expect(page.getByTestId('timer-runtime')).not.toBeVisible();
  });

  test('timer runtime row appears when a timed session starts', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('timer-checkbox').check();
    await page.getByTestId('circle').click();
    await expect(page.getByTestId('timer-runtime')).toBeVisible();
  });

  test('countdown shows remaining time once session starts', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('timer-checkbox').check();
    await page.getByTestId('circle').click();
    const text = await page.getByTestId('timer-remaining').textContent();
    expect(text).toMatch(/^\d+:\d{2}$/);
  });

  test('disabling timer mid-session hides the countdown but keeps session running', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('timer-checkbox').check();
    await page.getByTestId('circle').click();
    await expect(page.getByTestId('timer-runtime')).toBeVisible();
    await page.getByTestId('timer-checkbox').uncheck();
    await expect(page.getByTestId('timer-runtime')).not.toBeVisible();
    const s = await state(page);
    expect(s.running).toBe(true);
  });

  test('enabling timer mid-session starts countdown immediately', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('circle').click();
    await expect(page.getByTestId('timer-runtime')).not.toBeVisible();
    await page.getByTestId('timer-checkbox').check();
    await expect(page.getByTestId('timer-runtime')).toBeVisible();
    const s = await state(page);
    expect(s.running).toBe(true);
  });

  test('reset restarts countdown without stopping session', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('timer-checkbox').check();
    await page.getByTestId('circle').click();
    await page.waitForTimeout(2000);
    await page.getByTestId('timer-reset').click();
    const s = await state(page);
    expect(s.running).toBe(true);
    const remaining = await page.evaluate(() => window._lungfulState.remainingMs);
    expect(remaining).toBeGreaterThan(4 * 60 * 1000);
  });

  test('pausing a timed session shows "resume" on circle', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('timer-checkbox').check();
    await page.getByTestId('circle').click();
    await page.getByTestId('circle').click();
    await expect(page.getByTestId('circle-label')).toHaveText('resume');
  });

  test('countdown remains visible when paused', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('timer-checkbox').check();
    await page.getByTestId('circle').click();
    await page.getByTestId('circle').click();
    await expect(page.getByTestId('timer-runtime')).toBeVisible();
  });

  test('resuming after pause continues countdown from remaining time', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('timer-checkbox').check();
    await page.getByTestId('circle').click();
    await page.waitForTimeout(2000);
    await page.getByTestId('circle').click(); // pause
    const remainingAfterPause = await page.evaluate(() => window._lungfulState.remainingMs);
    await page.getByTestId('circle').click(); // resume
    await page.waitForTimeout(500);
    const remainingAfterResume = await page.evaluate(() => window._lungfulState.remainingMs);
    expect(remainingAfterResume).toBeLessThanOrEqual(remainingAfterPause + 100);
    expect(remainingAfterResume).toBeGreaterThan(remainingAfterPause - 1500);
  });

});

// ─── Audio state ───────────────────────────────────────────────────────────

test.describe('Audio state', () => {

  test('samples are loaded and ready on startup', async ({ page }) => {
    await openApp(page);
    const s = await state(page);
    expect(s.samplesReady).toBe(true);
  });

  test('master gain is at 1 when session is running', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('circle').click();
    await page.waitForTimeout(300);
    const gain = await page.evaluate(() => window._lungfulState.masterGain);
    expect(gain).toBeCloseTo(1, 1);
  });

  test('master gain recovers to 1 after a quick pause and resume', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('circle').click();
    await page.waitForTimeout(300);
    await page.getByTestId('circle').click(); // pause — starts fade
    await page.waitForTimeout(100);
    await page.getByTestId('circle').click(); // resume quickly — should cancel fade
    await page.waitForTimeout(300);
    const gain = await page.evaluate(() => window._lungfulState.masterGain);
    expect(gain).toBeCloseTo(1, 1);
  });

  test('audio is active shortly after session begins', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('circle').click();
    await page.waitForTimeout(300);
    const s = await state(page);
    expect(s.audioRunning).toBe(true);
  });

});

// ─── localStorage persistence ─────────────────────────────────────────────

test.describe('Settings persistence', () => {

  test('pace change is saved and restored on reload', async ({ page }) => {
    await openApp(page);
    const incBtn = page.locator('[id="tv-pace"]').locator('..').locator('button').last();
    await incBtn.click(); // 4 → 4.5
    await page.reload();
    await page.waitForFunction(() => window._lungfulState?.samplesReady === true, { timeout: 10000 });
    const params = await page.evaluate(() => window._lungfulState.presetParams('box'));
    expect(params.pace).toBe(4.5);
  });

  test('timer duration is saved and restored on reload', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('timer-checkbox').check();
    await page.getByTestId('timer-inc').click(); // 5 → 6
    await page.reload();
    await page.waitForFunction(() => window._lungfulState?.samplesReady === true, { timeout: 10000 });
    const val = await page.getByTestId('timer-val').textContent();
    expect(val).toBe('6');
  });

  test('timer enabled state is saved and restored on reload', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('timer-checkbox').check();
    await page.reload();
    await page.waitForFunction(() => window._lungfulState?.samplesReady === true, { timeout: 10000 });
    const checked = await page.getByTestId('timer-checkbox').isChecked();
    expect(checked).toBe(true);
  });

});
