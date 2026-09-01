import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DevicesPage } from '../pages/DevicesPage';
import { Sidebar } from '../pages/Sidebar';
import { env } from '../utils/helpers';

test.describe('Kandji login', () => {
  test('full login and logout flow @smoke', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const devicesPage = new DevicesPage(page);
    const sidebar = new Sidebar(page);

    await page.goto('/');
    await loginPage.login(env.email, env.password, env.totpSecret);
    await devicesPage.expectLoaded();
    await sidebar.expectNavLinksVisible();

    await sidebar.logout();
    await loginPage.expectLoginFormVisible();
  });
});
