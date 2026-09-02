/**
 * Every value the suite needs from the environment, read lazily so that a
 * missing variable fails with a clear message at the point of use rather than
 * as a confusing downstream error (an empty baseURL, a blank login field).
 */

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get baseUrl() {
    return requiredEnv('KANDJI_URL');
  },
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
