import { type Page, type Locator, expect } from '@playwright/test';

export class DevicesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly announcementDismissButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Devices', exact: true });
    this.announcementDismissButton = page.getByRole('button', { name: 'Got it!' });
  }

  async expectLoaded(options?: { timeout?: number }): Promise<void> {
    await expect(this.page).toHaveURL(/\/devices/i, options);

    const deadline = Date.now() + (options?.timeout ?? 5_000);
    while (Date.now() < deadline) {
      if (await this.announcementDismissButton.isVisible().catch(() => false)) {
        await this.announcementDismissButton.click().catch(() => {});
      }
      if (await this.heading.isVisible().catch(() => false)) {
        return;
      }
      await this.page.waitForTimeout(250);
    }

    await expect(this.heading).toBeVisible(options);
  }
}
