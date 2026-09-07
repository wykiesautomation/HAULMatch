# Batch C Trust and Moderation setup

1. Replace the Apps Script `Code.gs` with the new `google-apps-script/Code.gs`.
2. Keep existing Script Properties: `HAULMATCH_SHEET_ID`, `HAULMATCH_ADMIN_EMAIL`, `HAULMATCH_ADMIN_KEY`.
3. Optional Turnstile activation:
   - Create a Cloudflare Turnstile widget for `haulmatch.wykiesautomation.co.za`.
   - Put the public site key in `assets/config.js` as `turnstileSiteKey`.
   - Add the private secret in Apps Script Property `HAULMATCH_TURNSTILE_SECRET`.
   - Never place the secret in GitHub.
4. Save and run `upgradeTrustSheets` once.
5. Deploy > Manage deployments > Edit > New version > Deploy. The `/exec` URL remains unchanged.
6. Upload this complete pack to GitHub.
7. Open `/admin/`, enter the admin key, then use `Load Trust & Moderation`.
8. Review risk flags before publishing listings or approving transporters.

Existing request and transporter rows remain in place. New trust columns are appended.
