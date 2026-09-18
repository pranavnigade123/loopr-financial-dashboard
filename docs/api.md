# REST API

Local API base URL: `http://localhost:3000/api`. Development frontend proxies `/api` to this server. All JSON responses are non-cacheable. Amounts use integer minor units. Production uses HTTPS.

| Method | Path            | Authentication | Purpose                                                |
| ------ | --------------- | -------------- | ------------------------------------------------------ |
| GET    | `/health/live`  | Public         | Process health                                         |
| GET    | `/health/ready` | Public         | Database connectivity; 503 if unavailable              |
| POST   | `/auth/login`   | Public         | Login with `email` and `password`; sets session cookie |
| GET    | `/auth/me`      | Session cookie | Current analyst identity                               |
| POST   | `/auth/logout`  | Session cookie | Revoke session and clear cookie; returns 204           |
| GET    | `/transactions` | Session cookie | Paginated transactions, newest first                   |

Send `X-Requested-With: loopr` for POST requests, and `Content-Type: application/json` when a JSON body is present. Logout has no body. The browser automatically supplies Origin; if present, it must match APP_ORIGIN. Postman uses its cookie jar for the JWT session; no token needs to be copied into a collection variable.

Login body:

```json
{ "email": "analyst@loopr.local", "password": "your-locally-configured-password" }
```

Transaction query parameters: `page` (default 1, range 1–10000), `pageSize` (default 20, range 1–100). Unsupported parameters return 400.

| Parameter                | Meaning                                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `search`                 | Literal, case-insensitive match on user ID, category and status; numeric input also matches exact ID or amount; ISO date matches that UTC day |
| `category`               | `Revenue` or `Expense`                                                                                                                        |
| `status`                 | `Paid` or `Pending`                                                                                                                           |
| `userId`                 | A source user ID such as `user_001`                                                                                                           |
| `dateFrom`, `dateTo`     | Inclusive UTC calendar dates in `YYYY-MM-DD` format                                                                                           |
| `amountMin`, `amountMax` | Inclusive nonnegative USD amounts, at most two decimal places                                                                                 |
| `sortBy`                 | `date` (default), `amountMinor`, `category`, `status`, `userId`, or `id`                                                                      |
| `sortOrder`              | `asc` or `desc` (default)                                                                                                                     |

All supplied filters are combined with AND. Search matches fields with OR. Sorting uses source ID as a stable tie-breaker. Inverted ranges return 400.

Additional protected endpoints:

| Method | Path                     | Purpose                                                                   |
| ------ | ------------------------ | ------------------------------------------------------------------------- |
| GET    | `/transactions/metadata` | Available source users and full dataset date range                        |
| GET    | `/analytics`             | Same filters as transactions; pagination and sorting do not affect totals |
| POST   | `/exports`               | CSV for all matching records with selected columns in the requested order |

Analytics returns `total`, `paidRevenueMinor`, `paidExpenseMinor`, `netCashFlowMinor`, `pendingCount`, `pendingRevenueMinor`, `pendingExpenseMinor`, and `monthly` points (`month`, `revenueMinor`, `expenseMinor`). Paid metrics always exclude Pending records, including when a Pending filter is selected; pending metrics remain available separately.

Export body:

```json
{
  "query": { "category": "Revenue", "status": "Paid", "sortBy": "date", "sortOrder": "desc" },
  "columns": ["date", "amount", "userId"]
}
```

Allowed columns: `id`, `date`, `amount`, `category`, `status`, `userId`. Select at least one unique column. CSV uses UTF-8 with BOM, CRLF row delimiters, headers, exact decimal amounts, and ISO UTC timestamps. Spreadsheet formula-like text is escaped. Exports ignore page/pageSize and reject more than 10,000 matching rows with 422 `EXPORT_TOO_LARGE`. This bound keeps synchronous exports predictable for the assignment's small dataset. Exports are limited to ten requests per minute per observed IP.

```json
{
  "items": [
    {
      "id": 1,
      "date": "2024-01-15T08:34:12.000Z",
      "amountMinor": 150000,
      "category": "Revenue",
      "status": "Paid",
      "userId": "user_001"
    }
  ],
  "total": 300,
  "page": 1,
  "pageSize": 20
}
```

Errors use `{ "error": { "code": "INVALID_REQUEST", "message": "...", "requestId": "..." } }`. Expected statuses: 400 invalid input, 401 absent/invalid/expired/revoked session, 403 rejected request origin/header, 429 rate limit, 500 internal failure. Login is limited to five attempts per minute per observed client IP. Repeated Postman runs may reach that limit.

## Postman

Import both files in `postman/`, select the local environment, and enter the demo password as a local secret value. Run the collection in order. It checks login, identity, paging, combined filters, analytics, search, configurable CSV, invalid requests, logout, and rejection after logout. Cookie persistence must be enabled. Do not export credentials when sharing the collection/environment. The collection was executed against an isolated local instance: 14 requests and 23 assertions passed. The runner is not a required application dependency; Postman's Collection Runner can execute the supplied files.
