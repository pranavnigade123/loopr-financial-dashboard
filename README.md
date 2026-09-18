# Penta — Loopr financial analytics

A TypeScript financial dashboard built for the Loopr assignment. One npm-workspaces repository contains a React frontend, Fastify REST API, and shared contracts. Production serves the frontend and API from one Azure App Service origin; MongoDB Atlas stores data.

## Current status

The local application includes login/logout, revocable JWT sessions, repeatable sample-data seeding, financial charts and metrics, server-side filtering/search/sorting/pagination, and configurable CSV downloads. Styling uses Tailwind CSS and follows the supplied dark dashboard reference. GitHub publication and Azure deployment are intentionally deferred until the local implementation is reviewed; infrastructure files are not evidence of a completed deployment.

## Run locally

Requirements: Node.js 22.13+ and MongoDB (local or Atlas). Use a dedicated `loopr` database and a database user restricted to it.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` at the repository root.
3. Set `MONGODB_URI` with an explicit `/loopr` database name, a random `JWT_SECRET` of at least 32 characters, and `DEMO_PASSWORD` of at least 12 characters. Never commit this file.
4. Run `npm run seed`. The command validates the entire source file, upserts records by source ID, creates indexes, and creates the demo analyst if absent. It does not delete unrelated records or reset an existing password.
5. Run `npm run dev`, then open `http://localhost:5173`.
6. Sign in using `DEMO_EMAIL` and the password configured in step 3.

For Atlas, allow your current IP in Network Access and use the database user's credentials, not your Atlas account password. Percent-encode reserved characters in the username/password. Keep the URI quoted in `.env`.

## Commands

| Command                    | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `npm run dev`              | Watch shared contracts, API, and frontend          |
| `npm run seed`             | Validate and seed the supplied dataset             |
| `npm run check`            | Lint, type-check, unit tests, production build     |
| `npm run test:integration` | Authentication and pagination against real MongoDB |
| `npm run format:check`     | Verify formatting                                  |
| `npm run build`            | Compile all workspaces                             |
| `npm start`                | Serve compiled frontend and API on `PORT`          |

Integration tests use `MONGODB_TEST_URI` (default `mongodb://127.0.0.1:27018`). They create a randomly named `loopr_test_*` database and remove only that database afterward. Use a local test MongoDB, never production. `docker compose -f compose.test.yml up -d` starts one on port 27018.

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
docs              Decisions, API, delivery plan, deployment guide
```

See [decisions](docs/decisions.md), [API usage](docs/api.md), [delivery plan](docs/plan.md), and [deployment](docs/deployment.md).

## Data and design assumptions

The sample contains 300 transactions from 2024, four user IDs, Revenue/Expense categories, and Paid/Pending statuses. Monetary amounts are stored as integer minor units. USD is a display assumption based on the supplied Figma; the source has no currency field. Dates use UTC consistently. All demo analysts can read the supplied company dataset. Transaction user IDs are not authentication accounts.

The supplied Penta dashboard is the visual reference. Login and missing interaction states are designed as extensions. No actual balance, savings, person names, or spending subcategories are inferred from data that does not contain them.
