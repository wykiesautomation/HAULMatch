HAULMATCH 360 - FINAL GOOGLE ADMIN PRODUCTION PACK

FINAL ADMIN BEHAVIOUR
- /admin/ is the only public admin entry point.
- Authorized Google accounts sign in through Google Identity Services.
- The Google ID token is verified server-side by Apps Script.
- The Complete Admin Cockpit opens after successful verification.
- The old public admin-free-test page now redirects to /admin/.
- Old G7 password UI is no longer linked from the website.

COMPLETE COCKPIT
- Requests: Publish, Unpublish, Close, Reopen and Set Cost.
- Transporters: Approve + Wallet, More Info, Reject and Block.
- Wallets: Visible balances and audited adjustments with a required reason.
- Module Health: Unlocks, quotes, appointments, uploads and PayFast status.
- Google administrator email is recorded in the Audit Log.

REQUIRED SCRIPT PROPERTIES
- HAULMATCH_SHEET_ID
- HAULMATCH_ADMIN_EMAIL
- HAULMATCH_ADMIN_KEY
- HAULMATCH_GOOGLE_CLIENT_ID
- HAULMATCH_ADMIN_EMAILS

HAULMATCH_ADMIN_EMAILS example:
admin1@gmail.com,admin2@gmail.com,admin3@gmail.com

DEPLOY ORDER
1. Deploy this ZIP to the GitHub repository root.
2. In Apps Script, replace the entire Code.gs with google-apps-script/Code.gs from this pack.
3. Keep only one Apps Script file named Code.gs.
4. Save.
5. Deploy > Manage deployments > Edit > New version > Deploy.
6. Keep the existing /exec URL.
7. Open https://haulmatch.wykiesautomation.co.za/admin/ and sign in with an authorized Google account.

DO NOT
- Do not add GoogleAdminAuth.gs separately.
- Do not add Code_GOOGLE_ADMIN_FINAL.gs separately.
- Do not publish HAULMATCH_ADMIN_KEY or a Google Client Secret.
- Do not use the old admin-free-test page as the main admin route.
