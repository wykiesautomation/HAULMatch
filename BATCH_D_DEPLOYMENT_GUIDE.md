# HaulMatch 360 Batch D VPS Deployment

## Architecture
Cloudflare proxies `haulmatch.wykiesautomation.co.za` to a HOSTAFRICA Docker VPS. Nginx terminates origin TLS and proxies FastAPI. PostgreSQL and private uploads stay in Docker volumes.

## Provisioning
1. Order a HOSTAFRICA Linux VPS with Ubuntu LTS and Docker support. Minimum practical start: 2 vCPU, 4 GB RAM, 80 GB SSD. Prefer 4 vCPU and 8 GB RAM for production growth.
2. Create a non-root sudo operator and install SSH keys.
3. Clone the private repository to `/opt/haulmatch`.
4. Copy `.env.production.example` to `.env.production` and replace every placeholder.
5. Generate the application secret with `sh scripts/generate_secret.sh`.
6. Create a Cloudflare Origin Certificate for `haulmatch.wykiesautomation.co.za`. Save only on the VPS as `deploy/certs/origin.pem` and `deploy/certs/origin.key`.
7. Run `sudo sh scripts/firewall.sh`.
8. Run `sh scripts/deploy.sh`.
9. Test `/health/live` and `/health/ready` before DNS cutover.

## DNS cutover
Replace the temporary GitHub Pages CNAME with an A record:

- Type: A
- Name: haulmatch
- Value: HOSTAFRICA VPS public IPv4
- Proxy: Proxied
- TTL: Auto

Set Cloudflare SSL/TLS encryption mode to Full (strict).

## Rollback
Before cutover, retain the old GitHub Pages commit and CNAME details. If the VPS health checks fail, restore the CNAME to `wykiesautomation.github.io` and redeploy the static Pages version.

## Security gates
- No demo accounts
- No `.env.production` or certificate keys in Git
- PostgreSQL and private uploads backed up
- Restore drill completed
- Cloudflare Turnstile secret configured
- Email and SMS providers configured before public account verification
- PayFast remains sandbox until validated on the public HTTPS callback
