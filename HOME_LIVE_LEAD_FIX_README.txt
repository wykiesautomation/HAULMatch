HAULMATCH HOME LIVE LEAD FIX

FIXED
- Home and Transport Leads now use the same Apps Script published-lead source as Admin.
- Old stale Neon test lead no longer controls the Home featured card.
- Only current PUBLISHED and non-BLOCKED requests are returned.
- The newest published Tractor request can replace the closed towing test card.
- First uploaded load photo is returned as a public Google Drive thumbnail.
- Home WOW layout remains unchanged.
- Main footer Admin link now opens /admin/.
- Broken Â· characters on Home and Transport Leads were corrected.
- Asset query strings force browsers to load the corrected JavaScript.

DEPLOY
1. Run Deploy_Home_Live_Lead_Fix.ps1.
2. Copy google-apps-script/Code.gs into the only Apps Script Code.gs.
3. Save and deploy the existing Web App as New version.
4. Hard refresh Home and Transport Leads.
