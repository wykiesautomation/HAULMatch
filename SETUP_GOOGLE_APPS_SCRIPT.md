# HaulMatch temporary lead backend setup

1. Create a Google Sheet named `HaulMatch 360 Leads`.
2. Copy the spreadsheet ID from its URL.
3. Open Extensions > Apps Script.
4. Replace Code.gs with `google-apps-script/Code.gs` from this pack.
5. In Project Settings > Script Properties add:
   - `HAULMATCH_SHEET_ID` = spreadsheet ID
   - `HAULMATCH_ADMIN_EMAIL` = email that must receive lead alerts
6. Run `setupSheets` once and approve permissions.
7. Deploy > New deployment > Web app.
8. Execute as: yourself.
9. Who has access: Anyone.
10. Copy the Web App URL ending in `/exec`.
11. Edit `assets/config.js` and replace `PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.
12. Upload the complete static pack to GitHub and test both forms.

Security notes:
- Exact street addresses and identity documents are not requested by this temporary form.
- The hidden honeypot blocks basic bots.
- Google Apps Script validates form type, reference and duplicates.
- Add Cloudflare Turnstile before paid advertising or high-volume public traffic.
- The Google Sheet must remain private.
