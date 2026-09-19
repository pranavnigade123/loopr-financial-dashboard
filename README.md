# Penta — Loopr financial analytics

A financial dashboard for exploring company transactions, comparing revenue and expenses, and exporting reports. Built with React, Tailwind CSS, Fastify, TypeScript, and MongoDB Atlas in one npm-workspaces repository.

## Current status

Implemented: account registration, cookie-based authentication, transaction search and combined filters, stable sorting and pagination, financial charts, and CSV exports with selectable columns. New accounts access the shared sample workspace. Email verification and password recovery are not yet available. The responsive UI has separate Dashboard, Transactions, Wallet, Analytics, Personal, Messages, and Settings routes.

Wallet summarizes cash flow; it does not connect to a bank. Personal and Settings display account information and fixed reporting defaults. Messages contains system notices rather than person-to-person messaging. Azure deployment is pending; infrastructure and a manual release workflow are included.

## Run locally

Requirements: Node.js 22.13+ and MongoDB (local or Atlas). Use a dedicated `loopr` database and a database user restricted to it.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` at the repository root.
3. Set `MONGODB_URI` with an explicit `/loopr` database name, a random `JWT_SECRET` of at least 32 characters, and `DEMO_PASSWORD` of at least 12 characters. Never commit this file.
4. Run `npm run seed`. The command validates the entire source file, upserts records by source ID, creates indexes, and creates the demo analyst if absent. It does not delete unrelated records or reset an existing password.
5. Run `npm run dev`, then open `http://localhost:5173`.
6. Sign in using `DEMO_EMAIL` and the password configured in step 3.

For Atlas, allow your current IP in Network Access and use the database user's credentials, not your Atlas account password. Percent-encode reserved characters in the username/password. Keep the URI quoted in `.env`.

If the demo account already exists, changing `.env` alone does not change its password. Run `npm run reset:demo-password` explicitly to apply `DEMO_PASSWORD` to that account and revoke its existing sessions.

## Commands

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
tests             Unit and real-database integration checks
infra             Azure Bicep template
docs              Architecture, engineering decisions, API reference
```

See [architecture](docs/architecture.md), [decisions](docs/decisions.md), and [API usage](docs/api.md).

## API collection

Import [the Postman collection](postman/collection.json) and [environment template](postman/environment.json). Set the environment's `demoPassword` locally, select it, and run the collection in order. The 14 requests cover authentication, filters, analytics, exports, validation errors, and logout. See [API usage](docs/api.md#postman) for setup details.

## Data and design assumptions

The sample contains 300 transactions from 2024, four user IDs, Revenue/Expense categories, and Paid/Pending statuses. Monetary amounts are stored as integer minor units. USD is a display assumption based on the supplied Figma; the source has no currency field. Dates use UTC consistently. All demo analysts can read the supplied company dataset. Transaction user IDs are not authentication accounts.

The supplied Penta dashboard is the visual reference. Login and missing interaction states are designed as extensions. No actual balance, savings, person names, or spending subcategories are inferred from data that does not contain them.
