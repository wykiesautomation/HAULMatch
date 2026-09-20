HAULMATCH PHOTO PIPELINE FINAL FIX

This build no longer relies only on Transport Requests > Photo Link.
For every published lead, Apps Script now:
1. Uses Photo Link when valid.
2. If Photo Link is empty, finds the first STORED LOAD_PHOTO in Request Uploads by request reference.
3. Uses the stored Drive File ID.
4. Enables anyone-with-link viewing for that image.
5. Returns a Google Drive thumbnail URL to Home and Transport Leads.

After deploying Code.gs as a New version, run repairPublishedLeadPhotos once from Apps Script only if the image row already exists in Request Uploads. The function repairs empty Photo Link cells for published requests.

If the log reports missing: 1, the original request did not store an uploaded image. In that case the request must be resubmitted with a JPG/PNG photo. No code can reconstruct an image that was never uploaded.
