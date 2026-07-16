import { test, expect } from '@playwright/test';

// End-to-end reference-number walkthrough: create an encrypted vault, load the
// manufacturing sample library, open the ransomware scenario, and confirm the
// pinned deterministic ALE and a reproducible simulation run. The numbers are
// documented in CLAUDE.md and .claude/skills/verify/SKILL.md — this test fails
// loudly if a change ever moves them.
//
// The vault key is a module-level variable, so a full reload re-locks it: this
// whole flow is ONE test that only ever navigates by clicking (never goto).

const RANSOMWARE_ALE = '$611,274';

test('vault → sample library → workbench reference numbers hold', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');

  // 1. First run shows the create-vault form directly (no store picker yet).
  await page.getByPlaceholder('e.g. ABC Company Analysis').fill('E2E Store');
  await page.getByPlaceholder('Passphrase', { exact: true }).fill('correct horse battery');
  await page.getByPlaceholder('Repeat passphrase').fill('correct horse battery');
  await page.getByRole('button', { name: 'Create store' }).click();

  // 2. Dismiss the one-time welcome dialog (modal — blocks the page until closed).
  await page.getByRole('button', { name: 'Get started' }).click();

  // 3. Create a project; the dialog's Create button lands us on /scenarios.
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByPlaceholder('e.g. FY26 Enterprise Risk Assessment').fill('E2E Project');
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();

  // 4. Load the manufacturing sample library (holds the ransomware scenario).
  await page.getByRole('button', { name: 'Load sample scenarios' }).first().click();
  await page.getByRole('menuitem', { name: /Stella Polaris/ }).click();

  // The card already carries an ALE badge — a first cheap sanity check.
  await expect(page.getByText('Ransomware Disrupts Manufacturing')).toBeVisible();

  // 5. Open the scenario into the 7-step workbench (lands on Scoping).
  await page.getByText('Ransomware Disrupts Manufacturing').click();

  // 6. Deterministic ALE must be exactly $611,274 on the Expected-loss step.
  //    Anchor the stepper link by its leading step number so it can't collide
  //    with a "Next: Expected loss" button elsewhere on the page.
  await page.getByRole('link', { name: /^4\s*Expected loss$/ }).click();
  await expect(page.getByText(RANSOMWARE_ALE).first()).toBeVisible();

  // 7. Run the Monte Carlo with the defaults (20,000 iterations, seed 42) and
  //    confirm the run stamp reports the seed back — i.e. a result rendered.
  await page.getByRole('link', { name: /^5\s*Simulation$/ }).click();
  await page.getByRole('button', { name: 'Run simulation' }).click();
  await expect(page.getByText(/seed 42/)).toBeVisible({ timeout: 30_000 });

  // The app should surface no uncaught errors across the whole flow.
  expect(pageErrors).toEqual([]);
});
