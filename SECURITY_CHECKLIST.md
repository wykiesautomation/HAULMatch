# Security checklist

- Strong production secret configured
- PostgreSQL credentials stored outside source control
- HTTPS and HSTS enabled
- Allowed hosts restricted
- PayFast passphrase not in frontend or repository
- PayFast ITN reachable through public HTTPS
- Return URL does not credit wallet
- Duplicate ITN tested
- Upload size and MIME restrictions tested
- Malware scanning service connected before public document uploads
- Private storage not served by static web routes
- Seed accounts removed or disabled
- Admin roles reviewed
- Backup restored successfully in staging
- Rate limiting verified at Nginx and application edge
- Legal and POPIA review completed
