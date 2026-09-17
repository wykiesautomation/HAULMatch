# Final installation order

1. Upload all repository files to GitHub and allow Pages to deploy.
2. Review the G1-G5 website pages.
3. Open the existing HaulMatch Apps Script project.
4. Replace its entire `Code.gs` with `google-apps-script/Code.gs` from this pack.
5. Run `upgradeG1ToG5Sheets` once.
6. Redeploy the existing web app as a new version. Keep the same `/exec` URL.
7. Execute the full acceptance flow from request to appointment.
