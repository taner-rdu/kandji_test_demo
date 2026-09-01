import { authenticator } from 'otplib';

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

export function generateTotpCode(secret: string = env.totpSecret): string {
  return authenticator.generate(secret);
}
