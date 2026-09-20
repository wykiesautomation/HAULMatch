HaulMatch 360 Neon Integration Release

WHAT CHANGED
- Home and Transport Leads now load public opportunities from Neon RPC public_get_leads().
- Transport Leads now uses Neon Auth email/password sign-in.
- Wallet reads are protected by PostgreSQL RLS.
- Unlock uses secure_unlock_lead(), which performs the atomic debit and private customer release in PostgreSQL.
- Google Apps Script remains only as a temporary fallback for request uploads, existing Admin, quotes and finance while those modules are migrated.
- No PostgreSQL DATABASE_URL or password is published. The browser receives only the public HTTPS Neon database/Data API endpoint and short-lived Auth tokens.

NEON CONSOLE REQUIRED
1. Data API enabled on production/neondb.
2. Neon Auth enabled.
3. All RLS policies and RPC functions from HaulMatch_360_Neon_Security_V2.sql installed.
4. Refresh Data API schema cache after SQL changes.
5. Auth user linked to transporters.auth_subject.
6. In Auth configuration, add trusted origins:
   https://haulmatch.wykiesautomation.co.za
   https://wykiesautomation.github.io

TEST
- Open Home: 1 approved lead should load from Neon.
- Open Transport Leads and sign in with the created Neon Auth account.
- Refresh Wallet: current test balance should display.
- The already-unlocked test lead may return duplicate protection. Use a new published lead for the next end-to-end debit test.

ROLLBACK
The original Apps Script URL remains in assets/config.js. Restore the previous platform.js to return public leads and wallet/unlock to Apps Script.
