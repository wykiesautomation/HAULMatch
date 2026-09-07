# HaulMatch 360 Production Release REV9

Cumulative release built exclusively from the verified REV8_FIXED baseline.

# HaulMatch 360 REV7

Cumulative Fleet Operations and POD baseline. Run `run_windows.bat`, then open http://127.0.0.1:8080.

Demo transporter/customer emails use password `ChangeMe123!`.

REV7 includes fleet and driver compliance records, payload validation, awarded jobs, assignments, controlled milestones, incidents, JPG/PNG/PDF evidence API, electronic POD, customer confirmation and ratings API. Transport payment remains direct between customer and transporter.


## REV8
PayFast credits, wallet ledger, disputes, verification, notifications, risk and audit controls. See REV8_PAYFAST_SETUP.txt.


See `PRODUCTION_DEPLOYMENT_GUIDE.md`, `SECURITY_CHECKLIST.md`, `FINAL_ACCEPTANCE_REPORT.md`, and `REV9_RELEASE_NOTES.txt`.


## Repository publishing

This repository includes CI, Dependabot, issue and pull-request templates, proprietary licensing, security policy, root-file index, dynamic `robots.txt`, dynamic `sitemap.xml`, SEO metadata, Docker deployment and a PowerShell GitHub uploader. Set `HAULMATCH_PUBLIC_BASE_URL` to the final HTTPS domain before public indexing. Never commit `.env`, production certificates, databases, uploads, backups or customer information.


## Trust Hardened release
Email ownership tokens, mobile OTP, +27 normalisation, disposable-email controls, rate limits, trust levels, risk rules and strict award-only contact reveal are included. See `TRUST_HARDENING_SETUP.md`.
