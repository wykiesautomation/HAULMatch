# Batch F Production Finalisation

## Operational workflow
AWARDED -> ASSIGNED -> EN_ROUTE_COLLECTION -> ARRIVED_COLLECTION -> LOADED -> IN_TRANSIT -> ARRIVED_DELIVERY -> DELIVERED -> COMPLETED.

`DELAYED` is permitted from `IN_TRANSIT` and may return to `IN_TRANSIT` or advance to `ARRIVED_DELIVERY`.

## Assignment gates
A job cannot be assigned unless the vehicle and driver belong to the awarded transporter, are verified and available, all required expiry fields are current, and the vehicle payload is sufficient for the recorded load mass.

## Evidence and POD
Evidence is stored in the private upload volume and is never exposed as a static public route. The database stores original name, content type, storage name and SHA-256 hash. POD requires arrival at delivery. Customer confirmation requires a delivered job and POD.

## Production completion gates
- Generate and review Batch E and Batch F Alembic migrations.
- Run the complete test suite against PostgreSQL staging.
- Execute PayFast sandbox acceptance tests.
- Complete a full backup and restore drill.
- Confirm Cloudflare Full strict and origin certificate rotation process.
- Connect transactional email, SMS OTP, Turnstile and monitoring alerts.
- Complete legal, POPIA, insurance, accounting and transport marketplace reviews.
- Remove Google Sheets as the primary runtime only after PostgreSQL import reconciliation.
