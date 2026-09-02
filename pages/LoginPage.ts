import { type Page, type Locator, expect } from '@playwright/test';
import { currentTotpWindow, generateTotpCode, waitForNextTotpWindow } from '../utils/totp';

const MFA_RESULT_TIMEOUT = 10_000;

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly continueButton: Locator;
  readonly totpInput: Locator;
  readonly invalidCodeError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.continueButton = page.getByRole('button', { name: 'Continue', exact: true });
    this.totpInput = page.getByRole('textbox', { name: /one-time code/i });
    this.invalidCodeError = page.getByText('The code you entered is invalid');
  }

  async login(email: string, password: string, totpSecret?: string): Promise<void> {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.submitCredentials();
    await this.submitMfaCode(totpSecret);
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Set through the DOM rather than filled. Since Playwright 1.52 `fill()`
   * records its argument in the step title, which lands in the HTML report and
   * the trace: https://github.com/microsoft/playwright/issues/35848
   *
   * The native setter (not `input.value =`) is what makes React register the
   * change; it tracks the last value it wrote and ignores a plain assignment.
   */
  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.evaluate((input: HTMLInputElement, value: string) => {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (!descriptor?.set) throw new Error('No native value setter on HTMLInputElement.');
      descriptor.set.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, password);
  }

  /** Submits the credentials step, advancing to MFA. */
  async submitCredentials(): Promise<void> {
    await this.continueButton.click();
  }

  async submitMfaCode(secret?: string): Promise<void> {
    const first = await this.trySubmitCode(secret);
    if (first.accepted) return;

    // Only a new window yields different digits, and detecting the failure has
    // often rolled it over already.
    if (currentTotpWindow() === first.window) await waitForNextTotpWindow();

    const retry = await this.trySubmitCode(secret);
    if (retry.accepted) return;

    throw new Error('MFA failed after two codes.');
  }

  /** Submits a code as given: no generation, no retry. For negative tests. */
  async submitCodeOnce(code: string): Promise<void> {
    await this.totpInput.fill(code);
    await this.continueButton.click();
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
  }

  private async trySubmitCode(secret?: string): Promise<{ accepted: boolean; window: number }> {
    const code = await generateTotpCode(secret);
    const window = currentTotpWindow();
    await this.submitCodeOnce(code);

    // Acceptance is the MFA step going away.
    const accepted = await this.totpInput
      .waitFor({ state: 'detached', timeout: MFA_RESULT_TIMEOUT })
      .then(() => true)
      .catch(() => false);

    return { accepted, window };
  }
}
