# G5 Production Migration Readiness

This layer does not activate a VPS. It prepares a controlled migration from Google Sheets to the preserved Batch F PostgreSQL/FastAPI runtime.

## Required sequence
1. Freeze a test data export.
2. Export Transport Requests, Transporter Applications, Quotes, Lead Settings, Test Wallets, Lead Unlocks, Quote Decisions, Appointments and Tester Feedback.
3. Validate references, emails, statuses, duplicate keys and balances.
4. Import into PostgreSQL staging using idempotent external references.
5. Reconcile counts and wallet balances.
6. Run security, PayFast sandbox, backup/restore and operational acceptance tests.
7. Cut over only after signed approval.
