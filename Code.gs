/**
 * CLEOMUN Registration — Backend
 * ================================
 * Google Apps Script, bound to a Google Sheet.
 *
 * SETUP (see README.md for the full walkthrough):
 *  1. Create a new Google Sheet.
 *  2. Extensions > Apps Script. Delete the placeholder code, paste this file in.
 *  3. Deploy > New deployment > type "Web app".
 *       Execute as: Me
 *       Who has access: Anyone
 *  4. Copy the Web app URL and paste it into CONFIG.APPS_SCRIPT_URL in script.js.
 *
 * Every registration is written as one row in the "Registrations" sheet
 * (created automatically on first submission). Uploaded files (ID cards,
 * roster spreadsheets, payment screenshots) are saved into a Drive folder
 * called "CLEOMUN Uploads" and linked from the sheet.
 */

const SHEET_NAME = 'Registrations';
const DRIVE_FOLDER_NAME = 'CLEOMUN Uploads';

const HEADERS = [
  'Reg ID', 'Submitted At', 'Registration Type',
  'Full Name', 'Email', 'Phone', 'Class / Year', 'Institution', 'Prior Experience', 'ID File',
  'Committee 1', 'C1 Portfolio Pref 1', 'C1 Portfolio Pref 2',
  'Committee 2', 'C2 Portfolio Pref 1', 'C2 Portfolio Pref 2',
  'Group Name', 'Group Size', 'Leader Name', 'Leader Email', 'Leader Phone',
  'School Name', 'School Address', 'Teacher Name', 'Teacher Email', 'Teacher Phone',
  'Roster File', 'Payment Screenshot'
];

const COMMITTEE_NAMES = {
  'UNHRC': 'UN Human Rights Council',
  'UNSC': 'UN Security Council',
  'UNGA-DISEC': 'UNGA — DISEC',
  'AIPPM': 'All India Political Parties Meet',
  'UNCSW': 'UN Commission on the Status of Women',
  'IPC': 'International Press Corps'
};

/* ---------- entry points ---------- */

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    let result;
    if (body.action === 'uploadFile') {
      result = handleFileUpload(body);
    } else if (body.action === 'submitRegistration') {
      result = handleSubmitRegistration(body);
    } else {
      result = { ok: false, error: 'Unknown action: ' + body.action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonResponse({ ok: true, message: 'CLEOMUN registration backend is live.' });
}

/* ---------- file upload ---------- */

function handleFileUpload(body) {
  if (!body.dataBase64 || !body.fileName) {
    return { ok: false, error: 'Missing file data' };
  }
  const folder = getOrCreateFolder();
  const bytes = Utilities.base64Decode(body.dataBase64);
  const blob = Utilities.newBlob(bytes, body.mimeType || 'application/octet-stream', body.fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, url: file.getUrl(), fileId: file.getId() };
}

function getOrCreateFolder() {
  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

/* ---------- registration submission ---------- */

function handleSubmitRegistration(body) {
  const sheet = getSheet();
  const regId = generateRegId(sheet);
  const submittedAt = new Date();

  sheet.appendRow([
    regId, submittedAt, body.registrationType || '',
    body.fullName || '', body.email || '', body.phone || '', body.classYear || '',
    body.institution || '', numOrBlank(body.priorExperience), body.idFileUrl || '',
    committeeName(body.committee1), body.c1p1 || '', body.c1p2 || '',
    committeeName(body.committee2), body.c2p1 || '', body.c2p2 || '',
    body.groupName || '', numOrBlank(body.groupSize), body.leaderName || '', body.leaderEmail || '', body.leaderPhone || '',
    body.schoolName || '', body.schoolAddress || '', body.teacherName || '', body.teacherEmail || '', body.teacherPhone || '',
    body.rosterFileUrl || '', body.paymentFileUrl || ''
  ]);

  return { ok: true, regId: regId };
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function generateRegId(sheet) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id;
  const existing = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat()
    : [];
  do {
    let s = '';
    for (let i = 0; i < 5; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    id = 'CLEO-' + new Date().getFullYear() + '-' + s;
  } while (existing.indexOf(id) !== -1);
  return id;
}

/* ---------- helpers ---------- */

function committeeName(code) {
  return COMMITTEE_NAMES[code] || code || '';
}
function numOrBlank(v) {
  return (v === undefined || v === null || v === '') ? '' : v;
}
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
