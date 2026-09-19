import { test, expect, type BrowserContext } from '@playwright/test';
import { readFile } from 'node:fs/promises';

let cookies: Awaited<ReturnType<BrowserContext['cookies']>>;
test.beforeAll(async ({ request }) => {
  const login = await request.post('/api/auth/login', {
    headers: { 'X-Requested-With': 'loopr' },
    data: { email: 'browser@example.com', password: 'Browser-test-only-2026' },
  });
  expect(login.status()).toBe(200);
  cookies = (await request.storageState()).cookies;
});
test.beforeEach(async ({ context }) => {
  await context.addCookies(cookies);
});

test('navigation, refresh, unknown routes and browser history', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Net cash flow', { exact: true })).toBeVisible();
  for (const [label, path] of [
    ['Transactions', 'transactions'],
    ['Wallet', 'wallet'],
    ['Analytics', 'analytics'],
    ['Personal', 'personal'],
    ['Message', 'messages'],
    ['Setting', 'settings'],
  ]) {
    await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${path}\\?`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(label!);
  }
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Setting');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Message');
  await page.goto('/does-not-exist');
  await expect(page.getByText('Page unavailable')).toBeVisible();
  await page.getByRole('link', { name: 'Back to dashboard' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard');
});

test('filters, pagination cache, sorting and CSV contents agree', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/analytics')) analyticsRequests.push(request.url());
  });
  await page.goto('/transactions?category=Revenue&status=Paid&pageSize=10');
  await expect(page.getByText('81 matching records')).toBeVisible();
  const requestsBefore = analyticsRequests.length;
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('Page 2 of 9')).toBeVisible();
  expect(analyticsRequests).toHaveLength(requestsBefore);
  await page.getByRole('button', { name: 'Amount', exact: true }).click();
  await expect(page.getByRole('columnheader', { name: 'Amount' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  const download = await downloadEvent;
  const csv = await readFile((await download.path())!, 'utf8');
  const lines = csv
    .replace(/^\uFEFF/, '')
    .trim()
    .split('\r\n');
  expect(lines).toHaveLength(82);
  expect(lines[0]).toContain('Transaction ID');
  expect(lines.slice(1).every((line) => line.includes(',Revenue,Paid,'))).toBe(true);
});

test('search follows Back and invalid ranges cannot export', async ({ page }) => {
  await page.goto('/transactions');
  await page.locator('#global-search').fill('user_002');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/search=user_002/);
  await page.goBack();
  await expect(page.locator('#global-search')).toHaveValue('');
  await page.goto('/transactions?amountMin=500&amountMax=100');
  await page.getByRole('button', { name: /^Filters/ }).click();
  await expect(page.locator('#maximum-error')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
});

test('API failure is recoverable and shows a support reference', async ({ page }) => {
  await page.route('**/api/transactions?*', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { message: 'Service temporarily unavailable.', requestId: 'test-support-id' },
      }),
    }),
  );
  await page.goto('/transactions');
  await expect(page.getByRole('alert')).toContainText('test-support-id');
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  await page.unroute('**/api/transactions?*');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('300 matching records')).toBeVisible();
});

test('an obsolete search response cannot replace the current results', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let arrived!: () => void;
  const started = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  await page.route('**/api/transactions?*', async (route) => {
    if (new URL(route.request().url()).searchParams.get('search') !== 'user_001') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    arrived();
    await held;
    await route.fulfill({ response });
  });
  await page.goto('/transactions');
  await expect(page.getByText('300 matching records')).toBeVisible();
  await page.locator('#global-search').fill('user_001');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await started;
  await page.locator('#global-search').fill('user_002');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  release();
  await expect(page).toHaveURL(/search=user_002/);
  await expect(page.getByRole('table')).toContainText('User 002');
  await expect(page.getByRole('table')).not.toContainText('User 001');
});

test('export expiry returns to login and preserves destination', async ({ page }) => {
  await page.goto('/transactions?category=Revenue');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  await page.route('**/api/exports', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );
  await page.getByRole('button', { name: 'Download CSV' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to your workspace' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('session has expired');
  await expect(page).toHaveURL(/transactions\?category=Revenue/);
});

test('network failures and throttling give actionable recovery guidance', async ({ page }) => {
  await page.route('**/api/transactions?*', (route) => route.abort('failed'));
  await page.goto('/transactions');
  await expect(page.getByRole('alert')).toContainText('Check your connection');
  await page.unroute('**/api/transactions?*');
  await page.route('**/api/transactions?*', (route) =>
    route.fulfill({
      status: 429,
      headers: { 'Retry-After': '30' },
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'Too many requests.' } }),
    }),
  );
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Retry in 30 seconds');
});

test('mobile navigation traps focus and restores it on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  const opener = page.getByRole('button', { name: 'Open navigation' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Workspace navigation' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Sign out' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAttribute('aria-expanded', 'false');
});

test('registration confirmation, successful signup, login and logout', async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.getByLabel('Full name').fill('Browser New Analyst');
  await page.getByLabel('Email address').fill('signup-browser@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Browser-signup-only-2026');
  await page.getByLabel('Confirm password').fill('Not-the-same-password');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  await page.getByLabel('Confirm password').fill('Browser-signup-only-2026');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Account created');
  await page.getByLabel('Email address').fill('signup-browser@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Browser-signup-only-2026');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to your workspace' })).toBeVisible();
});
