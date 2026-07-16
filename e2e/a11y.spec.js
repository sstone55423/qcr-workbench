import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Accessibility smoke checks with axe-core. We gate on 'serious' and 'critical'
// violations only — the two impact levels that block real assistive-tech use —
// so cosmetic best-practice noise doesn't make the suite flaky.
const BLOCKING = ['serious', 'critical'];

async function blockingViolations(page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  return violations
    .filter((v) => BLOCKING.includes(v.impact))
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`);
}

test('lock screen has no serious/critical a11y violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('e.g. ABC Company Analysis')).toBeVisible();
  expect(await blockingViolations(page)).toEqual([]);
});

test('authenticated home has no serious/critical a11y violations', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('e.g. ABC Company Analysis').fill('A11y Store');
  await page.getByPlaceholder('Passphrase', { exact: true }).fill('correct horse battery');
  await page.getByPlaceholder('Repeat passphrase').fill('correct horse battery');
  await page.getByRole('button', { name: 'Create store' }).click();
  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(page.getByRole('button', { name: 'New project' })).toBeVisible();
  expect(await blockingViolations(page)).toEqual([]);
});
