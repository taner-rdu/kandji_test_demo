import { authenticator } from 'otplib';

/**
 * TOTP is defined against the UTC epoch, so the local timezone is irrelevant --
 * only absolute clock accuracy matters. That is the one thing that genuinely
 * differs between a host run and a container run, so see measureClockSkewSeconds.
 */
export const TOTP_STEP_SECONDS = 30;

/**
 * Never submit a code with less than this much life left. Filling, clicking and
 * the server round-trip take a second or two; a code generated at the tail of a
 * window expires in flight and is rejected even though it was correct.
 */
export const MIN_VALIDITY_SECONDS = 5;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get email() {
    return requiredEnv('USER_EMAIL');
  },
  get password() {
    return requiredEnv('USER_PASSWORD');
  },
  get totpSecret() {
    return requiredEnv('KANDJI_TOTP_SECRET');
  },
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

/** Whole seconds left before the current TOTP window rolls over. */
export function totpTimeRemaining(): number {
  return authenticator.timeRemaining();
}

/**
 * How long to wait before generating, given the life left in the current window.
 * Pure so the boundary behaviour is testable without burning real seconds.
 * The +1 lands just inside the next window rather than exactly on the boundary.
 */
export function millisUntilUsableWindow(
  remainingSeconds: number,
  minValiditySeconds: number = MIN_VALIDITY_SECONDS,
): number {
  return remainingSeconds >= minValiditySeconds ? 0 : (remainingSeconds + 1) * 1000;
}

/** Index of the current 30s window. Two codes match if and only if this matches. */
export function currentTotpWindow(): number {
  return Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);
}

/**
 * Block until the current window has rolled over. Used between retries: a server
 * that has already consumed a code will reject the identical digits as a replay,
 * so a retry is only meaningful once the window has actually changed.
 */
export async function waitForNextTotpWindow(): Promise<void> {
  await sleep((totpTimeRemaining() + 1) * 1000);
}

/**
 * Generate a code that is guaranteed to have at least MIN_VALIDITY_SECONDS of
 * life left, waiting for the next window first if the current one is nearly up.
 */
export async function generateTotpCode(secret: string = env.totpSecret): Promise<string> {
  await sleep(millisUntilUsableWindow(totpTimeRemaining()));
  return authenticator.generate(secret);
}
