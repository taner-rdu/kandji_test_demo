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
    await expect(this.heading).toBeVisible(options);
  }

  /** Register before navigating: dismisses the announcement whenever it blocks an action. */
  async dismissAnnouncementsWhenShown(): Promise<void> {
    await this.page.addLocatorHandler(
      this.announcementDismissButton,
      async (button) => button.click(),
    );
  }
}
