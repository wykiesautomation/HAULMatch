# G5 Acceptance Gates
- Source export hashes recorded
- No duplicate request, transporter, quote, unlock or appointment references
- Wallet totals reconcile to opening credits minus unlock debits
- Quote appointments have exactly one appointed quote per request
- Private customer fields are excluded from public lead views
- Staging import is repeatable without duplicates
- PostgreSQL backup and restore pass
- PayFast remains sandbox until signed acceptance
- DNS remains on GitHub Pages until production go-live sign-off
