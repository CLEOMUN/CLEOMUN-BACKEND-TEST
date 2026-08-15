# CLEOMUN Registration — Backend Setup

The site works fully without a backend (it runs in local-only demo mode).
Follow these steps to make submissions actually land in a Google Sheet.

## 1. Create the Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**.
2. Name it something like `CLEOMUN 2027 — Registrations`.

## 2. Add the backend script

1. In the Sheet, go to **Extensions → Apps Script**.
2. Delete whatever's in the default `Code.gs` file.
3. Paste in the entire contents of `Code.gs` from this folder.
4. Click the **save icon** (or `Ctrl/Cmd+S`).

## 3. Deploy it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Fill in:
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone
4. Click **Deploy**.
5. The first time, Google will ask you to authorize the script — click through
   (it'll warn "Google hasn't verified this app" since it's your own script;
   click **Advanced → Go to (your project name)** to proceed).
6. Copy the **Web app URL** it gives you — looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

## 4. Connect the front-end

1. Open `script.js`.
2. Near the top, find:
   ```js
   const CONFIG = {
     APPS_SCRIPT_URL: "" // e.g. "https://script.google.com/macros/s/AKfycb.../exec"
   };
   ```
3. Paste your URL between the quotes.
4. Save, and redeploy/refresh your site.

That's it — registrations will now:
- Upload the ID card, roster spreadsheet, and payment screenshot to a Drive
  folder called **CLEOMUN Uploads** (auto-created, shared "anyone with link
  can view" so your team can open them from the sheet).
- Append a row to a **Registrations** sheet (auto-created) with every field,
  a server-generated unique Registration ID, and links to the uploaded files.

## Notes

- **Every time you change `Code.gs`**, you need to redeploy: **Deploy → Manage
  deployments → edit (pencil icon) → New version → Deploy**. Just saving the
  script does *not* push changes to the live URL.
- The sheet and Drive folder live in whichever Google account you deployed
  from — make sure that's the account your team will actually check.
- File size: Apps Script can comfortably handle the ID/payment screenshots
  and roster spreadsheets this form expects. If you ever raise the 5MB/10MB
  limits in the front-end by a lot, be aware Apps Script web apps have a
  ~50MB total request size ceiling.
- Want a confirmation email sent automatically once someone registers? Say
  the word — that's a small addition to `handleSubmitRegistration` in
  `Code.gs` using `MailApp.sendEmail(...)`.
