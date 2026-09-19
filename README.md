# Penta — Loopr financial analytics

A financial dashboard for exploring company transactions, comparing revenue and expenses, and exporting reports. Built with React, Tailwind CSS, Fastify, TypeScript, and MongoDB Atlas in one npm-workspaces repository.

## Features

- JWT login/logout and account registration, with HttpOnly cookies and revocable sessions.
- Financial summaries and interactive revenue, expense, cash-flow, and settlement charts.
- Transaction search, combined filters, stable sorting, and pagination with URL-based state.
- Server-generated CSV downloads with selectable columns and a preview. Exports include all matching records.
- Responsive pages, keyboard-accessible dialogs, and loading, empty, and recoverable error states.

## Live demo

The application is deployed to Azure App Service at [loopr-pranav-dashboard](https://loopr-pranav-dashboard-h6gaexeve8e4bqhb.southindia-01.azurewebsites.net). The deployment uses an Azure for Students subscription and is intended for assignment review, so it will remain online for a limited evaluation period. The local setup below remains available after the hosted demo is decommissioned.

## Run locally

### Demo login

| Field    | Value                 |
| -------- | --------------------- |
| Email    | `analyst@loopr.local` |
| Password | `TestPassword123!`    |

This intentionally public demo account has access to the shared sample transactions. For a fresh local database, set `DEMO_EMAIL` and `DEMO_PASSWORD` to these values before seeding, or choose your own credentials.

### Setup

Requirements: Node.js 22.13+ and MongoDB (local or Atlas). Use a dedicated `loopr` database and a database user restricted to it.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` at the repository root.
3. Set `MONGODB_URI` with an explicit database name such as `/loopr`, a random `JWT_SECRET` of at least 32 characters, and `DEMO_EMAIL` / `DEMO_PASSWORD` using the demo details above or your own values. Keep `PORT=3000` and `APP_ORIGIN=http://localhost:5173` for local development. Never commit `.env`.
4. Run `npm run seed`. The command validates the entire source file, upserts records by source ID, creates indexes, and creates the demo analyst if absent. It does not delete unrelated records or reset an existing password.
5. Run `npm run dev`, then open `http://localhost:5173`.
6. Sign in using `DEMO_EMAIL` and the password configured in step 3.

For Atlas, allow your current IP in Network Access and use the database user's credentials, not your Atlas account password. Percent-encode reserved characters in the username/password. Keep the URI quoted in `.env`.

If the demo account already exists, changing `.env` alone does not change its password. Run `npm run reset:demo-password` explicitly to apply `DEMO_PASSWORD` to that account and revoke its existing sessions.

## Suggested review flow

1. Sign in and inspect the dashboard summaries, trend chart, and recent transactions.
2. Open Transactions, combine Revenue and Paid filters, then search, sort, and change pages. Refresh or use Back to check that the URL preserves the selected view.
3. Export selected columns to CSV. The download includes all matching records, including those outside the current page.
4. Open Analytics for additional charts, then check navigation at mobile width.
5. Sign out, or create an account to try registration.

## Environment configuration

| Setting              | Local development                             | Azure production                                          |
| -------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Configuration source | Root `.env`                                   | App Service environment variables                         |
| `NODE_ENV`           | `development`                                 | `production`                                              |
| `APP_ORIGIN`         | `http://localhost:5173`                       | Exact HTTPS origin shown in the App Service overview      |
| `PORT`               | `3000` (Vite proxy follows this value)        | Provided by the hosting runtime                           |
| `MONGODB_URI`        | Local MongoDB or a development Atlas database | Atlas connection string for the deployed sample workspace |
| `JWT_SECRET`         | Local random secret                           | Separate production secret of at least 32 characters      |

Production and test processes do not load the local `.env`. The browser uses relative `/api` URLs in both environments; production serves the compiled frontend and API together. Production requires HTTPS and enables Secure session cookies. Demo account settings are used only by seeding/password-reset commands and are not needed to start the deployed server.

Production starts with `node apps/api/dist/server.js` after the workflow builds the workspaces, creates a minimal release artifact, and installs production dependencies.

## Deployment and CI/CD

The frontend and API are deployed together to one Linux Azure App Service. Fastify serves the compiled React application and exposes the REST API under `/api`; MongoDB Atlas provides persistence. Keeping both layers on one origin simplifies secure cookie authentication and gives each commit one synchronized release.

The [GitHub Actions workflow](.github/workflows/main_loopr-pranav-dashboard.yml) runs on pull requests and pushes to `main`:

1. Install dependencies and run formatting, linting, type checks, unit tests, MongoDB integration tests, and Chromium browser tests.
2. Build all npm workspaces and assemble a minimal production artifact.
3. Authenticate to Azure through OpenID Connect, deploy to App Service, and verify the database-readiness endpoint.

Production secrets stay in Azure App Service settings and are never included in the repository or deployment artifact. Azure supplies `PORT`; the application binds to `0.0.0.0`. Atlas network access is configured separately. The deployed health endpoints are `/api/health/live` for process health and `/api/health/ready` for database readiness.

## Verification and commands

Verification includes 15 unit tests, 13 MongoDB integration tests, and 9 Chromium browser tests. The [quality and deployment workflow](.github/workflows/main_loopr-pranav-dashboard.yml) runs these alongside formatting, linting, type-checking, and the production build.

| Command                       | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `npm run dev`                 | Watch shared contracts, API, and frontend                      |
| `npm run seed`                | Validate and seed the supplied dataset                         |
| `npm run check`               | Lint, type-check, unit tests, production build                 |
| `npm run test:integration`    | Authentication and pagination against real MongoDB             |
| `npm run test:browser`        | Chromium tests against an isolated local database              |
| `npm run reset:demo-password` | Update the existing demo account from local environment values |
| `npm run format:check`        | Verify formatting                                              |
| `npm run build`               | Compile all workspaces                                         |
| `npm start`                   | Serve compiled frontend and API on `PORT`                      |

Integration tests use `MONGODB_TEST_URI` (default `mongodb://127.0.0.1:27018`). They create a randomly named `loopr_test_*` database and remove only that database afterward. Use a local test MongoDB, never production. `docker compose -f compose.test.yml up -d` starts one on port 27018.

For browser tests, start that local MongoDB, run `npx playwright install chromium`, then `npm run build` and `npm run test:browser`. The fixture serves the compiled application on port 3003 with a separate random database and never reads `.env`. Tests cover registration, login/logout, navigation/history, filters, CSV contents, failed requests, session expiry, and mobile keyboard navigation. CI runs these checks and retains failure traces for seven days.

For a local production-build preview, set `APP_ORIGIN=http://localhost:3000`, run `npm run build`, then `npm start`. Keep `NODE_ENV=development` for HTTP localhost; production requires HTTPS and secure cookies.

## Structure

```text
apps/web          React, Vite, Tailwind CSS, self-hosted DM Sans
apps/api          Fastify, MongoDB driver, authentication and REST endpoints
packages/contracts Shared Zod validation and API types
data              Original assignment dataset
postman           Collection and environment template
tests             Unit, real-database integration, and browser checks
docs              Architecture and engineering decisions, API reference
```

See [architecture and engineering decisions](docs/architecture.md) and [API usage](docs/api.md).

## Design decisions and maintainability

| Decision                                                       | Reason                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| One repository with separate web, API, and contracts packages  | Keeps frontend and backend changes together while making responsibilities clear.              |
| Shared Zod schemas and one server filter builder               | Avoids duplicated validation rules and keeps table, chart, and CSV filters consistent.        |
| Feature folders and separate page components                   | Keeps each screen understandable without putting the entire dashboard in one component.       |
| Reusable controls, table components, and Tailwind style tokens | Keeps common interactions and visual styles consistent across pages.                          |
| Integer cents and explicit Paid/Pending calculations           | Avoids floating-point arithmetic for monetary totals and makes financial assumptions visible. |
| URL-based filters and a centralized request helper             | Supports refresh and browser history while keeping timeout and error handling consistent.     |
| Tests for calculations, API behavior, and browser flows        | Provides regression coverage for exports, authentication, filters, and failure recovery.      |

TypeScript checks module boundaries; linting and formatting keep conventions consistent. The backend uses the native MongoDB driver and direct query functions, with offset pagination suited to the 300-record dataset. More complex infrastructure is deferred until the application's needs justify it.

## API collection

Import [the Postman collection](postman/collection.json) and [environment template](postman/environment.json). Enter the demo password locally, select the environment, and run the collection in order. The 15 requests cover health, authentication, filters, analytics, exports, validation errors, and logout. See [API usage](docs/api.md#postman) for setup details.

The environment template targets the local API at `http://localhost:3000/api`; port 5173 serves the development frontend. The separate [registration collection](postman/registration.json) covers account creation, duplicate rejection, login, and logout. It creates a persistent test account on each run, so use a development database for registration runs.

## Assumptions and limitations

The sample contains 300 transactions from 2024, four user IDs, Revenue/Expense categories, and Paid/Pending statuses. Monetary amounts are stored as integer minor units. USD is a display assumption based on the supplied Figma; the source has no currency field. Dates use UTC consistently. All demo analysts can read the supplied company dataset. Transaction user IDs are not authentication accounts.

The supplied Penta dashboard is the visual reference. Login and missing interaction states are designed as extensions. No actual balance, savings, person names, or spending subcategories are inferred from data that does not contain them.

Realized revenue and expenses include Paid transactions; pending incoming and outgoing amounts are reported separately. Transactions are seeded into MongoDB; file uploads and transaction editing are not implemented. Registration gives access to the shared sample workspace, without email verification or password recovery.

Wallet summarizes cash flow. Personal and Settings display account information and reporting defaults. Messages contains system notices. These pages do not implement bank connections, account editing, or person-to-person messaging.
