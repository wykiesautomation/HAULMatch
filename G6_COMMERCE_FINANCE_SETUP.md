# G6 Commerce, PayFast and Finance Admin

## Free-test mode
G6 uses server-defined credit packs and a controlled sandbox payment simulation. It does not collect real card details or real money on GitHub Pages. An administrator marks a payment order COMPLETE to simulate a trusted server notification. Completion is idempotent and credits the wallet once.

## PDF documents
Apps Script creates PDF invoice, receipt, credit note and wallet statement files in a dedicated Google Drive folder. The folder ID is stored automatically in Script Properties as `HAULMATCH_FINANCE_FOLDER_ID`.

## Script Properties
Preserve:
- `HAULMATCH_SHEET_ID`
- `HAULMATCH_ADMIN_EMAIL`
- `HAULMATCH_ADMIN_KEY`

Optional future PayFast sandbox properties are reserved but not required for simulation:
- `HAULMATCH_PAYFAST_MODE`
- `HAULMATCH_PAYFAST_MERCHANT_ID`
- `HAULMATCH_PAYFAST_MERCHANT_KEY`
- `HAULMATCH_PAYFAST_PASSPHRASE`

## Install
1. Upload the complete repository pack to GitHub.
2. Replace Apps Script `Code.gs` with the final G6 script.
3. Run `upgradeG1ToG6Sheets` once.
4. Redeploy the existing Web App as a new version.
5. Test payment -> wallet credit -> invoice/receipt PDF -> statement -> refund -> credit note -> reconciliation.
