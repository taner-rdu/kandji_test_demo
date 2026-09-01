import { type Page, type Locator, expect } from '@playwright/test';

export class DevicesPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Devices', exact: true });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/devices/i);
    await expect(this.heading).toBeVisible();
  }
}
