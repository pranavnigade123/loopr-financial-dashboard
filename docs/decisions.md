# Engineering decisions

## Architecture

One repository, one frontend, one modular API, and one managed MongoDB database. Fastify provides routing, request injection for integration tests, structured logging, and security plugins. Zod validates external data and shared request contracts. The native MongoDB driver avoids a second overlapping schema abstraction. Business query logic will be shared across transactions, analytics, and CSV exports as those features arrive.

The frontend and API build independently but deploy together. Serving `/` and `/api/*` from one origin simplifies cookie authentication, avoids CORS configuration, and keeps releases synchronized. Separate deployments remain possible if independent scaling becomes necessary.

## Financial rules

- Store nonnegative amounts as integer cents (`amountMinor`); derive incoming/outgoing direction from Revenue/Expense.
- Display USD, explicitly an assumption because the sample does not identify currency.
- Default analytics period: the supplied 2024 dataset, not the current calendar month.
- Proposed realized metrics: Paid revenue, Paid expenses, and their difference (net cash flow). Pending transactions are reported separately. Pending values are not cash received or paid.
- Do not label net cash flow as an actual balance or savings balance. Neither opening balances nor savings account data are supplied.
- Preserve the source statuses Paid and Pending.
- Use UTC timestamps and UTC calendar boundaries. Future date-range filters will use an inclusive start and exclusive next-day end.

## Identity and sessions

The assignment does not specify registration, roles, or tenant isolation. A separately seeded analyst account can read all company sample transactions. Display the source user IDs as readable identifiers and use deterministic avatars; no invented identities.

Passwords use salted Node.js scrypt hashes. JWTs have a one-hour lifetime, fixed algorithm, issuer and audience, and are stored in an HttpOnly, SameSite=Strict cookie scoped to `/api` (Secure in production). A MongoDB session record allows immediate logout revocation; expiry is checked on every request independently of TTL cleanup. Browser writes require an exact allowed Origin and a custom header; non-browser clients must also send the custom header. No CORS policy is enabled.

The initial API uses process-local rate limiting, suitable for one application instance. Distributed deployments would need shared rate-limit state. Azure proxy behavior and client IP attribution must be verified before cloud deployment; blindly trusting arbitrary forwarded headers is intentionally avoided.

## Scope and tradeoffs

- Tailwind CSS v4 with named theme tokens; self-hosted fonts avoid third-party font requests.
- Offset pagination is appropriate for 300 records; use stable secondary sorting by unique source ID.
- Shared types do not replace runtime validation at untrusted boundaries.
- Seed upserts are repeatable but not a multi-document transaction. The full dataset is validated before any writes, and rerunning repairs an interrupted seed.
- No automatic database seeding at server startup.
- No payment execution, wallets, messages, signup, or user administration are implied by decorative Figma navigation.
- CSV exports will contain all matching records, not only the visible page. Column selection and filter semantics must be applied server-side.
