import { type Page, type Locator, expect } from '@playwright/test';
import { generateTotpCode } from '../utils/helpers';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly continueButton: Locator;
  readonly totpInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.continueButton = page.getByRole('button', { name: 'Continue', exact: true });
    this.totpInput = page.getByRole('textbox', { name: /one-time code/i });
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 20_000 });
    await this.emailInput.fill(email);
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
    await this.continueButton.click();
  }

  async submitMfaCode(secret?: string): Promise<void> {
    const code = generateTotpCode(secret);
    await this.totpInput.fill(code);
    await this.continueButton.click();
  }

  async login(email: string, password: string, totpSecret?: string): Promise<void> {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.submitMfaCode(totpSecret);
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
  }
}
