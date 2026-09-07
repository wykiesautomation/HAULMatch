# HaulMatch 360 Production Deployment Guide

## Release boundary
REV9 is a production deployment candidate. Public launch still requires real PayFast sandbox completion, public HTTPS callbacks, legal/POPIA review, operational support ownership, real verification-document testing and a restore drill.

## Deployment
1. Provision a Linux host with Docker and Docker Compose.
2. Copy `.env.production.example` to `.env.production` and replace every placeholder.
3. Set a strong PostgreSQL password in the shell environment or deployment secret store.
4. Put TLS files in `deploy/certs` on the host. Never commit private keys.
5. Change the domain in `deploy/nginx.conf` and all PayFast callback URLs.
6. Run `python scripts/preflight.py` inside the app environment.
7. Run `docker compose -f docker-compose.production.yml build`.
8. Run `docker compose -f docker-compose.production.yml up -d`.
9. Check `/health/live` and `/health/ready`.
10. Complete migrations, smoke tests, PayFast sandbox tests and backup/restore validation before switching PayFast to production.

## Operational controls
- Keep exact addresses and evidence private.
- Back up PostgreSQL and private object storage together.
- Rotate the JWT secret and payment credentials under a documented incident process.
- Review audit events, disputes, failed payments and document expiries daily.
- Never use the seeded local accounts in production.
