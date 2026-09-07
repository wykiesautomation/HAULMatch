# Batch B setup

1. Replace Apps Script `Code.gs` with `google-apps-script/Code.gs`.
2. Add Script Property `HAULMATCH_ADMIN_KEY` with a strong random value. Do not put this value in GitHub.
3. Save and run `upgradeMarketplaceSheets` once.
4. Existing rows stay in place. New tabs are created: Quotes, Status History, Risk Flags, Audit Log, Settings.
5. Approve a transporter from Apps Script by running `approveTransporter('HMTRN-REFERENCE')` after replacing the reference in the function call through a temporary helper, or set column Q to APPROVED in the Transporter Applications sheet.
6. Deploy > Manage deployments > Edit > New version > Deploy. The `/exec` URL remains unchanged.
7. Upload this pack to GitHub root and test Marketplace, Track Request and Submit Quote.
8. Admin page is `/admin/`; enter the Script Property admin key manually.
