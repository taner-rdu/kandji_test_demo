# kandji_test_demo

Kandji QA take-home exercise. TypeScript / Playwright test framework with a Page Object Model, Dockerized test execution, and a manually-triggered GitHub Actions workflow.

## Scope notes

This was scoped as a framework exercise, not a coverage exercise.

- Only one smoke test is included (login, devices page, logout), tagged `@smoke`. I focused on building an extendable, maintainable test framework (page objects, env/config handling, CI/Docker setup) rather than writing out a full test suite.
- Cross-browser testing is skipped. `playwright.config.ts` only defines a `chromium` project. Adding Firefox/WebKit projects would be straightforward given the current structure, just didn't do it here.
- CI runs on `workflow_dispatch` only, by design. The GitHub Actions workflow doesn't auto-trigger on PRs, pushes, or merges to any branch. It's meant to be run manually. Wiring up automatic triggers would just be a small addition to `.github/workflows/kandji-smoke.yml`.

## Project setup

```bash
git clone <repo-url>
cd kandji_test_demo
npm ci
npx playwright install --with-deps chromium
```

Copy the example env file and fill in real values (see Environment variables below):

```bash
cp .env.example .env
```

### Running the tests

Tests can run either directly from the IDE or inside Docker. I prefer running directly from the IDE for local development, it's faster to iterate, and Playwright UI mode, native debugging and traces just work. Docker is there to guarantee a consistent, reproducible environment for CI.

Locally (IDE / host):

```bash
npm test              # headless run
npm run test:headed   # headed, watch the browser
npm run test:ui       # Playwright UI mode
npm run report        # open the last HTML report
```

In Docker (mirrors what CI runs):

```bash
docker build -t kandji-test-demo .
docker run --rm --env-file .env kandji-test-demo npx playwright test --grep @smoke
```

The Docker image is based on `mcr.microsoft.com/playwright:v1.62.1-jammy`, which already has matching browser binaries installed, so there's no separate `playwright install` step needed inside the container.

## Environment variables

Defined in `.env` locally (see `.env.example`):

| Variable | Description |
|---|---|
| `KANDJI_URL` | Base URL of the Kandji tenant under test |
| `USER_EMAIL` | Login email |
| `USER_PASSWORD` | Login password |
| `KANDJI_TOTP_SECRET` | TOTP seed used to generate MFA codes at login time (via `otplib`) |

`.env` is git-ignored and never committed.

### Credential handling in CI

CI (`.github/workflows/kandji-smoke.yml`) sources these same values from GitHub Actions Repository Secrets and passes them into the Docker container as environment variables at run time.

Repository secrets were good enough for this exercise. For a real production use case, I'd move these credentials to a dedicated secrets manager (e.g. AWS Secrets Manager) that both local dev and CI can pull from at runtime, instead of keeping values duplicated between a local `.env` and GitHub Secrets.

## Project structure

```
pages/          Page Object Model classes (LoginPage, DevicesPage, Sidebar)
tests/          Test specs
utils/          Shared helpers (env loading, TOTP generation, etc.)
Dockerfile      Test runner image (Playwright + browsers preinstalled)
.github/workflows/kandji-smoke.yml   Manually-triggered CI workflow
```
