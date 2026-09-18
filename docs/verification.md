# Verification record

## Automated checks

- ESLint and strict TypeScript checks.
- Unit checks for all source records, independently verified totals, password hashing, decimal conversion, leap-day boundaries, invalid ranges, literal search, deterministic sort, column validation, and CSV formula/quoting/Unicode behavior.
- Real-MongoDB integration checks for protected routes, cross-origin writes, incorrect credentials, cookie flags, stable pagination, session expiry/revocation, aggregate totals, combined-filter agreement across table/analytics/export, and invalid requests.
- Postman collection executed with Newman against an isolated local test account: 14 requests, 23 assertions, zero failures. Newman was used only for verification; its dependencies are not required by the application.

## Browser checks

An isolated MongoDB fixture uses the same 300 supplied transactions and a disposable local analyst account. This keeps testing separate from the configured Atlas account and credentials.

Verified in the browser: successful login, dashboard rendering, Revenue + Paid filters yielding 81 records, matching financial totals, export scope across all pages, deselecting a column, reordering columns, and triggering the CSV download. Backend tests independently verify CSV contents and row count.

## Remaining before submission

- Final responsive and keyboard review after visual feedback.
- Add repeatable browser tests to CI when final UI flows settle.
- Azure infrastructure validation, runtime/proxy checks, and deployed smoke test.
- GitHub repository setup and real CI execution.
- Release recovery exercise and collection execution against the cloud URL.

These pending steps are not represented as completed or production-certified.
