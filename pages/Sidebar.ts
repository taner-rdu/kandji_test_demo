import { type Page, type Locator, expect } from '@playwright/test';

export class Sidebar {
  readonly page: Page;
  readonly userMenuTrigger: Locator;
  readonly logoutButton: Locator;
  readonly confirmLogoutButton: Locator;
  readonly devicesLink: Locator;
  readonly blueprintsLink: Locator;
  readonly libraryLink: Locator;
  readonly usersLink: Locator;
  readonly detectionsLink: Locator;
  readonly vulnerabilitiesLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userMenuTrigger = page.getByTestId('sidebar-user-name');
    this.logoutButton = page.getByTestId('log-out-button');
    this.confirmLogoutButton = page.getByRole('button', { name: 'Log out', exact: true });
    this.devicesLink = page.getByTestId('sidebar-devices');
    this.blueprintsLink = page.getByTestId('sidebar-blueprints');
    this.libraryLink = page.getByTestId('sidebar-library');
    this.usersLink = page.getByTestId('sidebar-users');
    this.detectionsLink = page.getByTestId('sidebar-detections');
    this.vulnerabilitiesLink = page.getByTestId('sidebar-vulnerabilities');
  }

  async logout(): Promise<void> {
    await this.userMenuTrigger.click();
    await this.logoutButton.click();
    await this.confirmLogoutButton.click();
  }

  async expectNavLinksVisible(): Promise<void> {
    await expect(this.devicesLink).toBeVisible();
    await expect(this.blueprintsLink).toBeVisible();
    await expect(this.libraryLink).toBeVisible();
    await expect(this.usersLink).toBeVisible();
    await expect(this.detectionsLink).toBeVisible();
    await expect(this.vulnerabilitiesLink).toBeVisible();
  }
}
