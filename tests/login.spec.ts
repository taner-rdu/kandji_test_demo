import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DevicesPage } from '../pages/DevicesPage';
import { Sidebar } from '../pages/Sidebar';
import { env } from '../config/env';

test.describe('Kandji login', () => {
  test('full login and logout flow', { tag: '@smoke' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const devicesPage = new DevicesPage(page);
    const sidebar = new Sidebar(page);

    await page.goto('/');
    await loginPage.login(env.email, env.password, env.totpSecret);
    await devicesPage.expectLoaded({ timeout: 10_000 });
    await sidebar.expectNavLinksVisible();
    await sidebar.logout();
    await loginPage.expectLoginFormVisible();
  });

  test('reject an invalid MFA code', { tag: '@smoke' }, async ({ page }) => {
    const loginPage = new LoginPage(page);

    await page.goto('/');
    await loginPage.enterEmail(env.email);
    await loginPage.enterPassword(env.password);
    await loginPage.submitCredentials();
    await loginPage.submitCodeOnce('000000');

    await expect(loginPage.invalidCodeError).toBeVisible();
  });
});
