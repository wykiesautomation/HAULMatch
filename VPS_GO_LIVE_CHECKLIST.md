# Go-live checklist

- [ ] HOSTAFRICA VPS provisioned
- [ ] SSH key-only access confirmed
- [ ] UFW allows only SSH, HTTP and HTTPS
- [ ] `.env.production` placeholders replaced
- [ ] Cloudflare Origin certificate installed
- [ ] Docker Compose preflight passed
- [ ] PostgreSQL healthy
- [ ] `/health/live` returns ok
- [ ] `/health/ready` returns database up
- [ ] Static site and Marketplace pages load from VPS
- [ ] Account register/login API smoke-tested
- [ ] Private uploads are not publicly addressable
- [ ] Backup created and restored on staging
- [ ] Cloudflare A record proxied to VPS
- [ ] Cloudflare SSL mode Full (strict)
- [ ] GitHub Pages CNAME rollback recorded
- [ ] Monitoring and disk alerts configured

- [ ] PayFast sandbox ITN validation passed
- [ ] Wallet idempotency and reconciliation passed

- [ ] Batch F operations migration reviewed
- [ ] Evidence/POD workflow tested
- [ ] Scheduled backup and restore verification passed
- [ ] Health timer and alerts active
