# Batch E PayFast and Automated Marketplace

## PayFast sandbox first
Set in `.env.production`:

- `HAULMATCH_PAYFAST_MODE=sandbox`
- merchant ID
- merchant key
- passphrase

The public HTTPS ITN endpoint is `/api/payments/payfast/itn`. The browser return page never credits a wallet. Only a validated, COMPLETE, non-duplicate ITN credits the wallet.

## Required tests
1. Checkout fields and signature generated server-side.
2. Successful sandbox payment credits exactly once.
3. Duplicate ITN does not duplicate credits.
4. Invalid signature, merchant, reference, amount and incomplete status are rejected.
5. Wallet ledger before/after balances reconcile.
6. Approved transporter unlock debits credits.
7. Unlock does not reveal contact.
8. Awarded quote releases contact only to customer, awarded transporter and admin.
9. Dispute refund creates a new linked credit ledger entry. Original debit remains immutable.
10. Receipts match completed payment orders.

Do not switch to `production` until all tests pass and PayFast confirms the merchant account configuration.
