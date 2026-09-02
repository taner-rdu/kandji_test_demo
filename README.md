# kandji_test_demo

I treated this as a framework exercise rather than a coverage exercise, so most of the effort went into structure. The calls below are all deliberate, and I've listed what I'd do differently on a real project.

**Two tests, both tagged `@smoke`.** The happy-path login flow, and one negative MFA case.

**Chromium only.** `playwright.config.ts` defines one project. Firefox and WebKit are a few lines each if you want them.

**No `storageState`.** Playwright can save a logged-in session so other tests skip the login screen entirely. Both of my tests are about logging in, so neither could use it anyway, since a login test has to start logged out. The moment there's a test that starts past the login screen it's worth adding.

**CI runs when I trigger it.** The workflow does typecheck, lint, then the smoke tests in Docker, and publishes an Allure report to GitHub Pages. On a real project it would run on every pull request, which is one line in the workflow file.

**Serial in CI.** CI runs one test at a time. I didn't bother splitting the work up for two tests, but it's easy to update: mark anything order-dependent with test.describe.serial and let the rest spread across workers. If the suite gets big enough to outgrow one machine, --shard breaks it across parallel CI jobs and merge-reports stitches the reports back together.

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

I run the tests from the IDE day to day. It's quicker and debugging is easier. Docker is there so CI gets the same environment every time.

From cli:
```bash
npx playwright test --grep @smoke
```

From docker:
```bash
docker build -t kandji-test-demo .
docker run --rm --ipc=host --env-file .env kandji-test-demo npx playwright test --grep @smoke
```

The image is built on `mcr.microsoft.com/playwright:v1.62.1-jammy`, which already ships the matching browser binaries, so there's no `playwright install` step inside the container.

## Reports

Every run writes two reports. Playwright's own HTML report (`playwright-report/`, `npm run report`) is what I use while debugging locally, since it has the traces attached. Allure is the one meant to be read by other people.

Allure works in two steps: the run drops raw JSON into `allure-results/`, then the CLI turns that into a static site.

```bash
npx playwright test --grep @smoke
npm run allure:generate   # allure-results/ -> allure-report/
npm run allure:open       # serves allure-report/
```

`npm run allure:serve` does both in one go against a temp directory, which is usually what you want locally.

The CLI is Java-based, so generating a report needs a JDK on the machine. Running the tests doesn't.

In CI the container writes `allure-results/` to a mounted volume, the runner generates the report and publishes it to GitHub Pages, so the latest run is a URL rather than a zip someone has to download and unpack. The raw results and both report directories are also kept as build artifacts for 14 days.

Pages needs to be enabled once on the repo, under Settings → Pages → Source: GitHub Actions. Note the report is public if the repo is, so it shouldn't carry anything sensitive: it holds test names, timings, and failure screenshots.

I left the Allure history/trend feature out. It needs the previous run's `history/` folder copied back into `allure-results/` before generating, usually by pulling it off the `gh-pages` branch, and with a manually triggered workflow there isn't a meaningful trend to plot yet.

## Environment variables

| Variable | Description |
|---|---|
| `KANDJI_URL` | Base URL of the tenant under test |
| `USER_EMAIL` | Login email |
| `USER_PASSWORD` | Login password |
| `KANDJI_TOTP_SECRET` | TOTP seed, used to generate MFA codes at login (via `otplib`) |

All four are required and read through one place, `config/env.ts`, so a missing one fails immediately with a clear message instead of something confusing further along.

`.env` is git-ignored and never committed. CI reads the same four values from GitHub Actions repository secrets and passes them into the container.

On a real project I'd pull them from something like AWS Secrets Manager so local and CI share one source, rather than keeping the values in two places.

## MFA

Login needs a TOTP code, and those roll over every 30 seconds. That's where nearly all the flakiness came from.

The fix is to stop using codes that are about to expire. If the current one has less than five seconds left, the suite waits for the next window before typing anything. A code could be perfectly valid when generated and dead by the time the server checked it.

If a code still gets rejected, it tries once more, but only after the window rolls over. Sending the same digits again would most likely be refused.

## Layout

```
config/     env.ts, the one place environment variables are read
pages/      Page objects: LoginPage, DevicesPage, Sidebar
tests/      Specs
utils/      totp.ts, MFA code generation
Dockerfile  Test image, browsers preinstalled
.github/workflows/kandji-smoke.yml
```
