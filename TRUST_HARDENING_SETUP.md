# Trust Hardening Setup

## Delivery providers
Development uses a console email/SMS provider and returns verification values only outside production. Before public launch, replace `ConsoleDeliveryProvider` with real transactional email and South African SMS providers.

## Required production controls
- Configure email sender and SMS provider credentials in deployment secrets.
- Add an edge CAPTCHA or bot challenge to registration and verification endpoints.
- Nginx and application throttles must both remain enabled.
- Generate and review the Alembic migration for the new trust tables and User fields.
- Connect malware scanning before accepting public evidence uploads.
- Review disposable-email domains regularly.

## Contact privacy
Unlocking never grants customer phone, email or exact addresses. Only an awarded customer, awarded transporter, or authorised admin may call `/api/jobs/{job_id}/contact`. Every access creates `CONTACT_REVEALED` in the audit log.
