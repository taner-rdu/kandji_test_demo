# kandji_test_demo

My Kandji QA take-home. Playwright and TypeScript, page objects, runs in Docker, with a GitHub Actions workflow.

## Scope

I treated this as a framework exercise rather than a coverage exercise, so most of the effort went into structure. The calls below are all deliberate, and I've said what I'd do differently on a real project.

**Two tests, both tagged `@smoke`.** The happy-path login flow, and one negative MFA case. I'd rather hand in a small suite on solid foundations (page objects, config handling, Docker, CI) than a longer list of tests with nothing under them.

**Chromium only.** `playwright.config.ts` defines one project. Firefox and WebKit are a few lines each if you want them.

**No `storageState`.** Playwright can save a logged-in session so other tests skip the login screen entirely. Both of my tests are about logging in, so neither could use it anyway, since a login test has to start logged out. The moment there's a test that starts past the login screen it's worth adding.

**CI runs when I trigger it.** The workflow does typecheck and lint, then the smoke tests in Docker. On a real project it would run on every pull request, which is one line in the workflow file.

**Serial in CI.** Locally the tests run in parallel, but CI pins `workers: 1`. There's a single shared Kandji login. Two tests signing in at once is fine. Twenty wouldn't be. The proper fix is a pool of test accounts, one per worker. Past that you'd shard with `--shard` across parallel jobs and merge the blob reports with `merge-reports`. Neither is worth it for two tests.

### What the tests check

`full login and logout flow`

- Email, password, and a TOTP code generated on the spot
- Lands on Devices
- Sidebar nav renders: Devices, Blueprints, Library, Users, Detections, Vulnerabilities
- Logout puts you back on the login form

`reject an invalid MFA code`

- A bad code is rejected and the error shows

Left out on purpose:

- Bad username/password error states
- Any assertion about real device data
- Clicking into Blueprints, Users and the rest. I only check that the nav links render
- Accessibility
- Session persistence across reloads
- Other MFA failure modes, like expired codes or a locked account

All of it belongs in a smoke suite. I left it out for time.

## Setup

```bash
git clone <repo-url>
cd kandji_test_demo
npm ci
npx playwright install --with-deps chromium
```

Then copy the env file and fill it in (details below):

```bash
cp .env.example .env
```

## Running

I run these straight from the IDE day to day. It's quicker, and UI mode, debugging and traces all just work. Docker is there so CI gets the same environment every time.

```bash
npm test              # headless run
npm run test:headed   # headed, watch the browser
npm run test:ui       # Playwright UI mode
npm run report        # open the last HTML report
npm run typecheck     # tsc --noEmit; Playwright transpiles without typechecking
npm run lint          # eslint, incl. missing-await detection
```

The same thing in Docker, which is what CI does:

```bash
docker build -t kandji-test-demo .
docker run --rm --env-file .env kandji-test-demo npx playwright test --grep @smoke
```

The image is built on `mcr.microsoft.com/playwright:v1.62.1-jammy`, which already ships the matching browser binaries, so there's no `playwright install` step inside the container.

## Environment variables

| Variable | Description |
|---|---|
| `KANDJI_URL` | Base URL of the tenant under test |
| `USER_EMAIL` | Login email |
| `USER_PASSWORD` | Login password |
| `KANDJI_TOTP_SECRET` | TOTP seed, used to generate MFA codes at login (via `otplib`) |

All four are required and read through one place, `config/env.ts`, so a missing one fails immediately with a clear message instead of something confusing further along.

`.env` is git-ignored and never committed. CI reads the same four values from GitHub Actions repository secrets and passes them into the container.

Repository secrets are fine for an exercise. On a real project I'd pull them from something like AWS Secrets Manager so local and CI share one source, rather than keeping the values in two places.

## MFA

Login needs a TOTP code, and those roll over every 30 seconds. That's where nearly all the flakiness came from.

The fix was to stop using codes that are about to expire. If the current one has less than five seconds left, the suite waits for the next window before typing anything. A code could be perfectly valid when generated and dead by the time the server checked it.

If a code still gets rejected, it tries once more, but only after the window rolls over. Sending the same digits again would just be refused, and Kandji won't take a code twice anyway.

One thing to watch: if your machine's clock is off by more than a few seconds, every code fails and retrying won't save you. Timezone doesn't matter, only whether the actual time is right. That's also the one part of this that can behave differently in Docker, since the VM's clock can drift after your laptop sleeps.

## Layout

```
config/     env.ts, the one place environment variables are read
pages/      Page objects: LoginPage, DevicesPage, Sidebar
tests/      Specs
utils/      totp.ts, MFA code generation
Dockerfile  Test image, browsers preinstalled
.github/workflows/kandji-smoke.yml
```
